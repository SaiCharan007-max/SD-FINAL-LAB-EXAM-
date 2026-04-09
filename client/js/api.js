// Central API wrapper + endpoint methods used by pages.
async function apiRequest(method, path, body, isFormData = false) {
  if (CONFIG.MOCK_MODE) {
    return mockApiRequest(method, path, body, isFormData);
  }

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const options = { method, headers };
  if (body !== undefined && body !== null) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      logout();
    }
    const err = new Error(errorText || "Request failed");
    throw err;
  }
  if (response.status === 204) return {};
  return response.json();
}

function apiLogin(username, password, selectedRole) {
  if (CONFIG.MOCK_MODE) {
    return mockApiRequest("POST", "/auth/login", {
      username,
      password,
      selectedRole
    });
  }
  return apiRequest("POST", "/auth/login", { username, password });
}

function apiRegister(full_name, email, username, password, confirm_password) {
  return apiRequest("POST", "/auth/register", {
    full_name,
    email,
    username,
    password,
    confirm_password
  });
}

function apiGetAdminSummary() {
  return apiRequest("GET", "/admin/summary");
}

function apiGetAdminFaculty() {
  return apiRequest("GET", "/admin/faculty");
}

function apiCreateFaculty(full_name, email, employee_id) {
  return apiRequest("POST", "/admin/faculty", { full_name, email, employee_id });
}

function apiGetAdminCourses() {
  return apiRequest("GET", "/admin/courses");
}

function apiCreateCourse(course_name, course_code, description, academic_year) {
  return apiRequest("POST", "/admin/courses", {
    course_name,
    course_code,
    description,
    academic_year
  });
}

function apiAssignFaculty(courseId, faculty_ids) {
  return apiRequest("POST", `/admin/courses/${courseId}/assign-faculty`, { faculty_ids });
}

function apiRemoveFaculty(courseId, facultyId) {
  return apiRequest("DELETE", `/admin/courses/${courseId}/faculty/${facultyId}`);
}

function apiGetFacultyCourses() {
  return apiRequest("GET", "/faculty/courses");
}

function apiUploadQuestions(formData) {
  return apiRequest("POST", "/faculty/questions/upload", formData, true);
}

function apiGetQuestions(courseId, academic_year) {
  return apiRequest("GET", `/faculty/questions?courseId=${courseId}&academic_year=${encodeURIComponent(academic_year)}`);
}

function apiGetFacultyExams() {
  return apiRequest("GET", "/faculty/exams");
}

function apiCreateExam(title, course_id, academic_year, start_datetime, duration_minutes, num_questions) {
  return apiRequest("POST", "/faculty/exams", {
    title,
    course_id,
    academic_year,
    start_datetime,
    duration_minutes,
    num_questions
  });
}

function apiGetLeaderboard(examId) {
  return apiRequest("GET", `/faculty/exams/${examId}/leaderboard`);
}

