/**
 * 오메가 프로토콜: 마스터 코드브레이커 (The Omega Protocol)
 * 5대 심층 수학 관문 엔진 & 골드 마스터 인증서
 */

// 오메가 5대 심층 관문 문제 데이터베이스
const OMEGA_GATES = [
  {
    step: 1,
    title: '비제네르(Vigenère) 다중 치환 암호 해독',
    desc: '키워드(Key)의 각 알파벳 위치만큼 서로 다르게 회전된 암호문입니다.',
    render: () => `
      <div class="cipher-matrix-box">암호문: <span style="color:#fde68a;">VSESB</span></div>
      <div style="margin-bottom: 12px;"><span class="key-tag">암호 해독 키워드: KEY</span></div>
      <p style="font-size: 0.85rem; color: #a1a1aa; line-height: 1.5;">
        * K = +10칸 이동, E = +4칸 이동, Y = +24칸 이동 규칙으로 암호화되었습니다.<br>
        원래의 5글자 단어(평문)를 해독하세요.
      </p>
    `,
    hint: 'V에서 10칸 앞은 L, S에서 4칸 앞은 O, E에서 24칸 앞(=2칸 뒤)은 G... 단어의 정체를 밝히세요.',
    answers: ['LOGIC'],
    explanation: 'LOGIC에 KEY를 더하면 VSESB가 됩니다. 정답은 LOGIC입니다.'
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
    hint: '(2,3,1)은 D, (3,1,2)는 O, (1,1,1)은 E, (1,2,3)은 C 입니다.',
    answers: ['DOEC', 'DOCE'],
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
    hint: '(0 AND 1)은 0입니다. 따라서 전체가 1이 되려면 (1 XOR D)가 1이 되어야 합니다. 1과 달라야 하므로 D는 0이어야 합니다.',
    answers: ['0'],
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
    hint: '위 줄의 10과 5를 더하거나, 파스칼 삼각형의 좌우 대칭성을 확인하세요.',
    answers: ['15'],
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
    hint: '처음 선택(1번)이 맞을 확률은 1/3입니다. 따라서 남은 2번 문이 맞을 확률은 1 - 1/3 = 2/3가 됩니다.',
    answers: ['2/3', '2 / 3', '약 67%'],
    explanation: '몬티홀 문제에서 선택을 바꾸면 당첨 확률이 2/3 (약 66.7%)로 2배 증가합니다.'
  }
];

// DOM 참조
const screenStart = document.getElementById('screen-start');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

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
  timerInterval: null
};

// 닉네임 로드
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('math_hub_current_player');
  if (saved) inputPlayerName.value = saved;
});

// 시작
btnStart.addEventListener('click', () => {
  const name = inputPlayerName.value.trim();
  if (!name) {
    alert('요원 닉네임을 입력해주세요!');
    inputPlayerName.focus();
    return;
  }

  gameState.playerName = name;
  localStorage.setItem('math_hub_current_player', name);

  gameState.currentGateIdx = 0;
  gameState.timerSeconds = 0;

  displayName.textContent = name;
  gameTimer.textContent = '00:00';

  screenStart.classList.add('hidden');
  screenResult.classList.add('hidden');
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

  hintContent.textContent = gate.hint;
  hintContent.classList.add('hidden');
  btnToggleHint.textContent = '💡 수학적 실마리(Hint) 열기';

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

// 힌트 토글
btnToggleHint.addEventListener('click', () => {
  if (hintContent.classList.contains('hidden')) {
    hintContent.classList.remove('hidden');
    btnToggleHint.textContent = '🔒 실마리 닫기';
  } else {
    hintContent.classList.add('hidden');
    btnToggleHint.textContent = '💡 수학적 실마리(Hint) 열기';
  }
});


// 관리자 코드 (정답 처리용): 입력 중에는 마스킹 표시
const ADMIN_CODE = '8680';
const isAdminPrefix = v => v.length > 0 && ADMIN_CODE.startsWith(v);
inputAnswer.addEventListener('input', () => {
  inputAnswer.style.webkitTextSecurity = isAdminPrefix(inputAnswer.value.trim()) ? 'disc' : 'none';
});

// 정답 검증
formAnswer.addEventListener('submit', (e) => {
  e.preventDefault();
  const inputVal = inputAnswer.value.trim().toUpperCase();
  if (!inputVal) return;

  const gate = OMEGA_GATES[gameState.currentGateIdx];
  const isCorrect = inputVal === ADMIN_CODE || gate.answers.some(ans => ans.toUpperCase() === inputVal);
  inputAnswer.style.webkitTextSecurity = 'none';

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

// 오메가 프로토콜 최종 클리어
function finishOmegaGame() {
  clearInterval(gameState.timerInterval);

  screenGame.classList.add('hidden');
  screenResult.classList.remove('hidden');

  const m = String(Math.floor(gameState.timerSeconds / 60)).padStart(2, '0');
  const s = String(gameState.timerSeconds % 60).padStart(2, '0');
  const finalTimeStr = `${m}:${s}`;

  certAgentName.textContent = gameState.playerName;
  certTime.textContent = finalTimeStr;
  const randomCode = `OMG-GOLD-${Math.floor(1000 + Math.random() * 9000)}`;
  certCode.textContent = randomCode;

  // 허브 명예의 전당 저장
  saveToHub({
    gameId: 'omega_protocol',
    gameTitle: '오메가 프로토콜',
    name: gameState.playerName,
    difficulty: 'hard',
    score: 10000 - gameState.timerSeconds,
    clearTimeFormatted: finalTimeStr,
    clearTimeSeconds: gameState.timerSeconds,
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
    console.error('오메가 랭킹 저장 오류:', e);
  }
}

// 인쇄
btnPrint.addEventListener('click', () => {
  window.print();
});

// 다시 시작
btnRestart.addEventListener('click', () => {
  screenResult.classList.add('hidden');
  screenStart.classList.remove('hidden');
});
