// Speed Math Mini-Game Engine
const MathGame = {
  durationSec: 60,
  timer: null,
  currentAns: 0,
  correctCount: 0,
  totalCount: 0,
  rtList: [],
  startTime: 0,
  onComplete: null,

  start(container, onComplete) {
    this.onComplete = onComplete;
    this.correctCount = 0;
    this.totalCount = 0;
    this.rtList = [];

    container.innerHTML = `
      <div style="width:100%; max-width:500px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-weight:700;">
          <span style="color:var(--primary-blue);">GAME 2/3: SPEED MATH</span>
          <span id="math-time">Time: 60s</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem;">Solve mental arithmetic problems as quickly as possible!</p>

        <div id="math-problem" style="font-size:3.5rem; font-weight:800; margin:1.5rem 0; color:var(--text-dark);">2 + 2 = ?</div>
        
        <div class="stroop-buttons" id="math-options">
          <!-- Answer buttons injected here -->
        </div>

        <button class="btn-icon" style="margin-top:1.5rem;" onclick="MathGame.finish()">Skip Game &rarr;</button>
      </div>
    `;

    let secondsLeft = this.durationSec;
    this.timer = setInterval(() => {
      secondsLeft--;
      const timeEl = document.getElementById('math-time');
      if (timeEl) timeEl.textContent = `Time: ${secondsLeft}s`;
      if (secondsLeft <= 0) this.finish();
    }, 1000);

    this.nextQuestion();
  },

  nextQuestion() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const isAdd = Math.random() > 0.5;

    this.currentAns = isAdd ? a + b : a * b;
    const opStr = isAdd ? '+' : '×';

    const probEl = document.getElementById('math-problem');
    if (probEl) probEl.textContent = `${a} ${opStr} ${b} = ?`;

    // Generate 4 options
    const options = [this.currentAns];
    while (options.length < 4) {
      const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const fake = this.currentAns + delta;
      if (fake > 0 && !options.includes(fake)) options.push(fake);
    }

    options.sort(() => Math.random() - 0.5);

    const optsEl = document.getElementById('math-options');
    if (optsEl) {
      optsEl.innerHTML = options.map(opt => `
        <button class="stroop-btn" onclick="MathGame.answer(${opt})">${opt}</button>
      `).join('');
    }

    this.startTime = Date.now();
  },

  answer(chosen) {
    const rt = Date.now() - this.startTime;
    this.totalCount++;

    if (chosen === this.currentAns) {
      this.correctCount++;
      this.rtList.push(rt);
      if (typeof playSound === 'function') playSound('correct');
    } else {
      if (typeof playSound === 'function') playSound('wrong');
    }

    this.nextQuestion();
  },

  finish() {
    clearInterval(this.timer);
    const avgRt = this.rtList.length > 0 ? this.rtList.reduce((a,b)=>a+b,0) / this.rtList.length : 2500;

    if (this.onComplete) {
      this.onComplete({
        correct: this.correctCount,
        total: this.totalCount,
        avg_rt: avgRt
      });
    }
  }
};
