// Student exams page.
async function renderStudentMyExams() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">My Exams</h2></div><div class="card"><div id="my-exams-wrap"></div></div>`;
  showSpinner("my-exams-wrap");

  try {
    const rows = await apiGetMyExams();
    if (!rows.length) {
      showEmptyState("my-exams-wrap", "No exams available");
      return;
    }

    document.getElementById("my-exams-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Exam</th><th>Course</th><th>Start</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${rows
              .map((exam, index) => {
                const status = exam.status || getExamStatus(exam.start_datetime, exam.duration_minutes);
                let action = `<button class="btn btn-grey" disabled>Closed</button>`;

                if (exam.is_submitted && exam.attempt_id) {
                  action = `<button class="btn btn-blue" onclick="navigate('#/exam/result?attemptId=${exam.attempt_id}')">View Result</button>`;
                } else if (status === "Upcoming") {
                  action = `<button class="btn btn-grey" disabled>Not Started</button>`;
                } else if (status === "Ongoing") {
                  action = `<button class="btn btn-success" onclick="startExam(${exam.exam_id})">${exam.attempt_id ? "Resume Exam" : "Start Exam"}</button>`;
                }

                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${exam.title}</td>
                    <td>${exam.course_name || "-"}</td>
                    <td>${formatDate(exam.start_datetime)}</td>
                    <td>${getStatusBadgeHTML(status)}</td>
                    <td>${action}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    window.startExam = async function (examId) {
      try {
        const response = await apiStartExam(examId);
        const attemptId = response.attempt_id || response.attemptId;
        if (attemptId) {
          localStorage.setItem("activeAttemptId", String(attemptId));
        }
        navigate(`#/exam/attempt?examId=${examId}`);
      } catch (err) {
        showToast(err.message, "error");
      }
    };
  } catch (err) {
    document.getElementById("my-exams-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
