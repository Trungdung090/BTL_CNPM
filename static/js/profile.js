document.addEventListener('DOMContentLoaded', function() {
    // Password strength indicator
    const newPasswordInput = document.getElementById('new_password');
    const progressBar = document.querySelector('.progress-bar');
    const strengthText = document.querySelector('.strength-text');

    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;

            // Length check
            if (password.length >= 8) strength += 1;
            // Contains lowercase
            if (password.match(/[a-z]/)) strength += 1;
            // Contains uppercase
            if (password.match(/[A-Z]/)) strength += 1;
            // Contains number
            if (password.match(/[0-9]/)) strength += 1;
            // Contains special char
            if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

            // Update progress bar
            const width = strength * 20;
            let color, text;

            if (strength <= 1) {
                color = '#dc3545';
                text = 'Yếu';
            } else if (strength <= 3) {
                color = '#ffc107';
                text = 'Trung bình';
            } else {
                color = '#28a745';
                text = 'Mạnh';
            }

            progressBar.style.width = width + '%';
            progressBar.style.backgroundColor = color;
            strengthText.textContent = 'Độ mạnh mật khẩu: ' + text;
        });
    }

    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirm_password');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const newPassword = document.getElementById('new_password').value;
            if (this.value !== newPassword) {
                this.setCustomValidity('Mật khẩu không khớp');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Cancel booking confirmation modal
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');

    cancelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const cancelUrl = this.getAttribute('href');
            confirmCancelBtn.setAttribute('href', cancelUrl);
            cancelModal.show();
        });
    });

    // Form submissions
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            // You can add additional validation here
            // For demo, we'll just show a success message
            flashMessage('Cập nhật thông tin thành công!', 'success');
        });
    }

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            // You can add additional validation here
            // For demo, we'll just show a success message
            flashMessage('Đổi mật khẩu thành công!', 'success');
        });
    }

    // Helper function to show flash messages
    function flashMessage(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.profile-container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 5000);
    }
});