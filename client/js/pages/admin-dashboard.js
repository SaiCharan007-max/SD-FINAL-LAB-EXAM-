// Admin dashboard summary page.
async function renderAdminDashboard() {
  const user = getUser();
  renderSidebar("admin");
  renderHeader(user && user.full_name, "Admin");
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head"><h2 class="page-title">Dashboard</h2></div>
    <div id="admin-summary"></div>
  `;
  showSpinner("admin-summary");
  try {
    const data = await apiGetAdminSummary();
    document.getElementById("admin-summary").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__icon">📚</div><div class="summary-card__label">Total Courses</div><div class="summary-card__value">${data.total_courses ?? 0}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__icon">👩‍🏫</div><div class="summary-card__label">Total Faculty</div><div class="summary-card__value">${data.total_faculty ?? 0}</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__icon">🎓</div><div class="summary-card__label">Total Students</div><div class="summary-card__value">${data.total_students ?? 0}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__icon">📋</div><div class="summary-card__label">Exams Conducted</div><div class="summary-card__value">${data.exams_conducted ?? 0}</div></div>
      </div>
    `;
  } catch (err) {
    document.getElementById("admin-summary").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
