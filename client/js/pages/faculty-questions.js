// Faculty question bank management: upload and view per course/year.
async function renderFacultyQuestions() {
  const user = getUser();
  renderSidebar("faculty");
  renderHeader(user && user.full_name, "Faculty");
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-head"><h2 class="page-title">Question Bank</h2></div>
    <div class="card">
      <form id="upload-form" class="form-row">
        <div class="form-group"><label>Course</label><select id="q_course" required></select></div>
        <div class="form-group">
          <label>Year (Current AY: ${getCurrentAcademicYear()})</label>
          <select id="q_year" required>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div class="form-group"><label>CSV File</label><input id="q_file" type="file" accept=".csv" required /></div>
        <div><button class="btn btn-primary" type="submit">Upload Questions</button></div>
      </form>
    </div>
    <div class="section-gap card"><div id="questions-list"></div></div>
  `;

  let courses = [];
  try {
    const data = await apiGetFacultyCourses();
    courses = data.courses || data || [];
    document.getElementById("q_course").innerHTML = courses
      .map((c) => `<option value="${c.course_id || c.id}">${c.course_name || c.name}</option>`)
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }

  async function loadQuestions() {
    const courseId = document.getElementById("q_course").value;
    const year = document.getElementById("q_year").value.trim();
    if (!courseId || !year) return;
    showSpinner("questions-list");
    try {
      const data = await apiGetQuestions(courseId, year);
      const questions = data.questions || data || [];
      if (!questions.length) {
        showEmptyState("questions-list", "No questions found for selected filters", "❓");
        return;
      }
      document.getElementById("questions-list").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Question</th><th>Difficulty</th></tr></thead>
            <tbody>
              ${questions.map((q, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${q.question_text || q.question || "-"}</td>
                  <td><span class="badge badge-${(q.difficulty || "low").toLowerCase()}">${q.difficulty || "LOW"}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById("questions-list").innerHTML = `<p class="form-error">${err.message}</p>`;
    }
  }

  document.getElementById("q_course").addEventListener("change", loadQuestions);
  document.getElementById("q_year").addEventListener("change", loadQuestions);

  document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("course_id", document.getElementById("q_course").value);
    fd.append("academic_year", document.getElementById("q_year").value.trim());
    fd.append("file", document.getElementById("q_file").files[0]);
    await apiUploadQuestions(fd);
    showToast("Questions uploaded", "success");
    loadQuestions();
  });
}
