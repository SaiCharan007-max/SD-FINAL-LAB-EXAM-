import pool, { query } from '../config/db.js';
import { shuffleOptions } from '../utils/shuffleOptions.js';
import { getExamStatus } from '../utils/examStatus.js';

const buildAttemptResponse = (rows) => {
  const firstRow = rows[0];
  const startDatetime = new Date(firstRow.start_datetime);
  const endDatetime = new Date(startDatetime.getTime() + Number(firstRow.duration_minutes) * 60000);

  return {
    attempt_id: firstRow.attempt_id,
    exam: {
      title: firstRow.title,
      duration_minutes: Number(firstRow.duration_minutes),
      start_datetime: firstRow.start_datetime,
      end_datetime: endDatetime.toISOString()
    },
    questions: rows.map((row) => ({
      attempt_question_id: row.attempt_question_id,
      shuffled_order: Number(row.shuffled_order),
      question_text: row.question_text,
      options: [
        { position: 1, text: row.opt1_text },
        { position: 2, text: row.opt2_text },
        { position: 3, text: row.opt3_text },
        { position: 4, text: row.opt4_text }
      ],
      student_answer: row.student_answer === null ? null : Number(row.student_answer)
    }))
  };
};

const fetchAttemptRows = async (client, attemptId) => {
  const result = await client.query(
    `SELECT
       ea.id AS attempt_id,
       ex.title,
       ex.start_datetime,
       ex.duration_minutes,
       aq.id AS attempt_question_id,
       aq.shuffled_order,
       q.question_text,
       aq.opt1_text,
       aq.opt2_text,
       aq.opt3_text,
       aq.opt4_text,
       aq.student_answer
     FROM exam_attempts ea
     JOIN exams ex ON ex.id = ea.exam_id
     JOIN attempt_questions aq ON aq.attempt_id = ea.id
     JOIN questions q ON q.id = aq.question_id
     WHERE ea.id = $1
     ORDER BY aq.shuffled_order ASC`,
    [attemptId]
  );

  return result.rows;
};

const startExam = async (req, res, next) => {
  const examId = Number(req.params.examId);
  const client = await pool.connect();

  try {
    const examResult = await client.query(
      `SELECT id, title, course_id, academic_year, start_datetime, duration_minutes, num_questions
       FROM exams
       WHERE id = $1`,
      [examId]
    );

    if (examResult.rowCount === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = examResult.rows[0];

    if (getExamStatus(exam.start_datetime, Number(exam.duration_minutes)) !== 'Ongoing') {
      return res.status(400).json({ error: 'Exam is not active' });
    }

    const enrollment = await client.query(
      `SELECT 1
       FROM enrollments
       WHERE student_id = $1 AND course_id = $2`,
      [req.user.id, exam.course_id]
    );

    if (enrollment.rowCount === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    const existingAttempt = await client.query(
      `SELECT id, is_submitted
       FROM exam_attempts
       WHERE exam_id = $1 AND student_id = $2`,
      [examId, req.user.id]
    );

    if (existingAttempt.rowCount > 0) {
      if (existingAttempt.rows[0].is_submitted) {
        return res.status(400).json({ error: 'Already submitted' });
      }

      const attemptRows = await fetchAttemptRows(client, existingAttempt.rows[0].id);
      return res.status(200).json(buildAttemptResponse(attemptRows));
    }

    await client.query('BEGIN');

    const attemptInsert = await client.query(
      `INSERT INTO exam_attempts (exam_id, student_id)
       VALUES ($1, $2)
       RETURNING id`,
      [examId, req.user.id]
    );

    const attemptId = attemptInsert.rows[0].id;
    const questionResult = await client.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d
       FROM questions
       WHERE course_id = $1 AND academic_year = $2
       ORDER BY RANDOM()
       LIMIT $3`,
      [exam.course_id, exam.academic_year, Number(exam.num_questions)]
    );

    if (questionResult.rows.length < Number(exam.num_questions)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient questions available to start the exam' });
    }

    const columnsPerRow = 11;
    const placeholders = [];
    const values = [];

    questionResult.rows.forEach((question, index) => {
      const shuffled = shuffleOptions(question);
      const base = index * columnsPerRow;

      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`
      );

      values.push(
        attemptId,
        question.id,
        index + 1,
        shuffled[0].text,
        shuffled[1].text,
        shuffled[2].text,
        shuffled[3].text,
        shuffled[0].original,
        shuffled[1].original,
        shuffled[2].original,
        shuffled[3].original
      );
    });

    await client.query(
      `INSERT INTO attempt_questions (
         attempt_id,
         question_id,
         shuffled_order,
         opt1_text,
         opt2_text,
         opt3_text,
         opt4_text,
         opt1_original,
         opt2_original,
         opt3_original,
         opt4_original
       )
       VALUES ${placeholders.join(', ')}`,
      values
    );

    await client.query('COMMIT');

    const attemptRows = await fetchAttemptRows(client, attemptId);
    return res.status(200).json(buildAttemptResponse(attemptRows));
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(rollbackError);
    }

    return next(error);
  } finally {
    client.release();
  }
};

