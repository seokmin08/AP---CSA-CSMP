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
    wrapper.style.borderRadius = "14px";
    wrapper.style.padding = "18px";
    wrapper.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";

    const title = document.createElement("h3");
    title.textContent = "Question " + result.questionNumber;
    title.style.margin = "0 0 12px 0";
    title.style.fontSize = "20px";
    title.style.color = "#111827";

    const status = document.createElement("p");
    status.style.margin = "0 0 12px 0";
    status.style.fontWeight = "700";
    status.style.color = result.isCorrect ? "#166534" : "#b91c1c";
    status.textContent = result.isCorrect ? "✅ 맞음" : "❌ 틀림";

    const question = document.createElement("pre");
    question.textContent = result.questionText;
    question.style.background = "#111827";
    question.style.color = "#e5e7eb";
    question.style.padding = "14px";
    question.style.borderRadius = "10px";
    question.style.whiteSpace = "pre-wrap";
    question.style.fontFamily = "monospace";
    question.style.fontSize = "14px";
    question.style.lineHeight = "1.6";
    question.style.margin = "0 0 12px 0";
    question.style.overflowX = "auto";

    const selected = document.createElement("p");
    selected.style.margin = "6px 0";
    selected.style.color = result.isCorrect ? "#166534" : "#b91c1c";
    selected.style.fontWeight = "600";
    selected.textContent = "내가 고른 답: " + (result.selectedAnswer || "No Answer");

    const correct = document.createElement("p");
    correct.style.margin = "6px 0";
    correct.style.color = "#166534";
    correct.style.fontWeight = "600";
    correct.textContent = "정답: " + result.correctAnswer;

    wrapper.appendChild(title);
    wrapper.appendChild(status);
    wrapper.appendChild(question);
    wrapper.appendChild(selected);
    wrapper.appendChild(correct);

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
    container.style.gap = "16px";
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