// Student course catalog page with enroll action.
async function renderStudentCourses() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">All Courses</h2></div><div class="card"><div id="all-courses-wrap"></div></div>`;
  showSpinner("all-courses-wrap");
  try {
    const data = await apiGetAllCourses();
    const rows = data.courses || data || [];
    if (!rows.length) {
      showEmptyState("all-courses-wrap", "No courses available", "📚");
      return;
    }
    document.getElementById("all-courses-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Course</th><th>Code</th><th>Year</th><th>Action</th></tr></thead>
          <tbody>
            ${rows.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.course_name || c.name}</td>
                <td>${c.course_code || "-"}</td>
                <td>${formatYearWithAcademic(c.academic_year)}</td>
                <td><button class="btn btn-green" id="enroll-${c.course_id || c.id}" onclick="enrollCourse(${c.course_id || c.id})">Enroll</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    window.enrollCourse = async function (id) {
      const btn = document.getElementById(`enroll-${id}`);
      btn.disabled = true;
      await apiEnrollCourse(id);
      showToast("Enrolled successfully", "success");
      btn.textContent = "Enrolled";
      btn.className = "btn btn-grey";
    };
  } catch (err) {
    document.getElementById("all-courses-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
