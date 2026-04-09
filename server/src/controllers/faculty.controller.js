import xlsx from 'xlsx';

import { query } from '../config/db.js';
import { generateLeaderboardCSV } from '../utils/csvExport.js';
import { getExamStatus } from '../utils/examStatus.js';

const isFacultyAssignedToCourse = async (facultyId, courseId) => {
  const result = await query(
    `SELECT 1
     FROM faculty_courses
     WHERE faculty_id = $1 AND course_id = $2`,
    [facultyId, courseId]
  );

  return result.rowCount > 0;
};

const sanitizeExamFilename = (title) => {
  const cleaned = title
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return cleaned || 'exam';
};

const getAssignedCourses = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         c.course_name,
         c.course_code,
         c.description,
         c.student_year,
         c.academic_year,
         COUNT(DISTINCT e.student_id) AS enrolled_student_count,
         COUNT(DISTINCT ex.id) AS exam_count
       FROM faculty_courses fc
       JOIN courses c ON c.id = fc.course_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN exams ex ON ex.course_id = c.id AND ex.created_by = $1
       WHERE fc.faculty_id = $1
       GROUP BY c.id
       ORDER BY c.course_name ASC`,
      [req.user.id]
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        ...row,
        student_year: row.student_year,
        enrolled_student_count: Number(row.enrolled_student_count),
        exam_count: Number(row.exam_count)
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const uploadQuestions = async (req, res, next) => {
  try {
    const courseId = Number(req.body.course_id);
    const { academic_year } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Excel or CSV question bank file is required' });
    }

    if (!(await isFacultyAssignedToCourse(req.user.id, courseId))) {
      return res.status(403).json({ error: 'You are not assigned to this course' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

    if (rows.length <= 1) {
      return res.status(400).json({ error: 'No question rows found in the uploaded file' });
    }

    const errors = [];
    const preparedQuestions = [];

    for (let index = 1; index < rows.length; index += 1) {
      const rowNumber = index + 1;
      const row = rows[index];
      const values = Array.from({ length: 7 }, (_, cellIndex) => String(row[cellIndex] ?? '').trim());
      const [question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty] = values;

      if (values.some((value) => !value)) {
        errors.push({ row: rowNumber, reason: 'All 7 columns must contain values' });
        continue;
      }

      const normalizedAnswer = correct_answer.toUpperCase();
      const normalizedDifficulty =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

      if (!['A', 'B', 'C', 'D'].includes(normalizedAnswer)) {
        errors.push({ row: rowNumber, reason: 'correct_answer must be A, B, C, or D' });
        continue;
      }

      if (!['Easy', 'Medium', 'Hard'].includes(normalizedDifficulty)) {
        errors.push({ row: rowNumber, reason: 'difficulty must be Easy, Medium, or Hard' });
        continue;
      }

      preparedQuestions.push({
        course_id: courseId,
        academic_year,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer: normalizedAnswer,
        difficulty: normalizedDifficulty,
        uploaded_by: req.user.id
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const columnsPerRow = 10;
    const placeholders = preparedQuestions.map((_, index) => {
      const base = index * columnsPerRow;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`;
    });

    const values = preparedQuestions.flatMap((question) => [
      question.course_id,
      question.academic_year,
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
      question.correct_answer,
      question.difficulty,
      question.uploaded_by
    ]);

    await query(
      `INSERT INTO questions (
         course_id,
         academic_year,
         question_text,
         option_a,
         option_b,
         option_c,
         option_d,
         correct_answer,
         difficulty,
         uploaded_by
       )
       VALUES ${placeholders.join(', ')}`,
      values
    );

    return res.status(200).json({
      message: `Upload successful - ${preparedQuestions.length} questions added`,
      count: preparedQuestions.length
    });
  } catch (error) {
    return next(error);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const { academic_year } = req.query;

    if (!(await isFacultyAssignedToCourse(req.user.id, courseId))) {
      return res.status(403).json({ error: 'You are not assigned to this course' });
    }

    const params = [courseId];
    let sql = `SELECT
                 id,
                 question_text,
                 option_a,
                 option_b,
                 option_c,
                 option_d,
                 correct_answer,
                 difficulty,
                 created_at
               FROM questions
               WHERE course_id = $1`;

    if (academic_year) {
      params.push(academic_year);
      sql += ` AND academic_year = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const createExam = async (req, res, next) => {
  try {
    const {
      title,
      course_id,
      academic_year,
      start_datetime,
      duration_minutes,
      num_questions
    } = req.body;

    const courseId = Number(course_id);
    const durationMinutes = Number(duration_minutes);
    const questionCount = Number(num_questions);
    const startDatetime = new Date(start_datetime);

    if (!(await isFacultyAssignedToCourse(req.user.id, courseId))) {
      return res.status(403).json({ error: 'You are not assigned to this course' });
    }

    if (Number.isNaN(startDatetime.getTime())) {
      return res.status(400).json({ error: 'Invalid start_datetime' });
    }

    if (startDatetime < new Date(Date.now() + 15 * 60000)) {
      return res.status(400).json({ error: 'start_datetime must be at least 15 minutes from now' });
    }

    const questionResult = await query(
      `SELECT COUNT(*) AS total
       FROM questions
       WHERE course_id = $1 AND academic_year = $2`,
      [courseId, academic_year]
    );

    if (Number(questionResult.rows[0].total) < questionCount) {
      return res.status(400).json({ error: 'Not enough questions available for this exam' });
    }

    const result = await query(
      `INSERT INTO exams (
         title,
         course_id,
         created_by,
         academic_year,
         start_datetime,
         duration_minutes,
         num_questions
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, courseId, req.user.id, academic_year, startDatetime.toISOString(), durationMinutes, questionCount]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         ex.id,
         ex.title,
         c.course_name,
         c.course_code,
         ex.academic_year,
         ex.start_datetime,
         ex.duration_minutes,
         ex.num_questions,
         COUNT(ea.id) FILTER (WHERE ea.is_submitted = TRUE) AS total_submissions
       FROM exams ex
       JOIN courses c ON c.id = ex.course_id
       LEFT JOIN exam_attempts ea ON ea.exam_id = ex.id
       WHERE ex.created_by = $1
       GROUP BY ex.id, c.id
       ORDER BY ex.start_datetime DESC`,
      [req.user.id]
    );

    return res.status(200).json(
      result.rows.map((row) => {
        const durationMinutes = Number(row.duration_minutes);
        const endDatetime = new Date(new Date(row.start_datetime).getTime() + durationMinutes * 60000);

        return {
          id: row.id,
          title: row.title,
          course_name: row.course_name,
          course_code: row.course_code,
          academic_year: row.academic_year,
          start_datetime: row.start_datetime,
          end_datetime: endDatetime.toISOString(),
          duration_minutes: durationMinutes,
          num_questions: Number(row.num_questions),
          status: getExamStatus(row.start_datetime, durationMinutes),
          total_submissions: Number(row.total_submissions)
        };
      })
    );
  } catch (error) {
    return next(error);
  }
};

const getFacultyExam = async (facultyId, examId) => {
  const result = await query(
    `SELECT id, title
     FROM exams
     WHERE id = $1 AND created_by = $2`,
    [examId, facultyId]
  );

  return result.rows[0] || null;
};

const getLeaderboard = async (req, res, next) => {
  try {
    const examId = Number(req.params.examId);

    if (!(await getFacultyExam(req.user.id, examId))) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const result = await query(
      `SELECT
         er.rank,
         u.full_name,
         u.username,
         er.score,
         ex.num_questions,
         er.percentage,
         er.time_taken_sec,
         er.submitted_at
       FROM exam_rankings er
       JOIN users u ON u.id = er.student_id
       JOIN exams ex ON ex.id = er.exam_id
       WHERE er.exam_id = $1
       ORDER BY er.rank ASC, er.submitted_at ASC`,
      [examId]
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        rank: Number(row.rank),
        full_name: row.full_name,
        username: row.username,
        score: Number(row.score),
        num_questions: Number(row.num_questions),
        percentage: Number(row.percentage),
        time_taken_sec: Number(row.time_taken_sec),
        submitted_at: row.submitted_at
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const exportLeaderboardCsv = async (req, res, next) => {
  try {
    const examId = Number(req.params.examId);
    const exam = await getFacultyExam(req.user.id, examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const result = await query(
      `SELECT
         er.rank,
         u.full_name,
         u.username,
         er.score,
         ex.num_questions,
         er.percentage,
         er.time_taken_sec,
         er.submitted_at
       FROM exam_rankings er
       JOIN users u ON u.id = er.student_id
       JOIN exams ex ON ex.id = er.exam_id
       WHERE er.exam_id = $1
       ORDER BY er.rank ASC, er.submitted_at ASC`,
      [examId]
    );

    const csv = generateLeaderboardCSV(
      result.rows.map((row) => ({
        rank: Number(row.rank),
        full_name: row.full_name,
        username: row.username,
        score: Number(row.score),
        num_questions: Number(row.num_questions),
        percentage: Number(row.percentage),
        time_taken_sec: Number(row.time_taken_sec),
        submitted_at: row.submitted_at
      }))
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizeExamFilename(exam.title)}_results.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
};

export {
  createExam,
  exportLeaderboardCsv,
  getAssignedCourses,
  getExams,
  getLeaderboard,
  getQuestions,
  uploadQuestions
};
