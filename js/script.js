function login() {
    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    // 학생 계정
    if (
        (studentId === "30420" && password === "0221") ||
        (studentId === "30331" && password === "0906") ||
        (studentId === "30327" && password === "0731") ||
        (studentId === "20106" && password === "0516") ||
        (studentId === "99999" && password === "1234")
    ) {
        localStorage.setItem("currentUser", studentId);
        localStorage.setItem("currentRole", "student");
        window.location.href = "pages/home.html";
    }

    // 관리자 계정
    else if (
        (studentId === "hwang" && password === "0501") ||
        (studentId === "seok" && password === "0324")
    ) {
        localStorage.setItem("currentUser", studentId);
        localStorage.setItem("currentRole", "admin");
        window.location.href = "pages/admin.html";
    }

    else {
        message.textContent = "Invalid ID or password.";
    }
}
