// Student enrolled courses page.
async function renderStudentMyCourses() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">My Courses</h2></div><div class="card"><div id="my-courses-wrap"></div></div>`;
  showSpinner("my-courses-wrap");

  try {
    const rows = await apiGetMyCourses();
    if (!rows.length) {
      showEmptyState("my-courses-wrap", "You are not enrolled in any course yet");
      return;
    }

    document.getElementById("my-courses-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Course</th><th>Code</th><th>Student Year</th><th>Academic Year</th><th>Exam Status</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (course, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${course.course_name}</td>
                    <td>${course.course_code || "-"}</td>
                    <td>${formatYearLevel(course.student_year)}</td>
                    <td>${formatYearWithAcademic(course.academic_year)}</td>
                    <td>${getStatusBadgeHTML(course.exam_status || "Not Scheduled")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.getElementById("my-courses-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
