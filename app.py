import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, render_template
import scoring

app = Flask(__name__)

DB_PATH = os.environ.get('DATABASE_PATH', os.path.join('data', 'focusgym.db'))

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            browser_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            created_date TEXT NOT NULL,
            UNIQUE(browser_id, created_date)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            browser_id TEXT NOT NULL,
            matrix_correct INTEGER NOT NULL,
            matrix_total INTEGER NOT NULL,
            matrix_level INTEGER NOT NULL,
            matrix_score REAL NOT NULL,
            math_correct INTEGER NOT NULL,
            math_total INTEGER NOT NULL,
            math_avg_rt REAL NOT NULL,
            math_score REAL NOT NULL,
            schulte_time REAL NOT NULL,
            schulte_penalties INTEGER NOT NULL,
            schulte_score REAL NOT NULL,
            focus_score REAL NOT NULL,
            created_date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/checkin', methods=['POST'])
def checkin():
    browser_id = request.headers.get('X-Browser-ID', 'default_user')
    data = request.get_json() or {}
    rating = data.get('rating')

    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400

    today = datetime.now().strftime('%Y-%m-%d')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO checkins (browser_id, rating, created_date)
        VALUES (?, ?, ?)
        ON CONFLICT(browser_id, created_date) DO UPDATE SET rating=excluded.rating
    ''', (browser_id, rating, today))
    conn.commit()
    conn.close()

    return jsonify({'status': 'saved', 'rating': rating, 'date': today})

@app.route('/api/results', methods=['POST'])
def save_results():
    browser_id = request.headers.get('X-Browser-ID', 'default_user')
    data = request.get_json() or {}

    try:
        mat_correct = int(data['matrix_correct'])
        mat_total = int(data['matrix_total'])
        mat_level = int(data['matrix_level'])

        math_correct = int(data['math_correct'])
        math_total = int(data['math_total'])
        math_rt = float(data['math_avg_rt'])

        schulte_t = float(data['schulte_time'])
        schulte_p = int(data['schulte_penalties'])

        if mat_correct < 0 or mat_total < 0 or mat_level < 1:
            raise ValueError()
        if math_correct < 0 or math_total < 0 or math_rt < 0:
            raise ValueError()
        if schulte_t < 0 or schulte_p < 0:
            raise ValueError()

    except (KeyError, ValueError, TypeError):
        return jsonify({'error': 'Invalid workout results payload'}), 400

    mat_score = scoring.memory_matrix_score(mat_correct, mat_total, mat_level)
    math_score = scoring.speed_math_score(math_correct, math_total, math_rt)
    sch_score = scoring.schulte_score(schulte_t, schulte_p)
    f_score = scoring.focus_score(mat_score, math_score, sch_score)

    today = datetime.now().strftime('%Y-%m-%d')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO results (
            browser_id, matrix_correct, matrix_total, matrix_level, matrix_score,
            math_correct, math_total, math_avg_rt, math_score,
            schulte_time, schulte_penalties, schulte_score, focus_score, created_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        browser_id, mat_correct, mat_total, mat_level, mat_score,
        math_correct, math_total, math_rt, math_score,
        schulte_t, schulte_p, sch_score, f_score, today
    ))
    conn.commit()
    conn.close()

    return jsonify({
        'focus_score': f_score,
        'matrix_score': mat_score,
        'math_score': math_score,
        'schulte_score': sch_score
    })

@app.route('/api/history')
def history():
    browser_id = request.headers.get('X-Browser-ID', 'default_user')
    days = request.args.get('days', 30, type=int)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT created_date, focus_score FROM results
        WHERE browser_id = ?
        ORDER BY created_date ASC
    ''', (browser_id,))
    workout_rows = cursor.fetchall()

    cursor.execute('''
        SELECT created_date, rating FROM checkins
        WHERE browser_id = ?
        ORDER BY created_date ASC
    ''', (browser_id,))
    checkin_rows = cursor.fetchall()

    conn.close()

    checkin_map = {r['created_date']: r['rating'] for r in checkin_rows}
    workout_dates = [r['created_date'] for r in workout_rows]
    streak = scoring.streak_days(workout_dates)

    history_data = []
    x_ratings = []
    y_scores = []

    for r in workout_rows:
        date_str = r['created_date']
        score = r['focus_score']
        rating = checkin_map.get(date_str)
        history_data.append({
            'date': date_str,
            'focus_score': score,
            'checkin_rating': rating
        })
        if rating is not None:
            x_ratings.append(rating)
            y_scores.append(score)

    corr_val = scoring.correlation(x_ratings, y_scores)

    return jsonify({
        'history': history_data[-days:],
        'streak': streak,
        'correlation': corr_val
    })

@app.route('/version')
def version():
    return jsonify({
        'GIT_SHA': os.environ.get('GIT_SHA', 'unknown'),
        'BUILD_TIME': os.environ.get('BUILD_TIME', 'unknown')
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
