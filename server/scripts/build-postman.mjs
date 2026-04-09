import { writeFile } from 'fs/promises';
import path from 'path';

const questionsExcelPath = path.join(process.cwd(), 'postman-assets', 'questions.xlsx').replace(/\\/g, '/');
const outputPath = path.join(process.cwd(), 'postman.json');

const jsonHeaders = [{ key: 'Content-Type', value: 'application/json' }];

const bearerHeader = (tokenVar) => [{ key: 'Authorization', value: `Bearer {{${tokenVar}}}` }];

const makeJsonRequest = ({
  name,
  method,
  pathParts,
  rawPath,
  body,
  tokenVar,
  tests = [],
  prerequest = [],
  description = ''
}) => ({
  name,
  ...(prerequest.length || tests.length
    ? {
        event: [
          ...(prerequest.length
            ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: prerequest } }]
            : []),
          ...(tests.length
            ? [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }]
            : [])
        ]
      }
    : {}),
  request: {
    method,
    description,
    header: [
      ...(tokenVar ? bearerHeader(tokenVar) : []),
      ...(body ? jsonHeaders : [])
    ],
    ...(body
      ? {
          body: {
            mode: 'raw',
            raw: JSON.stringify(body, null, 2)
              .replace(/"{{/g, '{{')
              .replace(/}}"/g, '}}')
          }
        }
      : {}),
    url: {
      raw: `{{baseUrl}}${rawPath}`,
      host: ['{{baseUrl}}'],
      path: pathParts
    }
  },
  response: []
});

