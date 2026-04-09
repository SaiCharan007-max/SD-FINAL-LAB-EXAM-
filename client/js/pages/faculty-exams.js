// Faculty exams page.
async function renderFacultyExams() {
  const user = getUser();
  renderSidebar("faculty");
  renderHeader(user && user.full_name, "Faculty");
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head"><h2 class="page-title">Exams</h2></div>
    <div class="card"><button class="btn btn-primary" id="open-exam-modal">Schedule Exam</button></div>
    <div class="section-gap card"><div id="faculty-exams-table"></div></div>
  `;

  let courses = [];
  try {
    courses = await apiGetFacultyCourses();
  } catch (err) {
    showToast(err.message, "error");
  }

  async function loadExams() {
    showSpinner("faculty-exams-table");
    try {
      const exams = await apiGetFacultyExams();
      if (!exams.length) {
        showEmptyState("faculty-exams-table", "No exams created yet");
        return;
      }

      document.getElementById("faculty-exams-table").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Title</th><th>Course</th><th>Start</th><th>Duration</th><th>Status</th><th>Submissions</th><th>Actions</th></tr></thead>
            <tbody>
              ${exams
                .map(
                  (exam, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${exam.title}</td>
                      <td>${exam.course_name || "-"}</td>
                      <td>${formatDate(exam.start_datetime)}</td>
                      <td>${exam.duration_minutes} mins</td>
                      <td>${getStatusBadgeHTML(exam.status || getExamStatus(exam.start_datetime, exam.duration_minutes))}</td>
                      <td>${exam.total_submissions ?? 0}</td>
                      <td><button class="btn btn-blue" onclick="navigate('#/faculty/leaderboard?examId=${exam.id}')">Leaderboard</button></td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("faculty-exams-table").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  function openModal() {
    const suggestedStart = new Date(Date.now() + 20 * 60 * 1000);
    const startValue = new Date(suggestedStart.getTime() - suggestedStart.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    showModal(`
      <h3>Schedule Exam</h3>
      <form id="exam-form">
        <div class="form-group"><label>Title</label><input id="exam_title" required /></div>
        <div class="form-group"><label>Course</label><select id="exam_course">${courses.map((course) => `<option value="${course.id}">${course.course_name}</option>`).join("")}</select></div>
        <div class="form-group"><label>Academic Year</label><select id="exam_year" required>${renderAcademicYearOptions(getCurrentAcademicYear())}</select></div>
        <div class="form-group"><label>Start DateTime</label><input id="exam_start" type="datetime-local" value="${startValue}" required /></div>
        <div class="form-group"><label>Duration (mins)</label><input id="exam_duration" type="number" value="60" min="10" max="180" required /></div>
        <div class="form-group"><label>No. of Questions</label><input id="exam_questions" type="number" value="5" min="1" required /></div>
        <div class="modal-actions">
          <button type="button" class="btn" onclick="hideModal()">Cancel</button>
          <button class="btn btn-primary" type="submit">Create</button>
        </div>
      </form>
    `);

    document.getElementById("exam-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await apiCreateExam(
          document.getElementById("exam_title").value.trim(),
          Number(document.getElementById("exam_course").value),
          document.getElementById("exam_year").value.trim(),
          new Date(document.getElementById("exam_start").value).toISOString(),
          Number(document.getElementById("exam_duration").value),
          Number(document.getElementById("exam_questions").value)
        );
        hideModal();
        showToast("Exam scheduled", "success");
        await loadExams();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  document.getElementById("open-exam-modal").addEventListener("click", openModal);
  await loadExams();
}
