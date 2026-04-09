import bcrypt from 'bcrypt';

import { query } from '../config/db.js';

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const getSummary = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         (SELECT COUNT(*) FROM courses) AS total_courses,
         (SELECT COUNT(*) FROM users WHERE role = 'faculty') AS total_faculty,
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
         (SELECT COUNT(*) FROM exams) AS total_exams`
    );

    const row = result.rows[0];

    return res.status(200).json({
      total_courses: Number(row.total_courses),
      total_faculty: Number(row.total_faculty),
      total_students: Number(row.total_students),
      total_exams: Number(row.total_exams)
    });
  } catch (error) {
    return next(error);
  }
};

const createFaculty = async (req, res, next) => {
  try {
    const { full_name, email, employee_id } = req.body;
    const username = employee_id;
    const tempPassword = `Temp${employee_id.slice(-4)}`;

    const existing = await query(
      `SELECT email, employee_id, username
       FROM users
       WHERE email = $1 OR employee_id = $2 OR username = $3`,
      [email, employee_id, username]
    );

    if (existing.rowCount > 0) {
      if (existing.rows.some((row) => row.email === email)) {
        return res.status(409).json({ error: 'Email is already registered' });
      }

      if (existing.rows.some((row) => row.employee_id === employee_id)) {
        return res.status(409).json({ error: 'Employee ID is already registered' });
      }

      return res.status(409).json({ error: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);
    const result = await query(
      `INSERT INTO users (full_name, email, username, password_hash, role, employee_id)
       VALUES ($1, $2, $3, $4, 'faculty', $5)
       RETURNING id, full_name, email, employee_id`,
      [full_name, email, username, passwordHash, employee_id]
    );

    return res.status(201).json({
      message: 'Faculty created successfully',
      faculty: result.rows[0],
      temp_password: tempPassword
    });
  } catch (error) {
    return next(error);
  }
};

const listFaculty = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.employee_id,
         COALESCE(
           ARRAY_AGG(DISTINCT c.course_name) FILTER (WHERE c.course_name IS NOT NULL),
           '{}'
         ) AS courses_assigned,
         COUNT(DISTINCT fc.course_id) AS total_courses,
         COUNT(DISTINCT e.student_id) AS total_students_registered,
         COUNT(DISTINCT ex.id) AS total_exams_conducted
       FROM users u
       LEFT JOIN faculty_courses fc ON fc.faculty_id = u.id
       LEFT JOIN courses c ON c.id = fc.course_id
       LEFT JOIN enrollments e ON e.course_id = fc.course_id
       LEFT JOIN exams ex ON ex.created_by = u.id
       WHERE u.role = 'faculty'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json(
      result.rows.map((row) => ({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        employee_id: row.employee_id,
        courses_assigned: row.courses_assigned || [],
        total_courses: Number(row.total_courses),
        total_students_registered: Number(row.total_students_registered),
        total_exams_conducted: Number(row.total_exams_conducted)
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { course_name, course_code, description, academic_year } = req.body;

    const result = await query(
      `INSERT INTO courses (course_name, course_code, description, academic_year, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [course_name, course_code, description || null, academic_year, req.user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
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
         COALESCE(ec.enrolled_student_count, 0) AS enrolled_student_count,
         u.id AS faculty_id,
         u.full_name AS faculty_name
       FROM courses c
       LEFT JOIN (
         SELECT course_id, COUNT(DISTINCT student_id) AS enrolled_student_count
         FROM enrollments
         GROUP BY course_id
       ) ec ON ec.course_id = c.id
       LEFT JOIN faculty_courses fc ON fc.course_id = c.id
       LEFT JOIN users u ON u.id = fc.faculty_id
       ORDER BY c.created_at DESC, u.full_name ASC`
    );

    const courseMap = new Map();

    for (const row of result.rows) {
      if (!courseMap.has(row.id)) {
        courseMap.set(row.id, {
          id: row.id,
          course_name: row.course_name,
          course_code: row.course_code,
          description: row.description,
          academic_year: row.academic_year,
          assigned_faculty: [],
          enrolled_student_count: Number(row.enrolled_student_count)
        });
      }

      if (row.faculty_id) {
        courseMap.get(row.id).assigned_faculty.push({
          id: row.faculty_id,
          full_name: row.faculty_name
        });
      }
    }

    return res.status(200).json(Array.from(courseMap.values()));
  } catch (error) {
    return next(error);
  }
};

const assignFacultyToCourse = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const facultyIds = [...new Set(req.body.faculty_ids.map((id) => Number(id)))];

    const course = await query('SELECT id FROM courses WHERE id = $1', [courseId]);

    if (course.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const faculty = await query(
      `SELECT id
       FROM users
       WHERE role = 'faculty' AND id = ANY($1::int[])`,
      [facultyIds]
    );

    if (faculty.rowCount !== facultyIds.length) {
      return res.status(400).json({ error: 'One or more faculty IDs are invalid' });
    }

    const placeholders = facultyIds.map((_, index) => {
      const base = index * 2;
      return `($${base + 1}, $${base + 2})`;
    });

    const values = facultyIds.flatMap((facultyId) => [facultyId, courseId]);

    await query(
      `INSERT INTO faculty_courses (faculty_id, course_id)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (faculty_id, course_id) DO NOTHING`,
      values
    );

    return res.status(200).json({ message: 'Faculty assigned successfully' });
  } catch (error) {
    return next(error);
  }
};

const removeFacultyFromCourse = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const facultyId = Number(req.params.facultyId);

    const result = await query(
      `DELETE FROM faculty_courses
       WHERE course_id = $1 AND faculty_id = $2`,
      [courseId, facultyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Faculty assignment not found' });
    }

    return res.status(200).json({ message: 'Faculty removed from course' });
  } catch (error) {
    return next(error);
  }
};

export {
  assignFacultyToCourse,
  createCourse,
  createFaculty,
  getSummary,
  listCourses,
  listFaculty,
  removeFacultyFromCourse
};
