// Stroop Clash Mini-Game Engine
const StroopGame = {
  colors: [
    { name: 'RED', hex: '#ef4444', key: '1' },
    { name: 'BLUE', hex: '#2563eb', key: '2' },
    { name: 'GREEN', hex: '#10b981', key: '3' },
    { name: 'YELLOW', hex: '#f59e0b', key: '4' }
  ],
  durationSec: 90,
  timer: null,
  turnTimer: null,
  currentWord: null,
  currentInk: null,
  correctCount: 0,
  totalCount: 0,
  streak: 0,
  maxStreak: 0,
  rtList: [],
  startTime: 0,
  timeLimitMs: 2000,
  onComplete: null,
  keyHandler: null,

  start(container, onComplete) {
    this.onComplete = onComplete;
    this.correctCount = 0;
    this.totalCount = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.rtList = [];
    this.timeLimitMs = 2000;

    container.innerHTML = `
      <div style="width:100%; max-width:500px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-weight:700;">
          <span style="color:var(--primary-blue);">GAME 1/3: STROOP CLASH</span>
          <span id="stroop-time">Time: 90s</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">Tap the button or press key [1-4] matching the <strong>INK COLOR</strong>, not the word text!</p>
        <div id="stroop-word" class="stroop-word">READY</div>
        <div class="stroop-buttons">
          ${this.colors.map(c => `
            <button class="stroop-btn" data-color="${c.name}" onclick="StroopGame.answer('${c.name}')">
              [${c.key}] ${c.name}
            </button>
          `).join('')}
        </div>
        <button class="btn-icon" style="margin-top:1.5rem;" onclick="StroopGame.finish()">Skip Game &rarr;</button>
      </div>
    `;

    this.bindKeyboard();
    let secondsLeft = this.durationSec;
    this.timer = setInterval(() => {
      secondsLeft--;
      const timerEl = document.getElementById('stroop-time');
      if (timerEl) timerEl.textContent = `Time: ${secondsLeft}s`;
      if (secondsLeft <= 0) this.finish();
    }, 1000);

    this.nextTurn();
  },

  nextTurn() {
    clearTimeout(this.turnTimer);
    const wordObj = this.colors[Math.floor(Math.random() * this.colors.length)];
    let inkObj;
    do {
      inkObj = this.colors[Math.floor(Math.random() * this.colors.length)];
    } while (inkObj.name === wordObj.name && Math.random() > 0.2);

    this.currentWord = wordObj;
    this.currentInk = inkObj;

    const wordEl = document.getElementById('stroop-word');
    if (!wordEl) return;
    wordEl.textContent = wordObj.name;
    wordEl.style.color = inkObj.hex;

    this.startTime = Date.now();
    this.turnTimer = setTimeout(() => {
      this.recordAnswer(false, this.timeLimitMs);
      this.nextTurn();
    }, this.timeLimitMs);
  },

  answer(chosenColor) {
    const rt = Date.now() - this.startTime;
    clearTimeout(this.turnTimer);
    const isCorrect = chosenColor === this.currentInk.name;
    this.recordAnswer(isCorrect, rt);
    this.nextTurn();
  },

  recordAnswer(isCorrect, rt) {
    this.totalCount++;
    if (isCorrect) {
      this.correctCount++;
      this.streak++;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      this.rtList.push(rt);
      if (typeof playSound === 'function') playSound('correct');
      if (this.correctCount % 5 === 0) {
        this.timeLimitMs = Math.max(800, this.timeLimitMs - 100);
      }
    } else {
      this.streak = 0;
      if (typeof playSound === 'function') playSound('wrong');
    }
  },

  bindKeyboard() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = (e) => {
      const col = this.colors.find(c => c.key === e.key);
      if (col) {
        e.preventDefault();
        this.answer(col.name);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  },

  finish() {
    clearInterval(this.timer);
    clearTimeout(this.turnTimer);
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    const accuracy = this.totalCount > 0 ? this.correctCount / this.totalCount : 0;
    const avgRt = this.rtList.length > 0 ? this.rtList.reduce((a,b)=>a+b,0) / this.rtList.length : 1500;

    if (this.onComplete) {
      this.onComplete({
        accuracy: accuracy,
        avg_rt: avgRt,
        streak: this.maxStreak
      });
    }
  }
};
