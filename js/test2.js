import { db, collection, addDoc } from "./firebase.js";
const TEST_NAME = "Test 2";
const TEST_DURATION_SECONDS = 45 * 60;
let questions = [];
let currentQuestion = 0;
let selectedAnswer = null;
let seconds = TEST_DURATION_SECONDS;
let timerInterval = null;
let userAnswers = [];

function getCurrentUser() {
    return localStorage.getItem("currentUser") || "unknown";
}

function getProgressKey() {
    return `progress_${getCurrentUser()}_${TEST_NAME}`;
}

function saveProgress() {
    const progress = {
        currentQuestion: currentQuestion,
        userAnswers: [...userAnswers],
        seconds: seconds,
        savedAt: new Date().toLocaleString()
    };

    localStorage.setItem(getProgressKey(), JSON.stringify(progress));
}

function restoreProgress() {
    const saved = JSON.parse(localStorage.getItem(getProgressKey()));

    if (!saved) {
        return;
    }

    if (Array.isArray(saved.userAnswers) && saved.userAnswers.length === questions.length) {
        userAnswers = saved.userAnswers;
    }

    if (typeof saved.currentQuestion === "number" && saved.currentQuestion >= 0 && saved.currentQuestion < questions.length) {
        currentQuestion = saved.currentQuestion;
    }

    if (typeof saved.seconds === "number" && saved.seconds > 0) {
        seconds = saved.seconds;
    }
}

function clearProgress() {
    localStorage.removeItem(getProgressKey());
}

async function loadQuestions() {
    try {
        const response = await fetch("../data/test2.json");
        questions = await response.json();

        userAnswers = new Array(questions.length).fill(null);
        restoreProgress();

        loadQuestion();
        startTimer();
    } catch (error) {
        console.error("Failed to load questions:", error);
        document.getElementById("question-text").textContent =
            "문제를 불러오지 못했습니다.";
    }
}

function loadQuestion() {
    const q = questions[currentQuestion];

    document.getElementById("question-number").textContent =
        "Question " + (currentQuestion + 1);

    document.getElementById("question-text").textContent = q.question;

    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";

    const frqContainer = document.getElementById("frq-container");
    const frqInput = document.getElementById("frq-answer");

    // FRQ vs MCQ handling
    if (q.choices.length === 0 || q.answer === "FRQ") {
        // Show FRQ, hide choices
        choicesDiv.style.display = "none";
        frqContainer.style.display = "block";

        // Load saved answer if exists
        frqInput.value = userAnswers[currentQuestion] || "";

        selectedAnswer = frqInput.value || null;

        // Save on typing
        frqInput.oninput = function () {
            const val = frqInput.value.trim();
            userAnswers[currentQuestion] = val;
            selectedAnswer = val || null;
            saveProgress();
        };
    } else {
        // Show choices, hide FRQ
        choicesDiv.style.display = "block";
        frqContainer.style.display = "none";
        frqInput.value = "";

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
                saveProgress();
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
    saveProgress();
    loadQuestion();
}

async function nextQuestion() {
    const q = questions[currentQuestion];

    if ((q.choices.length === 0 || q.answer === "FRQ")) {
        const frqInput = document.getElementById("frq-answer");
        if (!frqInput.value.trim()) {
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
        await submitTest();
        return;
    }

    currentQuestion++;
    saveProgress();
    loadQuestion();
}

async function submitTest() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    let score = 0;
    const currentUser = getCurrentUser();
    const wrongQuestions = [];
    const questionResults = [];

    for (let i = 0; i < questions.length; i++) {
        const selected = userAnswers[i];
        const correct = questions[i].answer;
        const selectedOption = selected ? selected.charAt(0) : "No Answer";
        const correctOption = correct.charAt(0);
        const isCorrect = selected === correct;

        questionResults.push({
            questionNumber: i + 1,
            selectedAnswer: selected,
            correctAnswer: correct,
            selectedOption: selectedOption,
            correctOption: correctOption,
            isCorrect: isCorrect,
            questionText: questions[i].question
        });

        if (isCorrect) {
            score++;
        } else {
            wrongQuestions.push({
                questionNumber: i + 1,
                selectedAnswer: selectedOption,
                correctAnswer: correctOption,
                questionText: questions[i].question
            });
        }
    }

    const elapsedTime = TEST_DURATION_SECONDS - seconds;
    localStorage.setItem("test2Score", score);
    localStorage.setItem("test2Total", questions.length);
    localStorage.setItem("test2Time", elapsedTime);

    const submission = {
        user: currentUser,
        test: TEST_NAME,
        score: score,
        total: questions.length,
        time: elapsedTime,
        answers: [...userAnswers],
        questionResults: questionResults,
        wrongQuestions: wrongQuestions,
        submittedAt: new Date().toLocaleString()
    };

    let submissions = JSON.parse(localStorage.getItem("submissions")) || [];
    submissions.push(submission);
    localStorage.setItem("submissions", JSON.stringify(submissions));

    try {
        await addDoc(collection(db, "submissions"), {
            ...submission,
            createdAt: new Date().toISOString()
        });
        console.log("Firebase 저장 완료");
    } catch (error) {
        console.error("Firebase 저장 실패:", error);
    }

    let studentHistory = JSON.parse(localStorage.getItem("studentHistory")) || {};

    if (!studentHistory[currentUser]) {
        studentHistory[currentUser] = [];
    }

    studentHistory[currentUser].push(submission);
    localStorage.setItem("studentHistory", JSON.stringify(studentHistory));

    clearProgress();

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
        saveProgress();

        if (seconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById("timer").textContent = "00:00";
            submitTest();
        }
    }, 1000);
}

window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.submitTest = submitTest;

loadQuestions();