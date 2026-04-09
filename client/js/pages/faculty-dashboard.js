// Faculty dashboard page.
async function renderFacultyDashboard() {
  const user = getUser();
  renderSidebar("faculty");
  renderHeader(user && user.full_name, "Faculty");

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head">
      <h2 class="page-title">Faculty Dashboard</h2>
      <p class="page-subtitle">Review your teaching load, live delivery status, and the next actions that matter most.</p>
    </div>
    <div id="faculty-summary"></div>
  `;
  showSpinner("faculty-summary");

  try {
    const [courses, exams] = await Promise.all([apiGetFacultyCourses(), apiGetFacultyExams()]);
    const courseList = courses.courses || courses || [];
    const examList = exams.exams || exams || [];
    const ongoing = examList.filter((e) => getExamStatus(e.start_datetime, e.duration_minutes) === "Ongoing").length;
    const completed = examList.filter((e) => getExamStatus(e.start_datetime, e.duration_minutes) === "Completed").length;

    document.getElementById("faculty-summary").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__icon">CRS</div><div class="summary-card__label">My Courses</div><div class="summary-card__value">${courseList.length}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__icon">EXM</div><div class="summary-card__label">Total Exams</div><div class="summary-card__value">${examList.length}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__icon">LIVE</div><div class="summary-card__label">Ongoing Exams</div><div class="summary-card__value">${ongoing}</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__icon">DONE</div><div class="summary-card__label">Completed Exams</div><div class="summary-card__value">${completed}</div></div>
      </div>

      <div class="dashboard-grid section-gap">
        <section class="card dashboard-panel">
          <span class="badge badge-code">Overview</span>
          <h3>Delivery at a glance</h3>
          <p>Your workspace is ready for question uploads, exam scheduling, and leaderboard review from a single dashboard.</p>
          <div class="metric-pills">
            <span class="metric-pill">${courseList.length} assigned courses</span>
            <span class="metric-pill">${Math.max(examList.length - completed, 0)} active pipeline</span>
            <span class="metric-pill">${ongoing} live now</span>
          </div>
        </section>

        <section class="card dashboard-panel">
          <span class="badge badge-code">Quick Actions</span>
          <h3>Keep momentum moving</h3>
          <div class="quick-links">
            <a class="quick-link" href="${routeToPath("#/faculty/questions")}">
              <div><strong>Refresh question bank</strong><span>Upload new CSV or Excel question sets for assigned courses.</span></div>
              <div class="quick-link__code">BANK</div>
            </a>
            <a class="quick-link" href="${routeToPath("#/faculty/exams")}">
              <div><strong>Plan the next exam</strong><span>Create future exam windows and review current delivery status.</span></div>
              <div class="quick-link__code">PLAN</div>
            </a>
          </div>
        </section>
      </div>
    `;
  } catch (err) {
    document.getElementById("faculty-summary").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
