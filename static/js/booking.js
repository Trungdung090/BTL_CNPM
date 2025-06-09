document.addEventListener('DOMContentLoaded', function() {
    const hoursInput = document.getElementById('booking_hours');
    const decrementBtn = document.getElementById('decrement-hour');
    const incrementBtn = document.getElementById('increment-hour');
    const timeSlots = document.querySelectorAll('.time-slot');
    const dateInput = document.getElementById('booking_date');
    const pricePerHour = parseFloat(document.getElementById('price_per_hour').value);

    // Xử lý chọn khung giờ
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            timeSlots.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('selected_time').value = this.dataset.time;
            calculateTotalPrice();    // Tính toán và hiển thị tổng giá
        });
    });

    // Xử lý chọn ngày
    dateInput.addEventListener('change', calculateTotalPrice);

    // Hàm tính toán tổng giá
    function calculateTotalPrice() {
        const hours = parseInt(hoursInput.value);
        const totalPrice = pricePerHour * hours;

        // Hiển thị tổng giá với định dạng tiền tệ Việt Nam
        document.getElementById('total_price').textContent =
            totalPrice.toLocaleString('vi-VN') + ' VND';
        document.getElementById('total_price_input').value = totalPrice;

        // Cập nhật end_time nếu có thời gian bắt đầu được chọn
        const selectedTime = document.querySelector('.time-slot.selected')?.dataset.time;
        if (selectedTime) {
            updateEndTime(selectedTime, hours);
        }
    }

    // Hàm cập nhật thời gian kết thúc
    function updateEndTime(startTime, hours) {
        if (!startTime) return;

        const [startHour, startMinute] = startTime.split(':').map(Number);
        let endHour = startHour + hours;

        // Xử lý trường hợp qua ngày (ví dụ: 23h + 2h = 1h)
        if (endHour >= 24) {
            endHour -= 24;
        }
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        document.getElementById('end_time').value = endTime;
    }
});