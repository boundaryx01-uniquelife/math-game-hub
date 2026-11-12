/**
 * 수학탐정단: 암호 연구소 탈출 미션 (Cipher Escape v2)
 * Hub 연동 및 문제은행 비동기/내장 Fallback 지원
 */

// 5x5 알파벳 좌표 그리드 매핑 테이블 (가로 X: 1~5, 세로 Y: 1~5)
const COORD_GRID = {
  cols: 5,
  rows: 5,
  data: [
    ['A', 'B', 'C', 'D', 'E'], // Y=1: (1,1)=A, (2,1)=B, (3,1)=C, (4,1)=D, (5,1)=E
    ['F', 'G', 'H', 'I', 'J'], // Y=2: (1,2)=F, (2,2)=G, (3,2)=H, (4,2)=I, (5,2)=J
    ['K', 'L', 'M', 'N', 'O'], // Y=3: (1,3)=K, (2,3)=L, (3,3)=M, (4,3)=N, (5,3)=O
    ['P', 'Q', 'R', 'S', 'T'], // Y=4: (1,4)=P, (2,4)=Q, (3,4)=R, (4,4)=S, (5,4)=T
    ['U', 'V', 'W', 'X', 'Y']  // Y=5: (1,5)=U, (2,5)=V, (3,5)=W, (4,5)=X, (5,5)=Y
  ]
};

// Fallback 문제은행 데이터 (네트워크 실패 또는 file:// 직접 열기 대비)
let questionBank = {
  caesar: {
    easy: [{ id: "c_e_01", shift: 1, ciphertext: "NBUI", answer: "MATH", hint: "각 알파벳을 1칸 뒤로(A←B) 되돌려보세요." }],
    normal: [{ id: "c_n_01", shift: 3, ciphertext: "PDWK", answer: "MATH", hint: "P에서 3칸 뒤는 M (M, N, O, P)" }],
    hard: [{ id: "c_h_01", shift: 5, ciphertext: "RFXYNTS", answer: "MYSTERY", hint: "5칸 앞의 알파벳을 찾아보세요." }]
  },
  coordinate: {
    easy: [{ id: "co_e_01", answer: "CAT", coords: ["(3,1)", "(1,1)", "(5,4)"], hint: "가로(X), 세로(Y) 순서로 찾으세요." }],
    normal: [{ id: "co_n_01", answer: "MATH", coords: ["(3,3)", "(1,1)", "(5,4)", "(3,2)"], hint: "M=(3,3), A=(1,1), T=(5,4), H=(3,2)" }],
    hard: [{ id: "co_h_01", answer: "ESCAPE", coords: ["(5,1)", "(4,4)", "(3,1)", "(1,1)", "(1,4)", "(5,1)"], hint: "E, S, C, A, P, E 6글자를 순서대로 찾아보세요." }]
  },
  binary: {
    easy: [{ id: "b_e_01", binary: "0101", answer: "5", hint: "4 + 1 = 5" }],
    normal: [{ id: "b_n_01", binary: "1100", answer: "12", hint: "8 + 4 = 12" }],
    hard: [{ id: "b_h_01", binary: "11001", answer: "25", hint: "16 + 8 + 1 = 25" }]
  },
  sequence: {
    easy: [{ id: "s_e_01", sequence: "2, 4, 6, 8, [ ? ]", answer: "10", hint: "2씩 더해지는 등차수열입니다." }],
    normal: [{ id: "s_n_01", sequence: "1, 1, 2, 3, 5, 8, [ ? ]", answer: "13", hint: "피보나치 수열 (5+8)." }],
    hard: [{ id: "s_h_01", sequence: "2, 3, 5, 7, 11, 13, [ ? ]", answer: "17", hint: "소수(Prime Number) 수열입니다." }]
  }
};

// 게임 상태 관리 객체
const gameState = {
  playerName: '',
  difficulty: 'normal', // 'easy' | 'normal' | 'hard'
  currentStep: 1,       // 1: 시저, 2: 좌표, 3: 이진수, 4: 수열
  selectedQuestions: {},
  timerInterval: null,
  elapsedSeconds: 0,
  masterKeyUsed: 0,
  currentInfo: null
};

// DOM 요소 참조
const screenStart = document.getElementById('screen-start');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

