// Student dashboard page.
async function renderStudentDashboard() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head">
      <h2 class="page-title">Student Dashboard</h2>
      <p class="page-subtitle">Track your courses, active exams, and performance from one cleaner workspace.</p>
    </div>
    <div id="student-summary"></div>
  `;
  showSpinner("student-summary");

  try {
    const [courses, exams, results] = await Promise.all([apiGetMyCourses(), apiGetMyExams(), apiGetMyResults()]);
    const c = courses.courses || courses || [];
    const e = exams.exams || exams || [];
    const r = results.results || results || [];
    const bestScore = r.length ? Math.max(...r.map((x) => Number(x.percentage || 0))) : 0;

    document.getElementById("student-summary").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__icon">CRS</div><div class="summary-card__label">Enrolled Courses</div><div class="summary-card__value">${c.length}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__icon">LIVE</div><div class="summary-card__label">Available Exams</div><div class="summary-card__value">${e.length}</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__icon">RSLT</div><div class="summary-card__label">Results</div><div class="summary-card__value">${r.length}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__icon">BEST</div><div class="summary-card__label">Best Score</div><div class="summary-card__value">${bestScore}%</div></div>
      </div>

      <div class="dashboard-grid section-gap">
        <section class="card dashboard-panel">
          <span class="badge badge-code">Overview</span>
          <h3>Your academic snapshot</h3>
          <p>Use this space to jump between enrollments, attempts, and result breakdowns without changing how the app works.</p>
          <div class="metric-pills">
            <span class="metric-pill">${c.length} enrolled courses</span>
            <span class="metric-pill">${e.length} available exams</span>
            <span class="metric-pill">${r.length} published results</span>
          </div>
        </section>

        <section class="card dashboard-panel">
          <span class="badge badge-code">Quick Actions</span>
          <h3>Pick up where you left off</h3>
          <div class="quick-links">
            <a class="quick-link" href="${routeToPath("#/student/my-exams")}">
              <div><strong>Open my exams</strong><span>Review upcoming and ongoing exam windows before they close.</span></div>
              <div class="quick-link__code">EXAM</div>
            </a>
            <a class="quick-link" href="${routeToPath("#/student/my-results")}">
              <div><strong>Review my results</strong><span>See detailed breakdowns, scores, and rank for completed attempts.</span></div>
              <div class="quick-link__code">RANK</div>
            </a>
          </div>
        </section>
      </div>
    `;
  } catch (err) {
    document.getElementById("student-summary").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