const saveAnswer = async (req, res, next) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const attemptQuestionId = Number(req.body.attempt_question_id);
    const studentAnswer = Number(req.body.student_answer);

    const attempt = await query(
      `SELECT id, is_submitted
       FROM exam_attempts
       WHERE id = $1 AND student_id = $2`,
      [attemptId, req.user.id]
    );

    if (attempt.rowCount === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.rows[0].is_submitted) {
      return res.status(400).json({ error: 'Attempt already submitted' });
    }

    const result = await query(
      `UPDATE attempt_questions
       SET student_answer = $1
       WHERE id = $2 AND attempt_id = $3
       RETURNING id`,
      [studentAnswer, attemptQuestionId, attemptId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Attempt question not found' });
    }

    return res.status(200).json({ message: 'Answer saved' });
  } catch (error) {
    return next(error);
  }
};

const submitExam = async (req, res, next) => {
  const attemptId = Number(req.params.attemptId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const attemptResult = await client.query(
      `SELECT
         ea.id,
         ea.exam_id,
         ea.started_at,
         ea.is_submitted,
         ex.num_questions
       FROM exam_attempts ea
       JOIN exams ex ON ex.id = ea.exam_id
       WHERE ea.id = $1 AND ea.student_id = $2
       FOR UPDATE`,
      [attemptId, req.user.id]
    );

    if (attemptResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    if (attempt.is_submitted) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Attempt already submitted' });
    }

    const questionsResult = await client.query(
      `SELECT
         aq.id,
         aq.student_answer,
         aq.opt1_original,
         aq.opt2_original,
         aq.opt3_original,
         aq.opt4_original,
         q.correct_answer
       FROM attempt_questions aq
       JOIN questions q ON q.id = aq.question_id
       WHERE aq.attempt_id = $1
       ORDER BY aq.shuffled_order ASC`,
      [attemptId]
    );

    let score = 0;

    for (const row of questionsResult.rows) {
      let selectedOriginal = null;

      if (row.student_answer === 1) selectedOriginal = row.opt1_original;
      if (row.student_answer === 2) selectedOriginal = row.opt2_original;
      if (row.student_answer === 3) selectedOriginal = row.opt3_original;
      if (row.student_answer === 4) selectedOriginal = row.opt4_original;

      const isCorrect = Boolean(selectedOriginal) && selectedOriginal === row.correct_answer;

      if (isCorrect) {
        score += 1;
      }

      await client.query(
        `UPDATE attempt_questions
         SET is_correct = $1
         WHERE id = $2`,
        [isCorrect, row.id]
      );
    }

    const timeTakenSec = Math.max(
      0,
      Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000)
    );
    const percentage = Number(((score / Math.max(questionsResult.rows.length, 1)) * 100).toFixed(2));

    await client.query(
      `UPDATE exam_attempts
       SET is_submitted = TRUE,
           submitted_at = NOW(),
           score = $2,
           time_taken_sec = $3
       WHERE id = $1`,
      [attemptId, score, timeTakenSec]
    );

    const rankingSource = await client.query(
      `SELECT student_id, score, time_taken_sec, submitted_at
       FROM exam_attempts
       WHERE exam_id = $1 AND is_submitted = TRUE
       ORDER BY score DESC, submitted_at ASC, student_id ASC`,
      [attempt.exam_id]
    );

    let previousKey = null;
    let currentRank = 0;
    const rankingRows = rankingSource.rows.map((row, index) => {
      const currentKey = `${row.score}|${new Date(row.submitted_at).toISOString()}`;

      if (currentKey !== previousKey) {
        currentRank = index + 1;
        previousKey = currentKey;
      }

      return {
        student_id: row.student_id,
        score: Number(row.score),
        percentage: Number(((Number(row.score) / Number(attempt.num_questions)) * 100).toFixed(2)),
        time_taken_sec: Number(row.time_taken_sec),
        submitted_at: row.submitted_at,
        rank: currentRank
      };
    });

    if (rankingRows.length > 0) {
      const columnsPerRow = 7;
      const placeholders = rankingRows.map((_, index) => {
        const base = index * columnsPerRow;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
      });

      const values = rankingRows.flatMap((row) => [
        attempt.exam_id,
        row.student_id,
        row.score,
        row.percentage,
        row.time_taken_sec,
        row.submitted_at,
        row.rank
      ]);

      await client.query(
        `INSERT INTO exam_rankings (
           exam_id,
           student_id,
           score,
           percentage,
           time_taken_sec,
           submitted_at,
           rank
         )
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (exam_id, student_id)
         DO UPDATE SET
           score = EXCLUDED.score,
           percentage = EXCLUDED.percentage,
           time_taken_sec = EXCLUDED.time_taken_sec,
           submitted_at = EXCLUDED.submitted_at,
           rank = EXCLUDED.rank`,
        values
      );
    }

    await client.query('COMMIT');

    const currentStudentRanking = rankingRows.find((row) => row.student_id === req.user.id);

    return res.status(200).json({
      message: 'Exam submitted',
      score,
      total: questionsResult.rows.length,
      percentage,
      rank: currentStudentRanking ? currentStudentRanking.rank : null
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(rollbackError);
    }

    return next(error);
  } finally {
    client.release();
  }
};

