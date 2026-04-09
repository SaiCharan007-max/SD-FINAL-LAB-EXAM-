// Student exams page with start exam actions.
async function renderStudentMyExams() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">My Exams</h2></div><div class="card"><div id="my-exams-wrap"></div></div>`;
  showSpinner("my-exams-wrap");
  try {
    const data = await apiGetMyExams();
    const rows = data.exams || data || [];
    if (!rows.length) {
      showEmptyState("my-exams-wrap", "No exams available", "📝");
      return;
    }
    document.getElementById("my-exams-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Exam</th><th>Course</th><th>Start</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${rows.map((e, i) => {
              const status = getExamStatus(e.start_datetime, e.duration_minutes);
              let action = "-";
              if (status === "Upcoming") action = `<button class="btn btn-grey" disabled>Not Started</button>`;
              if (status === "Ongoing") action = `<button class="btn btn-success" onclick="startExam(${e.exam_id || e.id})">Start Exam</button>`;
              if (status === "Completed") action = `<button class="btn btn-grey" disabled>Closed</button>`;
              return `<tr><td>${i + 1}</td><td>${e.title}</td><td>${e.course_name || "-"}</td><td>${formatDate(e.start_datetime)}</td><td>${getStatusBadgeHTML(status)}</td><td>${action}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
    window.startExam = async function (examId) {
      const res = await apiStartExam(examId);
      const attemptId = res.attempt_id || res.attemptId;
      if (attemptId) localStorage.setItem("activeAttemptId", String(attemptId));
      navigate(`#/exam/attempt?examId=${examId}`);
    };
  } catch (err) {
    document.getElementById("my-exams-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
