let questions = [];
let currentQuestion = 0;
let selectedAnswer = null;
let seconds = 45 * 60;
let timerInterval = null;
let userAnswers = [];

async function loadQuestions() {
    try {
        const response = await fetch("../data/test2.json");
        questions = await response.json();

        userAnswers = new Array(questions.length).fill(null);

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
        submitTest();
        return;
    }

    currentQuestion++;
    loadQuestion();
}

function submitTest() {
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

    const elapsedTime = 30 * 60 - seconds;
    localStorage.setItem("test2Score", score);
    localStorage.setItem("test2Total", questions.length);
    localStorage.setItem("test2Time", elapsedTime);

    const submission = {
        user: currentUser,
        test: "Test 2",
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