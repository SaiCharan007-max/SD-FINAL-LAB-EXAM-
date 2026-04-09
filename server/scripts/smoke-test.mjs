import { execFileSync } from 'child_process';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3137';

const readSeedOutput = (commandArgs) => {
  const output = execFileSync(process.execPath, commandArgs, {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  const trimmed = output.trim();
  const jsonStart = trimmed.indexOf('{');

  if (jsonStart === -1) {
    throw new Error(`Could not find JSON in command output: ${trimmed}`);
  }

  return JSON.parse(trimmed.slice(jsonStart));
};

const runCommand = (commandArgs) => {
  execFileSync(process.execPath, commandArgs, {
    cwd: process.cwd(),
    stdio: 'pipe',
    encoding: 'utf8'
  });
};

const api = async (name, method, path, body, token, extraHeaders = {}) => {
  try {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const text = await response.text();
    let parsed = text;

    try {
      parsed = JSON.parse(text);
    } catch {
      // Keep text as-is for CSV and other non-JSON responses.
    }

    return {
      name,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsed
    };
  } catch (error) {
    return {
      name,
      ok: false,
      error: error.message
    };
  }
};

const assertOk = (result, message) => {
  if (!result.ok) {
    throw new Error(`${message}: ${JSON.stringify(result, null, 2)}`);
  }
};

const main = async () => {
  const results = [];

  const health = await api('health', 'GET', '/');
  assertOk(health, 'Server health check failed');
  results.push(health);

  runCommand(['seed.js']);
  const seeded = readSeedOutput(['seed.testdata.js']);

  const adminLogin = await api('adminLogin', 'POST', '/api/auth/login', {
    username: 'AdminExam999',
    password: 'AdminExam@123',
    role: 'admin'
  });
  assertOk(adminLogin, 'Admin login failed');
  results.push(adminLogin);
  const adminToken = adminLogin.body.token;

  const adminSummary = await api('adminSummary', 'GET', '/api/admin/summary', null, adminToken);
  assertOk(adminSummary, 'Admin summary failed');
  results.push(adminSummary);

  const facultyLogin = await api('facultyLogin', 'POST', '/api/auth/login', {
    username: seeded.facultyUsername,
    password: seeded.facultyPassword,
    role: 'faculty'
  });
  assertOk(facultyLogin, 'Faculty login failed');
  results.push(facultyLogin);
  const facultyToken = facultyLogin.body.token;

  const facultyCourses = await api('facultyCourses', 'GET', '/api/faculty/courses', null, facultyToken);
  assertOk(facultyCourses, 'Faculty courses failed');
  results.push(facultyCourses);

  const facultyQuestions = await api(
    'facultyQuestions',
    'GET',
    `/api/faculty/questions/${seeded.courseId}?academic_year=${encodeURIComponent(seeded.academicYear)}`,
    null,
    facultyToken
  );
  assertOk(facultyQuestions, 'Faculty questions failed');
  results.push(facultyQuestions);

  const facultyExams = await api('facultyExams', 'GET', '/api/faculty/exams', null, facultyToken);
  assertOk(facultyExams, 'Faculty exams failed');
  results.push(facultyExams);

  const seededExam = facultyExams.body.find((exam) => exam.id === seeded.examId);

  if (!seededExam) {
    throw new Error(`Seeded exam ${seeded.examId} was not returned by faculty exams`);
  }

  const studentLogin = await api('studentLogin', 'POST', '/api/auth/login', {
    username: seeded.studentUsername,
    password: seeded.studentPassword,
    role: 'student'
  });
  assertOk(studentLogin, 'Student login failed');
  results.push(studentLogin);
  const studentToken = studentLogin.body.token;

  const studentMyCourses = await api(
    'studentMyCourses',
    'GET',
    '/api/student/my-courses',
    null,
    studentToken
  );
  assertOk(studentMyCourses, 'Student my-courses failed');
  results.push(studentMyCourses);

  const studentMyExams = await api(
    'studentMyExams',
    'GET',
    '/api/student/my-exams',
    null,
    studentToken
  );
  assertOk(studentMyExams, 'Student my-exams failed');
  results.push(studentMyExams);

  const targetExam = studentMyExams.body.find(
    (exam) => exam.exam_id === seeded.examId && exam.status === 'Ongoing'
  );

  if (!targetExam) {
    throw new Error(`Expected seeded ongoing exam ${seeded.examId} to be visible to the student`);
  }

  const examStart = await api(
    'examStart',
    'POST',
    `/api/exam/${seeded.examId}/start`,
    null,
    studentToken
  );
  assertOk(examStart, 'Exam start failed');
  results.push(examStart);

  const attemptId = examStart.body.attempt_id;
  const attemptQuestionId = examStart.body.questions?.[0]?.attempt_question_id;

  if (!attemptId || !attemptQuestionId) {
    throw new Error(`Exam start did not return attempt metadata: ${JSON.stringify(examStart.body, null, 2)}`);
  }

  const saveAnswer = await api(
    'saveAnswer',
    'PATCH',
    `/api/exam/attempt/${attemptId}/answer`,
    {
      attempt_question_id: attemptQuestionId,
      student_answer: 1
    },
    studentToken
  );
  assertOk(saveAnswer, 'Saving answer failed');
  results.push(saveAnswer);

  const submitExam = await api(
    'submitExam',
    'POST',
    `/api/exam/attempt/${attemptId}/submit`,
    null,
    studentToken
  );
  assertOk(submitExam, 'Exam submit failed');
  results.push(submitExam);

  const attemptResult = await api(
    'attemptResult',
    'GET',
    `/api/exam/attempt/${attemptId}/result`,
    null,
    studentToken
  );
  assertOk(attemptResult, 'Attempt result failed');
  results.push(attemptResult);

  const studentResults = await api(
    'studentResults',
    'GET',
    '/api/student/my-results',
    null,
    studentToken
  );
  assertOk(studentResults, 'Student results failed');
  results.push(studentResults);

  const leaderboard = await api(
    'leaderboard',
    'GET',
    `/api/faculty/exams/${seeded.examId}/leaderboard`,
    null,
    facultyToken
  );
  assertOk(leaderboard, 'Leaderboard failed');
  results.push(leaderboard);

  const leaderboardCsv = await api(
    'leaderboardCsv',
    'GET',
    `/api/faculty/exams/${seeded.examId}/leaderboard/export-csv`,
    null,
    facultyToken
  );
  assertOk(leaderboardCsv, 'Leaderboard CSV failed');
  results.push({
    ...leaderboardCsv,
    body:
      typeof leaderboardCsv.body === 'string'
        ? leaderboardCsv.body.split('\n').slice(0, 2)
        : leaderboardCsv.body
  });

  console.log(
    JSON.stringify(
      {
        seeded,
        checks: results.map((result) => ({
          name: result.name,
          status: result.status,
          ok: result.ok
        }))
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message }, null, 2));
  process.exitCode = 1;
});
