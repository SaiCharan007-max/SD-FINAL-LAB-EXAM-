// Student past results page.
async function renderStudentMyResults() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">My Results</h2></div><div class="card"><div id="my-results-wrap"></div></div>`;
  showSpinner("my-results-wrap");
  try {
    const data = await apiGetMyResults();
    const rows = data.results || data || [];
    if (!rows.length) {
      showEmptyState("my-results-wrap", "No results yet", "🏁");
      return;
    }
    document.getElementById("my-results-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Exam</th><th>Score</th><th>Percentage</th><th>Rank</th><th>Action</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.exam_title || "-"}</td>
                <td>${r.score ?? 0}/${r.total_questions ?? r.num_questions ?? 0}</td>
                <td>${r.percentage ?? 0}%</td>
                <td>#${r.rank ?? "-"}</td>
                <td><button class="btn btn-blue" onclick="navigate('#/exam/result?attemptId=${r.attempt_id || r.id}')">View</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.getElementById("my-results-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
