// Memory Matrix Mini-Game Engine
const MatrixGame = {
  gridSize: 4,
  targetCount: 4,
  level: 1,
  targets: [],
  userSelected: [],
  canClick: false,
  roundCount: 0,
  maxRounds: 5,
  totalCells: 0,
  correctCells: 0,
  onComplete: null,

  start(container, onComplete) {
    this.onComplete = onComplete;
    this.level = 1;
    this.targetCount = 4;
    this.roundCount = 0;
    this.totalCells = 0;
    this.correctCells = 0;

    container.innerHTML = `
      <div style="width:100%; max-width:500px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-weight:700;">
          <span style="color:var(--primary-blue);">GAME 1/3: MEMORY MATRIX</span>
          <span id="matrix-info">Round 1/5 &bull; Level 1</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">Memorize the highlighted blue pattern, then tap the same squares after they hide!</p>
        
        <div class="nback-grid" id="matrix-grid" style="grid-template-columns: repeat(4, 70px); gap: 8px; margin: 1.5rem auto;">
          ${Array.from({length: 16}, (_, i) => `<div class="nback-cell" data-idx="${i}" style="width:70px; height:70px; cursor:pointer;" onclick="MatrixGame.tap(${i}, this)"></div>`).join('')}
        </div>

        <button class="btn-icon" style="margin-top:1rem;" onclick="MatrixGame.finish()">Skip Game &rarr;</button>
      </div>
    `;

    this.nextRound();
  },

  nextRound() {
    this.roundCount++;
    if (this.roundCount > this.maxRounds) {
      this.finish();
      return;
    }

    document.getElementById('matrix-info').textContent = `Round ${this.roundCount}/${this.maxRounds} • Level ${this.level}`;
    
    // Pick random target cells
    this.targets = [];
    this.userSelected = [];
    this.canClick = false;

    while (this.targets.length < this.targetCount) {
      const rand = Math.floor(Math.random() * 16);
      if (!this.targets.includes(rand)) this.targets.push(rand);
    }

    const cells = document.querySelectorAll('#matrix-grid .nback-cell');
    cells.forEach((c, idx) => {
      c.classList.remove('active', 'wrong');
      c.style.background = '';
      if (this.targets.includes(idx)) {
        c.classList.add('active');
      }
    });

    // Hide pattern after 2 seconds
    setTimeout(() => {
      cells.forEach(c => c.classList.remove('active'));
      this.canClick = true;
    }, 2000);
  },

  tap(idx, cellEl) {
    if (!this.canClick || this.userSelected.includes(idx)) return;
    this.userSelected.push(idx);

    if (this.targets.includes(idx)) {
      cellEl.classList.add('active');
      if (typeof playSound === 'function') playSound('correct');
    } else {
      cellEl.style.background = '#ef4444';
      if (typeof playSound === 'function') playSound('wrong');
    }

    if (this.userSelected.length === this.targets.length) {
      this.canClick = false;
      this.totalCells += this.targets.length;
      const roundCorrect = this.userSelected.filter(i => this.targets.includes(i)).length;
      this.correctCells += roundCorrect;

      if (roundCorrect === this.targets.length) {
        this.level++;
        this.targetCount = Math.min(8, this.targetCount + 1);
      } else {
        this.targetCount = Math.max(3, this.targetCount - 1);
      }

      setTimeout(() => this.nextRound(), 1000);
    }
  },

  finish() {
    if (this.onComplete) {
      this.onComplete({
        correct: this.correctCells,
        total: this.totalCells || 1,
        level: this.level
      });
    }
  }
};
