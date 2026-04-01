import { db, collection, getDocs } from "./firebase.js";
const table = document.getElementById("submission-table");
let submissions = [];

function formatTime(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return min + ":" + sec;
}

function updateSummary() {
    const totalSubmissionsEl = document.getElementById("total-submissions");
    const averageScoreEl = document.getElementById("average-score");
    const highestScoreEl = document.getElementById("highest-score");
    const lowestScoreEl = document.getElementById("lowest-score");

    if (!totalSubmissionsEl || !averageScoreEl || !highestScoreEl || !lowestScoreEl) {
        return;
    }

    if (submissions.length === 0) {
        totalSubmissionsEl.textContent = "0";
        averageScoreEl.textContent = "0 / 0";
        highestScoreEl.textContent = "0 / 0";
        lowestScoreEl.textContent = "0 / 0";
        return;
    }

    const totalSubmissions = submissions.length;
    const totalPossible = submissions[0].total;

    let scoreSum = 0;
    let highest = submissions[0].score;
    let lowest = submissions[0].score;

    submissions.forEach(sub => {
        scoreSum += sub.score;
        if (sub.score > highest) {
            highest = sub.score;
        }
        if (sub.score < lowest) {
            lowest = sub.score;
        }
    });

    const average = (scoreSum / totalSubmissions).toFixed(1);

    totalSubmissionsEl.textContent = totalSubmissions;
    averageScoreEl.textContent = `${average} / ${totalPossible}`;
    highestScoreEl.textContent = `${highest} / ${totalPossible}`;
    lowestScoreEl.textContent = `${lowest} / ${totalPossible}`;
}

function renderSubmissionTable() {
    if (!table) {
        return;
    }
    table.innerHTML = "";

    const sortedSubs = [...submissions].sort((a, b) => b.score - a.score);
    sortedSubs.forEach(sub => {
        const row = document.createElement("tr");

        let wrongText = "";
        if (!sub.wrongQuestions || sub.wrongQuestions.length === 0) {
            wrongText = `<div class="wrong-item">오답 없음</div>`;
        } else {
            wrongText = sub.wrongQuestions.map(w =>
                `<div class="wrong-item">Q${w.questionNumber} · 고른 답: ${w.selectedAnswer} · 정답: ${w.correctAnswer}</div>`
            ).join("");
        }

        row.innerHTML = `
            <td>${sub.user}</td>
            <td>${sub.test}</td>
            <td>${sub.score} / ${sub.total}</td>
            <td>${formatTime(sub.time)}</td>
            <td class="wrong-cell">${wrongText}</td>
        `;

        table.appendChild(row);
    });
}

function getQuestionStats() {
    const stats = {};

    submissions.forEach(sub => {
        if (!sub.questionResults) {
            return;
        }

        sub.questionResults.forEach(result => {
            const qNum = result.questionNumber;

            if (!stats[qNum]) {
                stats[qNum] = {
                    questionNumber: qNum,
                    correctOption: result.correctOption,
                    total: 0,
                    correctCount: 0,
                    options: {
                        A: 0,
                        B: 0,
                        C: 0,
                        D: 0,
                        "No Answer": 0
                    }
                };
            }

            stats[qNum].total++;

            if (result.isCorrect) {
                stats[qNum].correctCount++;
            }

            const option = result.selectedOption || "No Answer";
            if (stats[qNum].options[option] === undefined) {
                stats[qNum].options[option] = 0;
            }
            stats[qNum].options[option]++;
        });
    });

    return Object.values(stats).sort((a, b) => a.questionNumber - b.questionNumber);
}

function getMostMissedOption(questionStat) {
    let mostMissedOption = "없음";
    let mostMissedCount = 0;

    Object.entries(questionStat.options).forEach(([option, count]) => {
        if (option !== questionStat.correctOption && count > mostMissedCount) {
            mostMissedOption = option;
            mostMissedCount = count;
        }
    });

    if (mostMissedCount === 0) {
        return "없음";
    }

    return `${mostMissedOption} (${mostMissedCount}명)`;
}

