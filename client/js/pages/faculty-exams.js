// Faculty exams page: list exams and create new exam schedule.
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
    const data = await apiGetFacultyCourses();
    courses = data.courses || data || [];
  } catch (err) {}

  async function loadExams() {
    showSpinner("faculty-exams-table");
    try {
      const data = await apiGetFacultyExams();
      const exams = data.exams || data || [];
      if (!exams.length) {
        showEmptyState("faculty-exams-table", "No exams created yet", "📝");
        return;
      }
      document.getElementById("faculty-exams-table").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Title</th><th>Course</th><th>Start</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${exams.map((e, i) => {
                const status = getExamStatus(e.start_datetime, e.duration_minutes);
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${e.title}</td>
                    <td>${e.course_name || "-"}</td>
                    <td>${formatDate(e.start_datetime)}</td>
                    <td>${e.duration_minutes} mins</td>
                    <td>${getStatusBadgeHTML(status)}</td>
                    <td><button class="btn btn-blue" onclick="navigate('#/faculty/leaderboard?examId=${e.exam_id || e.id}')">Leaderboard</button></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("faculty-exams-table").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  function openModal() {
    const now = new Date(Date.now() + 15 * 60000).toISOString().slice(0, 16);
    showModal(`
      <h3>Schedule Exam</h3>
      <form id="exam-form">
        <div class="form-group"><label>Title</label><input id="exam_title" required /></div>
        <div class="form-group"><label>Course</label><select id="exam_course">${courses.map((c) => `<option value="${c.course_id || c.id}">${c.course_name || c.name}</option>`).join("")}</select></div>
        <div class="form-group">
          <label>Year (Current AY: ${getCurrentAcademicYear()})</label>
          <select id="exam_year" required>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div class="form-group"><label>Start DateTime</label><input id="exam_start" type="datetime-local" value="${now}" required /></div>
        <div class="form-group"><label>Duration (mins)</label><input id="exam_duration" type="number" value="60" min="1" required /></div>
        <div class="form-group"><label>No. of Questions</label><input id="exam_questions" type="number" value="10" min="1" required /></div>
        <div class="modal-actions">
          <button type="button" class="btn" onclick="hideModal()">Cancel</button>
          <button class="btn btn-primary" type="submit">Create</button>
        </div>
      </form>
    `);
    document.getElementById("exam-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      await apiCreateExam(
        document.getElementById("exam_title").value.trim(),
        Number(document.getElementById("exam_course").value),
        document.getElementById("exam_year").value.trim(),
        document.getElementById("exam_start").value,
        Number(document.getElementById("exam_duration").value),
        Number(document.getElementById("exam_questions").value)
      );
      hideModal();
      showToast("Exam scheduled", "success");
      loadExams();
    });
  }

  document.getElementById("open-exam-modal").addEventListener("click", openModal);
  await loadExams();
}
