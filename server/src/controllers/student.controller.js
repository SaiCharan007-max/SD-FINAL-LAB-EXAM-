import { query } from '../config/db.js';
import { getExamStatus } from '../utils/examStatus.js';

const getAggregateExamStatus = (examRows) => {
  if (!examRows.length) {
    return 'Not Scheduled';
  }

  const statuses = examRows.map((exam) => getExamStatus(exam.start_datetime, Number(exam.duration_minutes)));

  if (statuses.includes('Ongoing')) {
    return 'Ongoing';
  }

  if (statuses.includes('Upcoming')) {
    return 'Upcoming';
  }

  return 'Completed';
};

const listCourses = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         c.course_name,
         c.course_code,
         c.description,
         c.academic_year,
         COALESCE(
           ARRAY_AGG(DISTINCT u.full_name) FILTER (WHERE u.full_name IS NOT NULL),
           '{}'
         ) AS faculty_names,
         EXISTS (
           SELECT 1
           FROM enrollments e2
           WHERE e2.course_id = c.id AND e2.student_id = $1
         ) AS is_enrolled
       FROM courses c
       LEFT JOIN faculty_courses fc ON fc.course_id = c.id
       LEFT JOIN users u ON u.id = fc.faculty_id
       GROUP BY c.id
       ORDER BY c.course_name ASC`,
      [req.user.id]
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        id: row.id,
        course_name: row.course_name,
        course_code: row.course_code,
        description: row.description,
        academic_year: row.academic_year,
        faculty_names: row.faculty_names || [],
        is_enrolled: row.is_enrolled
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const enrollInCourse = async (req, res, next) => {
  try {
    const courseId = Number(req.body.course_id);
    const course = await query('SELECT id FROM courses WHERE id = $1', [courseId]);

    if (course.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrollment = await query(
      `SELECT id
       FROM enrollments
       WHERE student_id = $1 AND course_id = $2`,
      [req.user.id, courseId]
    );

    if (enrollment.rowCount > 0) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    await query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)`,
      [req.user.id, courseId]
    );

    return res.status(201).json({ message: 'Enrolled successfully' });
  } catch (error) {
    return next(error);
  }
};

const getMyCourses = async (req, res, next) => {
  try {
    const coursesResult = await query(
      `SELECT
         c.id,
         c.course_name,
         c.course_code,
         COALESCE(
           ARRAY_AGG(DISTINCT u.full_name) FILTER (WHERE u.full_name IS NOT NULL),
           '{}'
         ) AS faculty_names
       FROM enrollments en
       JOIN courses c ON c.id = en.course_id
       LEFT JOIN faculty_courses fc ON fc.course_id = c.id
       LEFT JOIN users u ON u.id = fc.faculty_id
       WHERE en.student_id = $1
       GROUP BY c.id
       ORDER BY c.course_name ASC`,
      [req.user.id]
    );

    if (coursesResult.rowCount === 0) {
      return res.status(200).json([]);
    }

    const courseIds = coursesResult.rows.map((row) => row.id);
    const examsResult = await query(
      `SELECT course_id, start_datetime, duration_minutes
       FROM exams
       WHERE course_id = ANY($1::int[])`,
      [courseIds]
    );

    const examMap = new Map();

    for (const exam of examsResult.rows) {
      if (!examMap.has(exam.course_id)) {
        examMap.set(exam.course_id, []);
      }

      examMap.get(exam.course_id).push(exam);
    }

    return res.status(200).json(
      coursesResult.rows.map((row) => ({
        id: row.id,
        course_name: row.course_name,
        course_code: row.course_code,
        faculty_names: row.faculty_names || [],
        exam_status: getAggregateExamStatus(examMap.get(row.id) || [])
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const getMyExams = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         ex.id AS exam_id,
         ex.title,
         c.course_name,
         c.course_code,
         ex.start_datetime,
         ex.duration_minutes,
         ex.num_questions,
         ea.is_submitted,
         ea.id AS attempt_id
       FROM enrollments en
       JOIN courses c ON c.id = en.course_id
       JOIN exams ex ON ex.course_id = c.id
       LEFT JOIN exam_attempts ea ON ea.exam_id = ex.id AND ea.student_id = $1
       WHERE en.student_id = $1
       ORDER BY ex.start_datetime DESC`,
      [req.user.id]
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        exam_id: row.exam_id,
        title: row.title,
        course_name: row.course_name,
        course_code: row.course_code,
        start_datetime: row.start_datetime,
        duration_minutes: Number(row.duration_minutes),
        num_questions: Number(row.num_questions),
        status: getExamStatus(row.start_datetime, Number(row.duration_minutes)),
        is_submitted: row.is_submitted || false,
        attempt_id: row.attempt_id || null
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const getMyResults = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         ex.id AS exam_id,
         ex.title,
         c.course_name,
         c.course_code,
         ea.score,
         ex.num_questions,
         COALESCE(er.percentage, ROUND((ea.score::numeric / NULLIF(ex.num_questions, 0)) * 100, 2)) AS percentage,
         ea.time_taken_sec,
         er.rank,
         ea.submitted_at
       FROM exam_attempts ea
       JOIN exams ex ON ex.id = ea.exam_id
       JOIN courses c ON c.id = ex.course_id
       LEFT JOIN exam_rankings er ON er.exam_id = ea.exam_id AND er.student_id = ea.student_id
       WHERE ea.student_id = $1 AND ea.is_submitted = TRUE
       ORDER BY ea.submitted_at DESC`,
      [req.user.id]
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        exam_id: row.exam_id,
        title: row.title,
        course_name: row.course_name,
        course_code: row.course_code,
        score: Number(row.score),
        num_questions: Number(row.num_questions),
        percentage: Number(row.percentage),
        time_taken_sec: Number(row.time_taken_sec),
        rank: row.rank === null ? null : Number(row.rank),
        submitted_at: row.submitted_at
      }))
    );
  } catch (error) {
    return next(error);
  }
};

export { enrollInCourse, getMyCourses, getMyExams, getMyResults, listCourses };
