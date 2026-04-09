// Student enrolled courses page.
async function renderStudentMyCourses() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">My Courses</h2></div><div class="card"><div id="my-courses-wrap"></div></div>`;
  showSpinner("my-courses-wrap");
  try {
    const data = await apiGetMyCourses();
    const rows = data.courses || data || [];
    if (!rows.length) {
      showEmptyState("my-courses-wrap", "You are not enrolled in any course yet", "📘");
      return;
    }
    document.getElementById("my-courses-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Course</th><th>Code</th><th>Year / AY</th></tr></thead>
          <tbody>${rows.map((c, i) => `<tr><td>${i + 1}</td><td>${c.course_name || c.name}</td><td>${c.course_code || "-"}</td><td>${formatYearWithAcademic(c.academic_year)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.getElementById("my-courses-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
