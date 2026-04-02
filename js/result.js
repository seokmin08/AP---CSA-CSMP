const resultViewTest = localStorage.getItem("resultViewTest") || "Test 1";
const latestSubmission = JSON.parse(localStorage.getItem("latestSubmission") || "null");
const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");

function formatTime(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return min + ":" + sec;
}

function getLatestSubmissionForTest() {
    if (latestSubmission && latestSubmission.test === resultViewTest) {
        return latestSubmission;
    }

    for (let i = submissions.length - 1; i >= 0; i--) {
        if (submissions[i].test === resultViewTest) {
            return submissions[i];
        }
    }

    return null;
}

function createQuestionCard(result) {
    const wrapper = document.createElement("div");
    wrapper.style.background = "#ffffff";
    wrapper.style.border = result.isCorrect ? "2px solid #22c55e" : "2px solid #ef4444";
    wrapper.style.borderRadius = "16px";
    wrapper.style.padding = "22px";
    wrapper.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.08)";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.flexWrap = "wrap";
    header.style.gap = "10px";
    header.style.marginBottom = "16px";

    const title = document.createElement("h3");
    title.textContent = "Question " + result.questionNumber;
    title.style.margin = "0";
    title.style.fontSize = "22px";
    title.style.color = "#111827";

    const status = document.createElement("span");
    status.style.display = "inline-block";
    status.style.padding = "8px 14px";
    status.style.borderRadius = "999px";
    status.style.fontWeight = "700";
    status.style.fontSize = "14px";
    status.style.background = result.isCorrect ? "#dcfce7" : "#fee2e2";
    status.style.color = result.isCorrect ? "#166534" : "#b91c1c";
    status.textContent = result.isCorrect ? "✅ 맞음" : "❌ 틀림";

    header.appendChild(title);
    header.appendChild(status);

    const topRow = document.createElement("div");
    topRow.style.display = "grid";
    topRow.style.gridTemplateColumns = "minmax(0, 3fr) minmax(300px, 1fr)";
    topRow.style.gap = "16px";
    topRow.style.alignItems = "stretch";
    topRow.style.marginBottom = "14px";

    const questionBox = document.createElement("div");
    questionBox.style.background = "#0f172a";
    questionBox.style.color = "#e2e8f0";
    questionBox.style.padding = "16px";
    questionBox.style.borderRadius = "12px";
    questionBox.style.minHeight = "220px";
    questionBox.style.display = "flex";
    questionBox.style.flexDirection = "column";

    const questionLabel = document.createElement("div");
    questionLabel.textContent = "문제";
    questionLabel.style.fontSize = "13px";
    questionLabel.style.fontWeight = "700";
    questionLabel.style.color = "#93c5fd";
    questionLabel.style.marginBottom = "8px";

    const question = document.createElement("pre");
    question.textContent = result.questionText;
    question.style.whiteSpace = "pre-wrap";
    question.style.fontFamily = "monospace";
    question.style.fontSize = "14px";
    question.style.lineHeight = "1.7";
    question.style.margin = "0";
    question.style.overflowX = "auto";
    question.style.flex = "1";

    questionBox.appendChild(questionLabel);
    questionBox.appendChild(question);

    const selectedBox = document.createElement("div");
    selectedBox.style.background = result.isCorrect ? "#f0fdf4" : "#fef2f2";
    selectedBox.style.border = result.isCorrect ? "1px solid #86efac" : "1px solid #fca5a5";
    selectedBox.style.borderRadius = "12px";
    selectedBox.style.padding = "16px";
    selectedBox.style.display = "flex";
    selectedBox.style.flexDirection = "column";
    selectedBox.style.justifyContent = "center";
    selectedBox.style.minHeight = "220px";

    const selectedLabel = document.createElement("div");
    selectedLabel.textContent = "내가 고른 답";
    selectedLabel.style.fontSize = "13px";
    selectedLabel.style.fontWeight = "700";
    selectedLabel.style.color = result.isCorrect ? "#166534" : "#b91c1c";
    selectedLabel.style.marginBottom = "10px";

    const selectedText = document.createElement("div");
    selectedText.textContent = result.selectedAnswer || "No Answer";
    selectedText.style.fontSize = "18px";
    selectedText.style.fontWeight = "700";
    selectedText.style.color = "#111827";
    selectedText.style.wordBreak = "break-word";
    selectedText.style.lineHeight = "1.6";

    selectedBox.appendChild(selectedLabel);
    selectedBox.appendChild(selectedText);

    topRow.appendChild(questionBox);
    topRow.appendChild(selectedBox);

    const correctBox = document.createElement("div");
    correctBox.style.background = "#f0fdf4";
    correctBox.style.border = "1px solid #86efac";
    correctBox.style.borderRadius = "12px";
    correctBox.style.padding = "16px";

    const correctLabel = document.createElement("div");
    correctLabel.textContent = "정답";
    correctLabel.style.fontSize = "13px";
    correctLabel.style.fontWeight = "700";
    correctLabel.style.color = "#166534";
    correctLabel.style.marginBottom = "10px";

    const correctText = document.createElement("div");
    correctText.textContent = result.correctAnswer;
    correctText.style.fontSize = "18px";
    correctText.style.fontWeight = "700";
    correctText.style.color = "#111827";
    correctText.style.wordBreak = "break-word";
    correctText.style.lineHeight = "1.6";

    correctBox.appendChild(correctLabel);
    correctBox.appendChild(correctText);

    wrapper.appendChild(header);
    wrapper.appendChild(topRow);
    wrapper.appendChild(correctBox);

    return wrapper;
}

