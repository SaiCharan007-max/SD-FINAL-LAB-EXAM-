// Admin dashboard summary page.
async function renderAdminDashboard() {
  const user = getUser();
  renderSidebar("admin");
  renderHeader(user && user.full_name, "Admin");

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head">
      <h2 class="page-title">Dashboard</h2>
      <p class="page-subtitle">A premium operations view across courses, faculty distribution, students, and total exam volume.</p>
    </div>
    <div id="admin-summary"></div>
  `;
  showSpinner("admin-summary");

  try {
    const data = await apiGetAdminSummary();
    document.getElementById("admin-summary").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__icon">CRS</div><div class="summary-card__label">Total Courses</div><div class="summary-card__value">${data.total_courses ?? 0}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__icon">FAC</div><div class="summary-card__label">Total Faculty</div><div class="summary-card__value">${data.total_faculty ?? 0}</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__icon">STD</div><div class="summary-card__label">Total Students</div><div class="summary-card__value">${data.total_students ?? 0}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__icon">EXM</div><div class="summary-card__label">Total Exams</div><div class="summary-card__value">${data.total_exams ?? 0}</div></div>
      </div>

      <div class="dashboard-grid section-gap">
        <section class="card dashboard-panel">
          <span class="badge badge-code">Overview</span>
          <h3>Institution control center</h3>
          <p>Admin actions remain the same, but the presentation is cleaner and easier to scan while coordinating the academic workflow.</p>
          <div class="metric-pills">
            <span class="metric-pill">${data.total_courses ?? 0} active course records</span>
            <span class="metric-pill">${data.total_faculty ?? 0} faculty accounts</span>
            <span class="metric-pill">${data.total_students ?? 0} student accounts</span>
          </div>
        </section>

        <section class="card dashboard-panel">
          <span class="badge badge-code">Quick Actions</span>
          <h3>Administrative shortcuts</h3>
          <div class="quick-links">
            <a class="quick-link" href="${routeToPath("#/admin/courses")}">
              <div><strong>Manage courses</strong><span>Create, review, and assign course ownership from the catalog page.</span></div>
              <div class="quick-link__code">CRS</div>
            </a>
            <a class="quick-link" href="${routeToPath("#/admin/faculty")}">
              <div><strong>Manage faculty</strong><span>Create faculty accounts and distribute courses from one place.</span></div>
              <div class="quick-link__code">FAC</div>
            </a>
          </div>
        </section>
      </div>
    `;
  } catch (err) {
    document.getElementById("admin-summary").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
