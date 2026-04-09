// Student course catalog page.
async function renderStudentCourses() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">All Courses</h2><p class="page-subtitle">Only courses available for your current year are shown here.</p></div><div class="card"><div id="all-courses-wrap"></div></div>`;
  showSpinner("all-courses-wrap");

  try {
    const rows = await apiGetAllCourses();
    if (!rows.length) {
      showEmptyState("all-courses-wrap", "No courses available");
      return;
    }

    document.getElementById("all-courses-wrap").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
          <thead><tr><th>#</th><th>Course</th><th>Code</th><th>Student Year</th><th>Academic Year</th><th>Faculty</th><th>Action</th></tr></thead>
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
                    <td>${(course.faculty_names || []).join(", ") || "-"}</td>
                    <td><button class="btn ${course.is_enrolled ? "btn-grey" : "btn-green"}" id="enroll-${course.id}" onclick="enrollCourse(${course.id})" ${course.is_enrolled ? "disabled" : ""}>${course.is_enrolled ? "Enrolled" : "Enroll"}</button></td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    window.enrollCourse = async function (courseId) {
      const button = document.getElementById(`enroll-${courseId}`);
      button.disabled = true;
      try {
        await apiEnrollCourse(courseId);
        button.textContent = "Enrolled";
        button.className = "btn btn-grey";
        showToast("Enrolled successfully", "success");
      } catch (err) {
        button.disabled = false;
        showToast(err.message, "error");
      }
    };
  } catch (err) {
    document.getElementById("all-courses-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
