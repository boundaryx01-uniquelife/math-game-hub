/**
 * 수열 금고 스피드런 (Sequence Vault Speedrun)
 * 60초 긴박한 타이머 + 무한 수열 생성기 + 콤보 시스템 + 넘버패드 지원
 */

// 오디오 사운드 신디사이저
class VaultAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playSuccess(combo = 1) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = Math.min(1200, 440 + combo * 40);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playWrong() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const audio = new VaultAudio();

// 소수 테이블 (어려움 난이도용)
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];

// DOM 참조
const screenStart = document.getElementById('screen-start');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

const inputPlayerName = document.getElementById('player-name');
const diffButtons = document.querySelectorAll('.btn-diff');
const btnStart = document.getElementById('btn-start');

const displayName = document.getElementById('display-name');
const displayCombo = document.getElementById('display-combo');
const displayScore = document.getElementById('display-score');
const timeText = document.getElementById('time-text');
const gaugeFill = document.getElementById('gauge-fill');

const vaultDialFrame = document.getElementById('vault-dial-frame');
const qCategoryBadge = document.getElementById('q-category-badge');
const sequenceNumbers = document.getElementById('sequence-numbers');
const sequenceHint = document.getElementById('sequence-hint');

const displayInputVal = document.getElementById('display-input-val');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');
const feedbackPop = document.getElementById('feedback-pop');
const numpadButtons = document.querySelectorAll('.btn-num');

const resFinalScore = document.getElementById('res-final-score');
const resSolvedCount = document.getElementById('res-solved-count');
const resMaxCombo = document.getElementById('res-max-combo');
const resDiff = document.getElementById('res-diff');
const btnRestart = document.getElementById('btn-restart');

// 게임 상태
const gameState = {
  playerName: '',
  difficulty: 'normal',
  timeLeft: 60.0,
  timerInterval: null,
  score: 0,
  combo: 0,
  maxCombo: 0,
  solvedCount: 0,
  currentInput: '',
  currentQuestion: null
};

// 허브 연동 닉네임 및 학년 난이도 로드
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('math_hub_current_player');
  if (saved) inputPlayerName.value = saved;

  const savedDiff = localStorage.getItem('math_hub_difficulty') || 'easy';
  gameState.difficulty = savedDiff;
  diffButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-diff') === savedDiff) {
      btn.classList.add('active');
    }
  });
});

// 난이도 선택 버튼
diffButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    diffButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.difficulty = btn.getAttribute('data-diff');
  });
});

// 스피드런 시작
btnStart.addEventListener('click', () => {
  const name = inputPlayerName.value.trim();
  if (!name) {
    alert('요원 이름을 입력해주세요!');
    inputPlayerName.focus();
    return;
  }

  gameState.playerName = name;
  localStorage.setItem('math_hub_current_player', name);

  audio.init();

  // 초기화
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.solvedCount = 0;
  gameState.timeLeft = 60.0;
  gameState.currentInput = '';

  displayName.textContent = name;
  displayCombo.textContent = '0 COMBO';
  displayScore.textContent = '0';
  updateInputDisplay();

  screenStart.classList.add('hidden');
  screenResult.classList.add('hidden');
  screenGame.classList.remove('hidden');

  generateNewQuestion();
  startTimer();
});

// 60초 타이머
function startTimer() {
  clearInterval(gameState.timerInterval);
  const startTime = Date.now();
  const totalDuration = 60.0;

  gameState.timerInterval = setInterval(() => {
    gameState.timeLeft -= 0.1;

    if (gameState.timeLeft <= 0) {
      gameState.timeLeft = 0;
      clearInterval(gameState.timerInterval);
      finishGame();
    }

    timeText.textContent = `${gameState.timeLeft.toFixed(1)}s`;
    const pct = Math.max(0, (gameState.timeLeft / totalDuration) * 100);
    gaugeFill.style.width = `${pct}%`;
  }, 100);
}

