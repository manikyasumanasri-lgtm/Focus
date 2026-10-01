// Anonymous Browser ID helper
let browserId = localStorage.getItem('focusgym_browser_id');
if (!browserId) {
  browserId = 'user_' + Math.random().toString(36).substring(2, 11);
  localStorage.setItem('focusgym_browser_id', browserId);
}

// Sound synth state using Web Audio API
let soundEnabled = false;
let audioCtx = null;

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-btn');
  btn.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
}

function playSound(type) {
  if (!soundEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'correct') {
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'wrong') {
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
}

// Main workout state management
const FocusGymApp = {
  selectedRating: 3,
  workoutData: {},

  init() {
    this.renderCheckin();
    this.loadHistoryChart();
  },

  selectRating(val) {
    this.selectedRating = val;
    document.querySelectorAll('.rate-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
    });
  },

  async startWorkout() {
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Browser-ID': browserId
        },
        body: JSON.stringify({ rating: this.selectedRating })
      });
    } catch (e) {
      console.error('Checkin failed', e);
    }

    this.runMatrixIntro();
  },

  renderCheckin() {
    const arena = document.getElementById('workout-arena');
    arena.innerHTML = `
      <div style="max-width:500px; width:100%;">
        <h2 style="font-size:2rem; margin-bottom:0.5rem; color:var(--text-dark);">DAILY FOCUS CHECK-IN</h2>
        <p style="color:var(--text-muted); margin-bottom:1.5rem;">How focused do you feel right now before your workout?</p>
        
        <div class="rating-options">
          ${[1, 2, 3, 4, 5].map(n => `
            <button class="rate-btn ${n === 3 ? 'selected' : ''}" data-val="${n}" onclick="FocusGymApp.selectRating(${n})">${n}</button>
          `).join('')}
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:2rem;">1 = Very Distracted &bull; 5 = Highly Laser-Focused</p>
        
        <button class="btn-blue" style="width:100%; padding:1rem;" onclick="FocusGymApp.startWorkout()">START 5-MIN WORKOUT &rarr;</button>
      </div>
    `;
  },

  runMatrixIntro() {
    const arena = document.getElementById('workout-arena');
    arena.innerHTML = `
      <div style="max-width:500px; width:100%;">
        <div class="badge-tag">GAME 1 / 3</div>
        <h2 style="font-size:2.2rem; color:var(--text-dark);">MEMORY MATRIX</h2>
        <p style="color:var(--text-muted); margin:1rem 0 1.5rem 0;">A pattern of blue squares will flash briefly. Memorize the pattern and tap the same squares after they disappear!</p>
        <button class="btn-blue" onclick="MatrixGame.start(document.getElementById('workout-arena'), (res) => FocusGymApp.onMatrixDone(res))">PLAY MEMORY MATRIX &rarr;</button>
      </div>
    `;
  },

  onMatrixDone(res) {
    this.workoutData.matrix_correct = res.correct;
    this.workoutData.matrix_total = res.total;
    this.workoutData.matrix_level = res.level;
    this.runMathIntro();
  },

  runMathIntro() {
    const arena = document.getElementById('workout-arena');
    arena.innerHTML = `
      <div style="max-width:500px; width:100%;">
        <div class="badge-tag">GAME 2 / 3</div>
        <h2 style="font-size:2.2rem; color:var(--text-dark);">SPEED MATH</h2>
        <p style="color:var(--text-muted); margin:1rem 0 1.5rem 0;">Solve mental arithmetic problems as quickly as possible within 60 seconds!</p>
        <button class="btn-blue" onclick="MathGame.start(document.getElementById('workout-arena'), (res) => FocusGymApp.onMathDone(res))">PLAY SPEED MATH &rarr;</button>
      </div>
    `;
  },

  onMathDone(res) {
    this.workoutData.math_correct = res.correct;
    this.workoutData.math_total = res.total;
    this.workoutData.math_avg_rt = res.avg_rt;
    this.runSchulteIntro();
  },

  runSchulteIntro() {
    const arena = document.getElementById('workout-arena');
    arena.innerHTML = `
      <div style="max-width:500px; width:100%;">
        <div class="badge-tag">GAME 3 / 3</div>
        <h2 style="font-size:2.2rem; color:var(--text-dark);">SCHULTE TABLE</h2>
        <p style="color:var(--text-muted); margin:1rem 0 1.5rem 0;">Tap the numbers <strong>1 to 25</strong> in order as fast as possible. Wrong taps add a 1-second penalty!</p>
        <button class="btn-blue" onclick="SchulteGame.start(document.getElementById('workout-arena'), (res) => FocusGymApp.onSchulteDone(res))">PLAY SCHULTE &rarr;</button>
      </div>
    `;
  },

  async onSchulteDone(res) {
    this.workoutData.schulte_time = res.total_time;
    this.workoutData.schulte_penalties = res.penalties;

    try {
      const resp = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Browser-ID': browserId
        },
        body: JSON.stringify(this.workoutData)
      });
      const data = await resp.json();
      this.showResults(data);
    } catch (e) {
      console.error('Failed to submit results', e);
    }
  },

  showResults(scores) {
    const arena = document.getElementById('workout-arena');
    arena.innerHTML = `
      <div style="max-width:500px; width:100%;">
        <div class="badge-tag">WORKOUT COMPLETE</div>
        <h2 style="font-size:1.8rem; color:var(--text-dark);">YOUR DAILY FOCUS SCORE</h2>
        
        <div class="big-focus-score">${scores.focus_score}</div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin:1.5rem 0; background:var(--surface-light); padding:1.25rem; border-radius:16px; border:1px solid var(--card-border);">
          <div><div style="font-weight:800; font-size:1.2rem; color:var(--primary-blue);">${scores.matrix_score}</div><div style="font-size:0.8rem; color:var(--text-muted);">Matrix</div></div>
          <div><div style="font-weight:800; font-size:1.2rem; color:var(--primary-blue);">${scores.math_score}</div><div style="font-size:0.8rem; color:var(--text-muted);">Speed Math</div></div>
          <div><div style="font-weight:800; font-size:1.2rem; color:var(--primary-blue);">${scores.schulte_score}</div><div style="font-size:0.8rem; color:var(--text-muted);">Schulte</div></div>
        </div>

        <button class="btn-blue" style="width:100%;" onclick="FocusGymApp.renderCheckin(); FocusGymApp.loadHistoryChart();">RETURN TO DASHBOARD &rarr;</button>
      </div>
    `;
    this.loadHistoryChart();
  },

  async loadHistoryChart() {
    try {
      const resp = await fetch('/api/history?days=30', {
        headers: { 'X-Browser-ID': browserId }
      });
      const data = await resp.json();

      document.getElementById('header-streak').textContent = `${data.streak} Days Streak`;

      const corrEl = document.getElementById('correlation-text');
      if (data.correlation === null) {
        corrEl.textContent = "Complete 7 daily workouts to unlock your personal focus correlation insight.";
      } else if (data.correlation > 0.3) {
        corrEl.textContent = "On days you felt more focused, your workout score tended to be higher! 🎯";
      } else if (data.correlation < -0.3) {
        corrEl.textContent = "Your focus score moved inverse to how you felt today. Keep training!";
      } else {
        corrEl.textContent = "No clear pattern between self-rated focus and workout score yet.";
      }

      this.drawCanvasChart(data.history);
    } catch (e) {
      console.error('History load error', e);
    }
  },

  drawCanvasChart(history) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth - 60;
    const height = canvas.height = 220;

    ctx.clearRect(0, 0, width, height);

    if (!history || history.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Plus Jakarta Sans';
      ctx.fillText('No workout history recorded yet. Complete a workout to see trends!', 20, height / 2);
      return;
    }

    const padding = 40;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const stepX = history.length > 1 ? chartW / (history.length - 1) : chartW;

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (h.focus_score / 100.0) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    history.forEach((h, i) => {
      if (h.checkin_rating !== null) {
        const x = padding + i * stepX;
        const y = height - padding - (h.checkin_rating / 5.0) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

window.addEventListener('DOMContentLoaded', () => FocusGymApp.init());
