// Auth utility helpers for token, user, and role handling.
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (err) {
    return null;
  }
}

function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("activeAttemptId");
}

function isLoggedIn() {
  return !!getToken();
}

function getUserRole() {
  const user = getUser();
  return user ? user.role : null;
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (!decoded.exp) return true;
    return decoded.exp < Math.floor(Date.now() / 1000);
  } catch (err) {
    return true;
  }
}

function getHomeDashboard() {
  const role = getUserRole();
  if (role === "admin") return "#/admin/dashboard";
  if (role === "faculty") return "#/faculty/dashboard";
  if (role === "student") return "#/student/dashboard";
  return "#/login";
}

function logout() {
  clearAuth();
  navigate("#/login");
}

function requireAuth(requiredRole) {
  const token = getToken();
  if (!token) {
    navigate("#/login");
    return false;
  }
  if (isTokenExpired(token)) {
    logout();
    return false;
  }
  if (requiredRole && getUserRole() !== requiredRole) {
    navigate(getHomeDashboard());
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    logout();
    return true;
  }
  navigate(getHomeDashboard());
  return true;
}
