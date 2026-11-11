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
  elapsedSeconds: 0
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

// 초기 문제은행 로딩
async function loadQuestionBank() {
  try {
    const res = await fetch('../../data/cipher_bank.json');
    if (res.ok) {
      const data = await res.json();
      questionBank = data;
      console.log('JSON 문제은행 로드 완료 (120문항)');
    }
  } catch (err) {
    console.warn('JSON 로드 실패, 내장 문제은행으로 대체 작동합니다.', err);
  }
}
loadQuestionBank();

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
btnStart.addEventListener('click', () => {
  const name = inputPlayerName.value.trim();
  if (!name) {
    alert('수학탐정 요원 이름을 입력해주세요!');
    inputPlayerName.focus();
    return;
  }

  gameState.playerName = name;
  localStorage.setItem('math_hub_current_player', name);

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

  // 1. 절차적 무한 생성 엔진(ProceduralGenerator) 우선 적용 (100% 무중복)
  if (typeof window.ProceduralGenerator !== 'undefined') {
    gameState.selectedQuestions = {
      1: window.ProceduralGenerator.generateCaesar(d),
      2: window.ProceduralGenerator.generateCoordinate(d),
      3: window.ProceduralGenerator.generateBinary(d),
      4: window.ProceduralGenerator.generateSequence(d)
    };
    console.log('✨ 무한 절차적 문제 생성기 작동 완료 (고유 문제 생성)');
    return;
  }

  // 2. Fallback 문제은행
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  gameState.selectedQuestions = {
    1: getRandom(questionBank.caesar[d] || questionBank.caesar.normal),
    2: getRandom(questionBank.coordinate[d] || questionBank.coordinate.normal),
    3: getRandom(questionBank.binary[d] || questionBank.binary.normal),
    4: getRandom(questionBank.sequence[d] || questionBank.sequence.normal)
  };
}

// 타이머 시작
function startTimer() {
  gameState.elapsedSeconds = 0;
  gameTimer.textContent = '00:00';
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

  // 힌트 및 입력 초기화
  hintContent.classList.add('hidden');
  hintContent.textContent = q.hint || '힌트가 제공되지 않는 문제입니다.';
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

// 힌트 토글
btnToggleHint.addEventListener('click', () => {
  hintContent.classList.toggle('hidden');
});


// 관리자 코드 (정답 처리용): 입력 중에는 마스킹 표시
const ADMIN_CODE = '8680';
const isAdminPrefix = v => v.length > 0 && ADMIN_CODE.startsWith(v);
inputAnswer.addEventListener('input', () => {
  inputAnswer.style.webkitTextSecurity = isAdminPrefix(inputAnswer.value.trim()) ? 'disc' : 'none';
});

// 정답 확인 핸들러
formAnswer.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawInput = inputAnswer.value.trim().toUpperCase().replace(/\s+/g, '');
  if (!rawInput) return;

  const currentQ = gameState.selectedQuestions[gameState.currentStep];
  const targetAnswer = String(currentQ.answer).trim().toUpperCase().replace(/\s+/g, '');

  if (rawInput === targetAnswer || rawInput === ADMIN_CODE) {
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
    timestamp: Date.now()
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