const inputPlayerName = document.getElementById('player-name');
const diffButtons = document.querySelectorAll('.btn-diff');
const btnStart = document.getElementById('btn-start');

const displayAgentName = document.getElementById('display-agent-name');
const displayDiff = document.getElementById('display-diff');
const gameTimer = document.getElementById('game-timer');
const stepItems = document.querySelectorAll('.step-item');

const roomBadge = document.getElementById('room-badge');
const roomTitle = document.getElementById('room-title');
const roomDesc = document.getElementById('room-desc');
const cipherDisplayBox = document.getElementById('cipher-display-box');

const btnToggleHint = document.getElementById('btn-toggle-hint');
const hintContent = document.getElementById('hint-content');

const formAnswer = document.getElementById('form-answer');
const inputAnswer = document.getElementById('input-answer');
const feedbackMsg = document.getElementById('feedback-msg');

const certAgentName = document.getElementById('cert-agent-name');
const certDiff = document.getElementById('cert-diff');
const certTime = document.getElementById('cert-time');
const certCode = document.getElementById('cert-code');
const btnPrint = document.getElementById('btn-print');
const btnRestart = document.getElementById('btn-restart');

// ---- 외부 스크립트 로딩 (file:// 에서도 동작하도록 <script> 태그 주입 방식 사용) ----
// game.js 가 놓인 위치를 기준으로 상대경로를 해석합니다.
const SCRIPT_BASE = (document.currentScript && document.currentScript.src) || location.href;
function injectScript(relPath) {
  return new Promise((resolve) => {
    try {
      const s = document.createElement('script');
      s.src = new URL(relPath, SCRIPT_BASE).href;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    } catch (e) {
      resolve(false);
    }
  });
}

// 힌트/풀이 도우미 (shared/assist.js)
const assistReady = window.MathAssist ? Promise.resolve(true) : injectScript('../../shared/assist.js');

// 문제은행이 실제 120문항(JS 또는 JSON)으로 로드되었는지
let bankLoaded = false;
// 문제은행 문항을 섞어 쓰는 비율 (0 = 절차적 생성기만, 1 = 문제은행만). 문제은행이 로드되고 생성기도 있을 때 적용
const BANK_SHARE = 0.5;

// 초기 문제은행 로딩: window.CIPHER_BANK(data/cipher_bank.js) → fetch(cipher_bank.json) → 내장 Fallback
async function loadQuestionBank() {
  if (!window.CIPHER_BANK) {
    await injectScript('../../data/cipher_bank.js');
  }
  if (window.CIPHER_BANK) {
    questionBank = window.CIPHER_BANK;
    bankLoaded = true;
    console.log('JS 문제은행 로드 완료 (120문항)');
    return;
  }
  try {
    const res = await fetch('../../data/cipher_bank.json');
    if (res.ok) {
      questionBank = await res.json();
      bankLoaded = true;
      console.log('JSON 문제은행 로드 완료 (120문항)');
    }
  } catch (err) {
    console.warn('문제은행 로드 실패, 내장 문제은행으로 대체 작동합니다.', err);
  }
}
const bankReady = loadQuestionBank();
const resourcesReady = Promise.all([assistReady, bankReady]);

// 허브에서 전달된 플레이어 이름 및 학년 난이도 자동 채우기
window.addEventListener('DOMContentLoaded', () => {
  const savedPlayer = localStorage.getItem('math_hub_current_player');
  if (savedPlayer) {
    inputPlayerName.value = savedPlayer;
  }

  // 인트로에서 선택한 학년 난이도 자동 적용
  const savedDiff = localStorage.getItem('math_hub_difficulty') || 'easy';
  gameState.difficulty = savedDiff;
  diffButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-diff') === savedDiff) {
      btn.classList.add('active');
    }
  });

  // 인트로(등록 → 미션 이야기)에서 바로 넘어오면 시작 화면을 건너뛰고 첫 문제부터 시작
  if (/[?&]from=intro\b/.test(location.search)) {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (savedPlayer && savedPlayer.trim()) setTimeout(() => btnStart.click(), 0);
  }
});

// 난이도 선택 버튼 이벤트
diffButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    diffButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.difficulty = btn.getAttribute('data-diff');
  });
});

