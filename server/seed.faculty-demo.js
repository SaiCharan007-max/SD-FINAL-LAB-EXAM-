import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

import pool from './src/config/db.js';

dotenv.config();

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const facultySeed = {
  full_name: 'Faculty Two',
  email: 'faculty2@example.com',
  username: 'EMP2002',
  employee_id: 'EMP2002',
  password: 'Temp2002'
};

const studentSeeds = [
  {
    full_name: 'Student Two',
    email: 'student2@example.com',
    username: 'student002',
    password: 'Student@123',
    current_year: '2nd Year'
  },
  {
    full_name: 'Aarav Kumar',
    email: 'aarav.kumar@example.com',
    username: 'student201',
    password: 'Student@123',
    current_year: '2nd Year'
  },
  {
    full_name: 'Meera Nair',
    email: 'meera.nair@example.com',
    username: 'student202',
    password: 'Student@123',
    current_year: '2nd Year'
  },
  {
    full_name: 'Rohan Das',
    email: 'rohan.das@example.com',
    username: 'student203',
    password: 'Student@123',
    current_year: '2nd Year'
  }
];

const courseSeeds = [
  {
    course_name: 'Algorithms',
    course_code: 'CS202',
    description: 'Algorithms course for full API testing',
    student_year: '2nd Year',
    academic_year: '2025-26'
  },
  {
    course_name: 'Database Systems',
    course_code: 'CS204',
    description: 'Structured query processing and relational design',
    student_year: '2nd Year',
    academic_year: '2025-26'
  },
  {
    course_name: 'Operating Systems',
    course_code: 'CS205',
    description: 'Processes, scheduling, memory, and synchronization',
    student_year: '2nd Year',
    academic_year: '2025-26'
  }
];

const questionBank = {
  CS202: [
    ['Which data structure works on FIFO?', 'Stack', 'Queue', 'Heap', 'Trie', 'B', 'Easy'],
    ['Which algorithm uses divide and conquer for searching a sorted array?', 'BFS', 'DFS', 'Binary Search', 'Dijkstra', 'C', 'Easy'],
    ['What is the average-case time complexity of quicksort?', 'O(n)', 'O(log n)', 'O(n log n)', 'O(n^2)', 'C', 'Medium'],
    ['Which structure is best for prefix search?', 'Queue', 'Trie', 'Heap', 'Graph', 'B', 'Medium'],
    ['Which traversal uses a queue?', 'DFS', 'BFS', 'Inorder', 'Backtracking', 'B', 'Easy'],
    ['A minimum spanning tree exists for which type of graph?', 'Directed acyclic graph only', 'Connected weighted undirected graph', 'Only complete graph', 'Only tree graph', 'B', 'Hard']
  ],
  CS204: [
    ['Which SQL clause sorts the result set?', 'GROUP BY', 'HAVING', 'ORDER BY', 'WHERE', 'C', 'Easy'],
    ['Which join returns only matching rows from both tables?', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'INNER JOIN', 'D', 'Easy'],
    ['Which normal form removes partial dependency?', '1NF', '2NF', '3NF', 'BCNF', 'B', 'Medium'],
    ['Which command removes all rows but keeps the table?', 'DROP', 'TRUNCATE', 'REMOVE', 'DELETE TABLE', 'B', 'Medium'],
    ['What does ACID stand for?', 'Atomicity, Consistency, Isolation, Durability', 'Accuracy, Consistency, Integrity, Durability', 'Atomicity, Clarity, Isolation, Durability', 'Access, Control, Isolation, Dependability', 'A', 'Hard'],
    ['Which key references a primary key in another table?', 'Candidate key', 'Super key', 'Foreign key', 'Composite key', 'C', 'Easy']
  ],
  CS205: [
    ['Which scheduler gives each process a fixed time slice?', 'FCFS', 'Round Robin', 'Shortest Job First', 'Priority Non-preemptive', 'B', 'Easy'],
    ['Which memory issue occurs when free space is split into small blocks?', 'Deadlock', 'Thrashing', 'Fragmentation', 'Starvation', 'C', 'Easy'],
    ['A process waiting forever because others keep getting CPU is called?', 'Deadlock', 'Starvation', 'Aging', 'Paging', 'B', 'Medium'],
    ['Which concept allows multiple readers but one writer?', 'Semaphore', 'Reader-writer problem', 'Dining philosophers', 'Mutual exclusion only', 'B', 'Medium'],
    ['Which of these is not a process state?', 'Ready', 'Running', 'Blocked', 'Compiled', 'D', 'Easy'],
    ['Which technique prevents starvation in priority scheduling?', 'Swapping', 'Aging', 'Paging', 'Segmentation', 'B', 'Hard']
  ]
};