const collection = {
  info: {
    _postman_id: '4e2a56b4-6434-4f79-91c3-f2bc1b9f1f0a',
    name: 'Online Examination Management Portal API',
    description:
      'Full backend verification collection. Run `node seed.js`, `node seed.testdata.js`, and start the server before executing the collection.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3137' },
    { key: 'adminUsername', value: 'AdminExam999' },
    { key: 'adminPassword', value: 'AdminExam@123' },
    { key: 'seededFacultyUsername', value: 'EMP2002' },
    { key: 'seededFacultyPassword', value: 'Temp2002' },
    { key: 'seededCourseCode', value: 'CS202' },
    { key: 'seededStudentYear', value: '2nd Year' },
    { key: 'seededAcademicYear', value: '2025-26' },
    { key: 'seededExamTitle', value: 'Algorithms Live Test' },
    { key: 'questionsExcelPath', value: questionsExcelPath },
    { key: 'adminToken', value: '' },
    { key: 'seededFacultyToken', value: '' },
    { key: 'studentToken', value: '' },
    { key: 'dynamicStudentName', value: '' },
    { key: 'dynamicStudentEmail', value: '' },
    { key: 'dynamicStudentUsername', value: '' },
    { key: 'dynamicStudentCurrentYear', value: '2nd Year' },
    { key: 'dynamicStudentPassword', value: 'Student@123' },
    { key: 'dynamicFacultyName', value: '' },
    { key: 'dynamicFacultyEmail', value: '' },
    { key: 'dynamicFacultyEmployeeId', value: '' },
    { key: 'dynamicFacultyTempPassword', value: '' },
    { key: 'dynamicFacultyId', value: '' },
    { key: 'dynamicFacultyToken', value: '' },
    { key: 'dynamicCourseName', value: '' },
    { key: 'dynamicCourseCode', value: '' },
    { key: 'dynamicCourseStudentYear', value: '2nd Year' },
    { key: 'dynamicCourseId', value: '' },
    { key: 'seededCourseId', value: '' },
    { key: 'futureExamTitle', value: '' },
    { key: 'futureExamStartDateTime', value: '' },
    { key: 'futureExamId', value: '' },
    { key: 'ongoingExamId', value: '' },
    { key: 'attemptId', value: '' },
    { key: 'attemptQuestionId', value: '' }
  ],
  item: [
    {
      name: 'Health',
      item: [
        makeJsonRequest({
          name: 'GET /',
          method: 'GET',
          pathParts: [''],
          rawPath: '/',
          description: 'Expected: `200` with `{ "message": "Online Examination Management Portal API" }`.',
          tests: [
            "pm.test('Health check passes', function () { pm.response.to.have.status(200); });",
            "pm.test('Health message is returned', function () { pm.expect(pm.response.json().message).to.eql('Online Examination Management Portal API'); });"
          ]
        })
      ]
    },
    {
      name: 'Authentication',
      item: [
        makeJsonRequest({
          name: 'POST /api/auth/login (Admin)',
          method: 'POST',
          pathParts: ['api', 'auth', 'login'],
          rawPath: '/api/auth/login',
          body: {
            username: '{{adminUsername}}',
            password: '{{adminPassword}}',
            role: 'admin'
          },
          description: 'Expected: `200` with JWT token and admin user payload.',
          tests: [
            "pm.test('Admin login succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json.user.role).to.eql('admin');",
            "pm.collectionVariables.set('adminToken', json.token);"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/auth/login (Seeded Faculty)',
          method: 'POST',
          pathParts: ['api', 'auth', 'login'],
          rawPath: '/api/auth/login',
          body: {
            username: '{{seededFacultyUsername}}',
            password: '{{seededFacultyPassword}}',
            role: 'faculty'
          },
          description: 'Expected: `200` with JWT token and seeded faculty user payload.',
          tests: [
            "pm.test('Seeded faculty login succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json.user.role).to.eql('faculty');",
            "pm.collectionVariables.set('seededFacultyToken', json.token);"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/auth/register (Dynamic Student)',
          method: 'POST',
          pathParts: ['api', 'auth', 'register'],
          rawPath: '/api/auth/register',
          prerequest: [
            "const unique = String(Date.now()).slice(-6);",
            "pm.collectionVariables.set('dynamicStudentName', 'Student ' + unique);",
            "pm.collectionVariables.set('dynamicStudentEmail', 'student' + unique + '@example.com');",
            "pm.collectionVariables.set('dynamicStudentUsername', 'student' + unique);",
            "pm.collectionVariables.set('dynamicStudentCurrentYear', pm.collectionVariables.get('seededStudentYear'));"
          ],
          body: {
            full_name: '{{dynamicStudentName}}',
            email: '{{dynamicStudentEmail}}',
            username: '{{dynamicStudentUsername}}',
            current_year: '{{dynamicStudentCurrentYear}}',
            password: '{{dynamicStudentPassword}}',
            confirm_password: '{{dynamicStudentPassword}}'
          },
          description: 'Expected: `201` with `{ message, user: { id, username, role } }` and role `student`.',
          tests: [
            "pm.test('Dynamic student registers', function () { pm.response.to.have.status(201); });",
            'const json = pm.response.json();',
            "pm.expect(json.message).to.eql('Registration successful');",
            "pm.expect(json.user.role).to.eql('student');"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/auth/login (Dynamic Student)',
          method: 'POST',
          pathParts: ['api', 'auth', 'login'],
          rawPath: '/api/auth/login',
          body: {
            username: '{{dynamicStudentUsername}}',
            password: '{{dynamicStudentPassword}}',
            role: 'student'
          },
          description: 'Expected: `200` with JWT token and dynamic student payload.',
          tests: [
            "pm.test('Dynamic student login succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json.user.role).to.eql('student');",
            "pm.collectionVariables.set('studentToken', json.token);"
          ]
        })
      ]
    },
    {
      name: 'Admin',
      item: [
        makeJsonRequest({
          name: 'GET /api/admin/summary',
          method: 'GET',
          pathParts: ['api', 'admin', 'summary'],
          rawPath: '/api/admin/summary',
          tokenVar: 'adminToken',
          description: 'Expected: `200` with totals for courses, faculty, students, and exams.',
          tests: [
            "pm.test('Admin summary succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "['total_courses', 'total_faculty', 'total_students', 'total_exams'].forEach((key) => pm.expect(json).to.have.property(key));"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/admin/faculty (Dynamic Faculty)',
          method: 'POST',
          pathParts: ['api', 'admin', 'faculty'],
          rawPath: '/api/admin/faculty',
          tokenVar: 'adminToken',
          prerequest: [
            "const unique = String(Date.now()).slice(-6);",
            "pm.collectionVariables.set('dynamicFacultyName', 'Faculty ' + unique);",
            "pm.collectionVariables.set('dynamicFacultyEmail', 'faculty' + unique + '@example.com');",
            "pm.collectionVariables.set('dynamicFacultyEmployeeId', 'EMP' + unique);"
          ],
          body: {
            full_name: '{{dynamicFacultyName}}',
            email: '{{dynamicFacultyEmail}}',
            employee_id: '{{dynamicFacultyEmployeeId}}'
          },
          description: 'Expected: `201` with faculty payload and one-time `temp_password`.',
          tests: [
            "pm.test('Dynamic faculty is created', function () { pm.response.to.have.status(201); });",
            'const json = pm.response.json();',
            "pm.collectionVariables.set('dynamicFacultyId', String(json.faculty.id));",
            "pm.collectionVariables.set('dynamicFacultyTempPassword', json.temp_password);",
            "pm.expect(json.faculty.email).to.eql(pm.collectionVariables.get('dynamicFacultyEmail'));"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/admin/faculty',
          method: 'GET',
          pathParts: ['api', 'admin', 'faculty'],
          rawPath: '/api/admin/faculty',
          tokenVar: 'adminToken',
          description: 'Expected: `200` with faculty list including the newly created faculty.',
          tests: [
            "pm.test('Faculty list succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "const matched = json.find((faculty) => faculty.email === pm.collectionVariables.get('dynamicFacultyEmail'));",
            "pm.expect(matched).to.exist;",
            "pm.collectionVariables.set('dynamicFacultyId', String(matched.id));"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/admin/courses (Dynamic Course)',
          method: 'POST',
          pathParts: ['api', 'admin', 'courses'],
          rawPath: '/api/admin/courses',
          tokenVar: 'adminToken',
          prerequest: [
            "const unique = String(Date.now()).slice(-5);",
            "pm.collectionVariables.set('dynamicCourseName', 'Algorithms Lab ' + unique);",
            "pm.collectionVariables.set('dynamicCourseCode', 'LAB' + unique);",
            "pm.collectionVariables.set('dynamicCourseStudentYear', pm.collectionVariables.get('seededStudentYear'));"
          ],
          body: {
            course_name: '{{dynamicCourseName}}',
            course_code: '{{dynamicCourseCode}}',
            description: 'Course created during Postman verification',
            student_year: '{{dynamicCourseStudentYear}}',
            academic_year: '{{seededAcademicYear}}'
          },
          description: 'Expected: `201` with created course object.',
          tests: [
            "pm.test('Dynamic course is created', function () { pm.response.to.have.status(201); });",
            'const json = pm.response.json();',
            "pm.collectionVariables.set('dynamicCourseId', String(json.id));"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/admin/courses',
          method: 'GET',
          pathParts: ['api', 'admin', 'courses'],
          rawPath: '/api/admin/courses',
          tokenVar: 'adminToken',
          description: 'Expected: `200` with seeded and dynamic courses plus faculty assignments.',
          tests: [
            "pm.test('Course list succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "const seededCourse = json.find((course) => course.course_code === pm.collectionVariables.get('seededCourseCode'));",
            "const dynamicCourse = json.find((course) => course.course_code === pm.collectionVariables.get('dynamicCourseCode'));",
            "pm.expect(seededCourse).to.exist;",
            "pm.expect(dynamicCourse).to.exist;",
            "pm.collectionVariables.set('seededCourseId', String(seededCourse.id));",
            "pm.collectionVariables.set('dynamicCourseId', String(dynamicCourse.id));"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/admin/courses/:courseId/assign-faculty',
          method: 'POST',
          pathParts: ['api', 'admin', 'courses', '{{dynamicCourseId}}', 'assign-faculty'],
          rawPath: '/api/admin/courses/{{dynamicCourseId}}/assign-faculty',
          tokenVar: 'adminToken',
          body: {
            faculty_ids: ['{{dynamicFacultyId}}']
          },
          description: 'Expected: `200` with `{ message: "Faculty assigned successfully" }`.',
          tests: [
            "pm.test('Faculty assignment succeeds', function () { pm.response.to.have.status(200); });",
            "pm.expect(pm.response.json().message).to.eql('Faculty assigned successfully');"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/auth/login (Dynamic Faculty)',
          method: 'POST',
          pathParts: ['api', 'auth', 'login'],
          rawPath: '/api/auth/login',
          body: {
            username: '{{dynamicFacultyEmployeeId}}',
            password: '{{dynamicFacultyTempPassword}}',
            role: 'faculty'
          },
          description: 'Expected: `200` with JWT token for the newly created faculty.',
          tests: [
            "pm.test('Dynamic faculty login succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.collectionVariables.set('dynamicFacultyToken', json.token);"
          ]
        })
      ]
    },
    {
      name: 'Faculty',
      item: [
        makeJsonRequest({
          name: 'GET /api/faculty/courses (Dynamic Faculty)',
          method: 'GET',
          pathParts: ['api', 'faculty', 'courses'],
          rawPath: '/api/faculty/courses',
          tokenVar: 'dynamicFacultyToken',
          description: 'Expected: `200` with the dynamic course assigned by admin.',
          tests: [
            "pm.test('Dynamic faculty course list succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json.some((course) => String(course.id) === pm.collectionVariables.get('dynamicCourseId'))).to.eql(true);"
          ]
        }),
        {
          name: 'POST /api/faculty/questions/upload',
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  "pm.test('Question upload succeeds', function () { pm.response.to.have.status(200); });",
                  'const json = pm.response.json();',
                  "pm.expect(json.message).to.include('Upload successful');",
                  "pm.expect(json.count).to.be.above(0);"
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            description:
              'Expected: `200` with `Upload successful - X questions added`. Uses the workbook generated by `node seed.testdata.js`.',
            header: bearerHeader('dynamicFacultyToken'),
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'course_id', value: '{{dynamicCourseId}}', type: 'text' },
                { key: 'academic_year', value: '{{seededAcademicYear}}', type: 'text' },
                { key: 'file', type: 'file', src: '{{questionsExcelPath}}' }
              ]
            },
            url: {
              raw: '{{baseUrl}}/api/faculty/questions/upload',
              host: ['{{baseUrl}}'],
              path: ['api', 'faculty', 'questions', 'upload']
            }
          },
          response: []
        },
        makeJsonRequest({
          name: 'GET /api/faculty/questions/:courseId',
          method: 'GET',
          pathParts: ['api', 'faculty', 'questions', '{{dynamicCourseId}}'],
          rawPath: '/api/faculty/questions/{{dynamicCourseId}}?academic_year={{seededAcademicYear}}',
          tokenVar: 'dynamicFacultyToken',
          description: 'Expected: `200` with uploaded questions for the dynamic course.',
          tests: [
            "pm.test('Dynamic course questions are returned', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            'pm.expect(Array.isArray(json)).to.eql(true);',
            'pm.expect(json.length).to.be.above(0);'
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/faculty/exams (Future Exam)',
          method: 'POST',
          pathParts: ['api', 'faculty', 'exams'],
          rawPath: '/api/faculty/exams',
          tokenVar: 'dynamicFacultyToken',
          prerequest: [
            "const start = new Date(Date.now() + 20 * 60 * 1000);",
            "const unique = String(Date.now()).slice(-5);",
            "pm.collectionVariables.set('futureExamTitle', 'Future Exam ' + unique);",
            "pm.collectionVariables.set('futureExamStartDateTime', start.toISOString());"
          ],
          body: {
            title: '{{futureExamTitle}}',
            course_id: '{{dynamicCourseId}}',
            academic_year: '{{seededAcademicYear}}',
            start_datetime: '{{futureExamStartDateTime}}',
            duration_minutes: 30,
            num_questions: 5
          },
          description: 'Expected: `201` with created future exam object.',
          tests: [
            "pm.test('Future exam is created', function () { pm.response.to.have.status(201); });",
            'const json = pm.response.json();',
            "pm.collectionVariables.set('futureExamId', String(json.id));"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/faculty/exams (Seeded Faculty)',
          method: 'GET',
          pathParts: ['api', 'faculty', 'exams'],
          rawPath: '/api/faculty/exams',
          tokenVar: 'seededFacultyToken',
          description: 'Expected: `200` with the seeded ongoing exam and any submitted attempt counts.',
          tests: [
            "pm.test('Seeded faculty exams load', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "const ongoing = json.find((exam) => exam.title === pm.collectionVariables.get('seededExamTitle') && exam.status === 'Ongoing');",
            "pm.expect(ongoing).to.exist;",
            "pm.collectionVariables.set('ongoingExamId', String(ongoing.id));"
          ]
        })
      ]
    },
    {
      name: 'Student And Exam Flow',
      item: [
        makeJsonRequest({
          name: 'POST /api/student/enroll',
          method: 'POST',
          pathParts: ['api', 'student', 'enroll'],
          rawPath: '/api/student/enroll',
          tokenVar: 'studentToken',
          body: {
            course_id: '{{seededCourseId}}'
          },
          description: 'Expected: `201` with `{ message: "Enrolled successfully" }` for the dynamic student.',
          tests: [
            "pm.test('Dynamic student enrolls into seeded course', function () { pm.response.to.have.status(201); });",
            "pm.expect(pm.response.json().message).to.eql('Enrolled successfully');"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/student/my-courses',
          method: 'GET',
          pathParts: ['api', 'student', 'my-courses'],
          rawPath: '/api/student/my-courses',
          tokenVar: 'studentToken',
          description: 'Expected: `200` with the seeded course and computed exam status.',
          tests: [
            "pm.test('Dynamic student my-courses succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "const matched = json.find((course) => course.course_code === pm.collectionVariables.get('seededCourseCode'));",
            "pm.expect(matched).to.exist;"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/student/my-exams',
          method: 'GET',
          pathParts: ['api', 'student', 'my-exams'],
          rawPath: '/api/student/my-exams',
          tokenVar: 'studentToken',
          description: 'Expected: `200` with the seeded ongoing exam visible to the dynamic student.',
          tests: [
            "pm.test('Dynamic student my-exams succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "const target = json.find((exam) => String(exam.exam_id) === pm.collectionVariables.get('ongoingExamId'));",
            "pm.expect(target).to.exist;"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/exam/:examId/start',
          method: 'POST',
          pathParts: ['api', 'exam', '{{ongoingExamId}}', 'start'],
          rawPath: '/api/exam/{{ongoingExamId}}/start',
          tokenVar: 'studentToken',
          description: 'Expected: `200` with `attempt_id`, exam metadata, and shuffled questions without correct answers.',
          tests: [
            "pm.test('Exam start succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.collectionVariables.set('attemptId', String(json.attempt_id));",
            "pm.collectionVariables.set('attemptQuestionId', String(json.questions[0].attempt_question_id));",
            'pm.expect(Array.isArray(json.questions)).to.eql(true);',
            'pm.expect(json.questions.length).to.be.above(0);'
          ]
        }),
        makeJsonRequest({
          name: 'PATCH /api/exam/attempt/:attemptId/answer',
          method: 'PATCH',
          pathParts: ['api', 'exam', 'attempt', '{{attemptId}}', 'answer'],
          rawPath: '/api/exam/attempt/{{attemptId}}/answer',
          tokenVar: 'studentToken',
          body: {
            attempt_question_id: '{{attemptQuestionId}}',
            student_answer: 1
          },
          description: 'Expected: `200` with `{ message: "Answer saved" }`.',
          tests: [
            "pm.test('Answer save succeeds', function () { pm.response.to.have.status(200); });",
            "pm.expect(pm.response.json().message).to.eql('Answer saved');"
          ]
        }),
        makeJsonRequest({
          name: 'POST /api/exam/attempt/:attemptId/submit',
          method: 'POST',
          pathParts: ['api', 'exam', 'attempt', '{{attemptId}}', 'submit'],
          rawPath: '/api/exam/attempt/{{attemptId}}/submit',
          tokenVar: 'studentToken',
          description: 'Expected: `200` with `{ message, score, total, percentage, rank }`.',
          tests: [
            "pm.test('Exam submit succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json.message).to.eql('Exam submitted');",
            "['score', 'total', 'percentage', 'rank'].forEach((key) => pm.expect(json).to.have.property(key));"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/exam/attempt/:attemptId/result',
          method: 'GET',
          pathParts: ['api', 'exam', 'attempt', '{{attemptId}}', 'result'],
          rawPath: '/api/exam/attempt/{{attemptId}}/result',
          tokenVar: 'studentToken',
          description: 'Expected: `200` with result summary, correct answer positions, and question review data.',
          tests: [
            "pm.test('Exam result loads', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json).to.have.property('questions');",
            'pm.expect(json.questions.length).to.be.above(0);'
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/student/my-results',
          method: 'GET',
          pathParts: ['api', 'student', 'my-results'],
          rawPath: '/api/student/my-results',
          tokenVar: 'studentToken',
          description: 'Expected: `200` with the submitted exam in the student result list.',
          tests: [
            "pm.test('Student results succeed', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            "pm.expect(json.some((row) => String(row.exam_id) === pm.collectionVariables.get('ongoingExamId'))).to.eql(true);"
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/faculty/exams/:examId/leaderboard',
          method: 'GET',
          pathParts: ['api', 'faculty', 'exams', '{{ongoingExamId}}', 'leaderboard'],
          rawPath: '/api/faculty/exams/{{ongoingExamId}}/leaderboard',
          tokenVar: 'seededFacultyToken',
          description: 'Expected: `200` with ranked student results for the seeded ongoing exam.',
          tests: [
            "pm.test('Leaderboard succeeds', function () { pm.response.to.have.status(200); });",
            'const json = pm.response.json();',
            'pm.expect(Array.isArray(json)).to.eql(true);',
            'pm.expect(json.length).to.be.above(0);'
          ]
        }),
        makeJsonRequest({
          name: 'GET /api/faculty/exams/:examId/leaderboard/export-csv',
          method: 'GET',
          pathParts: ['api', 'faculty', 'exams', '{{ongoingExamId}}', 'leaderboard', 'export-csv'],
          rawPath: '/api/faculty/exams/{{ongoingExamId}}/leaderboard/export-csv',
          tokenVar: 'seededFacultyToken',
          description: 'Expected: `200` CSV download with header row beginning `Rank,Full Name,Username,...`.',
          tests: [
            "pm.test('Leaderboard CSV succeeds', function () { pm.response.to.have.status(200); });",
            "pm.test('Leaderboard CSV content-type is text/csv', function () { pm.expect(pm.response.headers.get('Content-Type')).to.include('text/csv'); });",
            "pm.test('Leaderboard CSV includes Rank header', function () { pm.expect(pm.response.text()).to.include('Rank'); });"
          ]
        })
      ]
    }
  ]
};

await writeFile(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
console.log(`Postman collection written to ${outputPath}`);
