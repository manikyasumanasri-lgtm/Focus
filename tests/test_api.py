import os
import pytest

@pytest.fixture
def client(tmp_path):
    db_file = tmp_path / "test_focusgym.db"
    os.environ['DATABASE_PATH'] = str(db_file)
    
    import app
    app.init_db()
    app.app.config['TESTING'] = True
    with app.app.test_client() as client:
        yield client

def test_health_check(client):
    res = client.get('/health')
    assert res.status_code == 200
    assert res.get_json() == {'status': 'ok'}

def test_checkin_validation(client):
    res = client.post('/api/checkin', json={'rating': 10})
    assert res.status_code == 400

    res2 = client.post('/api/checkin', json={'rating': 4})
    assert res2.status_code == 200

def test_results_validation(client):
    invalid_payload = {'matrix_correct': -1}
    res = client.post('/api/results', json=invalid_payload)
    assert res.status_code == 400

    valid_payload = {
        'matrix_correct': 4,
        'matrix_total': 4,
        'matrix_level': 1,
        'math_correct': 10,
        'math_total': 10,
        'math_avg_rt': 800,
        'schulte_time': 25.5,
        'schulte_penalties': 1
    }
    res2 = client.post('/api/results', json=valid_payload, headers={'X-Browser-ID': 'user_a'})
    assert res2.status_code == 200
    assert 'focus_score' in res2.get_json()

def test_browser_id_isolation(client):
    client.post('/api/checkin', json={'rating': 5}, headers={'X-Browser-ID': 'user_a'})
    res = client.get('/api/history', headers={'X-Browser-ID': 'user_b'})
    assert len(res.get_json()['history']) == 0