const examSeeds = [
  {
    title: 'Algorithms Live Test',
    course_code: 'CS202',
    academic_year: '2025-26',
    offset_minutes: -5,
    duration_minutes: 120,
    num_questions: 5
  },
  {
    title: 'Database Systems Quiz',
    course_code: 'CS204',
    academic_year: '2025-26',
    offset_minutes: 180,
    duration_minutes: 45,
    num_questions: 5
  },
  {
    title: 'Operating Systems Mock',
    course_code: 'CS205',
    academic_year: '2025-26',
    offset_minutes: -2880,
    duration_minutes: 60,
    num_questions: 5
  }
];

const completedExamPerformance = [
  { username: 'student201', answerPattern: ['A', 'B', 'D', 'B', 'D'], time_taken_sec: 1380 },
  { username: 'student202', answerPattern: ['B', 'B', 'B', 'B', 'D'], time_taken_sec: 1520 },
  { username: 'student203', answerPattern: ['B', 'C', 'B', 'A', 'D'], time_taken_sec: 1675 }
];

const ensureAdmin = async (client) => {
  const result = await client.query(
    "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
  );

  if (result.rowCount === 0) {
    throw new Error('No admin user found. Run node seed.js first.');
  }

  return result.rows[0].id;
};

const upsertFaculty = async (client) => {
  const passwordHash = await bcrypt.hash(facultySeed.password, saltRounds);
  const result = await client.query(
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
      facultySeed.full_name,
      facultySeed.email,
      facultySeed.username,
      passwordHash,
      facultySeed.employee_id
    ]
  );

  return result.rows[0];
};

const upsertStudents = async (client) => {
  const students = [];

  for (const seed of studentSeeds) {
    const passwordHash = await bcrypt.hash(seed.password, saltRounds);
    const result = await client.query(
      `INSERT INTO users (full_name, email, username, password_hash, role, current_year)
       VALUES ($1, $2, $3, $4, 'student', $5)
       ON CONFLICT (email)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         role = 'student',
         current_year = EXCLUDED.current_year
       RETURNING id, username, current_year`,
      [seed.full_name, seed.email, seed.username, passwordHash, seed.current_year]
    );

    students.push(result.rows[0]);
  }

  return students;
};

const upsertCourses = async (client, adminId) => {
  const courses = [];

  for (const seed of courseSeeds) {
    const result = await client.query(
      `INSERT INTO courses (course_name, course_code, description, student_year, academic_year, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (course_code)
       DO UPDATE SET
         course_name = EXCLUDED.course_name,
         description = EXCLUDED.description,
         student_year = EXCLUDED.student_year,
         academic_year = EXCLUDED.academic_year
       RETURNING id, course_code, student_year, academic_year`,
      [
        seed.course_name,
        seed.course_code,
        seed.description,
        seed.student_year,
        seed.academic_year,
        adminId
      ]
    );

    courses.push(result.rows[0]);
  }

  return courses;
};

const assignFacultyToCourses = async (client, facultyId, courses) => {
  for (const course of courses) {
    await client.query(
      `INSERT INTO faculty_courses (faculty_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (faculty_id, course_id) DO NOTHING`,
      [facultyId, course.id]
    );
  }
};

const enrollStudents = async (client, students, courses) => {
  for (const student of students) {
    for (const course of courses) {
      await client.query(
        `INSERT INTO enrollments (student_id, course_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id, course_id) DO NOTHING`,
        [student.id, course.id]
      );
    }
  }
};

const ensureQuestions = async (client, facultyId, courses) => {
  for (const course of courses) {
    const rows = questionBank[course.course_code] || [];

    for (const [question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty] of rows) {
      const existing = await client.query(
        `SELECT id
         FROM questions
         WHERE course_id = $1 AND academic_year = $2 AND question_text = $3
         LIMIT 1`,
        [course.id, course.academic_year, question_text]
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
            course.id,
            course.academic_year,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            difficulty,
            facultyId
          ]
        );
      }
    }
  }
};

const recreateDemoExams = async (client, facultyId, courses) => {
  const createdExams = [];

  for (const seed of examSeeds) {
    const course = courses.find((item) => item.course_code === seed.course_code);

    await client.query(
      `DELETE FROM exams
       WHERE title = $1 AND course_id = $2 AND created_by = $3`,
      [seed.title, course.id, facultyId]
    );

    const result = await client.query(
      `INSERT INTO exams (
         title,
         course_id,
         created_by,
         academic_year,
         start_datetime,
         duration_minutes,
         num_questions
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         NOW() + ($5 * INTERVAL '1 minute'),
         $6,
         $7
       )
       RETURNING id, title, course_id, academic_year, start_datetime, duration_minutes, num_questions`,
      [
        seed.title,
        course.id,
        facultyId,
        seed.academic_year,
        seed.offset_minutes,
        seed.duration_minutes,
        seed.num_questions
      ]
    );

    createdExams.push(result.rows[0]);
  }

  return createdExams;
};

