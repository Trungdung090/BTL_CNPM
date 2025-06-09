document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const passwordStrength = document.createElement('div');
    passwordStrength.className = 'password-strength';
    passwordStrength.innerHTML = '<div class="password-strength-bar"></div>';
    passwordInput.parentNode.appendChild(passwordStrength);
    const strengthBar = passwordStrength.querySelector('.password-strength-bar');

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;

        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]/)) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

        const width = strength * 20;
        let color;

        if (strength <= 1) color = '#dc3545';
        else if (strength <= 3) color = '#ffc107';
        else color = '#28a745';

        strengthBar.style.width = width + '%';
        strengthBar.style.backgroundColor = color;

        // Kiểm tra mật khẩu trùng khớp
        if (confirmPasswordInput.value && password !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Mật khẩu không khớp');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });

    confirmPasswordInput.addEventListener('input', function() {
        if (this.value !== passwordInput.value) {
            this.setCustomValidity('Mật khẩu không khớp');
        } else {
            this.setCustomValidity('');
        }
    });
});