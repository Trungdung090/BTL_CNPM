import sqlite3
from werkzeug.security import generate_password_hash

def init_db():
    conn = sqlite3.connect('football_booking.db')
    c = conn.cursor()
    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Create pitches table
    c.execute('''
        CREATE TABLE IF NOT EXISTS pitches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Create bookings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pitch_id INTEGER NOT NULL,
            booking_date DATE NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            hours INTEGER NOT NULL,
            total_price INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (pitch_id) REFERENCES pitches (id)
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect('football_booking.db')
    conn.row_factory = sqlite3.Row
    return conn

def add_user(fullname, phone, email, password):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO users (fullname, phone, email, password)
        VALUES (?, ?, ?, ?)
    ''', (fullname, phone, email, generate_password_hash(password)))
    conn.commit()
    conn.close()

def get_user(email_or_phone):
    conn = get_db()
    user = conn.execute('''
        SELECT * FROM users 
        WHERE email = ? OR phone = ?
    ''', (email_or_phone, email_or_phone)).fetchone()
    conn.close()
    return user

def add_pitch(name, address, phone, price, image, description):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO pitches (name, address, phone, price, image, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (name, address, phone, price, image, description, True))
    conn.commit()
    conn.close()
    return c.lastrowid

def get_pitches():
    conn = get_db()
    pitches = conn.execute('SELECT * FROM pitches ORDER BY name').fetchall()
    conn.close()
    return pitches

def book_pitch(user_id, pitch_id, booking_date, start_time, end_time, total_price, status):
    conn = get_db()
    c = conn.cursor()
    overlapping = c.execute('''
        SELECT * FROM bookings 
        WHERE pitch_id = ? AND booking_date = ? 
        AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))
    ''', (pitch_id, booking_date, start_time, start_time, end_time, end_time)).fetchone()
    if overlapping:
        conn.close()
        raise ValueError('Pitch is already booked for this time slot')

def get_user_by_id(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

def get_user_bookings(user_id):
    conn = get_db()
    bookings = conn.execute('''
        SELECT b.*, p.name as pitch_name, p.address as pitch_address, p.phone as pitch_phone
        FROM bookings b
        JOIN pitches p ON b.pitch_id = p.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return bookings

def get_all_bookings():
    conn = get_db()
    bookings = conn.execute('''
        SELECT b.*, p.name as pitch_name, u.fullname as user_name 
        FROM bookings b
        JOIN pitches p ON b.pitch_id = p.id
        JOIN users u ON b.user_id = u.id
        ORDER BY b.booking_date DESC
    ''').fetchall()
    conn.close()
    return bookings

def cancel_booking(booking_id):
    conn = get_db()
    conn.execute('''
        UPDATE bookings SET status = 'cancelled' WHERE id = ?
    ''', (booking_id,))
    conn.commit()
    conn.close()