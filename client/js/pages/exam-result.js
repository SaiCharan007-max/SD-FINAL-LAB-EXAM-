// Exam result detail page with question-by-question breakdown.
async function renderExamResult() {
  hideSidebarAndHeader();
  const app = document.getElementById("app");
  app.classList.remove("app-content--auth");
  app.style.margin = "0";
  app.style.padding = "24px";

  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get("attemptId");

  app.innerHTML = `<div id="result-wrap"></div>`;
  showSpinner("result-wrap");

  try {
    const data = await apiGetExamResult(attemptId);
    const questions = data.questions || data.breakdown || [];

    document.getElementById("result-wrap").innerHTML = `
      <div class="cards-grid">
        <div class="summary-card summary-card--blue"><div class="summary-card__label">Score</div><div class="summary-card__value">${data.score ?? 0}/${data.num_questions ?? questions.length}</div></div>
        <div class="summary-card summary-card--green"><div class="summary-card__label">Percentage</div><div class="summary-card__value">${data.percentage ?? 0}%</div></div>
        <div class="summary-card summary-card--yellow"><div class="summary-card__label">Time Taken</div><div class="summary-card__value">${formatSeconds(data.time_taken_sec || 0)}</div></div>
        <div class="summary-card summary-card--purple"><div class="summary-card__label">Rank</div><div class="summary-card__value">#${data.rank ?? "-"}</div></div>
      </div>

      <div class="card section-gap">
        <p><strong>Exam:</strong> ${data.exam_title || "-"}</p>
        <p><strong>Course:</strong> ${data.course_name || "-"}</p>
      </div>

      <div class="card section-gap table-wrap">
        <table class="data-table result-table">
          <thead><tr><th>#</th><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr></thead>
          <tbody>
            ${questions.map((q) => {
              const attempted = q.student_answer != null;
              const cls = !attempted ? "result-row--missed" : q.is_correct ? "result-row--correct" : "result-row--wrong";
              const mark = !attempted ? "NA" : q.is_correct ? "OK" : "NO";
              return `
                <tr class="${cls}">
                  <td>${q.shuffled_order || q.order_no || "-"}</td>
                  <td>${q.question_text}</td>
                  <td>${q.student_answer_text || "Not Attempted"}</td>
                  <td>${q.correct_answer_text || "-"}</td>
                  <td>${mark}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>

      <div class="section-gap">
        <button class="btn btn-primary" onclick="navigate('#/student/my-results')">Back to My Results</button>
      </div>
    `;

    window.scrollTo(0, 0);
  } catch (err) {
    document.getElementById("result-wrap").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}
