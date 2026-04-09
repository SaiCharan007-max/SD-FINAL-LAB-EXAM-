// Shared utility helpers for UI rendering and formatting.
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="spinner" aria-label="Loading"></div>';
}

function hideSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
}

function showModal(htmlContent) {
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");
  box.innerHTML = htmlContent;
  overlay.classList.remove("hidden");
}

function hideModal() {
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");
  overlay.classList.add("hidden");
  box.innerHTML = "";
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })} at ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  })}`;
}

function formatSeconds(totalSeconds) {
  const mins = Math.floor(Number(totalSeconds || 0) / 60);
  const secs = Number(totalSeconds || 0) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getExamStatus(start_datetime, duration_minutes) {
  if (!start_datetime || !duration_minutes) return "Not Scheduled";
  const now = new Date();
  const start = new Date(start_datetime);
  const end = new Date(start.getTime() + Number(duration_minutes) * 60000);
  if (now < start) return "Upcoming";
  if (now >= start && now <= end) return "Ongoing";
  return "Completed";
}

function getStatusBadgeHTML(status) {
  const normalized = (status || "").toLowerCase();
  return `<span class="badge badge-${normalized.replace(/\s+/g, "-")}">${status}</span>`;
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard!", "success");
}

function navigate(hash) {
  const target = routeToPath(hash);
  window.location.href = target;
}

function routeToPath(route) {
  const fallback = "login.html";
  if (!route) return fallback;
  if (!route.startsWith("#/")) return route;
  const [base, query = ""] = route.split("?");
  const map = {
    "#/login": "login.html",
    "#/register": "register.html",
    "#/admin/dashboard": "admin-dashboard.html",
    "#/admin/courses": "admin-courses.html",
    "#/admin/faculty": "admin-faculty.html",
    "#/faculty/dashboard": "faculty-dashboard.html",
    "#/faculty/questions": "faculty-questions.html",
    "#/faculty/exams": "faculty-exams.html",
    "#/faculty/leaderboard": "faculty-leaderboard.html",
    "#/student/dashboard": "student-dashboard.html",
    "#/student/courses": "student-courses.html",
    "#/student/my-courses": "student-my-courses.html",
    "#/student/my-exams": "student-my-exams.html",
    "#/student/my-results": "student-my-results.html",
    "#/exam/attempt": "exam-attempt.html",
    "#/exam/result": "exam-result.html"
  };
  const path = map[base] || fallback;
  return query ? `${path}?${query}` : path;
}

function currentRouteFromPath() {
  const page = window.location.pathname.split("/").pop();
  const map = {
    "login.html": "#/login",
    "register.html": "#/register",
    "admin-dashboard.html": "#/admin/dashboard",
    "admin-courses.html": "#/admin/courses",
    "admin-faculty.html": "#/admin/faculty",
    "faculty-dashboard.html": "#/faculty/dashboard",
    "faculty-questions.html": "#/faculty/questions",
    "faculty-exams.html": "#/faculty/exams",
    "faculty-leaderboard.html": "#/faculty/leaderboard",
    "student-dashboard.html": "#/student/dashboard",
    "student-courses.html": "#/student/courses",
    "student-my-courses.html": "#/student/my-courses",
    "student-my-exams.html": "#/student/my-exams",
    "student-my-results.html": "#/student/my-results",
    "exam-attempt.html": "#/exam/attempt",
    "exam-result.html": "#/exam/result",
    "index.html": ""
  };
  return map[page] || "";
}

function renderSidebar(role) {
  const sidebar = document.getElementById("sidebar");
  const map = {
    admin: [
      ["#/admin/dashboard", "Dashboard"],
      ["#/admin/courses", "Courses"],
      ["#/admin/faculty", "Faculty"]
    ],
    faculty: [
      ["#/faculty/dashboard", "Dashboard"],
      ["#/faculty/questions", "Question Bank"],
      ["#/faculty/exams", "Exams"]
    ],
    student: [
      ["#/student/dashboard", "Dashboard"],
      ["#/student/courses", "All Courses"],
      ["#/student/my-courses", "My Courses"],
      ["#/student/my-exams", "My Exams"],
      ["#/student/my-results", "My Results"]
    ]
  };
  const items = map[role] || [];
  sidebar.innerHTML = `
    <div class="logo">Exam Portal</div>
    <nav>
      ${items
        .map(([href, label]) => {
          const active = currentRouteFromPath().startsWith(href) ? "active" : "";
          return `<a class="${active}" href="${routeToPath(href)}">${label}</a>`;
        })
        .join("")}
    </nav>
    <button class="logout-btn" onclick="logout()">Logout</button>
  `;
  sidebar.classList.remove("hidden");
}

function renderHeader(fullName, role) {
  const header = document.getElementById("top-header");
  header.innerHTML = `
    <div class="header-left">
      <button id="hamburger" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
      <strong>Welcome, ${fullName || "User"}</strong>
    </div>
    <span class="badge badge-code">${String(role || "").toUpperCase()}</span>
  `;
  header.classList.remove("hidden");
}

function hideSidebarAndHeader() {
  document.getElementById("sidebar").classList.add("hidden");
  document.getElementById("top-header").classList.add("hidden");
  document.getElementById("app").classList.add("app-content--auth");
}

function showAppLayout() {
  document.getElementById("app").classList.remove("app-content--auth");
}

function showEmptyState(containerId, message, icon = "📭") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

function formatYearLevel(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "-";
  if (v === "1" || v.includes("1st")) return "1st Year";
  if (v === "2" || v.includes("2nd")) return "2nd Year";
  if (v === "3" || v.includes("3rd")) return "3rd Year";
  if (v === "4" || v.includes("4th")) return "4th Year";
  return String(value);
}

function getCurrentAcademicYear(startMonthIndex = 5) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const startYear = month >= startMonthIndex ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

function formatYearWithAcademic(value) {
  return `${formatYearLevel(value)} (AY ${getCurrentAcademicYear()})`;
}

// Only close modals using explicit buttons; overlay click is ignored by requirement.
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("modal-overlay");
  overlay.addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") {
      e.stopPropagation();
    }
  });
});
