// Fallback route for unknown hashes.
function renderNotFound() {
  hideSidebarAndHeader();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="not-found-page">
      <h1>404</h1>
      <p>Page not found.</p>
      <button class="btn btn-primary" onclick="navigate(getHomeDashboard() || '#/login')">Go Home</button>
    </div>
  `;
}
