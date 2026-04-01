const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
const latest = submissions[submissions.length - 1];

function formatTime(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return min + ":" + sec;
}

if (latest) {
    const scoreText = document.getElementById("score-text");
    const timeText = document.getElementById("time-text");
    const testNameText = document.getElementById("test-name-text");
    const container = document.getElementById("result-list");

    if (scoreText) {
        scoreText.textContent = "점수: " + latest.score + " / " + latest.total;
    }

    if (timeText) {
        timeText.textContent = "소요 시간: " + formatTime(Number(latest.time));
    }

    if (testNameText) {
        testNameText.textContent = latest.test;
    }

    if (container) {
        container.innerHTML = "";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "16px";
        container.style.marginTop = "24px";
    }

    const wrongQuestions = latest.wrongQuestions || [];
    const questionResults = latest.questionResults || [];

    if (container) {
        if (wrongQuestions.length === 0) {
            const perfect = document.createElement("div");
            perfect.style.background = "#ecfdf5";
            perfect.style.border = "2px solid #22c55e";
            perfect.style.borderRadius = "14px";
            perfect.style.padding = "18px";
            perfect.style.fontWeight = "700";
            perfect.style.color = "#166534";
            perfect.textContent = "모든 문제를 맞혔습니다!";
            container.appendChild(perfect);
        } else {
            wrongQuestions.forEach((wrong) => {
                const detail = questionResults.find(q => q.questionNumber === wrong.questionNumber);

                const wrapper = document.createElement("div");
                wrapper.style.background = "#ffffff";
                wrapper.style.border = "2px solid #ef4444";
                wrapper.style.borderRadius = "14px";
                wrapper.style.padding = "18px";
                wrapper.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";

                const title = document.createElement("h3");
                title.textContent = "Question " + wrong.questionNumber;
                title.style.margin = "0 0 12px 0";
                title.style.fontSize = "20px";
                title.style.color = "#111827";

                const question = document.createElement("pre");
                question.textContent = wrong.questionText;
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
                selected.style.color = "#b91c1c";
                selected.style.fontWeight = "600";
                selected.textContent = "내가 고른 답: " + wrong.selectedAnswer;

                const correct = document.createElement("p");
                correct.style.margin = "6px 0";
                correct.style.color = "#166534";
                correct.style.fontWeight = "600";
                correct.textContent = "정답: " + wrong.correctAnswer;

                wrapper.appendChild(title);
                wrapper.appendChild(question);
                wrapper.appendChild(selected);
                wrapper.appendChild(correct);

                if (detail && detail.selectedAnswer && detail.correctAnswer) {
                    const fullSelected = document.createElement("p");
                    fullSelected.style.margin = "6px 0";
                    fullSelected.style.color = "#374151";
                    fullSelected.textContent = "선택한 보기 전체: " + detail.selectedAnswer;

                    const fullCorrect = document.createElement("p");
                    fullCorrect.style.margin = "6px 0";
                    fullCorrect.style.color = "#374151";
                    fullCorrect.textContent = "정답 보기 전체: " + detail.correctAnswer;

                    wrapper.appendChild(fullSelected);
                    wrapper.appendChild(fullCorrect);
                }

                container.appendChild(wrapper);
            });
        }
    }
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