const seedCompletedExamData = async (client, completedExam, studentsByUsername) => {
  const questionResult = await client.query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer
     FROM questions
     WHERE course_id = $1 AND academic_year = $2
     ORDER BY id ASC
     LIMIT $3`,
    [completedExam.course_id, completedExam.academic_year, completedExam.num_questions]
  );

  const questions = questionResult.rows;

  if (questions.length < Number(completedExam.num_questions)) {
    throw new Error('Not enough questions to build completed exam demo data');
  }

  const rankingDraft = [];

  for (let index = 0; index < completedExamPerformance.length; index += 1) {
    const performance = completedExamPerformance[index];
    const student = studentsByUsername.get(performance.username);

    const submittedAtOffsetMinutes = 130 + index * 3;
    const attemptResult = await client.query(
      `INSERT INTO exam_attempts (
         exam_id,
         student_id,
         started_at,
         submitted_at,
         is_submitted,
         score,
         time_taken_sec
       )
       VALUES (
         $1,
         $2,
         NOW() - INTERVAL '2 days',
         NOW() - ($3 * INTERVAL '1 minute'),
         TRUE,
         0,
         $4
       )
       RETURNING id, submitted_at`,
      [completedExam.id, student.id, submittedAtOffsetMinutes, performance.time_taken_sec]
    );

    const attemptId = attemptResult.rows[0].id;
    let score = 0;

    for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
      const question = questions[questionIndex];
      const chosenOriginal = performance.answerPattern[questionIndex];
      const studentAnswer = ['A', 'B', 'C', 'D'].indexOf(chosenOriginal) + 1;
      const isCorrect = chosenOriginal === question.correct_answer;

      if (isCorrect) {
        score += 1;
      }

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
           opt4_original,
           student_answer,
           is_correct
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'A', 'B', 'C', 'D', $8, $9)`,
        [
          attemptId,
          question.id,
          questionIndex + 1,
          question.option_a,
          question.option_b,
          question.option_c,
          question.option_d,
          studentAnswer,
          isCorrect
        ]
      );
    }

    await client.query(
      `UPDATE exam_attempts
       SET score = $2
       WHERE id = $1`,
      [attemptId, score]
    );

    rankingDraft.push({
      student_id: student.id,
      score,
      percentage: Number(((score / questions.length) * 100).toFixed(2)),
      time_taken_sec: performance.time_taken_sec,
      submitted_at: attemptResult.rows[0].submitted_at
    });
  }

  rankingDraft.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return new Date(left.submitted_at).getTime() - new Date(right.submitted_at).getTime();
  });

  let previousKey = null;
  let currentRank = 0;

  for (let index = 0; index < rankingDraft.length; index += 1) {
    const row = rankingDraft[index];
    const key = `${row.score}|${new Date(row.submitted_at).toISOString()}`;

    if (key !== previousKey) {
      currentRank = index + 1;
      previousKey = key;
    }

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
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (exam_id, student_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         percentage = EXCLUDED.percentage,
         time_taken_sec = EXCLUDED.time_taken_sec,
         submitted_at = EXCLUDED.submitted_at,
         rank = EXCLUDED.rank`,
      [
        completedExam.id,
        row.student_id,
        row.score,
        row.percentage,
        row.time_taken_sec,
        row.submitted_at,
        currentRank
      ]
    );
  }
};

const main = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const adminId = await ensureAdmin(client);
    const faculty = await upsertFaculty(client);
    const students = await upsertStudents(client);
    const studentsByUsername = new Map(students.map((student) => [student.username, student]));
    const courses = await upsertCourses(client, adminId);

    await assignFacultyToCourses(client, faculty.id, courses);
    await enrollStudents(client, students, courses);
    await ensureQuestions(client, faculty.id, courses);

    const existingDemoExamIds = await client.query(
      `SELECT id
       FROM exams
       WHERE created_by = $1
         AND title = ANY($2::text[])`,
      [faculty.id, examSeeds.map((seed) => seed.title)]
    );

    if (existingDemoExamIds.rowCount > 0) {
      await client.query(
        `DELETE FROM exam_rankings
         WHERE exam_id = ANY($1::int[])`,
        [existingDemoExamIds.rows.map((row) => row.id)]
      );
    }

    const exams = await recreateDemoExams(client, faculty.id, courses);
    const completedExam = exams.find((exam) => exam.title === 'Operating Systems Mock');

    await seedCompletedExamData(client, completedExam, studentsByUsername);

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          faculty: {
            username: facultySeed.username,
            password: facultySeed.password
          },
          students: studentSeeds.map((student) => ({
            username: student.username,
            password: student.password,
            current_year: student.current_year
          })),
          courses: courseSeeds.map((course) => ({
            course_code: course.course_code,
            course_name: course.course_name,
            student_year: course.student_year,
            academic_year: course.academic_year
          })),
          exams: exams.map((exam) => ({
            title: exam.title,
            start_datetime: exam.start_datetime,
            duration_minutes: Number(exam.duration_minutes),
            num_questions: Number(exam.num_questions)
          }))
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
  console.error('seed.faculty-demo failed:', error.message);
  process.exitCode = 1;
});
