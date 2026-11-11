/**
 * 수열 금고 스피드런 (Sequence Vault Speedrun)
 * 60초 긴박한 타이머 + 무한 수열 생성기 + 콤보 시스템 + 넘버패드 지원
 */

// ---- 도우미 스크립트 로딩 (file:// 에서도 동작하도록 <script> 태그 주입) ----
const SCRIPT_BASE = (document.currentScript && document.currentScript.src) || location.href;
const assistReady = window.MathAssist ? Promise.resolve(true) : new Promise((resolve) => {
  try {
    const sc = document.createElement('script');
    sc.src = new URL('../../shared/assist.js', SCRIPT_BASE).href;
    sc.onload = () => resolve(true);
    sc.onerror = () => resolve(false);
    document.head.appendChild(sc);
  } catch (e) {
    resolve(false);
  }
});

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
  currentQuestion: null,
  masterKeyUsed: 0
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
btnStart.addEventListener('click', async () => {
  const name = inputPlayerName.value.trim();
  if (!name) {
    window.MathHubUI.toast('요원 이름을 입력해 주세요!', 'warn');
    inputPlayerName.focus();
    return;
  }

  gameState.playerName = name;
  localStorage.setItem('math_hub_current_player', name);

  audio.init();
  await assistReady; // 힌트/풀이 도우미 로딩 대기 (보통 이미 끝나 있음)

  // 초기화
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.solvedCount = 0;
  gameState.timeLeft = 60.0;
  gameState.currentInput = '';
  gameState.masterKeyUsed = 0;

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

// 무한 수열 문제 생성기: 난이도별 규칙(kind)을 골라 {title, terms, answer, kind} 를 만듦
function buildQuestion(d) {
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
        kind: 'arith' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
      };
    } else if (type === 'sub') {
      const step = Math.floor(Math.random() * 5) + 2; // -2 ~ -6
      const start = 40 + Math.floor(Math.random() * 30);
      const terms = [start, start - step, start - step * 2, start - step * 3, start - step * 4];
      q = {
        title: '감소 등차수열',
        terms: terms.slice(0, 4),
        answer: terms[4],
        kind: 'arith' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
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
        kind: 'geom' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
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
        kind: 'fib' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
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
        kind: 'squares' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
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
        kind: 'diffarith' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
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
        kind: 'primes' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
      };
    } else if (type === 'cube') {
      const terms = [1, 8, 27, 64, 125];
      q = {
        title: '세제곱수 규칙',
        terms: terms.slice(0, 4),
        answer: terms[4],
        kind: 'cubes' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
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
        kind: 'affine' // 힌트1/힌트2/풀이는 shared/assist.js 가 규칙(kind)과 항에서 만들어 줍니다
      };
    }
  }

  return withAssist(q);
}

// 규칙(kind)과 보이는 항(terms)에서 힌트 1/2 와 풀이를 붙임 (answer 가 규칙 계산 결과와 같은지 확인)
function withAssist(q) {
  const A = (typeof window !== 'undefined' && window.MathAssist) || null;
  const info = A ? A.seq.info(q.terms, q.kind, q.answer) : null;
  if (info && Number(info.answer) === Number(q.answer)) {
    q.hint1 = info.hint1;
    q.hint2 = info.hint2;
    q.explain = info.explain;
  } else {
    q.hint1 = '이웃한 두 수의 차이나 곱하는 수를 살펴보세요.';
    q.hint2 = '앞의 수에서 뒤의 수로 가는 계산이 무엇인지 처음 두 수로 찾아보세요.';
    q.explain = [`규칙(${q.title})에 따라 계산하면 정답은 ${q.answer}입니다.`];
  }
  return q;
}

function generateNewQuestion() {
  const q = buildQuestion(gameState.difficulty);
  gameState.currentQuestion = q;
  renderQuestion(q);
}

// 문제 렌더링
function renderQuestion(q) {
  qCategoryBadge.textContent = q.title;
  ensureHints();
  if (hintStager) hintStager.set(q.hint1, q.hint2);

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

// 힌트 2단계: #sequence-hint 에는 평소 안내 문구, 힌트 버튼은 JS가 만들어 그 뒤에 붙임
let hintStager = null;
const SEQ_IDLE_HINT = sequenceHint.textContent;
function ensureHints() {
  if (hintStager || !window.MathAssist) return;
  hintStager = window.MathAssist.createHints({
    content: sequenceHint,
    openText: '💡 힌트 보기',
    closeText: '🔒 힌트 닫기',
    idleText: SEQ_IDLE_HINT,
    alwaysVisible: true,
    noFocusSteal: true // 숫자/Enter 키 입력이 버튼에 가로채이지 않도록
  });
}

// 입력값 화면 갱신

// 마스터 키 (정답+풀이 패널 열기용): 입력 중에는 마스킹 표시
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
  if (window.MathAssist && window.MathAssist.isPanelOpen()) return;

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

  if (window.MathAssist && window.MathAssist.isPanelOpen()) return;

  // 마스터 키: 점수 없이 "정답 + 풀이" 패널을 보여주고, 닫으면 다음 문제로
  if (gameState.currentInput === ADMIN_CODE) {
    openMasterPanel();
    return;
  }

  const userAns = parseInt(gameState.currentInput, 10);
  const correctAns = gameState.currentQuestion.answer;

  if (userAns === correctAns) {
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

// 마스터 키 패널
// - 패널이 열려 있는 동안 60초 타이머를 멈추고, "다음 문제로"를 누르면 남은 시간부터 다시 흐름 (읽는 시간으로 손해 보지 않음)
// - 학생이 푼 것이 아니므로 점수/풀이 수는 올리지 않고, 콤보는 끊지도 올리지도 않음. 다음 문제로 넘어감
// - 기록(허브 랭킹)에는 masterKeyUsed(사용 횟수)를 함께 저장
function openMasterPanel() {
  gameState.currentInput = '';
  updateInputDisplay();
  if (!window.MathAssist) {
    feedbackPop.textContent = '❌ 도우미 스크립트를 불러오지 못해 마스터 키를 쓸 수 없습니다.';
    feedbackPop.className = 'feedback-pop wrong';
    return;
  }
  const q = gameState.currentQuestion;
  gameState.masterKeyUsed = (gameState.masterKeyUsed || 0) + 1;
  clearInterval(gameState.timerInterval);
  window.MathAssist.showPanel({
    answer: q.answer,
    steps: q.explain,
    note: '마스터 키를 사용했어요. 이 창이 열려 있는 동안 시간은 멈춰 있고, 이 문제는 점수에 들어가지 않아요.',
    nextLabel: '다음 문제로',
    onNext: () => {
      feedbackPop.textContent = '🔑 마스터 키로 넘어갔어요 (점수 없음)';
      feedbackPop.className = 'feedback-pop';
      generateNewQuestion();
      if (gameState.timeLeft > 0) startTimer();
    }
  });
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
    timestamp: Date.now(),
    ...(gameState.masterKeyUsed ? { masterKeyUsed: gameState.masterKeyUsed } : {})
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
