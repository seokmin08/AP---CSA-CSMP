function login() {
    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    const students = [
        { id: "30420", pw: "0221" },
        { id: "30331", pw: "0906" },
        { id: "30327", pw: "0731" },
        { id: "20106", pw: "0516" },
        { id: "99999", pw: "1234" }
    ];

    const isStudent = students.some(user => user.id === studentId && user.pw === password);

    if (isStudent) {
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
