from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from database import init_db, get_db, add_user, get_user, add_pitch, get_pitches, book_pitch, get_user_bookings, \
    cancel_booking, get_all_bookings
import sqlite3
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import logging
import os
from werkzeug.utils import secure_filename

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'dung'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}
init_db()

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

pitch_data = [
    {
        'name': 'Sân bóng đá Thái Nguyên 1',
        'address': '123 Đường Lương Ngọc Quyến, TP. Thái Nguyên',
        'phone': '0208 123 4567',
        'price': 50000,
        'image': 'anh1.jpg',
        'description': 'Sân cỏ nhân tạo tiêu chuẩn, có đèn chiếu sáng'
    },
    {
        'name': 'Sân bóng đá Thái Nguyên 2',
        'address': '456 Đường Hoàng Văn Thụ, TP. Thái Nguyên',
        'phone': '0208 234 5678',
        'price': 45000,
        'image': 'anh2.jpg',
        'description': 'Sân cỏ nhân tạo mới, có chỗ đỗ xe rộng rãi'
    },
    {
        'name': 'Sân bóng đá Thái Nguyên 3',
        'address': '789 Đường Cách Mạng Tháng Tám, TP. Thái Nguyên',
        'phone': '0208 345 6789',
        'price': 40000,
        'image': 'anh3.jpg',
        'description': 'Sân cỏ tự nhiên, phù hợp cho thi đấu'
    },
{
        'name': 'Sân bóng đá Thái Nguyên 4',
        'address': '101 Đường Quang Trung, TP. Thái Nguyên',
        'phone': '0208 456 7890',
        'price': 55000,
        'image': 'anh4.png',
        'description': 'Sân cỏ nhân tạo cao cấp, có khán đài'
    },
    {
        'name': 'Sân bóng đá Thái Nguyên 5',
        'address': '202 Đường Z115, TP. Thái Nguyên',
        'phone': '0208 567 8901',
        'price': 48000,
        'image': 'anh5.png',
        'description': 'Sân cỏ tự nhiên, gần trung tâm thành phố'
    },
    {
        "name": "Sân bóng đá Thái Nguyên 6",
        "address": "303 Đường Lê Duẩn, TP. Thái Nguyên",
        "phone": "0208 678 9012",
        "price": 60000,
        'image': 'anh6.png',
        "description": "Sân cỏ nhân tạo chất lượng cao, có chỗ đỗ xe"
    },
    {
        "name": "Sân bóng đá Thái Nguyên 7",
        "address": "404 Đường Hoàng Văn Thái, TP. Thái Nguyên",
        "phone": "0208 789 0123",
        "price": 55000,
        'image': 'anh7.jpg',
        "description": "Sân cỏ tự nhiên, phù hợp cho tập luyện"
    }
]

with app.app_context():
    db = get_db()
    if db.execute("SELECT COUNT(*) FROM pitches").fetchone()[0] == 0:
        for pitch in pitch_data:
            add_pitch(
                pitch['name'],
                pitch['address'],
                pitch['phone'],
                pitch['price'],
                pitch['image'],
                pitch['description']
            )
    # Create admin user if not exists
    admin = db.execute("SELECT * FROM users WHERE email = 'admin@example.com'").fetchone()
    if not admin:
        db.execute(
            "INSERT INTO users (fullname, phone, email, password, is_admin) VALUES (?, ?, ?, ?, ?)",
            ('Admin', '0987654321', 'admin@example.com', generate_password_hash('admin123'), 1)
        )
        db.commit()

@app.route('/')
def home():
    pitches = get_pitches()[:3]  # Show only 3 pitches on home page
    return render_template('home.html', popular_pitches=pitches)

