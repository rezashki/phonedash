import { showWarningModal } from './utils.js'; // Assuming you have a utils.js with showWarningModal

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();

                if (response.ok) {
                    showWarningModal('ورود موفقیت‌آمیز بود!', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard.html'; // Redirect to dashboard
                    }, 1000);
                } else {
                    showWarningModal(result.error || 'نام کاربری یا رمز عبور اشتباه است.', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showWarningModal('خطای شبکه یا سرور.', 'error');
            }
        });
    }

    // Handle Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            if (password !== confirmPassword) {
                showWarningModal('رمزهای عبور با هم مطابقت ندارند.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();

                if (response.ok) {
                    showWarningModal('ثبت نام با موفقیت انجام شد! اکنون می‌توانید وارد شوید.', 'success');
                    setTimeout(() => {
                        window.location.href = '/login.html'; // Redirect to login page
                    }, 1500);
                } else {
                    showWarningModal(result.error || 'ثبت نام با شکست مواجه شد.', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showWarningModal('خطای شبکه یا سرور.', 'error');
            }
        });
    }
});
