// Faculty dashboard page.
async function renderFacultyDashboard() {
  const user = getUser();
  renderSidebar("faculty");
  renderHeader(user && user.full_name, "Faculty");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">Faculty Dashboard</h2></div><div id="faculty-summary"></div>`;
  showSpinner("faculty-summary");
  try {
    const [courses, exams] = await Promise.all([apiGetFacultyCourses(), apiGetFacultyExams()]);
    const courseList = courses.courses || courses || [];
    const examList = exams.exams || exams || [];
    const ongoing = examList.filter((e) => getExamStatus(e.start_datetime, e.duration_minutes) === "Ongoing").length;
    document.getElementById("faculty-summary").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__icon">📚</div><div class="summary-card__label">My Courses</div><div class="summary-card__value">${courseList.length}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__icon">📝</div><div class="summary-card__label">Total Exams</div><div class="summary-card__value">${examList.length}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__icon">⏱</div><div class="summary-card__label">Ongoing Exams</div><div class="summary-card__value">${ongoing}</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__icon">📥</div><div class="summary-card__label">Ready Actions</div><div class="summary-card__value">2</div></div>
      </div>
    `;
  } catch (err) {
    document.getElementById("faculty-summary").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