@app.route('/lien-he')
def contact():
    return render_template('contact.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        fullname = request.form['fullname']
        phone = request.form['phone']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash('Mật khẩu không khớp!', 'danger')
            return redirect(url_for('register'))
        try:
            add_user(fullname, phone, email, password)
            flash('Đăng ký thành công! Vui lòng đăng nhập.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email hoặc số điện thoại đã được sử dụng!', 'danger')
            return redirect(url_for('register'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email_or_phone = request.form['email_or_phone']
        password = request.form['password']
        user = get_user(email_or_phone)
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['user_name'] = user['fullname']
            session['is_admin'] = user['is_admin']
            flash('Đăng nhập thành công!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Email/số điện thoại hoặc mật khẩu không đúng!', 'danger')
            return redirect(url_for('login'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Bạn đã đăng xuất thành công.', 'success')
    return redirect(url_for('home'))

@app.route('/pitches')
def pitches():
    # Get the current page from query parameters, default to 1
    page = request.args.get('page', 1, type=int)
    per_page = 6  # Number of pitches per page
    db = get_db()

    # Get total number of pitches
    total_pitches = db.execute("SELECT COUNT(*) FROM pitches").fetchone()[0]
    total_pages = (total_pitches + per_page - 1) // per_page  # Ceiling division

    # Ensure page is within valid range
    page = max(1, min(page, total_pages))

    # Calculate offset for SQL query
    offset = (page - 1) * per_page
    pitches = db.execute(
        "SELECT * FROM pitches LIMIT ? OFFSET ?",
        (per_page, offset)
    ).fetchall()
    return render_template('pitches.html', pitches=pitches, page=page, total_pages=total_pages)

@app.route('/book/<int:pitch_id>', methods=['GET', 'POST'])
def book(pitch_id):
    if 'user_id' not in session:
        flash('Vui lòng đăng nhập để đặt sân!', 'warning')
        return redirect(url_for('login'))
    db = get_db()
    pitch = db.execute('SELECT * FROM pitches WHERE id = ?', (pitch_id,)).fetchone()
    # Kiểm tra sân có tồn tại không
    if not pitch:
        flash('Sân bóng không tồn tại!', 'error')
        return redirect(url_for('pitches'))
    if request.method == 'POST':
        try:
            # Lấy dữ liệu từ form
            booking_date = request.form['booking_date']
            start_time = request.form['selected_time']  # Lấy từ time-slot đã chọn
            hours = int(request.form['booking_hours'])  # Số giờ đặt
            total_price = float(request.form['total_price'])  # Tổng giá đã tính

            # Validate ngày giờ
            booking_datetime = datetime.strptime(f"{booking_date} {start_time}", '%Y-%m-%d %H:%M')
            if booking_datetime < datetime.now():
                flash('Không thể đặt sân trong quá khứ!', 'error')
                return redirect(url_for('book', pitch_id=pitch_id))

            # Tính toán end_time từ start_time và số giờ
            start = datetime.strptime(start_time, '%H:%M')
            end = start + timedelta(hours=hours)
            end_time = end.strftime('%H:%M')
            if hours <= 0:
                flash('Thời gian kết thúc phải sau thời gian bắt đầu!', 'error')
                return redirect(url_for('book', pitch_id=pitch_id))

            # Kiểm tra xem sân có trống không
            existing_booking  = db.execute('''
                SELECT id FROM bookings 
                WHERE pitch_id = ? AND booking_date = ? 
                AND (
                    (start_time < ? AND end_time > ?) OR
                    (start_time >= ? AND start_time < ?) OR
                    (end_time > ? AND end_time <= ?)
                )
            ''', (
                pitch_id, booking_date,
                end_time, start_time,
                start_time, end_time,
                start_time, end_time
            )).fetchone()
            if existing_booking:
                flash('Sân đã được đặt trong khoảng thời gian này!', 'error')
                return redirect(url_for('book', pitch_id=pitch_id))

                # Lưu thông tin đặt sân
            db.execute('''
                INSERT INTO bookings (
                    user_id, pitch_id, booking_date, 
                    start_time, end_time, hours, total_price, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session['user_id'], pitch_id, booking_date,
                start_time, end_time, hours, total_price, 'pending_payment'
            ))
            db.commit()

            # Lưu thông tin booking vào session để thanh toán
            booking_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
            session['booking_id'] = booking_id
            session['total_price'] = total_price
            return redirect(url_for('payment'))
        except ValueError as e:
            flash('Dữ liệu không hợp lệ! Vui lòng kiểm tra lại.', 'error')
            return redirect(url_for('book', pitch_id=pitch_id))
        except Exception as e:
            db.rollback()
            flash('Có lỗi xảy ra khi đặt sân: ' + str(e), 'error')
            return redirect(url_for('book', pitch_id=pitch_id))

    # Tạo danh sách khung giờ (7h-23h, cách nhau 2 tiếng)
    time_slots = []
    for hour in range(7, 23):  # Từ 7h sáng đến 23h đêm
        time_slots.append(f"{hour:02d}:00")
    # Ngày đặt sân tối thiểu là ngày mai
    min_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    return render_template('booking.html', pitch=pitch, time_slots=time_slots,
                           min_date=min_date, price_per_hour=pitch['price'])

@app.route('/payment', methods=['GET', 'POST'])
def payment():
    if 'booking_id' not in session or 'total_price' not in session:
        flash('Thông tin đặt sân không hợp lệ!', 'error')
        return redirect(url_for('home'))
    db = get_db()
    # Lấy thông tin chi tiết đơn đặt sân
    booking = db.execute('''
        SELECT b.*, p.name AS pitch_name, p.price AS pitch_price
        FROM bookings b
        JOIN pitches p ON b.pitch_id = p.id
        WHERE b.id = ?
    ''', (session['booking_id'],)).fetchone()
    if not booking:
        flash('Không tìm thấy thông tin đặt sân!', 'error')
        return redirect(url_for('home'))
    if request.method == 'POST':
        payment_method = request.form.get('payment_method')
        if not payment_method:
            flash('Vui lòng chọn phương thức thanh toán!', 'error')
            return redirect(url_for('payment'))
        try:
            # Tính lại tổng tiền dựa trên số giờ và giá sân
            total_price = booking['pitch_price'] * booking['hours']
            # Cập nhật booking: trạng thái, phương thức và tổng tiền
            db.execute('''
                UPDATE bookings
                SET status = ?, payment_method = ?, total_price = ?
                WHERE id = ?
            ''', ('confirmed', payment_method, total_price, session['booking_id']))
            db.commit()
            # Xóa session booking
            session.pop('booking_id', None)
            session.pop('total_price', None)
            flash('Thanh toán thành công! Đơn của bạn đã được duyệt.', 'success')
            return redirect(url_for('profile'))
        except Exception as e:
            db.rollback()
            flash(f'Có lỗi xảy ra khi xử lý thanh toán: {e}', 'error')
            return redirect(url_for('payment'))
    # Nếu GET, hiển thị trang thanh toán
    return render_template('payment.html', booking=booking, total_price=session['total_price'])

@app.route('/payment-success')
def payment_success():
    flash('Thanh toán thành công! Đơn của bạn đã được duyệt.')
    return redirect(url_for('home'))

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    db = get_db()
    user_info = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    bookings = get_user_bookings(session['user_id'])
    return render_template('profile.html', user_info=dict(user_info), bookings=bookings)

@app.route('/update_profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    fullname = request.form['fullname']
    email = request.form['email']
    phone = request.form['phone']
    db = get_db()
    try:
        db.execute(
            'UPDATE users SET fullname = ?, email = ?, phone = ? WHERE id = ?',
            (fullname, email, phone, session['user_id']))
        db.commit()
        session['user_name'] = fullname
        flash('Cập nhật thông tin thành công!', 'success')
    except sqlite3.IntegrityError:
        flash('Email hoặc số điện thoại đã được sử dụng bởi tài khoản khác!', 'danger')
    return redirect(url_for('profile'))

@app.route('/change_password', methods=['POST'])
def change_password():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    current_password = request.form['current_password']
    new_password = request.form['new_password']
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    if not check_password_hash(user['password'], current_password):
        flash('Mật khẩu hiện tại không đúng!', 'danger')
        return redirect(url_for('profile'))
    db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        (generate_password_hash(new_password), session['user_id']))
    db.commit()
    flash('Đổi mật khẩu thành công!', 'success')
    return redirect(url_for('profile'))

@app.template_filter('datetimeformat')
def datetimeformat(value, format='%Y-%m-%d %H:%M'):
    if isinstance(value, datetime):
        return value.strftime(format)
    return value

@app.route('/cancel/<int:booking_id>')
def cancel(booking_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    cancel_booking(booking_id)
    flash('Đã hủy đặt sân thành công. Tiền sẽ được hoàn trả trong 3-5 ngày làm việc.', 'success')
    return redirect(url_for('profile'))

@app.route('/admin')
def admin_dashboard():
    if 'user_id' not in session or not session.get('is_admin'):
        return redirect(url_for('home'))
    pitches = get_pitches()
    bookings = get_all_bookings()

    # Calculate stats
    total_revenue = sum(b['total_price'] for b in bookings if b['status'] == 'confirmed')
    total_bookings = len([b for b in bookings if b['status'] == 'confirmed'])

    return render_template('admin.html',
                           pitches=pitches,
                           bookings=bookings,
                           total_revenue=total_revenue,
                           total_bookings=total_bookings)

# API endpoints cho quản lý sân
@app.route('/api/pitches', methods=['POST'])
def api_add_pitch():
    print(f"Session: {session}")
    logger.info(f"Adding pitch with data: {request.get_json()}")
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    if not all(key in data for key in ['name', 'address', 'phone', 'price']):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        pitch_id = add_pitch(
            data['name'],
            data['address'],
            data['phone'],
            data['price'],
            data.get('image', 'default.jpg'),  # Sử dụng ảnh mặc định nếu không có
            data.get('description', '')  # Mô tả trống nếu không có
        )
        db = get_db()
        pitch = db.execute('SELECT * FROM pitches WHERE id = ?', (pitch_id,)).fetchone()
        return jsonify(dict(pitch)), 201
    except sqlite3.IntegrityError as e:
        return jsonify({'error': 'Database error: Duplicate or invalid data'}), 400
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/pitches/<int:pitch_id>', methods=['PUT'])
def api_update_pitch(pitch_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if form-data contains file
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_filename = filename
        else:
            return jsonify({'error': 'Invalid file format. Only PNG, JPG, JPEG allowed'}), 400

    data = request.form if request.form else request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    # Validate required fields
    required_fields = ['name', 'address', 'phone', 'price']
    if not all(key in data for key in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    db = get_db()
    try:
        update_query = '''
            UPDATE pitches SET 
                name = ?, 
                address = ?, 
                phone = ?, 
                price = ?, 
                description = ?,
                image = COALESCE(?, image),
                is_active = ?
            WHERE id = ?
        '''
        db.execute(
            update_query,
            (
                data['name'],
                data['address'],
                data['phone'],
                data['price'],
                data.get('description', ''),
                image_filename,
                data.get('is_active', True) == 'true' or data.get('is_active', True) == True,
                pitch_id
            )
        )
        db.commit()
        # Lấy lại thông tin sân đã cập nhật
        pitch = db.execute('SELECT * FROM pitches WHERE id = ?', (pitch_id,)).fetchone()
        if pitch:
            return jsonify(dict(pitch))
        else:
            return jsonify({'error': 'Pitch not found'}), 404
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Database error: Duplicate or invalid data'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/pitches/<int:pitch_id>', methods=['DELETE'])
def api_delete_pitch(pitch_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    db = get_db()
    try:
        # Xóa các booking liên quan trước
        db.execute('DELETE FROM bookings WHERE pitch_id = ?', (pitch_id,))
        # Sau đó xóa sân
        db.execute('DELETE FROM pitches WHERE id = ?', (pitch_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)