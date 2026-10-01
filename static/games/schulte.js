// Schulte Table Mini-Game Engine
const SchulteGame = {
  nextNum: 1,
  penalties: 0,
  startTime: 0,
  timerInterval: null,
  onComplete: null,

  start(container, onComplete) {
    this.onComplete = onComplete;
    this.nextNum = 1;
    this.penalties = 0;

    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    numbers.sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <div style="width:100%; max-width:500px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-weight:700;">
          <span>GAME 3/3: SCHULTE TABLE</span>
          <span id="schulte-timer">Time: 0.0s</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.9rem;">Tap numbers 1 to 25 in order as fast as possible!</p>
        
        <div class="schulte-grid" id="schulte-grid">
          ${numbers.map(n => `<div class="schulte-cell" onclick="SchulteGame.tap(${n}, this)">${n}</div>`).join('')}
        </div>

        <button class="btn-icon" style="margin-top:1rem;" onclick="SchulteGame.finish()">Skip Game &rarr;</button>
      </div>
    `;

    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      const timerEl = document.getElementById('schulte-timer');
      if (timerEl) timerEl.textContent = `Time: ${elapsed}s (Penalties: +${this.penalties}s)`;
    }, 100);
  },

  tap(num, cellEl) {
    if (num === this.nextNum) {
      cellEl.style.visibility = 'hidden';
      this.nextNum++;
      if (typeof playSound === 'function') playSound('correct');
      if (this.nextNum > 25) {
        this.finish();
      }
    } else {
      this.penalties++;
      if (typeof playSound === 'function') playSound('wrong');
      cellEl.classList.add('wrong');
      setTimeout(() => cellEl.classList.remove('wrong'), 400);
    }
  },

  finish() {
    clearInterval(this.timerInterval);
    const totalTime = (Date.now() - this.startTime) / 1000;

    if (this.onComplete) {
      this.onComplete({
        total_time: totalTime,
        penalties: this.penalties
      });
    }
  }
};
