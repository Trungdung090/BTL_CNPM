document.addEventListener('DOMContentLoaded', function() {
    // Xử lý chọn khung giờ
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            timeSlots.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');

            // Cập nhật giá trị cho input ẩn
            document.getElementById('selected_time').value = this.dataset.time;

            // Tính toán và hiển thị tổng giá
            calculateTotalPrice();
        });
    });

    // Xử lý chọn ngày
    const dateInput = document.getElementById('booking_date');
    dateInput.addEventListener('change', calculateTotalPrice);

    function calculateTotalPrice() {
        const selectedDate = dateInput.value;
        const selectedTime = document.querySelector('.time-slot.selected')?.dataset.time;

        if (selectedDate && selectedTime) {
            const pricePerHour = parseFloat(document.getElementById('price_per_hour').value);
            const hours = parseFloat(document.getElementById('booking_hours').value);
            const totalPrice = pricePerHour * hours;

            document.getElementById('total_price').textContent = totalPrice.toLocaleString('vi-VN') + ' VND';
            document.getElementById('total_price_input').value = totalPrice;
        }
    }
});