// Login page renderer and event logic.
function renderLogin() {
  hideSidebarAndHeader();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth-card">
      <h1 class="auth-title">Online Examination Portal</h1>
      <form id="login-form">
        <div id="login-error" class="inline-error hidden"></div>
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" required>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input id="password" type="password" required />
            <button type="button" class="password-toggle" id="toggle-pwd">👁</button>
          </div>
        </div>
        <button id="login-btn" class="btn btn-primary" type="submit" style="width:100%">Login</button>
      </form>
      <p class="muted">New student? <a class="auth-link" href="register.html">Register here</a></p>
    </div>
  `;

  document.getElementById("toggle-pwd").addEventListener("click", () => {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
  });

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("login-btn");
    const errorEl = document.getElementById("login-error");
    errorEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Logging in...";
    try {
      const role = document.getElementById("role").value;
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const data = await apiLogin(username, password, role);
      saveAuth(data.token, data.user);
      navigate(getHomeDashboard());
    } catch (err) {
      errorEl.textContent = "Invalid username or password";
      errorEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });
}
