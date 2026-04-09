// Admin faculty management page.
async function renderAdminFaculty() {
  const user = getUser();
  renderSidebar("admin");
  renderHeader(user && user.full_name, "Admin");
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head"><h2 class="page-title">Faculty</h2></div>
    <div class="card">
      <form id="create-faculty-form" class="form-row">
        <div class="form-group"><label>Full Name</label><input id="full_name" required /></div>
        <div class="form-group"><label>Email</label><input id="email" required /></div>
        <div class="form-group"><label>Employee ID</label><input id="employee_id" required /></div>
        <div><button class="btn btn-primary" type="submit">Create Faculty</button></div>
      </form>
    </div>
    <div class="section-gap card"><div id="faculty-table-wrap"></div></div>
  `;

  async function loadFaculty() {
    showSpinner("faculty-table-wrap");
    try {
      const rows = await apiGetAdminFaculty();
      if (!rows.length) {
        showEmptyState("faculty-table-wrap", "No faculty records found");
        return;
      }

      document.getElementById("faculty-table-wrap").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Employee ID</th><th>Courses</th><th>Students</th><th>Exams</th></tr></thead>
            <tbody>
              ${rows
                .map(
                  (faculty, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${faculty.full_name}</td>
                      <td>${faculty.email}</td>
                      <td>${faculty.employee_id || "-"}</td>
                      <td>${faculty.total_courses ?? 0}</td>
                      <td>${faculty.total_students_registered ?? 0}</td>
                      <td>${faculty.total_exams_conducted ?? 0}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("faculty-table-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  window.showTempPassword = function (password) {
    showModal(`
      <div class="temp-password-box">
        <h3>Temporary Password</h3>
        <div class="temp-password-value">${password}</div>
        <div class="modal-actions">
          <button class="btn btn-blue" onclick="copyToClipboard('${password}')">Copy</button>
          <button class="btn" onclick="hideModal()">Close</button>
        </div>
      </div>
    `);
  };

  document.getElementById("create-faculty-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = await apiCreateFaculty(
        document.getElementById("full_name").value.trim(),
        document.getElementById("email").value.trim(),
        document.getElementById("employee_id").value.trim()
      );
      event.target.reset();
      showToast("Faculty created", "success");
      if (data.temp_password) {
        window.showTempPassword(data.temp_password);
      }
      await loadFaculty();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  await loadFaculty();
}
