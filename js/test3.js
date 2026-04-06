import { db, collection, addDoc } from "./firebase.js";
let questions = [];
let currentQuestion = 0;
let selectedAnswer = null;
let seconds = 25 * 60;
let timerInterval = null;
let userAnswers = [];
let warningCount = 0;
let examLocked = false;
let examStarted = false;

function enterFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) {
        return Promise.resolve();
    }
    if (el.requestFullscreen) {
        return el.requestFullscreen();
    }
    return Promise.resolve();
}

function updateWarningCount() {
    const label = document.getElementById("exam-warning-count");
    if (label) {
        label.textContent = "Warnings: " + warningCount;
    }
}

function lockExam(reason) {
    if (!examStarted) {
        return;
    }
    examLocked = true;
    warningCount++;
    updateWarningCount();

    const overlay = document.getElementById("exam-lock-overlay");
    if (overlay) {
        overlay.style.display = "flex";
    }

    if (warningCount >= 3) {
        alert("경고가 3회 누적되어 시험이 자동 제출됩니다.");
        submitTest();
        return;
    }

    if (reason) {
        console.warn("Exam warning:", reason);
    }
}

function unlockExam() {
    examLocked = false;
    const overlay = document.getElementById("exam-lock-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

function setupExamSecurity() {
    const resumeBtn = document.getElementById("resume-exam-btn");
    if (resumeBtn) {
        resumeBtn.onclick = async function () {
            await enterFullscreen();
            if (document.visibilityState === "visible") {
                unlockExam();
            }
        };
    }

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible") {
            lockExam("Tab switched");
        }
    });

    window.addEventListener("blur", function () {
        lockExam("Window lost focus");
    });

    document.addEventListener("fullscreenchange", function () {
        if (examStarted && !document.fullscreenElement) {
            lockExam("Exited fullscreen");
        }
    });

    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });

    document.addEventListener("copy", function (e) {
        e.preventDefault();
    });

    document.addEventListener("cut", function (e) {
        e.preventDefault();
    });

    document.addEventListener("paste", function (e) {
        e.preventDefault();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "F12" || (e.ctrlKey && ["c", "v", "x", "u", "p", "s"].includes(e.key.toLowerCase()))) {
            e.preventDefault();
        }
        if (e.altKey && e.key === "Tab") {
            e.preventDefault();
        }
    });
}

async function loadQuestions() {
    try {
        const response = await fetch("../data/test3.json");
        questions = await response.json();

        userAnswers = new Array(questions.length).fill(null);

        loadQuestion();
        setupExamSecurity();
        updateWarningCount();
        examStarted = true;
        await enterFullscreen();
        startTimer();
    } catch (error) {
        console.error("Failed to load questions:", error);
        document.getElementById("question-text").textContent = "문제를 불러오지 못했습니다.";
    }
}

function loadQuestion() {
    const q = questions[currentQuestion];

    document.getElementById("question-number").textContent = "Question " + (currentQuestion + 1);
    document.getElementById("question-text").textContent = q.question;

    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";

    const frqContainer = document.getElementById("frq-container");
    const frqInput = document.getElementById("frq-answer");

    if (q.choices.length === 0 || q.answer === "FRQ" || q.answer === "") {
        choicesDiv.style.display = "none";
        if (frqContainer) {
            frqContainer.style.display = "block";
        }

        if (frqInput) {
            frqInput.value = userAnswers[currentQuestion] || "";
            selectedAnswer = frqInput.value || null;
            frqInput.oninput = function () {
                const val = frqInput.value.trim();
                userAnswers[currentQuestion] = val;
                selectedAnswer = val || null;
            };
        }
    } else {
        choicesDiv.style.display = "block";
        if (frqContainer) {
            frqContainer.style.display = "none";
        }
        if (frqInput) {
            frqInput.value = "";
        }

        selectedAnswer = userAnswers[currentQuestion];

        for (let i = 0; i < q.choices.length; i++) {
            const choice = q.choices[i];
            const btn = document.createElement("button");
            btn.className = "choice-btn";
            btn.textContent = choice;

            if (userAnswers[currentQuestion] === choice) {
                btn.classList.add("selected");
            }

            btn.onclick = function () {
                selectedAnswer = choice;
                userAnswers[currentQuestion] = choice;

                const allButtons = document.querySelectorAll(".choice-btn");
                allButtons.forEach(button => button.classList.remove("selected"));

                btn.classList.add("selected");
            };

            choicesDiv.appendChild(btn);
        }
    }

    const nextBtn = document.getElementById("next-btn");
    if (currentQuestion === questions.length - 1) {
        nextBtn.textContent = "Submit";
    } else {
        nextBtn.textContent = "Next";
    }

    const prevBtn = document.getElementById("prev-btn");
    if (prevBtn) {
        prevBtn.disabled = currentQuestion === 0;
    }
}

