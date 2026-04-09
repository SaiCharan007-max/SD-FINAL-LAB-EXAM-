// Student past results page.
async function renderStudentMyResults() {
  const user = getUser();
  renderSidebar("student");
  renderHeader(user && user.full_name, "Student");
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-head"><h2 class="page-title">My Results</h2></div><div class="card"><div id="my-results-wrap"></div></div>`;
  showSpinner("my-results-wrap");

  try {
    const rows = await apiGetMyResults();
    if (!rows.length) {
      showEmptyState("my-results-wrap", "No results yet");
      return;
    }

    document.getElementById("my-results-wrap").innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Exam</th><th>Course</th><th>Score</th><th>Percentage</th><th>Rank</th><th>Action</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (result, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${result.title || result.exam_title || "-"}</td>
                    <td>${result.course_name || "-"}</td>
                    <td>${result.score ?? 0}/${result.num_questions ?? 0}</td>
                    <td>${result.percentage ?? 0}%</td>
                    <td>#${result.rank ?? "-"}</td>
                    <td>${result.attempt_id ? `<button class="btn btn-blue" onclick="navigate('#/exam/result?attemptId=${result.attempt_id}')">View</button>` : "-"}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.getElementById("my-results-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
