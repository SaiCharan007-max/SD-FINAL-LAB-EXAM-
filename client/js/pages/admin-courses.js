// Admin course management page.
async function renderAdminCourses() {
  const user = getUser();
  renderSidebar("admin");
  renderHeader(user && user.full_name, "Admin");
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head"><h2 class="page-title">Courses</h2></div>
    <div class="card">
      <form id="create-course-form" class="form-row">
        <div class="form-group"><label>Course Name</label><input id="course_name" required /></div>
        <div class="form-group"><label>Course Code</label><input id="course_code" required /></div>
        <div class="form-group"><label>Description</label><input id="description" /></div>
        <div class="form-group"><label>Student Year</label><select id="student_year" required>${renderStudentYearOptions("1st Year")}</select></div>
        <div class="form-group"><label>Academic Year</label><select id="academic_year" required>${renderAcademicYearOptions(getCurrentAcademicYear())}</select></div>
        <div><button class="btn btn-primary" type="submit">Create Course</button></div>
      </form>
    </div>
    <div class="section-gap card"><div id="courses-table-wrap"></div></div>
  `;

  let facultyList = [];
  let courseList = [];

  async function load() {
    showSpinner("courses-table-wrap");
    try {
      const [courses, faculty] = await Promise.all([apiGetAdminCourses(), apiGetAdminFaculty()]);
      courseList = courses;
      facultyList = faculty;

      if (!courseList.length) {
        showEmptyState("courses-table-wrap", "No courses available");
        return;
      }

      document.getElementById("courses-table-wrap").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Course</th><th>Code</th><th>Student Year</th><th>Academic Year</th><th>Assigned Faculty</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>
              ${courseList
                .map(
                  (course, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${course.course_name}</td>
                      <td>${course.course_code}</td>
                      <td>${formatYearLevel(course.student_year)}</td>
                      <td>${formatYearWithAcademic(course.academic_year)}</td>
                      <td>${(course.assigned_faculty || []).map((faculty) => faculty.full_name).join(", ") || "-"}</td>
                      <td>${course.enrolled_student_count ?? 0}</td>
                      <td><button class="btn btn-blue" onclick="openAssignFacultyModal(${course.id})">Assign Faculty</button></td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("courses-table-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  window.openAssignFacultyModal = function (courseId) {
    const course = courseList.find((item) => item.id === courseId);
    const assignedFacultyIds = (course.assigned_faculty || []).map((faculty) => Number(faculty.id));

    showModal(`
      <h3>Assign Faculty to ${course.course_name}</h3>
      <div style="display:grid;gap:8px;margin:12px 0;">
        ${facultyList
          .map(
            (faculty) => `
              <label>
                <input type="checkbox" value="${faculty.id}" ${assignedFacultyIds.includes(Number(faculty.id)) ? "checked" : ""} />
                ${faculty.full_name} (${faculty.employee_id || "N/A"})
              </label>
            `
          )
          .join("")}
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveFacultyAssignment(${courseId})">Save</button>
      </div>
    `);
  };

  window.saveFacultyAssignment = async function (courseId) {
    const selectedIds = Array.from(document.querySelectorAll("#modal-box input[type=checkbox]:checked")).map((el) => Number(el.value));
    const course = courseList.find((item) => item.id === courseId);
    const currentlyAssignedIds = (course.assigned_faculty || []).map((faculty) => Number(faculty.id));
    const idsToAdd = selectedIds.filter((facultyId) => !currentlyAssignedIds.includes(facultyId));
    const idsToRemove = currentlyAssignedIds.filter((facultyId) => !selectedIds.includes(facultyId));

    try {
      if (idsToAdd.length) {
        await apiAssignFaculty(courseId, idsToAdd);
      }

      if (idsToRemove.length) {
        await Promise.all(idsToRemove.map((facultyId) => apiRemoveFaculty(courseId, facultyId)));
      }

      hideModal();
      showToast("Faculty assignment updated", "success");
      await load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  document.getElementById("create-course-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await apiCreateCourse(
        document.getElementById("course_name").value.trim(),
        document.getElementById("course_code").value.trim(),
        document.getElementById("description").value.trim(),
        document.getElementById("student_year").value.trim(),
        document.getElementById("academic_year").value.trim()
      );
      event.target.reset();
      document.getElementById("student_year").value = "1st Year";
      document.getElementById("academic_year").value = getCurrentAcademicYear();
      showToast("Course created", "success");
      await load();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  await load();
}