const getAttemptResult = async (req, res, next) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const metadataResult = await query(
      `SELECT
         ea.score,
         ea.time_taken_sec,
         ex.title AS exam_title,
         ex.num_questions,
         c.course_name,
         er.rank,
         COALESCE(er.percentage, ROUND((ea.score::numeric / NULLIF(ex.num_questions, 0)) * 100, 2)) AS percentage
       FROM exam_attempts ea
       JOIN exams ex ON ex.id = ea.exam_id
       JOIN courses c ON c.id = ex.course_id
       LEFT JOIN exam_rankings er ON er.exam_id = ea.exam_id AND er.student_id = ea.student_id
       WHERE ea.id = $1 AND ea.student_id = $2 AND ea.is_submitted = TRUE`,
      [attemptId, req.user.id]
    );

    if (metadataResult.rowCount === 0) {
      return res.status(404).json({ error: 'Submitted attempt not found' });
    }

    const questionsResult = await query(
      `SELECT
         aq.shuffled_order,
         q.question_text,
         aq.opt1_text,
         aq.opt2_text,
         aq.opt3_text,
         aq.opt4_text,
         aq.opt1_original,
         aq.opt2_original,
         aq.opt3_original,
         aq.opt4_original,
         aq.student_answer,
         aq.is_correct,
         q.correct_answer
       FROM attempt_questions aq
       JOIN questions q ON q.id = aq.question_id
       WHERE aq.attempt_id = $1
       ORDER BY aq.shuffled_order ASC`,
      [attemptId]
    );

    const questions = questionsResult.rows.map((row) => {
      const options = [
        { position: 1, text: row.opt1_text, original: row.opt1_original },
        { position: 2, text: row.opt2_text, original: row.opt2_original },
        { position: 3, text: row.opt3_text, original: row.opt3_original },
        { position: 4, text: row.opt4_text, original: row.opt4_original }
      ];

      const correctOption = options.find((option) => option.original === row.correct_answer);
      const studentOption =
        row.student_answer === null
          ? null
          : options.find((option) => option.position === Number(row.student_answer));

      return {
        shuffled_order: Number(row.shuffled_order),
        question_text: row.question_text,
        options: options.map((option) => ({
          position: option.position,
          text: option.text
        })),
        student_answer: row.student_answer === null ? null : Number(row.student_answer),
        student_answer_text: studentOption ? studentOption.text : 'Not Attempted',
        correct_answer_position: correctOption ? correctOption.position : null,
        correct_answer_text: correctOption ? correctOption.text : null,
        is_correct: row.is_correct
      };
    });

    const metadata = metadataResult.rows[0];

    return res.status(200).json({
      exam_title: metadata.exam_title,
      course_name: metadata.course_name,
      score: Number(metadata.score),
      num_questions: Number(metadata.num_questions),
      percentage: Number(metadata.percentage),
      time_taken_sec: Number(metadata.time_taken_sec),
      rank: metadata.rank === null ? null : Number(metadata.rank),
      questions
    });
  } catch (error) {
    return next(error);
  }
};

export { getAttemptResult, saveAnswer, startExam, submitExam };