// 미션 시작
btnStart.addEventListener('click', async () => {
  const name = inputPlayerName.value.trim();
  if (!name) {
    window.MathHubUI.toast('요원 이름을 입력해 주세요!', 'warn');
    inputPlayerName.focus();
    return;
  }

  gameState.playerName = name;
  localStorage.setItem('math_hub_current_player', name);

  // 도우미 스크립트와 문제은행 로딩이 끝날 때까지 잠깐 대기 (보통 이미 끝나 있음)
  await resourcesReady;
  gameState.masterKeyUsed = 0;

  // 단계별 1문제씩 무작위 선정
  pickRandomQuestions();

  // 화면 전환 및 초기화
  displayAgentName.textContent = name;
  displayDiff.textContent = getDiffName(gameState.difficulty);

  screenStart.classList.add('hidden');
  screenGame.classList.remove('hidden');

  startTimer();
  gameState.currentStep = 1;
  loadCurrentStep();
});

// 난이도 한글명
function getDiffName(diff) {
  switch (diff) {
    case 'easy': return '쉬움';
    case 'hard': return '어려움';
    default: return '보통';
  }
}

// 문제 랜덤 및 무한 절차적 픽업
function pickRandomQuestions() {
  const d = gameState.difficulty;
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const hasGen = typeof window.ProceduralGenerator !== 'undefined';
  const gen = hasGen ? window.ProceduralGenerator : null;
  const genFns = { 1: 'generateCaesar', 2: 'generateCoordinate', 3: 'generateBinary', 4: 'generateSequence' };
  const bankKeys = { 1: 'caesar', 2: 'coordinate', 3: 'binary', 4: 'sequence' };

  const picked = {};
  for (let step = 1; step <= 4; step++) {
    const bankList = (questionBank[bankKeys[step]] && (questionBank[bankKeys[step]][d] || questionBank[bankKeys[step]].normal)) || [];
    // 절차적 생성기(무중복)와 문제은행(120문항)을 섞어서 출제. 생성기가 없으면 문제은행/내장 Fallback만 사용
    const useBank = !hasGen || (bankLoaded && bankList.length > 0 && Math.random() < BANK_SHARE);
    picked[step] = useBank ? getRandom(bankList) : gen[genFns[step]](d);
  }
  gameState.selectedQuestions = picked;
}

// 타이머 시작
function startTimer() {
  gameState.elapsedSeconds = 0;
  gameTimer.textContent = '00:00';
  resumeTimer();
}

// 타이머 (재)개시: 경과 시간은 유지한 채로 흐름만 다시 시작 (마스터 키 패널 종료 후에도 사용)
function resumeTimer() {
  clearInterval(gameState.timerInterval);

  gameState.timerInterval = setInterval(() => {
    gameState.elapsedSeconds++;
    const min = String(Math.floor(gameState.elapsedSeconds / 60)).padStart(2, '0');
    const sec = String(gameState.elapsedSeconds % 60).padStart(2, '0');
    gameTimer.textContent = `${min}:${sec}`;
  }, 1000);
}

