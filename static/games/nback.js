// N-Back Grid Mini-Game Engine
const NBackGame = {
  nLevel: 1,
  maxN: 1,
  turnsTotal: 0,
  history: [],
  hits: 0,
  misses: 0,
  falseAlarms: 0,
  timer: null,
  userPressed: false,
  onComplete: null,
  keyHandler: null,

  start(container, onComplete) {
    this.onComplete = onComplete;
    this.nLevel = 1;
    this.maxN = 1;
    this.turnsTotal = 0;
    this.history = [];
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;

    container.innerHTML = `
      <div style="width:100%; max-width:500px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-weight:700;">
          <span style="color:var(--primary-blue);">GAME 2/3: N-BACK GRID</span>
          <span id="nback-info">Level N = 1</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">Tap MATCH or press Spacebar when the blue cell matches <span id="nback-n-label">1</span> step back!</p>
        
        <div class="nback-grid" id="nback-grid">
          ${[0,1,2,3,4,5,6,7,8].map(i => `<div class="nback-cell" data-idx="${i}"></div>`).join('')}
        </div>

        <div style="display:flex; gap:1rem; justify-content:center;">
          <button class="btn-blue" style="padding:0.8rem 2.5rem;" onclick="NBackGame.checkMatch()">MATCH [Spacebar]</button>
        </div>
        <button class="btn-icon" style="margin-top:1.5rem;" onclick="NBackGame.finish()">Skip Game &rarr;</button>
      </div>
    `;

    this.bindKeyboard();
    this.nextStep();
  },

  nextStep() {
    this.turnsTotal++;
    if (this.turnsTotal > 45) {
      this.finish();
      return;
    }

    if (this.history.length > this.nLevel) {
      const prevIdx = this.history[this.history.length - 1 - this.nLevel];
      const currIdx = this.history[this.history.length - 1];
      if (prevIdx === currIdx && !this.userPressed) {
        this.misses++;
      }
    }

    this.userPressed = false;

    let cellIdx;
    if (this.history.length >= this.nLevel && Math.random() < 0.35) {
      cellIdx = this.history[this.history.length - this.nLevel];
    } else {
      cellIdx = Math.floor(Math.random() * 9);
    }

    this.history.push(cellIdx);

    const cells = document.querySelectorAll('.nback-cell');
    cells.forEach(c => c.classList.remove('active'));
    if (cells[cellIdx]) cells[cellIdx].classList.add('active');

    if (this.turnsTotal % 15 === 0 && this.turnsTotal > 0) {
      const totalTargets = this.hits + this.misses;
      const acc = totalTargets > 0 ? this.hits / (this.hits + this.misses + this.falseAlarms) : 0;
      if (acc >= 0.80) {
        this.nLevel++;
        this.maxN = Math.max(this.maxN, this.nLevel);
      } else if (acc < 0.60 && this.nLevel > 1) {
        this.nLevel--;
      }
      const infoEl = document.getElementById('nback-info');
      const labelEl = document.getElementById('nback-n-label');
      if (infoEl) infoEl.textContent = `Level N = ${this.nLevel}`;
      if (labelEl) labelEl.textContent = this.nLevel;
    }

    this.timer = setTimeout(() => {
      cells.forEach(c => c.classList.remove('active'));
      setTimeout(() => this.nextStep(), 300);
    }, 1700);
  },

  checkMatch() {
    if (this.userPressed) return;
    this.userPressed = true;

    if (this.history.length <= this.nLevel) {
      this.falseAlarms++;
      if (typeof playSound === 'function') playSound('wrong');
      return;
    }

    const currentCell = this.history[this.history.length - 1];
    const matchCell = this.history[this.history.length - 1 - this.nLevel];

    if (currentCell === matchCell) {
      this.hits++;
      if (typeof playSound === 'function') playSound('correct');
    } else {
      this.falseAlarms++;
      if (typeof playSound === 'function') playSound('wrong');
    }
  },

  bindKeyboard() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        this.checkMatch();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  },

  finish() {
    clearTimeout(this.timer);
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    if (this.onComplete) {
      this.onComplete({
        hits: this.hits,
        misses: this.misses,
        false_alarms: this.falseAlarms,
        max_n: this.maxN
      });
    }
  }
};
