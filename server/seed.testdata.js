import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { mkdir } from 'fs/promises';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workbookDir = path.join(__dirname, 'postman-assets');
const workbookPath = path.join(workbookDir, 'questions.xlsx');

const seededFaculty = {
  fullName: 'Faculty Two',
  email: 'faculty2@example.com',
  username: 'EMP2002',
  employeeId: 'EMP2002',
  password: 'Temp2002'
};

const seededStudent = {
  fullName: 'Student Two',
  email: 'student2@example.com',
  username: 'student002',
  password: 'Student@123',
  currentYear: '2nd Year'
};

const seededCourse = {
  name: 'Algorithms',
  code: 'CS202',
  description: 'Algorithms course for full API testing',
  studentYear: '2nd Year',
  academicYear: '2025-26'
};

const seededExam = {
  title: 'Algorithms Live Test',
  durationMinutes: 120,
  numQuestions: 5
};

const questionRows = [
  ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'difficulty'],
  ['What is 2 + 2?', '2', '3', '4', '5', 'C', 'Easy'],
  ['What comes after 10?', '11', '12', '13', '14', 'B', 'Easy'],
  ['Which is a linear data structure?', 'Stack', 'Tree', 'Graph', 'Heap', 'A', 'Medium'],
  ['Which complexity is fastest among these?', 'O(n)', 'O(log n)', 'O(n log n)', 'O(n^2)', 'B', 'Medium'],
  ['Which traversal uses a queue?', 'DFS', 'BFS', 'Topological Sort', 'Backtracking', 'B', 'Hard'],
  ['Which is useful for prefix lookup?', 'Trie', 'Matrix', 'Heap', 'Stack', 'A', 'Medium'],
  ['Which sorting method is stable?', 'Quick sort', 'Merge sort', 'Heap sort', 'Selection sort', 'B', 'Easy'],
  ['Which structure supports union-find well?', 'AVL Tree', 'Graph', 'Disjoint Set', 'Queue', 'C', 'Hard']
];

const ensureQuestionWorkbook = async () => {
  await mkdir(workbookDir, { recursive: true });

  const worksheet = xlsx.utils.aoa_to_sheet(questionRows);
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(workbook, worksheet, 'Questions');
  xlsx.writeFile(workbook, workbookPath);
};

const ensureSeedQuestions = async (client, facultyId, courseId) => {
  for (let index = 1; index < questionRows.length; index += 1) {
    const [questionText, optionA, optionB, optionC, optionD, correctAnswer, difficulty] = questionRows[index];

    const existing = await client.query(
      `SELECT id
       FROM questions
       WHERE course_id = $1 AND academic_year = $2 AND question_text = $3
       LIMIT 1`,
      [courseId, seededCourse.academicYear, questionText]
    );

    if (existing.rowCount === 0) {
      await client.query(
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
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          courseId,
          seededCourse.academicYear,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          difficulty,
          facultyId
        ]
      );
    }
  }
};

const main = async () => {
  await ensureQuestionWorkbook();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const facultyHash = await bcrypt.hash(seededFaculty.password, saltRounds);
    const studentHash = await bcrypt.hash(seededStudent.password, saltRounds);

    const adminRes = await client.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
    );

    if (adminRes.rowCount === 0) {
      throw new Error('No admin user found. Run node seed.js first.');
    }

    const adminId = adminRes.rows[0].id;

    const facultyRes = await client.query(
      `INSERT INTO users (full_name, email, username, password_hash, role, employee_id)
       VALUES ($1, $2, $3, $4, 'faculty', $5)
       ON CONFLICT (email)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         role = 'faculty',
         employee_id = EXCLUDED.employee_id
       RETURNING id, username`,
      [
        seededFaculty.fullName,
        seededFaculty.email,
        seededFaculty.username,
        facultyHash,
        seededFaculty.employeeId
      ]
    );

    const facultyId = facultyRes.rows[0].id;

    const studentRes = await client.query(
      `INSERT INTO users (full_name, email, username, password_hash, role, current_year)
       VALUES ($1, $2, $3, $4, 'student', $5)
       ON CONFLICT (email)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         role = 'student',
         current_year = EXCLUDED.current_year
       RETURNING id, username`,
      [
        seededStudent.fullName,
        seededStudent.email,
        seededStudent.username,
        studentHash,
        seededStudent.currentYear
      ]
    );

    const studentId = studentRes.rows[0].id;

    const courseRes = await client.query(
      `INSERT INTO courses (course_name, course_code, description, student_year, academic_year, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (course_code)
       DO UPDATE SET
         course_name = EXCLUDED.course_name,
         description = EXCLUDED.description,
         student_year = EXCLUDED.student_year,
         academic_year = EXCLUDED.academic_year
       RETURNING id, course_code`,
      [
        seededCourse.name,
        seededCourse.code,
        seededCourse.description,
        seededCourse.studentYear,
        seededCourse.academicYear,
        adminId
      ]
    );

    const courseId = courseRes.rows[0].id;

    await client.query(
      'INSERT INTO faculty_courses (faculty_id, course_id) VALUES ($1, $2) ON CONFLICT (faculty_id, course_id) DO NOTHING',
      [facultyId, courseId]
    );

    await client.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING',
      [studentId, courseId]
    );

    await ensureSeedQuestions(client, facultyId, courseId);

    await client.query(
      `DELETE FROM exams
       WHERE title = $1 AND course_id = $2 AND created_by = $3`,
      [seededExam.title, courseId, facultyId]
    );

    const examRes = await client.query(
      `INSERT INTO exams (
         title,
         course_id,
         created_by,
         academic_year,
         start_datetime,
         duration_minutes,
         num_questions
       )
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '5 minutes', $5, $6)
       RETURNING id`,
      [
        seededExam.title,
        courseId,
        facultyId,
        seededCourse.academicYear,
        seededExam.durationMinutes,
        seededExam.numQuestions
      ]
    );

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          workbookPath,
          facultyId,
          facultyUsername: seededFaculty.username,
          facultyPassword: seededFaculty.password,
          studentId,
          studentUsername: seededStudent.username,
          studentPassword: seededStudent.password,
          studentCurrentYear: seededStudent.currentYear,
          courseId,
          courseCode: seededCourse.code,
          studentYear: seededCourse.studentYear,
          academicYear: seededCourse.academicYear,
          examId: examRes.rows[0].id,
          examTitle: seededExam.title
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error('seed.testdata failed:', error.message);
  process.exitCode = 1;
});
