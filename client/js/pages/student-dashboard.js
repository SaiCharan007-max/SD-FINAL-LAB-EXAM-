// Student dashboard page.
async function renderStudentDashboard() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">Student Dashboard</h2></div><div id="student-summary"></div>`;
  showSpinner("student-summary");
  try {
    const [courses, exams, results] = await Promise.all([apiGetMyCourses(), apiGetMyExams(), apiGetMyResults()]);
    const c = courses.courses || courses || [];
    const e = exams.exams || exams || [];
    const r = results.results || results || [];
    document.getElementById("student-summary").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__icon">📚</div><div class="summary-card__label">Enrolled Courses</div><div class="summary-card__value">${c.length}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__icon">📝</div><div class="summary-card__label">Available Exams</div><div class="summary-card__value">${e.length}</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__icon">🏆</div><div class="summary-card__label">Results</div><div class="summary-card__value">${r.length}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__icon">⭐</div><div class="summary-card__label">Best Score</div><div class="summary-card__value">${r.length ? Math.max(...r.map((x) => x.percentage || 0)) : 0}%</div></div>
      </div>
    `;
  } catch (err) {
    document.getElementById("student-summary").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
