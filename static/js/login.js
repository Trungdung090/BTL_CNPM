document.addEventListener('DOMContentLoaded', function() {
    // Tự động phát hiện email hoặc số điện thoại
    const emailOrPhoneInput = document.getElementById('email_or_phone');

    emailOrPhoneInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (/^\d+$/.test(value)) {
            this.setAttribute('type', 'tel');
        } else if (value.includes('@')) {
            this.setAttribute('type', 'email');
        } else {
            this.setAttribute('type', 'text');
        }
    });

    // Xử lý nút "Quên mật khẩu"
    const forgotPasswordLink = document.querySelector('a[href="#"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.');
        });
    }
});