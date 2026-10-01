import math

def memory_matrix_score(correct_cells, total_cells, level):
    """Calculate Memory Matrix game score (0 to 100)."""
    if total_cells == 0:
        return 0.0
    accuracy = max(0.0, min(1.0, correct_cells / total_cells))
    base_score = accuracy * 70.0
    level_bonus = min(30.0, (level - 1) * 10.0)
    return round(max(0.0, min(100.0, base_score + level_bonus)), 1)

def speed_math_score(correct_answers, total_questions, avg_rt_ms):
    """Calculate Speed Math game score (0 to 100)."""
    if total_questions == 0:
        return 0.0
    accuracy = max(0.0, min(1.0, correct_answers / total_questions))
    acc_component = accuracy * 60.0
    speed_factor = max(0.0, min(1.0, (3000.0 - avg_rt_ms) / 2500.0))
    speed_component = speed_factor * 40.0
    return round(max(0.0, min(100.0, acc_component + speed_component)), 1)

def schulte_score(total_time_sec, penalties):
    """Calculate Schulte Table game score (0 to 100)."""
    effective_time = total_time_sec + (penalties * 1.0)
    if effective_time <= 15.0:
        score = 100.0
    elif effective_time >= 90.0:
        score = 0.0
    else:
        score = 100.0 * (1.0 - (effective_time - 15.0) / 75.0)
    return round(max(0.0, min(100.0, score)), 1)

def focus_score(matrix_s, math_s, schulte_s):
    """Calculate composite daily focus score (0 to 100)."""
    composite = (matrix_s * 0.35) + (math_s * 0.35) + (schulte_s * 0.30)
    return round(max(0.0, min(100.0, composite)), 1)

def streak_days(date_list):
    """Calculate consecutive daily streak from sorted unique YYYY-MM-DD date strings."""
    if not date_list:
        return 0
    unique_dates = sorted(list(set(date_list)), reverse=True)
    from datetime import datetime, timedelta
    dates = [datetime.strptime(d, "%Y-%m-%d").date() for d in unique_dates]
    today = datetime.now().date()
    if dates[0] != today and dates[0] != (today - timedelta(days=1)):
        return 0
    streak = 1
    for i in range(len(dates) - 1):
        if (dates[i] - dates[i+1]).days == 1:
            streak += 1
        else:
            break
    return streak

def correlation(x_list, y_list):
    """Calculate Pearson correlation coefficient between two lists."""
    if len(x_list) < 7 or len(y_list) < 7 or len(x_list) != len(y_list):
        return None
    n = len(x_list)
    mean_x = sum(x_list) / n
    mean_y = sum(y_list) / n
    var_x = sum((x - mean_x) ** 2 for x in x_list)
    var_y = sum((y - mean_y) ** 2 for y in y_list)
    if var_x == 0 or var_y == 0:
        return 0.0
    cov_xy = sum((x_list[i] - mean_x) * (y_list[i] - mean_y) for i in range(n))
    r = cov_xy / math.sqrt(var_x * var_y)
    return round(max(-1.0, min(1.0, r)), 2)