function renderQuestionStats() {
    const oldSection = document.getElementById("question-stats-section");
    if (oldSection) oldSection.remove();
    const questionStats = getQuestionStats();
    const section = document.createElement("div");
    section.id = "question-stats-section";
    section.style.marginTop = "30px";

    const title = document.createElement("h2");
    title.textContent = "문항별 통계";
    section.appendChild(title);

    if (questionStats.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "아직 제출된 시험 결과가 없습니다.";
        section.appendChild(empty);
        document.body.appendChild(section);
        return;
    }

    const statsTable = document.createElement("table");
    statsTable.style.width = "100%";
    statsTable.style.marginTop = "15px";
    statsTable.style.textAlign = "left";

    statsTable.innerHTML = `
        <thead>
            <tr>
                <th>문항</th>
                <th>A 선택</th>
                <th>B 선택</th>
                <th>C 선택</th>
                <th>D 선택</th>
                <th>정답</th>
                <th>정답률</th>
                <th>가장 많이 틀린 보기</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = statsTable.querySelector("tbody");

    questionStats.forEach(stat => {
        const accuracy = ((stat.correctCount / stat.total) * 100).toFixed(1);
        const row = document.createElement("tr");
        let color = "#111827";
        if (Number(accuracy) >= 80) {
            color = "#16a34a";
        } else if (Number(accuracy) <= 50) {
            color = "#dc2626";
        }
        row.innerHTML = `
            <td>Q${stat.questionNumber}</td>
            <td>${stat.options.A || 0}</td>
            <td>${stat.options.B || 0}</td>
            <td>${stat.options.C || 0}</td>
            <td>${stat.options.D || 0}</td>
            <td>${stat.correctOption}</td>
            <td style="color:${color}; font-weight:bold;">${accuracy}%</td>
            <td>${getMostMissedOption(stat)}</td>
        `;

        tbody.appendChild(row);
    });

    section.appendChild(statsTable);
    document.body.appendChild(section);
}

function renderHardestQuestions() {
    const oldSection = document.getElementById("hardest-questions-section");
    if (oldSection) oldSection.remove();
    const stats = getQuestionStats();

    if (stats.length === 0) {
        return;
    }

    const sorted = [...stats].sort((a, b) =>
        (a.correctCount / a.total) - (b.correctCount / b.total)
    );

    const top3 = sorted.slice(0, 3);
    const section = document.createElement("div");
    section.id = "hardest-questions-section";
    section.style.marginTop = "30px";

    const title = document.createElement("h2");
    title.textContent = "가장 어려운 문제 TOP 3";
    section.appendChild(title);

    const list = document.createElement("div");

    top3.forEach(q => {
        const acc = ((q.correctCount / q.total) * 100).toFixed(1);
        const item = document.createElement("p");
        item.textContent = `Q${q.questionNumber} - 정답률 ${acc}%`;
        list.appendChild(item);
    });

    section.appendChild(list);
    document.body.appendChild(section);
}

function renderFrqGrading() {
    const oldSection = document.getElementById("frq-grading-section");
    if (oldSection) oldSection.remove();
    const frqSubs = submissions.filter(sub =>
        sub.questionResults && sub.questionResults.some(result => result.correctAnswer === "FRQ")
    );
    const section = document.createElement("div");
    section.id = "frq-grading-section";
    section.style.marginTop = "30px";

    const title = document.createElement("h2");
    title.textContent = "FRQ 채점";
    section.appendChild(title);

    if (frqSubs.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "제출된 FRQ 답안이 없습니다.";
        section.appendChild(empty);
        document.body.appendChild(section);
        return;
    }

    frqSubs.forEach((sub, subIndex) => {
        const card = document.createElement("div");
        card.style.background = "#ffffff";
        card.style.border = "1px solid #e5e7eb";
        card.style.borderRadius = "14px";
        card.style.padding = "20px";
        card.style.marginTop = "16px";
        card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";

        const header = document.createElement("h3");
        header.textContent = `${sub.user} · ${sub.test}`;
        header.style.marginTop = "0";
        card.appendChild(header);

        const frqResults = sub.questionResults.filter(result => result.correctAnswer === "FRQ");

        frqResults.forEach((result) => {
            const block = document.createElement("div");
            block.style.marginTop = "18px";
            block.style.paddingTop = "18px";
            block.style.borderTop = "1px solid #e5e7eb";

            const qTitle = document.createElement("h4");
            qTitle.textContent = `Q${result.questionNumber}`;
            qTitle.style.margin = "0 0 10px 0";

            const questionBox = document.createElement("pre");
            questionBox.textContent = result.questionText;
            questionBox.style.background = "#111827";
            questionBox.style.color = "#e5e7eb";
            questionBox.style.padding = "14px";
            questionBox.style.borderRadius = "10px";
            questionBox.style.whiteSpace = "pre-wrap";
            questionBox.style.fontFamily = "monospace";
            questionBox.style.fontSize = "14px";
            questionBox.style.lineHeight = "1.6";
            questionBox.style.margin = "0 0 12px 0";

            const answerLabel = document.createElement("p");
            answerLabel.textContent = "학생 답안";
            answerLabel.style.fontWeight = "bold";
            answerLabel.style.margin = "0 0 8px 0";

            const answerBox = document.createElement("pre");
            answerBox.textContent = result.selectedAnswer || "No Answer";
            answerBox.style.background = "#f9fafb";
            answerBox.style.color = "#111827";
            answerBox.style.padding = "14px";
            answerBox.style.borderRadius = "10px";
            answerBox.style.whiteSpace = "pre-wrap";
            answerBox.style.fontFamily = "monospace";
            answerBox.style.fontSize = "14px";
            answerBox.style.lineHeight = "1.6";
            answerBox.style.margin = "0 0 12px 0";
            answerBox.style.border = "1px solid #d1d5db";

            const gradeRow = document.createElement("div");
            gradeRow.style.display = "flex";
            gradeRow.style.alignItems = "center";
            gradeRow.style.gap = "10px";
            gradeRow.style.flexWrap = "wrap";

            const scoreLabel = document.createElement("label");
            scoreLabel.textContent = "점수:";
            scoreLabel.style.fontWeight = "bold";

            const scoreInput = document.createElement("input");
            scoreInput.type = "number";
            scoreInput.min = "0";
            scoreInput.max = "5";
            scoreInput.step = "1";
            scoreInput.style.width = "90px";
            scoreInput.style.padding = "8px";
            scoreInput.style.borderRadius = "8px";
            scoreInput.style.border = "1px solid #d1d5db";

            const existingScore = sub.frqScores && sub.frqScores[result.questionNumber] !== undefined
                ? sub.frqScores[result.questionNumber]
                : "";
            scoreInput.value = existingScore;

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "저장";
            saveBtn.style.padding = "8px 12px";
            saveBtn.style.border = "none";
            saveBtn.style.borderRadius = "8px";
            saveBtn.style.background = "#2563eb";
            saveBtn.style.color = "white";
            saveBtn.style.cursor = "pointer";

            const status = document.createElement("span");
            status.style.fontSize = "14px";
            status.style.color = "#16a34a";

            saveBtn.onclick = function () {
                const raw = scoreInput.value.trim();
                if (raw === "") {
                    alert("점수를 입력하세요.");
                    return;
                }

                const score = Number(raw);
                if (Number.isNaN(score) || score < 0 || score > 5) {
                    alert("점수는 0점부터 5점 사이여야 합니다.");
                    return;
                }

                if (!submissions[subIndex].frqScores) {
                    submissions[subIndex].frqScores = {};
                }
                submissions[subIndex].frqScores[result.questionNumber] = score;
                localStorage.setItem("submissions", JSON.stringify(submissions));
                status.textContent = "저장됨";
            };

            gradeRow.appendChild(scoreLabel);
            gradeRow.appendChild(scoreInput);
            gradeRow.appendChild(saveBtn);
            gradeRow.appendChild(status);

            block.appendChild(qTitle);
            block.appendChild(questionBox);
            block.appendChild(answerLabel);
            block.appendChild(answerBox);
            block.appendChild(gradeRow);
            card.appendChild(block);
        });

        section.appendChild(card);
    });

    document.body.appendChild(section);
}

// ===== Admin Reset Button =====
const currentUser = localStorage.getItem("currentUser");

if (currentUser === "seok" || currentUser === "hwang") {
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset All Data";

    resetBtn.style.marginTop = "20px";
    resetBtn.style.padding = "10px 16px";
    resetBtn.style.borderRadius = "8px";
    resetBtn.style.border = "none";
    resetBtn.style.background = "#ef4444";
    resetBtn.style.color = "white";
    resetBtn.style.fontWeight = "bold";
    resetBtn.style.cursor = "pointer";

    resetBtn.onclick = function () {
        if (confirm("정말로 모든 데이터를 삭제하시겠습니까?")) {
            const adminUser = localStorage.getItem("currentUser");
            localStorage.clear();
            if (adminUser) {
                localStorage.setItem("currentUser", adminUser);
            }
            alert("로컬 데이터 초기화 완료 (Firebase 데이터는 유지됩니다).");
            window.location.reload();
        }
    };

    document.body.appendChild(resetBtn);
}

async function loadAdminData() {
    try {
        const snapshot = await getDocs(collection(db, "submissions"));
        submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Firebase 불러오기 실패:", error);
        submissions = JSON.parse(localStorage.getItem("submissions")) || [];
    }

    renderSubmissionTable();
    updateSummary();
    renderQuestionStats();
    renderHardestQuestions();
    renderFrqGrading();
}

loadAdminData();