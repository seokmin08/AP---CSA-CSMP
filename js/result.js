const score = localStorage.getItem("test1Score");
const total = localStorage.getItem("test1Total");
const time = localStorage.getItem("test1Time");

function formatTime(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return min + ":" + sec;
}

document.getElementById("score-text").textContent =
    "Your Score: " + score + " / " + total;

document.getElementById("time-text").textContent =
    "Time Used: " + formatTime(Number(time));

// Load latest submission and display detailed results
const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
const latest = submissions[submissions.length - 1];

if (latest && latest.questionResults) {
    const container = document.getElementById("result-list") || document.body;
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";
    container.style.marginTop = "24px";

    latest.questionResults.forEach((q) => {
        const wrapper = document.createElement("div");
        wrapper.style.background = "#ffffff";
        wrapper.style.border = q.isCorrect ? "2px solid #22c55e" : "2px solid #ef4444";
        wrapper.style.borderRadius = "14px";
        wrapper.style.padding = "18px";
        wrapper.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.marginBottom = "12px";

        const title = document.createElement("h3");
        title.textContent = "Question " + q.questionNumber;
        title.style.margin = "0";
        title.style.fontSize = "20px";
        title.style.color = "#111827";

        const status = document.createElement("span");
        status.textContent = q.isCorrect ? "Correct" : "Incorrect";
        status.style.fontWeight = "700";
        status.style.fontSize = "14px";
        status.style.padding = "6px 10px";
        status.style.borderRadius = "999px";
        status.style.color = "#ffffff";
        status.style.background = q.isCorrect ? "#22c55e" : "#ef4444";

        const question = document.createElement("pre");
        question.textContent = q.questionText;
        question.style.background = "#111827";
        question.style.color = "#e5e7eb";
        question.style.padding = "14px";
        question.style.borderRadius = "10px";
        question.style.whiteSpace = "pre-wrap";
        question.style.fontFamily = "monospace";
        question.style.fontSize = "14px";
        question.style.lineHeight = "1.6";
        question.style.margin = "0";
        question.style.overflowX = "auto";

        header.appendChild(title);
        header.appendChild(status);

        wrapper.appendChild(header);
        wrapper.appendChild(question);

        container.appendChild(wrapper);
    });
}

const resetButton = document.querySelector('.result-buttons button');
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