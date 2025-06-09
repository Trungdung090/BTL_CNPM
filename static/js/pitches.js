document.addEventListener('DOMContentLoaded', function() {
    // Hiệu ứng hover cho card
    document.querySelectorAll('.pitch-card-vertical').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
});