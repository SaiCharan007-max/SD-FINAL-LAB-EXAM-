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
      const data = await apiGetAdminFaculty();
      const rows = data.faculty || data || [];
      if (!rows.length) {
        showEmptyState("faculty-table-wrap", "No faculty records found", "👩‍🏫");
        return;
      }
      document.getElementById("faculty-table-wrap").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Employee ID</th><th>Temp Password</th></tr></thead>
            <tbody>
              ${rows.map((f, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${f.full_name}</td>
                  <td>${f.email}</td>
                  <td>${f.employee_id || "-"}</td>
                  <td>${f.temp_password ? `<button class="btn btn-blue" onclick="showTempPassword('${f.temp_password}')">View</button>` : "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("faculty-table-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  window.showTempPassword = function (pwd) {
    showModal(`
      <div class="temp-password-box">
        <h3>Temporary Password</h3>
        <div class="temp-password-value">${pwd}</div>
        <div class="modal-actions">
          <button class="btn btn-blue" onclick="copyToClipboard('${pwd}')">Copy</button>
          <button class="btn" onclick="hideModal()">Close</button>
        </div>
        <div class="temp-password-warning">Share this securely. The user should change it after first login.</div>
      </div>
    `);
  };

  document.getElementById("create-faculty-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await apiCreateFaculty(
        document.getElementById("full_name").value.trim(),
        document.getElementById("email").value.trim(),
        document.getElementById("employee_id").value.trim()
      );
      showToast("Faculty created", "success");
      e.target.reset();
      if (data.temp_password) window.showTempPassword(data.temp_password);
      await loadFaculty();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  await loadFaculty();
}