async function apiExportLeaderboardCSV(examId) {
  if (CONFIG.MOCK_MODE) {
    return mockApiRequest("GET", `/faculty/exams/${examId}/leaderboard/export`);
  }
  const token = getToken();
  const response = await fetch(`${CONFIG.API_BASE_URL}/faculty/exams/${examId}/leaderboard/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response;
}

function apiGetAllCourses() {
  return apiRequest("GET", "/student/courses");
}

function apiEnrollCourse(course_id) {
  return apiRequest("POST", "/student/enroll", { course_id });
}

function apiGetMyCourses() {
  return apiRequest("GET", "/student/my-courses");
}

function apiGetMyExams() {
  return apiRequest("GET", "/student/my-exams");
}

function apiGetMyResults() {
  return apiRequest("GET", "/student/my-results");
}

function apiStartExam(examId) {
  return apiRequest("POST", `/student/exams/${examId}/start`);
}

function apiSaveAnswer(attemptId, attempt_question_id, student_answer) {
  return apiRequest("POST", `/student/attempts/${attemptId}/answer`, {
    attempt_question_id,
    student_answer
  });
}

function apiSubmitExam(attemptId) {
  return apiRequest("POST", `/student/attempts/${attemptId}/submit`);
}

function apiGetExamResult(attemptId) {
  return apiRequest("GET", `/student/attempts/${attemptId}/result`);
}

function createMockToken(role) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = btoa(
    JSON.stringify({
      sub: "mock-user",
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
    })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${payload}.mock-signature`;
}

function getMockDatabase() {
  return {
    adminSummary: {
      total_courses: 12,
      total_faculty: 8,
      total_students: 230,
      exams_conducted: 34
    },
    faculty: [
      { id: 1, faculty_id: 1, full_name: "Dr. Priya Nair", email: "priya@college.edu", employee_id: "FAC101", temp_password: "TMPPRY123" },
      { id: 2, faculty_id: 2, full_name: "Prof. Arjun Rao", email: "arjun@college.edu", employee_id: "FAC102", temp_password: "TMPARJ456" },
      { id: 3, faculty_id: 3, full_name: "Dr. Sneha Iyer", email: "sneha@college.edu", employee_id: "FAC103", temp_password: "TMPSNH789" }
    ],
    courses: [
      { course_id: 1, id: 1, course_name: "Data Structures", course_code: "CS201", description: "Core DS", academic_year: "2nd Year", assigned_faculty: [{ id: 1, full_name: "Dr. Priya Nair" }], enrolled_students: 78 },
      { course_id: 2, id: 2, course_name: "Database Systems", course_code: "CS301", description: "SQL and DBMS", academic_year: "3rd Year", assigned_faculty: [{ id: 2, full_name: "Prof. Arjun Rao" }], enrolled_students: 64 },
      { course_id: 3, id: 3, course_name: "Operating Systems", course_code: "CS302", description: "OS concepts", academic_year: "4th Year", assigned_faculty: [{ id: 3, full_name: "Dr. Sneha Iyer" }], enrolled_students: 52 }
    ],
    exams: [
      {
        exam_id: 11,
        id: 11,
        title: "DS Midterm",
        course_id: 1,
        course_name: "Data Structures",
        academic_year: "2026-27",
        start_datetime: new Date(Date.now() + 5 * 60000).toISOString(),
        duration_minutes: 45
      },
      {
        exam_id: 12,
        id: 12,
        title: "DBMS Quiz",
        course_id: 2,
        course_name: "Database Systems",
        academic_year: "2026-27",
        start_datetime: new Date(Date.now() - 10 * 60000).toISOString(),
        duration_minutes: 60
      },
      {
        exam_id: 13,
        id: 13,
        title: "OS Final",
        course_id: 3,
        course_name: "Operating Systems",
        academic_year: "2026-27",
        start_datetime: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        duration_minutes: 60
      }
    ],
    leaderboard: [
      { rank: 1, student_name: "Akhil", score: 9, time_taken_sec: 1320 },
      { rank: 2, student_name: "Nisha", score: 8, time_taken_sec: 1405 },
      { rank: 3, student_name: "Rahul", score: 8, time_taken_sec: 1502 }
    ],
    questions: [
      { question_id: 1, question_text: "What is the time complexity of binary search?", difficulty: "HIGH" },
      { question_id: 2, question_text: "Which normal form removes transitive dependency?", difficulty: "MID" },
      { question_id: 3, question_text: "Which scheduling algorithm is preemptive?", difficulty: "LOW" }
    ]
  };
}

async function mockApiRequest(method, path, body) {
  const db = getMockDatabase();
  await new Promise((resolve) => setTimeout(resolve, 250));

  // AUTH
  if (method === "POST" && path === "/auth/login") {
    const u = String(body.username || "").toLowerCase();
    const role =
      body.selectedRole ||
      (u.includes("admin") ? "admin" : u.includes("faculty") ? "faculty" : "student");
    return {
      token: createMockToken(role),
      user: {
        id: 1,
        full_name: role === "admin" ? "Admin Demo" : role === "faculty" ? "Faculty Demo" : "Student Demo",
        email: `${role}@demo.local`,
        username: body.username || role,
        role
      }
    };
  }
  if (method === "POST" && path === "/auth/register") {
    return { message: "Registration successful (mock)." };
  }

  // ADMIN
  if (method === "GET" && path === "/admin/summary") return db.adminSummary;
  if (method === "GET" && path === "/admin/faculty") return { faculty: db.faculty };
  if (method === "POST" && path === "/admin/faculty") {
    return {
      message: "Faculty created",
      temp_password: "TMPNEW123",
      faculty: { id: 99, full_name: body.full_name, email: body.email, employee_id: body.employee_id }
    };
  }
  if (method === "GET" && path === "/admin/courses") return { courses: db.courses };
  if (method === "POST" && path === "/admin/courses") return { message: "Course created", course_id: 99 };
  if (method === "POST" && /\/admin\/courses\/\d+\/assign-faculty$/.test(path)) return { message: "Faculty assigned" };
  if (method === "DELETE" && /\/admin\/courses\/\d+\/faculty\/\d+$/.test(path)) return { message: "Faculty removed" };

  // FACULTY
  if (method === "GET" && path === "/faculty/courses") return { courses: db.courses };
  if (method === "POST" && path === "/faculty/questions/upload") return { message: "Questions uploaded" };
  if (method === "GET" && path.startsWith("/faculty/questions?")) return { questions: db.questions };
  if (method === "GET" && path === "/faculty/exams") return { exams: db.exams };
  if (method === "POST" && path === "/faculty/exams") return { message: "Exam created", exam_id: 1001 };
  if (method === "GET" && /\/faculty\/exams\/\d+\/leaderboard$/.test(path)) return { leaderboard: db.leaderboard };
  if (method === "GET" && /\/faculty\/exams\/\d+\/leaderboard\/export$/.test(path)) {
    const csv = "rank,student,score,time_taken_sec\n1,Akhil,9,1320\n2,Nisha,8,1405\n3,Rahul,8,1502\n";
    return new Response(csv, { status: 200, headers: { "Content-Type": "text/csv" } });
  }

  // STUDENT
  if (method === "GET" && path === "/student/courses") return { courses: db.courses };
  if (method === "POST" && path === "/student/enroll") return { message: "Enrolled" };
  if (method === "GET" && path === "/student/my-courses") return { courses: db.courses.slice(0, 2) };
  if (method === "GET" && path === "/student/my-exams") return { exams: db.exams };
  if (method === "GET" && path === "/student/my-results") {
    return {
      results: [
        { attempt_id: 501, exam_title: "DBMS Quiz", score: 8, total_questions: 10, percentage: 80, rank: 2 },
        { attempt_id: 502, exam_title: "OS Final", score: 7, total_questions: 10, percentage: 70, rank: 6 }
      ]
    };
  }

  // EXAM ENGINE
  if (method === "POST" && /\/student\/exams\/\d+\/start$/.test(path)) {
    const examId = Number(path.match(/\/student\/exams\/(\d+)\/start$/)[1]);
    const exam = db.exams.find((x) => x.exam_id === examId) || db.exams[1];
    const endDatetime = new Date(Date.now() + 25 * 60000).toISOString();
    return {
      attempt_id: 9001,
      exam: {
        exam_id: exam.exam_id,
        title: exam.title,
        end_datetime: endDatetime
      },
      questions: [
        {
          attempt_question_id: 3001,
          question_text: "What is the time complexity of binary search?",
          options: [
            { position: 1, option_text: "O(n)" },
            { position: 2, option_text: "O(log n)" },
            { position: 3, option_text: "O(n log n)" },
            { position: 4, option_text: "O(1)" }
          ]
        },
        {
          attempt_question_id: 3002,
          question_text: "Which SQL clause is used to filter grouped results?",
          options: [
            { position: 1, option_text: "ORDER BY" },
            { position: 2, option_text: "WHERE" },
            { position: 3, option_text: "HAVING" },
            { position: 4, option_text: "LIMIT" }
          ]
        },
        {
          attempt_question_id: 3003,
          question_text: "Which scheduler can preempt a running process?",
          options: [
            { position: 1, option_text: "FCFS" },
            { position: 2, option_text: "Round Robin" },
            { position: 3, option_text: "SJF (non-preemptive)" },
            { position: 4, option_text: "None" }
          ]
        }
      ]
    };
  }
  if (method === "POST" && /\/student\/attempts\/\d+\/answer$/.test(path)) return { message: "Saved" };
  if (method === "POST" && /\/student\/attempts\/\d+\/submit$/.test(path)) return { message: "Submitted" };
  if (method === "GET" && /\/student\/attempts\/\d+\/result$/.test(path)) {
    return {
      score: 2,
      num_questions: 3,
      percentage: 66.67,
      time_taken_sec: 780,
      rank: 4,
      exam_title: "DBMS Quiz",
      course_name: "Database Systems",
      questions: [
        {
          shuffled_order: 1,
          question_text: "What is the time complexity of binary search?",
          student_answer: 2,
          student_answer_text: "O(log n)",
          correct_answer_text: "O(log n)",
          is_correct: true
        },
        {
          shuffled_order: 2,
          question_text: "Which SQL clause is used to filter grouped results?",
          student_answer: 2,
          student_answer_text: "WHERE",
          correct_answer_text: "HAVING",
          is_correct: false
        },
        {
          shuffled_order: 3,
          question_text: "Which scheduler can preempt a running process?",
          student_answer: null,
          student_answer_text: null,
          correct_answer_text: "Round Robin",
          is_correct: false
        }
      ]
    };
  }

  return { message: `Mock endpoint not implemented: ${method} ${path}` };
}
