// Faculty leaderboard page.
async function renderFacultyLeaderboard() {
  const user = getUser();
  renderSidebar("faculty");
  renderHeader(user && user.full_name, "Faculty");
  const app = document.getElementById("app");
  const params = new URLSearchParams(window.location.search);
  const examId = params.get("examId");

  app.innerHTML = `
    <div class="page-head"><h2 class="page-title">Leaderboard</h2></div>
    <div class="card"><button class="btn btn-blue" id="download-csv">Download CSV</button></div>
    <div class="section-gap card"><div id="leaderboard-wrap"></div></div>
  `;

  async function load() {
    showSpinner("leaderboard-wrap");
    try {
      const rows = await apiGetLeaderboard(examId);
      if (!rows.length) {
        showEmptyState("leaderboard-wrap", "No submissions yet");
        return;
      }

      document.getElementById("leaderboard-wrap").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Username</th><th>Score</th><th>Percentage</th><th>Time</th></tr></thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      <td>#${row.rank}</td>
                      <td>${row.full_name}</td>
                      <td>${row.username}</td>
                      <td>${row.score}/${row.num_questions}</td>
                      <td>${row.percentage}%</td>
                      <td>${formatSeconds(row.time_taken_sec || 0)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("leaderboard-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  document.getElementById("download-csv").addEventListener("click", async () => {
    try {
      const response = await apiExportLeaderboardCSV(examId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leaderboard-exam-${examId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("CSV downloaded", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  await load();
}
