// Admin course management page with create + faculty assignment modal.
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
        <div class="form-group">
          <label>Year (Current AY: <span id="current-ay-admin">${getCurrentAcademicYear()}</span>)</label>
          <select id="academic_year" required>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div><button class="btn btn-primary" type="submit">Create Course</button></div>
      </form>
    </div>
    <div class="section-gap card">
      <div id="courses-table-wrap"></div>
    </div>
  `;

  let faculty = [];
  let courses = [];

  async function load() {
    const tableWrap = document.getElementById("courses-table-wrap");
    showSpinner("courses-table-wrap");
    try {
      const [courseData, facultyData] = await Promise.all([apiGetAdminCourses(), apiGetAdminFaculty()]);
      courses = courseData.courses || courseData || [];
      faculty = facultyData.faculty || facultyData || [];
      if (!courses.length) {
        showEmptyState("courses-table-wrap", "No courses available", "📚");
        return;
      }
      tableWrap.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Course Name</th><th>Course Code</th><th>Year / AY</th><th>Assigned Faculty</th><th>Enrolled Students</th><th>Actions</th></tr></thead>
            <tbody>
              ${courses.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${c.course_name || c.name || "-"}</td>
                  <td>${c.course_code || "-"}</td>
                  <td>${formatYearWithAcademic(c.academic_year)}</td>
                  <td>${(c.assigned_faculty || []).map((f) => f.full_name).join(", ") || "-"}</td>
                  <td>${c.enrolled_students ?? c.student_count ?? 0}</td>
                  <td><button class="btn btn-blue" onclick="openAssignFacultyModal(${c.course_id || c.id})">Assign Faculty</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      tableWrap.innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  window.openAssignFacultyModal = function (courseId) {
    const course = courses.find((c) => (c.course_id || c.id) === courseId);
    const assigned = (course.assigned_faculty || []).map((f) => f.id || f.faculty_id);
    showModal(`
      <h3>Assign Faculty to ${course.course_name || course.name}</h3>
      <div style="display:grid;gap:8px;margin:10px 0">
        ${faculty.map((f) => `
          <label><input type="checkbox" value="${f.id || f.faculty_id}" ${assigned.includes(f.id || f.faculty_id) ? "checked" : ""}/> ${f.full_name} (${f.employee_id || "N/A"})</label>
        `).join("")}
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveFacultyAssignment(${courseId})">Save</button>
      </div>
    `);
  };

  window.saveFacultyAssignment = async function (courseId) {
    const ids = Array.from(document.querySelectorAll("#modal-box input[type=checkbox]:checked")).map((el) => Number(el.value));
    await apiAssignFaculty(courseId, ids);
    hideModal();
    showToast("Faculty assignment updated", "success");
    load();
  };

  document.getElementById("create-course-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await apiCreateCourse(
      document.getElementById("course_name").value.trim(),
      document.getElementById("course_code").value.trim(),
      document.getElementById("description").value.trim(),
      document.getElementById("academic_year").value.trim()
    );
    showToast("Course created", "success");
    e.target.reset();
    load();
  });

  await load();
}
