document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const role = loginForm.role.value;

            const result = db.login(username, password, role);

            if (result.success) {
                // Redirect based on role
                if (role === 'faculty') {
                    window.location.href = 'faculty/faculty-dashboard.html';
                } else {
                    window.location.href = 'student/student-dashboard.html';
                }
            } else {
                errorMsg.textContent = result.message;
                errorMsg.style.display = 'block';
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = registerForm.role.value;
            const name = registerForm.name.value;
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const errorMsg = document.getElementById('errorMsg');
            const successMsg = document.getElementById('successMsg');

            const result = db.registerUser(name, username, password, role);

            if (result.success) {
                errorMsg.style.display = 'none';
                successMsg.textContent = 'Registration successful! Redirecting to login...';
                successMsg.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 800);
            } else {
                successMsg.style.display = 'none';
                errorMsg.textContent = result.message;
                errorMsg.style.display = 'block';
            }
        });
    }
});
