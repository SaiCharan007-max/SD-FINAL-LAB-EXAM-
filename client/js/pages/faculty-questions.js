// Faculty question bank management.
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
        <div class="form-group"><label>Academic Year</label><select id="q_year" required>${renderAcademicYearOptions(getCurrentAcademicYear())}</select></div>
        <div class="form-group"><label>Excel File</label><input id="q_file" type="file" accept=".xlsx,.xls" required /></div>
        <div><button class="btn btn-primary" type="submit">Upload Questions</button></div>
      </form>
    </div>
    <div class="section-gap card"><div id="questions-list"></div></div>
  `;

  let courses = [];

  try {
    courses = await apiGetFacultyCourses();
    document.getElementById("q_course").innerHTML = courses
      .map((course) => `<option value="${course.id}">${course.course_name}</option>`)
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }

  async function loadQuestions() {
    const courseId = document.getElementById("q_course").value;
    const academicYear = document.getElementById("q_year").value.trim();
    if (!courseId || !academicYear) return;

    showSpinner("questions-list");
    try {
      const questions = await apiGetQuestions(courseId, academicYear);
      if (!questions.length) {
        showEmptyState("questions-list", "No questions found for selected filters");
        return;
      }

      document.getElementById("questions-list").innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Question</th><th>Difficulty</th><th>Correct</th></tr></thead>
            <tbody>
              ${questions
                .map(
                  (question, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${question.question_text}</td>
                      <td>${question.difficulty}</td>
                      <td>${question.correct_answer}</td>
                    </tr>
                  `
                )
                .join("")}
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

  document.getElementById("upload-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("course_id", document.getElementById("q_course").value);
    formData.append("academic_year", document.getElementById("q_year").value.trim());
    formData.append("file", document.getElementById("q_file").files[0]);

    try {
      await apiUploadQuestions(formData);
      showToast("Questions uploaded", "success");
      event.target.reset();
      document.getElementById("q_year").value = getCurrentAcademicYear();
      if (courses.length) {
        document.getElementById("q_course").value = String(courses[0].id);
      }
      await loadQuestions();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  await loadQuestions();
}