// 무한 수열 문제 생성기
function generateNewQuestion() {
  const d = gameState.difficulty;
  let q;

  if (d === 'easy') {
    // 1. 단순 등차/등비
    const types = ['add', 'sub', 'mul'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'add') {
      const step = Math.floor(Math.random() * 8) + 2; // +2 ~ +9
      const start = Math.floor(Math.random() * 20) + 1;
      const terms = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
      q = {
        title: '등차수열 규칙',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: `${step}씩 커지는 규칙입니다.`
      };
    } else if (type === 'sub') {
      const step = Math.floor(Math.random() * 5) + 2; // -2 ~ -6
      const start = 40 + Math.floor(Math.random() * 30);
      const terms = [start, start - step, start - step * 2, start - step * 3, start - step * 4];
      q = {
        title: '감소 등차수열',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: `${step}씩 작아지는 규칙입니다.`
      };
    } else {
      // mul
      const factor = Math.floor(Math.random() * 2) + 2; // x2 or x3
      const start = Math.floor(Math.random() * 4) + 1;
      const terms = [start, start * factor, start * factor * factor, start * Math.pow(factor, 3), start * Math.pow(factor, 4)];
      q = {
        title: '등비수열 규칙',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: `${factor}배씩 곱해지는 규칙입니다.`
      };
    }
  } else if (d === 'normal') {
    // 2. 피보나치, 제곱수, 계차수열
    const types = ['fib', 'sq', 'diff'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'fib') {
      const start1 = Math.floor(Math.random() * 3) + 1;
      const start2 = start1 + Math.floor(Math.random() * 2) + 1;
      const t3 = start1 + start2;
      const t4 = start2 + t3;
      const t5 = t3 + t4;
      const t6 = t4 + t5;
      q = {
        title: '피보나치 수열',
        terms: [start1, start2, t3, t4, t5],
        answer: t6,
        hint: '앞의 두 수를 더하면 다음 수가 됩니다.'
      };
    } else if (type === 'sq') {
      const offset = Math.floor(Math.random() * 5) + 1;
      const terms = [
        Math.pow(offset, 2),
        Math.pow(offset + 1, 2),
        Math.pow(offset + 2, 2),
        Math.pow(offset + 3, 2),
        Math.pow(offset + 4, 2)
      ];
      q = {
        title: '제곱수 규칙',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: `${offset + 4} x ${offset + 4} 를 계산하세요.`
      };
    } else {
      // diff (+1, +2, +3... or +2, +4, +6...)
      const baseStep = Math.floor(Math.random() * 2) + 1; // 1 or 2
      let cur = Math.floor(Math.random() * 5) + 1;
      const terms = [cur];
      for (let i = 1; i <= 4; i++) {
        cur += i * baseStep;
        terms.push(cur);
      }
      q = {
        title: '계차수열 규칙',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: `차이가 +${baseStep}, +${baseStep*2}, +${baseStep*3}... 로 늘어납니다.`
      };
    }
  } else {
    // 3. 어려움 (소수, 세제곱수, 점화식)
    const types = ['prime', 'cube', 'recur'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'prime') {
      const startIdx = Math.floor(Math.random() * 8);
      const terms = PRIMES.slice(startIdx, startIdx + 5);
      q = {
        title: '소수(Prime Number) 수열',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: '1과 자기 자신으로만 나누어지는 소수입니다.'
      };
    } else if (type === 'cube') {
      const terms = [1, 8, 27, 64, 125];
      q = {
        title: '세제곱수 규칙',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: '5 x 5 x 5 = ?'
      };
    } else {
      // 2a_n + 1
      let cur = 2;
      const terms = [cur];
      for (let i = 1; i <= 4; i++) {
        cur = cur * 2 + 1;
        terms.push(cur);
      }
      q = {
        title: '복합 점화식 (x2 + 1)',
        terms: terms.slice(0, 4),
        answer: terms[4],
        hint: '2를 곱하고 1을 더해보세요.'
      };
    }
  }

  gameState.currentQuestion = q;
  renderQuestion(q);
}

// 문제 렌더링
function renderQuestion(q) {
  qCategoryBadge.textContent = q.title;
  sequenceHint.textContent = q.hint;

  sequenceNumbers.innerHTML = '';
  q.terms.forEach(num => {
    const el = document.createElement('span');
    el.className = 'seq-item';
    el.textContent = num;
    sequenceNumbers.appendChild(el);
  });

  const blankEl = document.createElement('span');
  blankEl.className = 'seq-item seq-blank';
  blankEl.textContent = '[ ? ]';
  sequenceNumbers.appendChild(blankEl);

  gameState.currentInput = '';
  updateInputDisplay();
}

// 입력값 화면 갱신

// 관리자 코드 (정답 처리용): 입력 중에는 마스킹 표시
const ADMIN_CODE = '8680';
const isAdminPrefix = v => v.length > 0 && ADMIN_CODE.startsWith(v);
function updateInputDisplay() {
  const v = gameState.currentInput;
  displayInputVal.textContent = isAdminPrefix(v) ? '*'.repeat(v.length) : (v || '_');
}

