// Login page renderer and event logic.
function renderLogin() {
  hideSidebarAndHeader();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth-shell">
      <section class="auth-hero">
        <div class="auth-hero__eyebrow">Premium Assessment Workspace</div>
        <h1 class="auth-hero__title">Secure exams with a calmer, cleaner experience.</h1>
        <p class="auth-hero__copy">
          Manage courses, publish question banks, and review ranked results from one polished portal built for admins, faculty, and students.
        </p>
        <div class="auth-hero__panel">
          <h2>Designed for focused delivery</h2>
          <p>Fast role-based access, structured workflows, and reliable exam tracking with no extra setup on the client side.</p>
        </div>
        <div class="auth-hero__stats">
          <div class="auth-hero__stat"><strong>RBAC</strong><span>Dedicated paths for admin, faculty, and student roles</span></div>
          <div class="auth-hero__stat"><strong>LIVE</strong><span>Ongoing exam flows with autosave and timed submission</span></div>
          <div class="auth-hero__stat"><strong>RANK</strong><span>Instant result views with leaderboard support</span></div>
        </div>
      </section>

      <section class="auth-card">
        <div class="auth-form-panel__eyebrow">Sign In</div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-copy">Choose your role and continue into the examination workspace.</p>

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
              <button type="button" class="password-toggle" id="toggle-pwd">Show</button>
            </div>
          </div>

          <button id="login-btn" class="btn btn-primary" type="submit" style="width:100%">Login</button>
        </form>

        <p class="auth-helper">New student? <a class="auth-link" href="register.html">Create your account</a></p>
      </section>
    </div>
  `;

  document.getElementById("toggle-pwd").addEventListener("click", () => {
    const input = document.getElementById("password");
    const toggle = document.getElementById("toggle-pwd");
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    toggle.textContent = showPassword ? "Hide" : "Show";
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
      errorEl.textContent = err.message || "Login failed";
      errorEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });
}