function renderResultPage() {
    const latest = getLatestSubmissionForTest();
    const scoreText = document.getElementById("score-text");
    const timeText = document.getElementById("time-text");
    const testNameText = document.getElementById("test-name-text");
    const container = document.getElementById("result-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "20px";
    container.style.marginTop = "24px";

    if (!latest) {
        if (scoreText) {
            scoreText.textContent = "결과를 찾을 수 없습니다.";
        }
        if (timeText) {
            timeText.textContent = "";
        }
        if (testNameText) {
            testNameText.textContent = resultViewTest;
        }

        const empty = document.createElement("div");
        empty.style.background = "#ffffff";
        empty.style.border = "2px solid #d1d5db";
        empty.style.borderRadius = "14px";
        empty.style.padding = "18px";
        empty.textContent = "아직 제출된 결과가 없습니다.";
        container.appendChild(empty);
        return;
    }

    if (scoreText) {
        scoreText.textContent = "점수: " + latest.score + " / " + latest.total;
    }

    if (timeText) {
        timeText.textContent = "소요 시간: " + formatTime(Number(latest.time || 0));
    }

    if (testNameText) {
        testNameText.textContent = latest.test;
    }

    const questionResults = latest.questionResults || [];

    if (questionResults.length === 0) {
        const empty = document.createElement("div");
        empty.style.background = "#ffffff";
        empty.style.border = "2px solid #d1d5db";
        empty.style.borderRadius = "14px";
        empty.style.padding = "18px";
        empty.textContent = "문제 결과가 없습니다.";
        container.appendChild(empty);
        return;
    }

    questionResults.forEach((result) => {
        container.appendChild(createQuestionCard(result));
    });
}

const resetButton = document.querySelector(".result-buttons button");
const currentUserForReset = localStorage.getItem("currentUser");
if (resetButton && currentUserForReset !== "seok" && currentUserForReset !== "hwang") {
    resetButton.style.display = "none";
}

function resetData() {
    const currentUser = localStorage.getItem("currentUser");

    if (currentUser !== "seok" && currentUser !== "hwang") {
        alert("관리자만 데이터 초기화를 할 수 있습니다.");
        return;
    }

    localStorage.clear();
    alert("데이터 초기화 완료");
    window.location.href = "home.html";
}

window.resetData = resetData;
renderResultPage();