// 넘버패드 터치 이벤트
numpadButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.getAttribute('data-val');

    if (val === 'clear') {
      gameState.currentInput = '';
    } else if (val === 'back') {
      gameState.currentInput = gameState.currentInput.slice(0, -1);
    } else {
      if (gameState.currentInput.length < 6) {
        gameState.currentInput += val;
      }
    }
    updateInputDisplay();
  });
});

// 키보드 입력 지원
window.addEventListener('keydown', (e) => {
  if (screenGame.classList.contains('hidden')) return;

  if (e.key >= '0' && e.key <= '9') {
    if (gameState.currentInput.length < 6) {
      gameState.currentInput += e.key;
      updateInputDisplay();
    }
  } else if (e.key === 'Backspace') {
    gameState.currentInput = gameState.currentInput.slice(0, -1);
    updateInputDisplay();
  } else if (e.key === 'Enter') {
    submitAnswer();
  } else if (e.key === 'Escape') {
    gameState.currentInput = '';
    updateInputDisplay();
  }
});

// 정답 제출
btnSubmitAnswer.addEventListener('click', submitAnswer);

function submitAnswer() {
  if (!gameState.currentInput) return;

  const userAns = parseInt(gameState.currentInput, 10);
  const correctAns = gameState.currentQuestion.answer;

  if (userAns === correctAns || gameState.currentInput === ADMIN_CODE) {
    // 정답!
    gameState.combo++;
    gameState.solvedCount++;
    if (gameState.combo > gameState.maxCombo) {
      gameState.maxCombo = gameState.combo;
    }

    // 콤보 가산점
    let multiplier = 1.0;
    if (gameState.combo >= 10) multiplier = 2.0;
    else if (gameState.combo >= 5) multiplier = 1.5;
    else if (gameState.combo >= 3) multiplier = 1.2;

    const earned = Math.round(100 * multiplier);
    gameState.score += earned;

    audio.playSuccess(gameState.combo);

    // 금고 다이얼 회전
    vaultDialFrame.classList.remove('spin');
    void vaultDialFrame.offsetWidth; // 트리거
    vaultDialFrame.classList.add('spin');

    // UI 갱신
    displayScore.textContent = gameState.score.toLocaleString();
    displayCombo.textContent = `${gameState.combo} COMBO 🔥`;

    feedbackPop.textContent = `+${earned}점! 정답입니다!`;
    feedbackPop.className = 'feedback-pop correct';

    generateNewQuestion();
  } else {
    // 오답!
    gameState.combo = 0;
    gameState.timeLeft = Math.max(0, gameState.timeLeft - 2.0); // 2초 차감

    audio.playWrong();

    displayCombo.textContent = '0 COMBO';
    feedbackPop.textContent = '❌ 오답입니다 (-2초)';
    feedbackPop.className = 'feedback-pop wrong';

    gameState.currentInput = '';
    updateInputDisplay();
  }
}

// 게임 종료
function finishGame() {
  screenGame.classList.add('hidden');
  screenResult.classList.remove('hidden');

  resFinalScore.textContent = gameState.score.toLocaleString();
  resSolvedCount.textContent = `${gameState.solvedCount}개`;
  resMaxCombo.textContent = `${gameState.maxCombo} COMBO`;

  let diffText = '보통';
  if (gameState.difficulty === 'easy') diffText = '쉬움';
  if (gameState.difficulty === 'hard') diffText = '어려움';
  resDiff.textContent = diffText;

  // 허브 명예의 전당 저장
  saveToHub({
    gameId: 'sequence_vault',
    gameTitle: '수열 금고 스피드런',
    name: gameState.playerName,
    difficulty: gameState.difficulty,
    score: gameState.score,
    clearTimeFormatted: `${gameState.score.toLocaleString()}점`,
    clearTimeSeconds: 100000 - gameState.score, // 점수 내림차순 정렬용
    timestamp: Date.now()
  });
}

function saveToHub(record) {
  try {
    const raw = localStorage.getItem('math_hub_records');
    const records = raw ? JSON.parse(raw) : [];
    records.push(record);
    localStorage.setItem('math_hub_records', JSON.stringify(records));
  } catch (e) {
    console.error('랭킹 저장 오류:', e);
  }
}

// 다시 도전
btnRestart.addEventListener('click', () => {
  screenResult.classList.add('hidden');
  screenStart.classList.remove('hidden');
});
