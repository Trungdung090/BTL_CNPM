document.addEventListener('DOMContentLoaded', function() {
    function showAlert(message, type, elementId = 'pitchActionAlert', messageId = 'pitchActionMessage') {
        const alertElement = document.getElementById(elementId);
        const messageElement = document.getElementById(messageId);

        if (alertElement && messageElement) {
            alertElement.className = `alert alert-${type}`;
            messageElement.textContent = message;
            alertElement.classList.remove('d-none');

            // Auto hide after 5 seconds
            setTimeout(() => {
                alertElement.classList.add('d-none');
            }, 5000);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    function createPitchTableRow(pitch) {
        return `
            <tr data-pitch-id="${pitch.id}">
                <td>${pitch.id}</td>
                <td>${pitch.name}</td>
                <td>${pitch.address}</td>
                <td>${formatPrice(pitch.price)} VND/giờ</td>
                <td>
                    <span class="badge bg-${pitch.is_active ? 'success' : 'secondary'}">
                        ${pitch.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary edit-pitch-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#editPitchModal"
                        data-pitch-id="${pitch.id}"
                        data-pitch-name="${pitch.name}"
                        data-pitch-address="${pitch.address}"
                        data-pitch-phone="${pitch.phone}"
                        data-pitch-price="${pitch.price}"
                        data-pitch-description="${pitch.description || ''}"
                        data-pitch-status="${pitch.is_active}"
                        data-pitch-image="${pitch.image || ''}">
                        <i class="bi bi-pencil"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-danger delete-pitch-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#deletePitchModal"
                        data-pitch-id="${pitch.id}"
                        data-pitch-name="${pitch.name}">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
                </td>
            </tr>
        `;
    }

    function updatePitchTableRow(pitch) {
        const row = document.querySelector(`#pitchesTable tr[data-pitch-id="${pitch.id}"]`);
        if (row) {
            const newRow = createPitchTableRow(pitch);
            row.outerHTML = newRow;
        }
    }

    function validatePhoneNumber(phone) {
        const normalizedPhone = phone.replace(/\s+|-/g, '');
        const phoneRegex = /^(0|(\+?84))([3-9][0-9]{8})$/;
        return phoneRegex.test(normalizedPhone);
    }

    // Enable/disable update button based on form validity
    function toggleUpdateButton() {
        const form = document.getElementById('editPitchForm');
        const name = form.querySelector('#editPitchName').value;
        const address = form.querySelector('#editPitchAddress').value;
        const phone = form.querySelector('#editPitchPhone').value;
        const price = form.querySelector('#editPitchPrice').value;
        const updateBtn = document.getElementById('updatePitchBtn');
        const isValid = name && address && validatePhoneNumber(phone) && price > 0;
        updateBtn.disabled = !isValid;
    }

    // Initialize form validation
    const editPitchForm = document.getElementById('editPitchForm');
    if (editPitchForm) {
        editPitchForm.addEventListener('input', toggleUpdateButton);
    }

    // ===== THÊM SÂN MỚI =====
    const addPitchModal = document.getElementById('addPitchModal');
    if (addPitchModal) {
        addPitchModal.addEventListener('show.bs.modal', function() {
            document.getElementById('addPitchForm').reset();
        });
        addPitchModal.addEventListener('shown.bs.modal', function() {
            document.getElementById('pitchName').focus();
        });
    }

    const savePitchBtn = document.getElementById('savePitchBtn');
    if (savePitchBtn) {
        savePitchBtn.addEventListener('click', function() {
            console.log('Nút lưu sân được click');
            const form = document.getElementById('addPitchForm');
            const formData = new FormData(form);

            // Validate data
            const name = formData.get('name');
            const address = formData.get('address');
            const phone = formData.get('phone');
            const price = parseInt(formData.get('price'));
            const isActive = formData.get('is_active') === 'true';

            if (!name || !address || !phone || !price) {
                showAlert('Vui lòng điền đầy đủ thông tin sân!', 'danger');
                return;
            }
            if (!validatePhoneNumber(phone)) {
                showAlert('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng số điện thoại Việt Nam.', 'danger');
                return;
            }
            if (price <= 0) {
                showAlert('Giá thuê sân phải lớn hơn 0!', 'danger');
                return;
            }

            // Send request with FormData to handle file upload
            fetch('/api/pitches', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `Lỗi khi thêm sân: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Phản hồi thành công:', data);
                const modal = bootstrap.Modal.getInstance(document.getElementById('addPitchModal'));
                modal.hide();
                const newRow = createPitchTableRow(data);
                document.querySelector('#pitchesTable tbody').insertAdjacentHTML('afterbegin', newRow);
                showAlert('Thêm sân mới thành công!', 'success');
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMessage = error.message.includes('Unauthorized')
                    ? 'Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.'
                    : `Đã xảy ra lỗi: ${error.message}`;
                showAlert(errorMessage, 'danger');
            });
        });
    }

    // ===== SỬA THÔNG TIN SÂN =====
    const editPitchModal = document.getElementById('editPitchModal');
    if (editPitchModal) {
        document.addEventListener('click', function(e) {
            const button = e.target.closest('.edit-pitch-btn');
            if (button) {
                console.log('Nút sửa sân được click');
                const id = button.getAttribute('data-pitch-id');
                const name = button.getAttribute('data-pitch-name');
                const address = button.getAttribute('data-pitch-address');
                const phone = button.getAttribute('data-pitch-phone');
                const price = button.getAttribute('data-pitch-price');
                const description = button.getAttribute('data-pitch-description');
                const status = button.getAttribute('data-pitch-status') === 'true';
                const image = button.getAttribute('data-pitch-image');

                console.log('Dữ liệu sân cần sửa:', { id, name, address, phone, price, description, status, image });

                document.getElementById('editPitchId').value = id;
                document.getElementById('editPitchName').value = name;
                document.getElementById('editPitchAddress').value = address;
                document.getElementById('editPitchPhone').value = phone;
                document.getElementById('editPitchPrice').value = price;
                document.getElementById('editPitchDescription').value = description || '';
                document.getElementById('editPitchStatusActive').checked = status;
                document.getElementById('editPitchStatusInactive').checked = !status;
                document.getElementById('editPitchImage').value = ''; // Reset file input
                toggleUpdateButton();
            }
        });

        const updatePitchBtn = document.getElementById('updatePitchBtn');
        const updatePitchSpinner = document.getElementById('updatePitchSpinner');
        if (updatePitchBtn) {
            updatePitchBtn.addEventListener('click', function() {
                console.log('Nút cập nhật sân được click');
                const form = document.getElementById('editPitchForm');
                const formData = new FormData(form);
                const isActive = formData.get('is_active') === 'true';
                const price = parseFloat(formData.get('price'));

                // Validate data
                if (!formData.get('name') || !formData.get('address') || !formData.get('phone') || !price) {
                    showAlert('Vui lòng điền đầy đủ thông tin sân!', 'danger');
                    return;
                }

                if (!validatePhoneNumber(formData.get('phone'))) {
                    showAlert('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng số điện thoại Việt Nam.', 'danger');
                    return;
                }

                if (price <= 0) {
                    showAlert('Giá thuê sân phải lớn hơn 0!', 'danger');
                    return;
                }

                // Show loading state
                updatePitchBtn.disabled = true;
                updatePitchSpinner.classList.remove('d-none');

                // Send request with FormData to handle file upload
                fetch(`/api/pitches/${formData.get('id')}`, {
                    method: 'PUT',
                    body: formData
                })
                .then(response => {
                    console.log('Phản hồi từ server:', response);
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || `Lỗi khi cập nhật sân: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Phản hồi cập nhật thành công:', data);
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editPitchModal'));
                    if (modal) {
                        modal.hide();
                    }
                    updatePitchTableRow(data);
                    showAlert('Cập nhật thông tin sân thành công!', 'success');
                })
                .catch(error => {
                    console.error('Error:', error);
                    const errorMessage = error.message.includes('Unauthorized')
                        ? 'Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.'
                        : `Đã xảy ra lỗi: ${error.message}`;
                    showAlert(errorMessage, 'danger');
                })
                .finally(() => {
                    updatePitchBtn.disabled = false;
                    updatePitchSpinner.classList.add('d-none');
                });
            });
        }
    }

    // ===== XÓA SÂN =====
    const deletePitchModal = document.getElementById('deletePitchModal');
    if (deletePitchModal) {
        document.addEventListener('click', function(e) {
            const button = e.target.closest('.delete-pitch-btn');
            if (button) {
                console.log('Nút xóa sân được click');
                const id = button.getAttribute('data-pitch-id');
                const name = button.getAttribute('data-pitch-name');

                console.log('Dữ liệu sân cần xóa:', { id, name });

                document.getElementById('deletePitchId').value = id;
                document.getElementById('deletePitchName').textContent = name;
            }
        });

        const confirmDeletePitchBtn = document.getElementById('confirmDeletePitchBtn');
        if (confirmDeletePitchBtn) {
            confirmDeletePitchBtn.addEventListener('click', function() {
                console.log('Nút xác nhận xóa sân được click');
                const pitchId = document.getElementById('deletePitchId').value;
                console.log('Xóa sân có ID:', pitchId);

                fetch(`/api/pitches/${pitchId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.status === 404) {
                        throw new Error('Không tìm thấy sân để xóa');
                    }
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.indexOf('application/json') !== -1) {
                        return response.json();
                    } else {
                        return { success: true };
                    }
                })
                .then(data => {
                    console.log('Phản hồi xóa thành công:', data);
                    const modal = bootstrap.Modal.getInstance(deletePitchModal);
                    if (modal) {
                        modal.hide();
                    } else {
                        $(deletePitchModal).modal('hide');
                    }
                    const row = document.querySelector(`#pitchesTable tr[data-pitch-id="${pitchId}"]`);
                    if (row) {
                        row.remove();
                    }
                    showAlert('Xóa sân thành công!', 'success');
                })
                .catch(error => {
                    console.error('Error:', error);
                    const errorMessage = error.message.includes('Unauthorized')
                        ? 'Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.'
                        : `Đã xảy ra lỗi: ${error.message}`;
                    showAlert(errorMessage, 'danger');
                });
            });
        }
    }

    // ===== TÌM KIẾM VÀ LỌC SÂN =====
    const pitchSearchInput = document.getElementById('pitchSearchInput');
    if (pitchSearchInput) {
        pitchSearchInput.addEventListener('keyup', function() {
            const searchValue = this.value.toLowerCase();
            const pitchRows = document.querySelectorAll('#pitchesTable tbody tr');

            pitchRows.forEach(row => {
                const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const address = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

                if (name.includes(searchValue) || address.includes(searchValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    const pitchStatusFilter = document.getElementById('pitchStatusFilter');
    if (pitchStatusFilter) {
        pitchStatusFilter.addEventListener('change', function() {
            const filterValue = this.value;
            const pitchRows = document.querySelectorAll('#pitchesTable tbody tr');

            pitchRows.forEach(row => {
                const statusCell = row.querySelector('td:nth-child(5) .badge');
                const isActive = statusCell.classList.contains('bg-success');

                if (filterValue === 'all' ||
                   (filterValue === 'active' && isActive) ||
                   (filterValue === 'inactive' && !isActive)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            localStorage.setItem('activeAdminTab', e.target.getAttribute('href'));
        });
    });

    const activeTab = localStorage.getItem('activeAdminTab');
    if (activeTab) {
        const tab = document.querySelector(`a[href="${activeTab}"]`);
        if (tab) {
            new bootstrap.Tab(tab).show();
        }
    }

    if (typeof bootstrap === 'undefined') {
        console.warn('Bootstrap không được tìm thấy. Các chức năng modal có thể không hoạt động.');
    } else {
        console.log('Bootstrap đã được load thành công.');
    }
});