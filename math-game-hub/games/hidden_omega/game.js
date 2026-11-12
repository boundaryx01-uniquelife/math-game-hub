/**
 * 오메가 프로토콜: 마스터 코드브레이커 (The Omega Protocol)
 * 5대 심층 수학 관문 엔진 & 골드 마스터 인증서
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

// 오메가 5대 심층 관문 문제 데이터베이스
const OMEGA_GATES = [
  {
    step: 1,
    title: '비제네르(Vigenère) 다중 치환 암호 해독',
    desc: '키워드(Key)의 각 알파벳 위치만큼 서로 다르게 회전된 암호문입니다.',
    render: () => `
      <div class="cipher-matrix-box">암호문: <span style="color:#fde68a;">VSESG</span></div>
      <div style="margin-bottom: 12px;"><span class="key-tag">암호 해독 키워드: KEY</span></div>
      <p style="font-size: 0.85rem; color: #a1a1aa; line-height: 1.5;">
        * K = +10칸 이동, E = +4칸 이동, Y = +24칸 이동 규칙으로 암호화되었습니다.<br>
        원래의 5글자 단어(평문)를 해독하세요.
      </p>
    `,
    hint1: '비제네르 암호는 글자마다 이동하는 칸 수가 달라요. 키워드 KEY의 K, E, Y가 각각 몇 칸인지 알아보고, 암호문 글자를 키워드 글자와 하나씩 짝지어 보세요. 키워드가 모자라면 처음부터 다시 반복해요.',
    hint2: '첫 글자 V는 K(10칸)만큼 밀렸으니, 알파벳에서 10칸 앞으로 되돌려 보세요. 둘째 글자 S는 E(4칸), 셋째 글자 E는 Y(24칸)이고, 넷째 글자는 다시 K로 돌아와요. (A보다 더 앞으로 가면 Z로 이어져요.)',
    answers: ['LOGIC'],
    steps: [
      '키워드 KEY를 암호문 길이(5글자)만큼 반복해서 짝지어요: K E Y K E 가 V S E S G 와 하나씩 짝이에요.',
      '알파벳에 번호를 붙여요 (A=0, B=1, C=2, …, Z=25). K=10, E=4, Y=24 이므로 이동한 칸 수는 10, 4, 24, 10, 4 예요.',
      '각 글자를 이동한 칸 수만큼 앞으로 되돌려요 (0보다 작아지면 26을 더해요): V(21)−10=11 → L, S(18)−4=14 → O, E(4)−24=−20 → −20+26=6 → G, S(18)−10=8 → I, G(6)−4=2 → C',
      'L, O, G, I, C 를 차례대로 이으면 LOGIC 이에요.'
    ],
    explanation: 'LOGIC에 KEY를 더하면 VSESG가 됩니다. 정답은 LOGIC입니다.'
  },
  {
    step: 2,
    title: '3차원 입체 공간 좌표 (X, Y, Z) 큐브 매핑',
    desc: '가로(X), 세로(Y), 높이(Z) 3차원 공간 격자에서 숨겨진 4글자 암호를 추출하세요.',
    render: () => `
      <div style="background: rgba(255,255,255,0.04); padding: 16px; border-radius: 12px; margin-bottom: 14px; text-align: left;">
        <div style="font-family: var(--font-mono); font-size: 0.95rem; margin-bottom: 8px; color: #c084fc;">
          <strong>[3D 큐브 좌표 데이터]</strong><br>
          • 1번 글자: (1, 2, 3) ➔ <strong>C</strong><br>
          • 2번 글자: (3, 1, 2) ➔ <strong>O</strong><br>
          • 3번 글자: (2, 3, 1) ➔ <strong>D</strong><br>
          • 4번 글자: (1, 1, 1) ➔ <strong>E</strong>
        </div>
        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 10px;">
          <strong>질문:</strong> 위 큐브 좌표계를 따를 때, 좌표 <strong>(2,3,1), (3,1,2), (1,1,1), (1,2,3)</strong>가 가리키는 4글자 단어는 무엇일까요?
        </div>
      </div>
    `,
    hint1: '3차원 좌표 (X, Y, Z)는 세 수가 한 세트예요. 위의 [3D 큐브 좌표 데이터]에서 어떤 좌표가 어떤 글자를 가리키는지 먼저 짝을 맞춰 보세요.',
    hint2: '질문의 좌표를 쓰인 순서대로 하나씩 읽어요. 첫 번째는 (2,3,1), 두 번째는 (3,1,2), 세 번째는 (1,1,1), 마지막은 (1,2,3)이에요. 각 좌표를 데이터 목록에서 찾아 옆에 적힌 글자를 읽으세요.',
    answers: ['DOEC'],
    steps: [
      '[3D 큐브 좌표 데이터]에 좌표와 글자가 짝지어 있어요: (1,2,3)=C, (3,1,2)=O, (2,3,1)=D, (1,1,1)=E',
      '질문에 나온 좌표를 순서대로 목록에서 찾아요: (2,3,1) → D, (3,1,2) → O, (1,1,1) → E, (1,2,3) → C',
      '읽은 글자를 차례대로 이으면 D, O, E, C → DOEC 예요. (질문의 좌표 순서가 데이터 목록 순서와 다른 점에 주의!)'
    ],
    explanation: 'D, O, E, C 순서로 결합된 DOEC 입니다.'
  },
  {
    step: 3,
    title: '논리 게이트 회로망 (Logic Gate Matrix)',
    desc: 'AND, OR, XOR 복합 논리 회로의 최종 출력을 1(TRUE)로 만드는 입력값을 추론하세요.',
    render: () => `
      <div style="background: rgba(255,255,255,0.04); padding: 16px; border-radius: 12px; margin-bottom: 14px; text-align: left;">
        <div style="font-family: var(--font-mono); font-size: 1rem; color: #fde68a; margin-bottom: 10px;">
          <strong>회로 연산식:</strong> Output = (A <strong>AND</strong> B) <strong>OR</strong> (C <strong>XOR</strong> D)
        </div>
        <p style="font-size: 0.85rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 8px;">
          • AND : 둘 다 1일 때만 1<br>
          • OR  : 둘 중 하나라도 1이면 1<br>
          • XOR : 둘이 서로 다를 때만 1
        </p>
        <div style="font-size: 0.9rem; color: #38bdf8;">
          현재 입력 상태: <strong>A = 0, B = 1, C = 1</strong><br>
          최종 Output을 <strong>1</strong>로 만들기 위한 <strong>D의 값(0 또는 1)</strong>은 무엇일까요?
        </div>
      </div>
    `,
    hint1: '위에 적힌 AND, OR, XOR 규칙을 읽고 괄호 안부터 하나씩 계산해 보세요. 전체가 1이 되려면 OR의 왼쪽과 오른쪽 중 어느 쪽이 1이어야 할지 생각해 보세요.',
    hint2: '먼저 왼쪽 괄호 (A AND B)에 주어진 A와 B 값을 넣어 계산해 보세요. OR는 하나라도 1이면 1인데, 왼쪽 결과가 1이 아니라면 오른쪽 (C XOR D)가 반드시 1이어야 해요. XOR가 1이 되려면 C와 D가 서로 같아야 할까요, 달라야 할까요?',
    answers: ['0'],
    steps: [
      'AND는 둘 다 1일 때만 1이에요. A는 0, B는 1 이므로 (A AND B)는 0 이에요.',
      'OR는 하나라도 1이면 1이에요. 왼쪽이 0 이니까, 전체가 1이 되려면 오른쪽 (C XOR D)가 1이어야 해요.',
      'XOR는 서로 다를 때만 1이에요. C는 1 이므로 D는 1과 달라야 하고, 그래서 D는 0 이에요.',
      '확인: (0 AND 1)=0, (1 XOR 0)=1, 0 OR 1 = 1 이라서 Output이 1이 돼요.'
    ],
    explanation: '(0 AND 1)=0 이므로 (1 XOR D)=1 이 되기 위해 D=0이어야 합니다.'
  },
  {
    step: 4,
    title: '파스칼(Pascal) 삼각형 & 이항계수 복합 수열',
    desc: '파스칼 삼각형 6번째 행의 숨겨진 빈칸 숫자를 계산하세요.',
    render: () => `
      <div class="pascal-diagram">
        <div class="pascal-row"><span class="p-item">1</span></div>
        <div class="pascal-row"><span class="p-item">1</span><span class="p-item">1</span></div>
        <div class="pascal-row"><span class="p-item">1</span><span class="p-item">2</span><span class="p-item">1</span></div>
        <div class="pascal-row"><span class="p-item">1</span><span class="p-item">3</span><span class="p-item">3</span><span class="p-item">1</span></div>
        <div class="pascal-row"><span class="p-item">1</span><span class="p-item">4</span><span class="p-item">6</span><span class="p-item">4</span><span class="p-item">1</span></div>
        <div class="pascal-row"><span class="p-item">1</span><span class="p-item">5</span><span class="p-item">10</span><span class="p-item">10</span><span class="p-item">5</span><span class="p-item">1</span></div>
        <div class="pascal-row">
          <span class="p-item">1</span>
          <span class="p-item">6</span>
          <span class="p-item">15</span>
          <span class="p-item">20</span>
          <span class="p-item p-blank">[ ? ]</span>
          <span class="p-item">6</span>
          <span class="p-item">1</span>
        </div>
      </div>
    `,
    hint1: '파스칼 삼각형에서는 각 칸의 수가 "바로 위 줄에서 이웃한 두 칸의 합"이에요. 빈칸 바로 위에 있는 두 칸을 찾아보세요.',
    hint2: '빈칸 위의 줄은 1, 5, 10, 10, 5, 1 이에요. 빈칸의 왼쪽 위 칸은 10, 오른쪽 위 칸은 5 예요. 이 두 수를 더하면 어떻게 될까요? (삼각형이 좌우 대칭이라는 점으로 확인할 수도 있어요.)',
    answers: ['15'],
    steps: [
      '파스칼 삼각형의 규칙: 각 칸의 수 = 바로 위 줄에서 이웃한 두 칸의 합 (양 끝은 항상 1).',
      '규칙이 맞는지 먼저 확인해요: 아랫줄의 20은 위 줄의 10 + 10, 왼쪽의 15는 위 줄의 5 + 10 이에요.',
      '빈칸은 위 줄의 10(왼쪽 위)과 5(오른쪽 위) 사이 아래에 있어요. 10 + 5 = 15',
      '좌우 대칭으로도 확인해요: 이 줄은 1, 6, 15, 20, 15, 6, 1 이라서 빈칸은 왼쪽 15와 같은 15 예요.'
    ],
    explanation: '10 + 5 = 15 또는 대칭에 의해 15입니다.'
  },
  {
    step: 5,
    title: '몬티홀 딜레마 & 조건부 확률 역설 챔버',
    desc: '3개의 문 중 1개에 슈퍼카가 있습니다. 문을 바꿀 때의 수학적 당첨 확률은 얼마일까요?',
    render: () => `
      <div style="background: rgba(255,255,255,0.04); padding: 18px; border-radius: 12px; margin-bottom: 14px; text-align: left;">
        <div style="font-size: 0.95rem; color: #fde68a; margin-bottom: 10px; font-weight: 700;">
          🚪 3개의 문(1, 2, 3번) 중 1개에만 자동차가 있습니다.
        </div>
        <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 10px;">
          1. 당신이 1번 문을 선택했습니다.<br>
          2. 사회자가 자동차가 없는 3번 문(염소)을 열어 보여주었습니다.<br>
          3. 사회자가 <strong>"2번 문으로 선택을 바꾸시겠습니까?"</strong>라고 물었습니다.
        </p>
        <div style="font-size: 0.9rem; color: #34d399; font-weight: 700;">
          질문: 선택을 2번 문으로 바꿀 때, 자동차에 당첨될 확률을 기약분수(예: 2/3) 형태로 입력하세요!
        </div>
      </div>
    `,
    hint1: '문이 3개이고 자동차는 1개뿐이에요. 처음에 1번 문을 골랐을 때, 그 문에 자동차가 있을 확률이 얼마인지부터 생각해 보세요.',
    hint2: '처음 선택이 맞을 확률과 틀릴 확률을 더하면 1이에요. 사회자는 항상 염소 문만 열어 주니까, 처음 선택이 틀렸다면 남은 문에 자동차가 있어요. 그러니 "문을 바꿔서 이기는 경우"는 "처음 선택이 틀렸던 경우"와 같아요.',
    answers: ['2/3', '2 / 3', '약 67%'],
    steps: [
      '자동차가 있는 문은 1번, 2번, 3번 중 하나이고 확률은 똑같이 각각 1/3 이에요.',
      '내가 1번을 골랐을 때 자동차 위치별로 "문을 바꾸면" 어떻게 되는지 볼게요. 자동차가 1번이면 바꾸면 져요. 자동차가 2번이면 사회자는 3번을 열고, 바꾸면 이겨요. 자동차가 3번이면 사회자는 2번을 열고, 바꾸면 이겨요.',
      '세 가지 경우 중 바꿔서 이기는 경우는 2가지예요. 다른 말로, 처음 선택이 틀릴 확률 1 − 1/3 = 2/3 과 같아요.',
      '그래서 문을 바꾸면 당첨 확률은 2/3 (약 67%)예요. 바꾸지 않으면 1/3 이니까 바꾸는 쪽이 2배 유리해요.'
    ],
    explanation: '몬티홀 문제에서 선택을 바꾸면 당첨 확률이 2/3 (약 66.7%)로 2배 증가합니다.'
  }
];

// DOM 참조
const screenStart = document.getElementById('screen-start');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');
const screenRank = document.getElementById('screen-rank');
let lastRecord = null;

const inputPlayerName = document.getElementById('player-name');
const btnStart = document.getElementById('btn-start');

const displayName = document.getElementById('display-name');
const gameTimer = document.getElementById('game-timer');
const displayGateProgress = document.getElementById('display-gate-progress');
const omegaSteps = document.querySelectorAll('.omega-step');

const gatePill = document.getElementById('gate-pill');
const gateTitle = document.getElementById('gate-title');
const gateDesc = document.getElementById('gate-desc');
const gateDisplayBox = document.getElementById('gate-display-box');

const btnToggleHint = document.getElementById('btn-toggle-hint');
const hintContent = document.getElementById('hint-content');

const formAnswer = document.getElementById('form-answer');
const inputAnswer = document.getElementById('input-answer');
const feedbackMsg = document.getElementById('feedback-msg');

const certAgentName = document.getElementById('cert-agent-name');
const certTime = document.getElementById('cert-time');
const certCode = document.getElementById('cert-code');
const btnPrint = document.getElementById('btn-print');
const btnRestart = document.getElementById('btn-restart');

// 게임 상태
const gameState = {
  playerName: '',
  currentGateIdx: 0,
  timerSeconds: 0,
  timerInterval: null,
  masterKeyUsed: 0
};

// 닉네임 로드
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('math_hub_current_player');
  if (saved) inputPlayerName.value = saved;
});

// 시작
btnStart.addEventListener('click', async () => {
  const name = inputPlayerName.value.trim();
  if (!name) {
    window.MathHubUI.toast('요원 닉네임을 입력해 주세요!', 'warn');
    inputPlayerName.focus();
    return;
  }

  gameState.playerName = name;
  localStorage.setItem('math_hub_current_player', name);

  await assistReady; // 힌트/풀이 도우미 로딩 대기 (보통 이미 끝나 있음)

  gameState.currentGateIdx = 0;
  gameState.timerSeconds = 0;
  gameState.masterKeyUsed = 0;

  displayName.textContent = name;
  gameTimer.textContent = '00:00';

  screenStart.classList.add('hidden');
  screenResult.classList.add('hidden');
  screenRank.classList.add('hidden');
  screenGame.classList.remove('hidden');

  startTimer();
  loadGate(0);
});

function startTimer() {
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(() => {
    gameState.timerSeconds++;
    const m = String(Math.floor(gameState.timerSeconds / 60)).padStart(2, '0');
    const s = String(gameState.timerSeconds % 60).padStart(2, '0');
    gameTimer.textContent = `${m}:${s}`;
  }, 1000);
}

// 관문 로드
function loadGate(idx) {
  gameState.currentGateIdx = idx;
  const gate = OMEGA_GATES[idx];

  gatePill.textContent = `GATE ${gate.step}`;
  gateTitle.textContent = gate.title;
  gateDesc.textContent = gate.desc;
  gateDisplayBox.innerHTML = gate.render();

  // 힌트 2단계: 힌트 1(접근법) → 힌트 2(구체적인 단계, 정답은 말하지 않음)
  ensureHints();
  if (hintStager) hintStager.set(gate.hint1, gate.hint2);
  else hintContent.textContent = '힌트를 불러오지 못했습니다.';

  inputAnswer.value = '';
  feedbackMsg.textContent = '';
  feedbackMsg.className = 'feedback-msg';

  displayGateProgress.textContent = `GATE ${gate.step} / 5`;

  omegaSteps.forEach((step, sIdx) => {
    step.classList.remove('active');
    if (sIdx < idx) step.classList.add('done');
    else if (sIdx === idx) step.classList.add('active');
  });

  inputAnswer.focus();
}

// 힌트 2단계 (기존 #btn-toggle-hint 는 힌트 1 열기/닫기, 힌트 2 버튼은 JS가 만들어 #hint-content 뒤에 붙임)
let hintStager = null;
function ensureHints() {
  if (hintStager || !window.MathAssist) return;
  hintStager = window.MathAssist.createHints({
    content: hintContent,
    toggle: btnToggleHint,
    openText: '💡 수학적 실마리(Hint) 열기',
    closeText: '🔒 실마리 닫기',
    hint2Text: '🔎 실마리 2 보기 (더 자세히)'
  });
}


// 마스터 키 (정답+풀이 패널 열기용): 입력 중에는 마스킹 표시
const ADMIN_CODE = '8680';
const isAdminPrefix = v => v.length > 0 && ADMIN_CODE.startsWith(v);
inputAnswer.addEventListener('input', () => {
  inputAnswer.style.webkitTextSecurity = isAdminPrefix(inputAnswer.value.trim()) ? 'disc' : 'none';
});

// 정답 검증
formAnswer.addEventListener('submit', (e) => {
  e.preventDefault();
  if (window.MathAssist && window.MathAssist.isPanelOpen()) return;
  const inputVal = inputAnswer.value.trim().toUpperCase();
  if (!inputVal) return;

  const gate = OMEGA_GATES[gameState.currentGateIdx];
  inputAnswer.style.webkitTextSecurity = 'none';

  // 마스터 키: 정답 처리 대신 "정답 + 풀이" 패널을 보여주고, 닫으면 다음 관문으로 진행
  if (inputVal === ADMIN_CODE) {
    openMasterPanel(gate);
    return;
  }

  const isCorrect = gate.answers.some(ans => ans.toUpperCase() === inputVal);

  if (isCorrect) {
    feedbackMsg.textContent = '✨ 관문 해제 성공! 다음 차원으로 진입합니다.';
    feedbackMsg.className = 'feedback-msg success';

    setTimeout(() => {
      if (gameState.currentGateIdx < OMEGA_GATES.length - 1) {
        loadGate(gameState.currentGateIdx + 1);
      } else {
        finishOmegaGame();
      }
    }, 600);
  } else {
    feedbackMsg.textContent = '❌ 암호 불일치! 수학적 규칙을 다시 검토하세요.';
    feedbackMsg.className = 'feedback-msg error';
    inputAnswer.select();
  }
});

// 마스터 키 패널
// - 패널이 열려 있는 동안 타이머를 멈추고 (풀이를 읽는 시간이 기록에 들어가지 않음), "다음 문제로"를 누르면 다시 흐름
// - 기록 저장 방식은 그대로이고, masterKeyUsed(사용 횟수)를 함께 저장
function openMasterPanel(gate) {
  inputAnswer.value = '';
  if (!window.MathAssist) {
    feedbackMsg.textContent = '❌ 도우미 스크립트를 불러오지 못해 마스터 키를 쓸 수 없습니다.';
    feedbackMsg.className = 'feedback-msg error';
    return;
  }
  gameState.masterKeyUsed = (gameState.masterKeyUsed || 0) + 1;
  clearInterval(gameState.timerInterval);
  window.MathAssist.showPanel({
    answer: gate.answers[0],
    steps: gate.steps,
    note: '마스터 키를 사용했어요. 이 창이 열려 있는 동안 시간은 멈춰 있어요.',
    nextLabel: '다음 문제로',
    onNext: () => {
      if (gameState.currentGateIdx < OMEGA_GATES.length - 1) {
        startTimer(); // 경과 시간은 유지한 채 다시 흐름 (startTimer 는 시간을 0으로 되돌리지 않음)
        loadGate(gameState.currentGateIdx + 1);
      } else {
        finishOmegaGame();
      }
    }
  });
}

// 오메가 프로토콜 최종 클리어
function finishOmegaGame() {
  clearInterval(gameState.timerInterval);

  screenGame.classList.add('hidden');

  const m = String(Math.floor(gameState.timerSeconds / 60)).padStart(2, '0');
  const s = String(gameState.timerSeconds % 60).padStart(2, '0');
  const finalTimeStr = `${m}:${s}`;

  certAgentName.textContent = gameState.playerName;
  certTime.textContent = finalTimeStr;
  const randomCode = `OMG-GOLD-${Math.floor(1000 + Math.random() * 9000)}`;
  certCode.textContent = randomCode;

  // 명예의 전당 저장
  lastRecord = {
    gameId: 'omega_protocol',
    gameTitle: '오메가 프로토콜',
    name: gameState.playerName,
    difficulty: 'hard',
    score: 10000 - gameState.timerSeconds,
    clearTimeFormatted: finalTimeStr,
    clearTimeSeconds: gameState.timerSeconds,
    timestamp: Date.now(),
    ...(gameState.masterKeyUsed ? { masterKeyUsed: gameState.masterKeyUsed } : {})
  };
  saveToHub(lastRecord);
  showRank();
}

// 끝나면 순위 TOP 10을 먼저 보여 주고, 골드 인증서는 버튼으로 볼 수 있게
function showRank() {
  screenResult.classList.add('hidden');
  screenGame.classList.add('hidden');
  screenRank.classList.remove('hidden');
  const level = localStorage.getItem('math_hub_difficulty') || 'all';
  window.MathHubRank.mount(screenRank, {
    difficulty: level,
    finished: lastRecord,
    actions: [
      { label: '📄 골드 인증서 보기', variant: 'omega', onClick: showResult },
      { label: '🔄 다시 도전하기', onClick: restartGame }
    ]
  });
}
function showResult() {
  screenRank.classList.add('hidden');
  screenResult.classList.remove('hidden');
}
function restartGame() {
  screenResult.classList.add('hidden');
  screenRank.classList.add('hidden');
  screenStart.classList.remove('hidden');
}

function saveToHub(record) {
  try {
    const raw = localStorage.getItem('math_hub_records');
    const records = raw ? JSON.parse(raw) : [];
    records.push(record);
    localStorage.setItem('math_hub_records', JSON.stringify(records));
  } catch (e) {
    console.error('오메가 랭킹 저장 오류:', e);
  }
}

// 인쇄
btnPrint.addEventListener('click', () => {
  window.print();
});

// 다시 시작 / 순위 보기 / 처음 화면으로
btnRestart.addEventListener('click', restartGame);
document.getElementById('btn-to-rank').addEventListener('click', showRank);
document.getElementById('btn-result-intro').addEventListener('click', () => window.MathHubRank.goIntro());
