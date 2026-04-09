// Exam attempt engine: question rendering, palette, timer, submit flow.
let examState = {
  attemptId: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  timerInterval: null
};

async function renderExamAttempt() {
  hideSidebarAndHeader();
  const app = document.getElementById("app");
  app.classList.remove("app-content--auth");
  app.style.margin = "0";
  app.style.padding = "0";
  const params = new URLSearchParams(window.location.search);
  const examId = params.get("examId");

  app.innerHTML = `
    <div id="exam-loader"></div>
    <div id="exam-root"></div>
  `;
  showSpinner("exam-loader");
  try {
    const data = await apiStartExam(examId);
    const attemptId = data.attempt_id || data.attemptId || localStorage.getItem("activeAttemptId");
    const questions = data.questions || [];
    examState = { attemptId, questions, answers: {}, currentIndex: 0, timerInterval: null };
    localStorage.setItem("activeAttemptId", String(attemptId));
    document.getElementById("exam-loader").innerHTML = "";
    document.getElementById("exam-root").innerHTML = `
      <div class="exam-container">
        <div class="exam-topbar">
          <div><strong>${data.exam?.title || "Exam"}</strong></div>
          <div id="exam-timer" class="exam-timer">00:00</div>
        </div>
        <div class="exam-main">
          <div class="exam-question-panel">
            <div id="question-container"></div>
          </div>
          <aside class="exam-sidebar-panel">
            <div id="palette-summary" class="muted"></div>
            <div id="palette-grid" class="palette-grid"></div>
            <button id="submit-exam-btn" class="btn-submit-exam">Submit Exam</button>
          </aside>
        </div>
      </div>
    `;
    renderQuestion(0);
    renderPalette();
    startCountdown(data.exam?.end_datetime);
    document.getElementById("submit-exam-btn").addEventListener("click", submitPrompt);
  } catch (err) {
    document.getElementById("exam-loader").innerHTML = `<p class="form-error">${err.message}</p>`;
  }
}

function renderQuestion(index) {
  const q = examState.questions[index];
  if (!q) return;
  const opts = q.options || q.choices || [];
  const selected = examState.answers[q.attempt_question_id];
  document.getElementById("question-container").innerHTML = `
    <div class="question-number">Question ${index + 1} / ${examState.questions.length}</div>
    <div class="question-text">${q.question_text}</div>
    <div>
      ${opts.map((opt) => {
        const isSel = selected === opt.position;
        return `
          <label class="option-label ${isSel ? "option-selected" : ""}" onclick="selectAnswer(${q.attempt_question_id}, ${opt.position})">
            <input type="radio" ${isSel ? "checked" : ""}/>
            <span class="option-position">${opt.position}.</span>
            <span>${opt.option_text || opt.text}</span>
          </label>
        `;
      }).join("")}
    </div>
    <div class="exam-nav">
      <button class="btn btn-blue" onclick="goToQuestion(${index - 1})" ${index === 0 ? "disabled" : ""}>← Previous</button>
      <button class="btn btn-blue" onclick="goToQuestion(${index + 1})" ${index === examState.questions.length - 1 ? "disabled" : ""}>Next →</button>
    </div>
  `;
}

function renderPalette() {
  const grid = document.getElementById("palette-grid");
  if (!grid) return;
  grid.innerHTML = examState.questions
    .map((q, i) => {
      const answered = examState.answers[q.attempt_question_id] != null;
      const current = i === examState.currentIndex;
      return `<div class="palette-box ${answered ? "palette-answered" : "palette-unanswered"} ${current ? "palette-current" : ""}" onclick="goToQuestion(${i})">${i + 1}</div>`;
    })
    .join("");
  const answeredCount = Object.values(examState.answers).filter((v) => v != null).length;
  document.getElementById("palette-summary").textContent = `Answered: ${answeredCount} / ${examState.questions.length}`;
}

function goToQuestion(index) {
  if (index < 0 || index >= examState.questions.length) return;
  examState.currentIndex = index;
  renderQuestion(index);
  renderPalette();
}

function selectAnswer(attemptQuestionId, position) {
  examState.answers[attemptQuestionId] = position;
  apiSaveAnswer(examState.attemptId, attemptQuestionId, position).catch(() => {});
  renderQuestion(examState.currentIndex);
  renderPalette();
}

function startCountdown(endDatetime) {
  const endTime = new Date(endDatetime).getTime();
  examState.timerInterval = setInterval(() => {
    const remaining = Math.max(0, endTime - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const timer = document.getElementById("exam-timer");
    if (!timer) return;
    timer.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    timer.classList.toggle("exam-timer--danger", remaining < 5 * 60000);
    if (remaining <= 0) {
      clearInterval(examState.timerInterval);
      autoSubmitExam();
    }
  }, 1000);
}

function submitPrompt() {
  const answeredCount = Object.values(examState.answers).filter((v) => v != null).length;
  showModal(`
    <h3>Submit Exam?</h3>
    <p>You have answered <strong>${answeredCount}</strong> of <strong>${examState.questions.length}</strong> questions.</p>
    <p>Unanswered questions will be marked as <em>Not Attempted</em>.</p>
    <div class="modal-actions">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmSubmit()">Submit</button>
    </div>
  `);
}

async function autoSubmitExam() {
  await apiSubmitExam(examState.attemptId);
  localStorage.removeItem("activeAttemptId");
  navigate(`#/exam/result?attemptId=${examState.attemptId}`);
}

async function confirmSubmit() {
  hideModal();
  clearInterval(examState.timerInterval);
  showToast("Submitting exam...", "info");
  await apiSubmitExam(examState.attemptId);
  localStorage.removeItem("activeAttemptId");
  navigate(`#/exam/result?attemptId=${examState.attemptId}`);
}
