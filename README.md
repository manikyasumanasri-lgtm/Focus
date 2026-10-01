# Focus Gym - Daily Focus Training Web App

Focus Gym is a daily focus-training application. Complete a 5-minute mental workout comprising 3 mini-games every day to measure your focus score (0-100) and compare it against your self-rated focus level.

## 🎮 The Three Mini-Games

1. **Stroop Clash**: A color word appears in a mismatched ink color. Identify the **ink color** within the shrinking time limit.
2. **N-Back Grid**: A 3x3 grid highlights cells in sequence. Press **Match** when the current cell equals the one shown N steps back. Difficulty scales adaptively.
3. **Schulte Table**: A 5x5 grid of shuffled numbers (1 to 25). Tap them in numerical order as fast as possible.

---

## 📐 Scoring Formula

The overall **Focus Score (0-100)** is a weighted composite calculated in `scoring.py`:
- **Stroop Clash (35% weight)**: Based on accuracy, reaction speed (ms), and max streak.
- **N-Back Grid (35% weight)**: Based on target hits, misses, false alarms, and maximum N level achieved.
- **Schulte Table (30% weight)**: Based on total completion time (seconds) plus penalty seconds for wrong taps.

---

## 🚀 CI/CD Pipeline Diagram

```
[ Push to main ] ──> [ Job: test (Pytest) ] ──> [ Job: build-and-push ] ──> [ DockerHub Registry ]
```

---

## 🛠️ Local Development & Testing

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Tests**:
   ```bash
   pytest
   ```

3. **Run Locally**:
   ```bash
   python app.py
   ```
   Open `http://localhost:5000` in your browser.

---

## 🐳 Docker Deployment

Build and run using Docker with persistent volume storage:

```bash
docker build -t focus-gym .
docker run -p 5000:5000 -v focusgym_data:/app/data focus-gym
```

---

## 🔒 GitHub Actions & DockerHub Setup

Add the following repository secrets under **Settings ➔ Secrets and variables ➔ Actions**:
- `DOCKERHUB_USERNAME`: Your DockerHub username.
- `DOCKERHUB_TOKEN`: Your DockerHub access token.

---

*Note: Focus Gym is designed for personal attention tracking and game skill training. It is not a medical diagnostic tool.*