// 현재 단계 로드
function loadCurrentStep() {
  const step = gameState.currentStep;
  const q = gameState.selectedQuestions[step];

  // 스텝 인디케이터 업데이트
  stepItems.forEach(item => {
    const itemStep = parseInt(item.getAttribute('data-step'), 10);
    item.classList.remove('active', 'completed');
    if (itemStep === step) item.classList.add('active');
    else if (itemStep < step) item.classList.add('completed');
  });

  // 힌트(2단계) 및 입력 초기화: 힌트 1은 접근법, 힌트 2는 더 구체적인 단계 (정답은 말하지 않음)
  gameState.currentInfo = window.MathAssist ? window.MathAssist.cipherInfo(step, q) : null;
  ensureHints();
  if (hintStager && gameState.currentInfo) {
    hintStager.set(gameState.currentInfo.hint1, gameState.currentInfo.hint2);
  } else {
    hintContent.textContent = '힌트를 불러오지 못했습니다.';
  }
  feedbackMsg.textContent = '';
  feedbackMsg.className = 'feedback-msg';
  inputAnswer.value = '';
  inputAnswer.focus();

  // 각 단계별 문제 렌더링
  if (step === 1) {
    roomBadge.textContent = 'ROOM 1';
    roomTitle.textContent = '보안 1구역: 시저 암호 해독';
    roomDesc.textContent = `알파벳이 일정한 칸수(+${q.shift || 3})만큼 뒤로 밀려있습니다. 원래 단어를 복원하세요.`;
    cipherDisplayBox.innerHTML = `
      <div class="code-banner">${q.ciphertext}</div>
      <div class="shift-info">이동 규칙: ${q.shift}칸 뒤로 밀림 (A → ${String.fromCharCode(65 + (q.shift || 1))})</div>
    `;
  } else if (step === 2) {
    roomBadge.textContent = 'ROOM 2';
    roomTitle.textContent = '보안 2구역: 좌표 암호 해독';
    roomDesc.textContent = '좌표 그리드에서 (가로 X, 세로 Y) 위치의 알파벳을 찾아 순서대로 단어를 만드세요.';
    
    // 5x5 테이블 생성
    let tableHtml = '<table class="coord-table"><thead><tr><th>Y\\X</th>';
    for (let c = 1; c <= 5; c++) tableHtml += `<th>${c}</th>`;
    tableHtml += '</tr></thead><tbody>';

    for (let r = 0; r < 5; r++) {
      const y = r + 1;
      tableHtml += `<tr><th>${y}</th>`;
      for (let c = 0; c < 5; c++) {
        tableHtml += `<td>${COORD_GRID.data[r][c]}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';

    const chipsHtml = q.coords.map(coord => `<span class="coord-chip">${coord}</span>`).join('');

    cipherDisplayBox.innerHTML = `
      <div class="coord-grid-container">
        ${tableHtml}
        <div class="coord-clues">${chipsHtml}</div>
      </div>
    `;
  } else if (step === 3) {
    roomBadge.textContent = 'ROOM 3';
    roomTitle.textContent = '보안 3구역: 이진수 암호 해독';
    roomDesc.textContent = '컴퓨터의 언어인 2진수를 10진수 숫자로 변환하여 잠금을 해제하세요.';
    
    const bits = q.binary.split('');
    const bitLen = bits.length;
    let bitsHtml = '<div class="binary-bits-row">';
    bits.forEach((bit, idx) => {
      const power = bitLen - 1 - idx;
      const weight = Math.pow(2, power);
      bitsHtml += `
        <div class="bit-card ${bit === '1' ? 'on' : ''}">
          <span class="bit-pos">${weight}의 자리</span>
          <span class="bit-val">${bit}</span>
        </div>
      `;
    });
    bitsHtml += '</div>';

    cipherDisplayBox.innerHTML = `
      <div class="code-banner mono">${q.binary} (2진수)</div>
      ${bitsHtml}
    `;
  } else if (step === 4) {
    roomBadge.textContent = 'ROOM 4';
    roomTitle.textContent = '보안 4구역: 수열 암호 해독';
    roomDesc.textContent = '숫자들 사이에 숨겨진 수학적 규칙을 찾아 [ ? ]에 들어갈 숫자를 맞히세요.';
    cipherDisplayBox.innerHTML = `
      <div class="seq-row">${q.sequence}</div>
    `;
  }
}

// 힌트 2단계 (기존 #btn-toggle-hint 는 힌트 1 열기/닫기, 힌트 2 버튼은 JS가 만들어 #hint-content 뒤에 붙임)
let hintStager = null;
function ensureHints() {
  if (hintStager || !window.MathAssist) return;
  hintStager = window.MathAssist.createHints({
    content: hintContent,
    toggle: btnToggleHint,
    openText: '💡 힌트 보기',
    closeText: '🔒 힌트 닫기'
  });
}


// 마스터 키 (정답+풀이 패널 열기용): 입력 중에는 마스킹 표시
const ADMIN_CODE = '8680';
const isAdminPrefix = v => v.length > 0 && ADMIN_CODE.startsWith(v);
inputAnswer.addEventListener('input', () => {
  inputAnswer.style.webkitTextSecurity = isAdminPrefix(inputAnswer.value.trim()) ? 'disc' : 'none';
});

// 정답 확인 핸들러
formAnswer.addEventListener('submit', (e) => {
  e.preventDefault();
  if (window.MathAssist && window.MathAssist.isPanelOpen()) return;
  const rawInput = inputAnswer.value.trim().toUpperCase().replace(/\s+/g, '');
  if (!rawInput) return;

  const currentQ = gameState.selectedQuestions[gameState.currentStep];
  const targetAnswer = String(currentQ.answer).trim().toUpperCase().replace(/\s+/g, '');

  // 마스터 키: 정답 처리 대신 "정답 + 풀이" 패널을 보여주고, 닫으면 다음 단계로 진행
  if (rawInput === ADMIN_CODE) {
    openMasterPanel();
    return;
  }

  if (rawInput === targetAnswer) {
    inputAnswer.style.webkitTextSecurity = 'none';
    feedbackMsg.textContent = '🎉 정답입니다! 다음 구역으로 이동합니다.';
    feedbackMsg.className = 'feedback-msg success';

    setTimeout(() => {
      if (gameState.currentStep < 4) {
        gameState.currentStep++;
        loadCurrentStep();
      } else {
        finishGame();
      }
    }, 800);
  } else {
    feedbackMsg.textContent = '❌ 암호가 일치하지 않습니다. 다시 확인해보세요!';
    feedbackMsg.className = 'feedback-msg error';
    inputAnswer.select();
  }
});

// 마스터 키 패널
// - 패널이 열려 있는 동안 타이머를 멈추고 (풀이를 읽는 시간이 기록에 들어가지 않음), "다음 문제로"를 누르면 다시 흐름
// - 학생이 푼 것이 아니므로 기록에 masterKeyUsed(사용 횟수)를 남김. 시간 가산/기록 저장 방식은 그대로
function openMasterPanel() {
  inputAnswer.style.webkitTextSecurity = 'none';
  inputAnswer.value = '';
  if (!window.MathAssist) {
    feedbackMsg.textContent = '❌ 도우미 스크립트를 불러오지 못해 마스터 키를 쓸 수 없습니다.';
    feedbackMsg.className = 'feedback-msg error';
    return;
  }
  const step = gameState.currentStep;
  const q = gameState.selectedQuestions[step];
  const info = gameState.currentInfo || window.MathAssist.cipherInfo(step, q);
  gameState.masterKeyUsed = (gameState.masterKeyUsed || 0) + 1;
  clearInterval(gameState.timerInterval);
  window.MathAssist.showPanel({
    answer: info.answer,
    steps: info.explain,
    note: '마스터 키를 사용했어요. 이 창이 열려 있는 동안 시간은 멈춰 있어요.',
    nextLabel: '다음 문제로',
    onNext: () => {
      if (gameState.currentStep < 4) {
        resumeTimer();
        gameState.currentStep++;
        loadCurrentStep();
      } else {
        finishGame();
      }
    }
  });
}

// 게임 완료 처리
function finishGame() {
  clearInterval(gameState.timerInterval);

  const min = String(Math.floor(gameState.elapsedSeconds / 60)).padStart(2, '0');
  const sec = String(gameState.elapsedSeconds % 60).padStart(2, '0');
  const formattedTime = `${min}:${sec}`;

  // 인증서 정보 기입
  certAgentName.textContent = gameState.playerName;
  certDiff.textContent = getDiffName(gameState.difficulty);
  certTime.textContent = formattedTime;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  certCode.textContent = `MD-2026-${randomSuffix}`;

  // 공통 통합 허브 랭킹 저장 (LocalStorage)
  saveRecordToHub({
    gameId: 'cipher_escape',
    gameTitle: '암호 연구소 탈출',
    name: gameState.playerName,
    difficulty: gameState.difficulty,
    clearTimeSeconds: gameState.elapsedSeconds,
    clearTimeFormatted: formattedTime,
    timestamp: Date.now(),
    ...(gameState.masterKeyUsed ? { masterKeyUsed: gameState.masterKeyUsed } : {})
  });

  // 화면 전환
  screenGame.classList.add('hidden');
  screenResult.classList.remove('hidden');
}

// 공통 허브 랭킹 저장 함수
function saveRecordToHub(record) {
  try {
    const raw = localStorage.getItem('math_hub_records');
    const records = raw ? JSON.parse(raw) : [];
    records.push(record);
    localStorage.setItem('math_hub_records', JSON.stringify(records));
  } catch (err) {
    console.error('랭킹 저장 오류:', err);
  }
}

// 인증서 인쇄
btnPrint.addEventListener('click', () => {
  window.print();
});

// 다시 도전하기
btnRestart.addEventListener('click', () => {
  screenResult.classList.add('hidden');
  screenStart.classList.remove('hidden');
  inputAnswer.value = '';
});
