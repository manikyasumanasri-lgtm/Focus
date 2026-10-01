import pytest
import scoring

def test_memory_matrix_score():
    score = scoring.memory_matrix_score(4, 4, 1)
    assert 0 <= score <= 100

def test_speed_math_score():
    score = scoring.speed_math_score(10, 10, 500)
    assert 0 <= score <= 100

def test_schulte_score():
    assert scoring.schulte_score(10.0, 0) == 100.0
    assert scoring.schulte_score(100.0, 0) == 0.0

def test_streak_days():
    assert scoring.streak_days([]) == 0

def test_correlation():
    assert scoring.correlation([1,2,3], [1,2,3]) is None
    x = [1, 2, 3, 4, 5, 6, 7]
    y = [10, 20, 30, 40, 50, 60, 70]
    corr = scoring.correlation(x, y)
    assert corr == 1.0
