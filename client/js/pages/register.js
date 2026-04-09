// Student registration page with client-side validation.
function renderRegister() {
  hideSidebarAndHeader();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth-card">
      <h1 class="auth-title">Student Registration</h1>
      <form id="register-form">
        <div id="register-error" class="inline-error hidden"></div>
        <div class="form-group"><label>Full Name</label><input id="full_name" /><span class="form-error" id="err_full_name"></span></div>
        <div class="form-group"><label>Email</label><input id="email" /><span class="form-error" id="err_email"></span></div>
        <div class="form-group"><label>Username</label><input id="username" /><span class="form-error" id="err_username"></span></div>
        <div class="form-group"><label>Password</label><input id="password" type="password" /><span class="form-error" id="err_password"></span></div>
        <ul class="pwd-checklist">
          <li id="rule_len">At least 8 characters</li>
          <li id="rule_upper">At least 1 uppercase letter</li>
          <li id="rule_num">At least 1 number</li>
          <li id="rule_special">At least 1 special character</li>
        </ul>
        <div class="form-group"><label>Confirm Password</label><input id="confirm_password" type="password" /><span class="form-error" id="err_confirm_password"></span></div>
        <button id="register-btn" class="btn btn-primary" type="submit" style="width:100%">Register</button>
      </form>
      <p><a class="auth-link" href="login.html">Back to Login</a></p>
    </div>
  `;

  const rules = {
    len: (v) => v.length >= 8,
    upper: (v) => /[A-Z]/.test(v),
    num: (v) => /[0-9]/.test(v),
    special: (v) => /[^A-Za-z0-9]/.test(v)
  };

  function updateChecklist() {
    const p = document.getElementById("password").value;
    document.getElementById("rule_len").classList.toggle("met", rules.len(p));
    document.getElementById("rule_upper").classList.toggle("met", rules.upper(p));
    document.getElementById("rule_num").classList.toggle("met", rules.num(p));
    document.getElementById("rule_special").classList.toggle("met", rules.special(p));
  }
  document.getElementById("password").addEventListener("input", updateChecklist);

  function setErr(id, msg) {
    document.getElementById(`err_${id}`).textContent = msg || "";
  }

  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = {
      full_name: document.getElementById("full_name").value.trim(),
      email: document.getElementById("email").value.trim(),
      username: document.getElementById("username").value.trim(),
      password: document.getElementById("password").value,
      confirm_password: document.getElementById("confirm_password").value
    };
    Object.keys(f).forEach((k) => setErr(k, ""));
    const errors = {};
    if (!f.full_name) errors.full_name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = "Invalid email";
    if (!/^[a-zA-Z0-9]+$/.test(f.username)) errors.username = "Alphanumeric only";
    if (!(rules.len(f.password) && rules.upper(f.password) && rules.num(f.password) && rules.special(f.password))) {
      errors.password = "Password does not meet requirements";
    }
    if (f.password !== f.confirm_password) errors.confirm_password = "Passwords do not match";
    Object.keys(errors).forEach((k) => setErr(k, errors[k]));
    if (Object.keys(errors).length) return;
    try {
      await apiRegister(f.full_name, f.email, f.username, f.password, f.confirm_password);
      showToast("Registration successful! Please login.", "success");
      navigate("#/login");
    } catch (err) {
      const el = document.getElementById("register-error");
      el.textContent = err.message || "Registration failed";
      el.classList.remove("hidden");
    }
  });
}