function prevQuestion() {
    if (currentQuestion === 0) {
        return;
    }

    currentQuestion--;
    loadQuestion();
}

function nextQuestion() {
    const q = questions[currentQuestion];

    if (q.choices.length === 0 || q.answer === "FRQ" || q.answer === "") {
        const frqInput = document.getElementById("frq-answer");
        if (!frqInput || !frqInput.value.trim()) {
            alert("Please write your answer first.");
            return;
        }
    } else {
        if (selectedAnswer === null) {
            alert("Please select an answer first.");
            return;
        }
    }

    if (currentQuestion === questions.length - 1) {
        submitTest();
        return;
    }

    currentQuestion++;
    loadQuestion();
}

async function submitTest() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    let score = 0;
    const currentUser = localStorage.getItem("currentUser") || "unknown";
    const wrongQuestions = [];
    const questionResults = [];

    for (let i = 0; i < questions.length; i++) {
        const selected = userAnswers[i];
        const correct = questions[i].answer;
        const isFrq = questions[i].choices.length === 0 || correct === "FRQ" || correct === "";
        const selectedOption = isFrq ? "FRQ" : (selected ? selected.charAt(0) : "No Answer");
        const correctOption = isFrq ? "FRQ" : correct.charAt(0);
        const isCorrect = isFrq ? false : selected === correct;

        questionResults.push({
            questionNumber: i + 1,
            selectedAnswer: selected,
            correctAnswer: correct,
            selectedOption: selectedOption,
            correctOption: correctOption,
            isCorrect: isCorrect,
            questionText: questions[i].question
        });

        if (!isFrq && isCorrect) {
            score++;
        } else if (!isFrq) {
            wrongQuestions.push({
                questionNumber: i + 1,
                selectedAnswer: selectedOption,
                correctAnswer: correctOption,
                questionText: questions[i].question
            });
        }
    }

    const elapsedTime = 25 * 60 - seconds;
    localStorage.setItem("test3Score", score);
    localStorage.setItem("test3Total", questions.length);
    localStorage.setItem("test3Time", elapsedTime);

    const submission = {
        user: currentUser,
        test: "Test 3",
        score: score,
        total: questions.length,
        time: elapsedTime,
        answers: [...userAnswers],
        questionResults: questionResults,
        wrongQuestions: wrongQuestions,
        warningCount: warningCount,
        submittedAt: new Date().toLocaleString()
    };

    let submissions = JSON.parse(localStorage.getItem("submissions")) || [];
    submissions.push(submission);
    localStorage.setItem("submissions", JSON.stringify(submissions));

    localStorage.setItem(`submitted_${currentUser}_Test 3`, "true");

    try {
        await addDoc(collection(db, "submissions"), {
            ...submission,
            createdAt: new Date().toISOString()
        });
        console.log("Firebase 저장 완료");
    } catch (error) {
        console.error("Firebase 저장 실패:", error);
    }

    window.location.href = "result.html";
}

function startTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
    }

    const initialMinutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const initialSeconds = String(seconds % 60).padStart(2, "0");
    document.getElementById("timer").textContent = initialMinutes + ":" + initialSeconds;

    timerInterval = setInterval(function () {
        seconds--;

        const min = String(Math.floor(seconds / 60)).padStart(2, "0");
        const sec = String(seconds % 60).padStart(2, "0");

        document.getElementById("timer").textContent = min + ":" + sec;

        if (seconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById("timer").textContent = "00:00";
            submitTest();
        }
    }, 1000);
}

loadQuestions();