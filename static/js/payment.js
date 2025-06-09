document.addEventListener('DOMContentLoaded', function() {
    // Xử lý chọn phương thức thanh toán
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('payment_method').value = this.dataset.method;
        });
    });

    // Xử lý nút thanh toán
    const payButton = document.getElementById('pay-button');
    if (payButton) {
        payButton.addEventListener('click', function(e) {
            e.preventDefault();

            if (!document.querySelector('.payment-method.selected')) {
                alert('Vui lòng chọn phương thức thanh toán');
                return;
            }

            // Hiển thị loading
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';
            this.disabled = true;

            // Giả lập quá trình thanh toán
            setTimeout(function() {
                alert('Thanh toán thành công! Đơn của bạn đã được duyệt.');
                window.location.href = '/payment-success';
            }, 2000);
        });
    }
});