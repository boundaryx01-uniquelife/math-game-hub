// 수학탐정단: 암호 연구소 탈출 미션 v2 - script.js

// 5x5 문자 격자 (좌표 암호용, 가로/세로 1~5, Z 제외)
const LETTER_GRID = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O'],
  ['P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y']
];

// 난이도별 정답 단어 풀 (시저, 좌표, 이진수용 - 알파벳 Z 배제)
const WORD_POOL = {
  easy: [
    'CAT', 'DOG', 'TOY', 'RED', 'FOX',
    'PIG', 'FLY', 'KEY', 'BOY', 'SUN',
    'BAG', 'CUP', 'MAP', 'RUN', 'SKY',
    'HOT', 'ICE', 'PEN', 'HAT', 'BOX'
  ],
  normal: [
    'MATH', 'GAME', 'STAR', 'BLUE', 'TREE',
    'BOOK', 'FISH', 'WIND', 'CAKE', 'ROSE',
    'MILK', 'BIRD', 'FIRE', 'GOLD', 'HOME',
    'KITE', 'LION', 'MOON', 'PARK', 'SHIP'
  ],
  hard: [
    'SCHOOL', 'PENCIL', 'FLOWER', 'YELLOW', 'GUITAR',
    'SUMMER', 'WINTER', 'CAMERA', 'PUPPY', 'FRIEND',
    'SCIENCE', 'HISTORY', 'LIBRARY', 'ACADEMY', 'COUNTRY',
    'WEATHER', 'JOURNEY', 'HARMONY', 'VICTORY', 'COLLEGE'
  ]
};

// 수열 문제 은행 (난이도별 10개)
const SEQUENCE_QUESTIONS = {
  easy: [
    { seq: "1, 3, 5, 7, ?", ans: ["9"], hint: "2씩 커지는 홀수 수열입니다." },
    { seq: "10, 20, 30, 40, ?", ans: ["50"], hint: "10씩 커지는 수열입니다." },
    { seq: "2, 4, 6, 8, ?", ans: ["10"], hint: "2씩 커지는 짝수 수열입니다." },
    { seq: "5, 10, 15, 20, ?", ans: ["25"], hint: "5씩 커지는(구구단 5단) 수열입니다." },
    { seq: "9, 8, 7, 6, ?", ans: ["5"], hint: "1씩 작아지는 수열입니다." },
    { seq: "3, 6, 9, 12, ?", ans: ["15"], hint: "3씩 커지는(구구단 3단) 수열입니다." },
    { seq: "20, 18, 16, 14, ?", ans: ["12"], hint: "2씩 작아지는 짝수 수열입니다." },
    { seq: "1, 2, 4, 8, ?", ans: ["16"], hint: "앞의 수에 2를 곱해 보세요." },
    { seq: "10, 9, 8, 7, ?", ans: ["6"], hint: "1씩 작아지는 수열입니다." },
    { seq: "4, 8, 12, 16, ?", ans: ["20"], hint: "4씩 커지는(구구단 4단) 수열입니다." }
  ],
  normal: [
    { seq: "2, 4, 8, 16, ?", ans: ["32"], hint: "앞의 수에 2를 곱해 보세요." },
    { seq: "1, 4, 9, 16, ?", ans: ["25"], hint: "1x1, 2x2, 3x3, 4x4... 다음은 몇 곱하기 몇일까요?" },
    { seq: "1, 2, 3, 5, 8, ?", ans: ["13"], hint: "앞의 두 수를 더해서 다음 수가 만들어집니다." },
    { seq: "3, 6, 12, 24, ?", ans: ["48"], hint: "앞의 수에 2를 곱해 보세요." },
    { seq: "1, 3, 7, 13, 21, ?", ans: ["31"], hint: "수 사이의 차이가 2, 4, 6, 8... 씩 늘어납니다." },
    { seq: "80, 40, 20, 10, ?", ans: ["5"], hint: "앞의 수를 2로 나누어 보세요." },
    { seq: "1, 3, 9, 27, ?", ans: ["81"], hint: "앞의 수에 3을 곱해 보세요." },
    { seq: "1, 2, 4, 7, 11, ?", ans: ["16"], hint: "수 사이의 차이가 1, 2, 3, 4... 씩 늘어납니다." },
    { seq: "100, 90, 81, 73, ?", ans: ["66"], hint: "줄어드는 크기가 10, 9, 8... 로 바뀝니다." },
    { seq: "2, 3, 5, 8, 12, ?", ans: ["17"], hint: "수 사이의 차이가 1, 2, 3, 4... 씩 늘어납니다." }
  ],
  hard: [
    { seq: "1, 2, 6, 24, 120, ?", ans: ["720"], hint: "1에 2를 곱하고, 그 다음은 3, 4, 5... 를 곱합니다." },
    { seq: "1, 3, 4, 7, 11, 18, ?", ans: ["29"], hint: "앞의 두 수를 더해서 다음 수가 만들어집니다 (11 + 18)." },
    { seq: "2, 3, 6, 18, 108, ?", ans: ["1944"], hint: "앞의 두 수를 곱해서 다음 수가 만들어집니다 (18 x 108)." },
    { seq: "2, 5, 11, 23, 47, ?", ans: ["95"], hint: "앞의 수에 2를 곱하고 1을 더해 보세요." },
    { seq: "1, 4, 10, 22, 46, ?", ans: ["94"], hint: "앞의 수에 2를 곱하고 2를 더해 보세요." },
    { seq: "3, 5, 9, 17, 33, ?", ans: ["65"], hint: "차이가 2, 4, 8, 16... 처럼 2배씩 늘어납니다." },
    { seq: "1, 8, 27, 64, ?", ans: ["125"], hint: "1x1x1, 2x2x2, 3x3x3... 같은 수를 세 번 곱한 수들입니다." },
    { seq: "2, 6, 12, 20, 30, ?", ans: ["42"], hint: "수 사이의 차이가 4, 6, 8, 10... 씩 늘어납니다." },
    { seq: "1, 2, 5, 14, 41, ?", ans: ["122"], hint: "수 사이의 차이가 3의 거듭제곱(1, 3, 9, 27...)씩 늘어납니다." },
    { seq: "10, 11, 13, 17, 25, ?", ans: ["41"], hint: "수 사이의 차이가 1, 2, 4, 8... 처럼 2배씩 늘어납니다." }
  ]
};

// --- 자동 생성 헬퍼 함수 ---

// 1. 시저 암호화 (알파벳 단어를 shift만큼 뒤로 미룬 암호문 생성)
// 예: MATH, +3 -> PDWK. 학생은 '3칸 앞으로 밀기' 규칙을 보고 MATH로 해독.
function qCaesarWord(word, shift) {
  return word.toUpperCase().split('').map(char => {
    let code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
    }
    return char;
  }).join('');
}

// 2. 좌표 암호화 (5x5 격자 기준)
// 예: M -> (3,3), A -> (1,1) -> "(3,3) (1,1) ..."
function qCoordWord(word) {
  return word.toUpperCase().split('').map(char => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (LETTER_GRID[r][c] === char) {
          return `(${c + 1},${r + 1})`; // (가로, 세로)
        }
      }
    }
    return '';
  }).join(' ');
}

// 3. 이진수 암호화 (A=1, B=2, ..., Z=26 -> 5자리 이진수)
// 예: M -> 13 -> 01101
function qBinaryWord(word) {
  return word.toUpperCase().split('').map(char => {
    let num = char.charCodeAt(0) - 64;
    return num.toString(2).padStart(5, '0');
  }).join(' ');
}

// --- 게임 상태 관리 ---
let gameState = {
  playerName: "수학탐정",
  difficulty: "normal", // easy, normal, hard
  currentStage: 1,      // 1: 시저, 2: 좌표, 3: 이진수, 4: 수열, 5: 인증서
  startTime: null,
  timerInterval: null,
  clearTimeSeconds: 0,
  questions: {
    stage1: null, // { word, cipher, shift, hint }
    stage2: null, // { word, coords, hint }
    stage3: null, // { word, binary, hint }
    stage4: null  // { seq, ans, hint, prevWord }
  }
};

// 정답 비교 정규화 함수
function normalize(value) {
  return String(value).trim().toUpperCase().replace(/\s+/g, "");
}

// --- 랭킹 및 저장 로직 (모듈화) ---
function saveRecord(record) {
  const records = loadRecords();
  records.push(record);
  localStorage.setItem('math_cipher_records', JSON.stringify(records));
}

function loadRecords() {
  const records = localStorage.getItem('math_cipher_records');
  return records ? JSON.parse(records) : [];
}

function getTopRecords(difficulty) {
  const records = loadRecords();
  return records
    .filter(r => r.difficulty === difficulty)
    .sort((a, b) => {
      if (a.clearTime !== b.clearTime) {
        return a.clearTime - b.clearTime; // 시간 짧은 순
      }
      return new Date(a.createdAt) - new Date(b.createdAt); // 먼저 완료한 순
    })
    .slice(0, 10);
}

function clearCurrentRanking(difficulty) {
  let records = loadRecords();
  records = records.filter(r => r.difficulty !== difficulty);
  localStorage.setItem('math_cipher_records', JSON.stringify(records));
}

// --- 타이머 기능 ---
function startTimer() {
  gameState.startTime = Date.now();
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  
  gameState.timerInterval = setInterval(() => {
    const elapsedMs = Date.now() - gameState.startTime;
    gameState.clearTimeSeconds = Math.floor(elapsedMs / 1000);
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function updateTimerUI() {
  const timerElements = document.querySelectorAll('.timer-display');
  const formatted = formatTime(gameState.clearTimeSeconds);
  timerElements.forEach(el => {
    el.textContent = formatted;
  });
}

// --- 문제 선택 및 초기화 ---
function selectRandomQuestions() {
  const diff = gameState.difficulty;
  const pool = WORD_POOL[diff];
  
  // 중복 출제 방지를 위해 단어 셔플
  const shuffledWords = [...pool].sort(() => Math.random() - 0.5);
  
  // 1단계: 시저 암호
  const w1 = shuffledWords[0];
  // 쉬움: shift 1~3, 보통: 3~5, 어려움: 5~8
  let shift = 3;
  if (diff === 'easy') shift = Math.floor(Math.random() * 3) + 1; // 1~3
  else if (diff === 'normal') shift = Math.floor(Math.random() * 3) + 3; // 3~5
  else shift = Math.floor(Math.random() * 4) + 5; // 5~8
  
  gameState.questions.stage1 = {
    word: w1,
    cipher: qCaesarWord(w1, shift),
    shift: shift,
    hint: `첫 알파벳 '${qCaesarWord(w1[0], shift)}'는 원래 '${w1[0]}'입니다. 알파벳 순서에서 ${shift}칸 앞으로 당겨보세요.`
  };
  
  // 2단계: 좌표 암호
  const w2 = shuffledWords[1];
  gameState.questions.stage2 = {
    word: w2,
    coords: qCoordWord(w2),
    hint: `좌표는 (가로, 세로) 순서입니다. 첫 번째 좌표 ${qCoordWord(w2[0])}은 '${w2[0]}'을 나타냅니다. 표에서 확인해 보세요.`
  };
  
  // 3단계: 이진수 암호
  const w3 = shuffledWords[2];
  gameState.questions.stage3 = {
    word: w3,
    binary: qBinaryWord(w3),
    hint: `A=00001(1), B=00010(2), C=00011(3) 규칙입니다. 첫 이진수 ${qBinaryWord(w3[0])}은 10진수로 ${w3[0].charCodeAt(0) - 64}이며, 알파벳 '${w3[0]}'입니다.`
  };
  
  // 4단계: 수열 암호
  const seqList = SEQUENCE_QUESTIONS[diff];
  const randSeq = seqList[Math.floor(Math.random() * seqList.length)];
  gameState.questions.stage4 = {
    seq: randSeq.seq,
    ans: randSeq.ans,
    hint: randSeq.hint,
    prevWord: w3 // 보통 난이도 등에서 활용할 수 있도록 이전 정답(3단계 단어)을 넘겨줌
  };
}

// --- UI 화면 제어 ---
function showScreen(screenId) {
  const screens = ['screen-start', 'screen-game', 'screen-result'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (id === screenId) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function updateProgress() {
  const percentage = (gameState.currentStage - 1) * 25;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
  document.getElementById('progress-text').textContent = `진행률: ${percentage}% (단계: ${gameState.currentStage}/4)`;
}

// --- 단계별 렌더링 ---
function renderStage() {
  const stage = gameState.currentStage;
  const cardContent = document.getElementById('question-card-content');
  const stageTitle = document.getElementById('stage-title');
  const hintBox = document.getElementById('hint-box');
  const answerInput = document.getElementById('answer-input');
  const feedback = document.getElementById('answer-feedback');
  
  // 입력창 및 메시지 초기화
  answerInput.value = "";
  answerInput.focus();
  hintBox.classList.add('hidden');
  feedback.textContent = "";
  feedback.className = "feedback-msg";
  
  updateProgress();

  if (stage === 1) {
    stageTitle.textContent = "1단계: 시저 암호 해독";
    const q = gameState.questions.stage1;
    cardContent.innerHTML = `
      <div class="cipher-box">
        <p class="cipher-title">비밀의 암호문</p>
        <p class="cipher-text neon-text">${q.cipher}</p>
      </div>
      <div class="rule-box">
        <p><strong>해독 규칙:</strong> 알파벳을 <strong>${q.shift}칸 앞으로 밀기</strong> (알파벳 순서에서 뒤로 ${q.shift}칸 이동)</p>
      </div>
    `;
  } else if (stage === 2) {
    stageTitle.textContent = "2단계: 좌표 암호 해독";
    const q = gameState.questions.stage2;
    cardContent.innerHTML = `
      <div class="cipher-box">
        <p class="cipher-title">비밀의 좌표</p>
        <p class="cipher-text neon-text">${q.coords}</p>
      </div>
      <div class="grid-container">
        <p class="grid-title">알파벳 좌표표 (가로, 세로)</p>
        <table class="grid-table">
          <thead>
            <tr>
              <th>세로＼가로</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
            </tr>
          </thead>
          <tbody>
            ${LETTER_GRID.map((row, rIdx) => `
              <tr>
                <th>${rIdx + 1}</th>
                ${row.map(char => `<td>${char}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (stage === 3) {
    stageTitle.textContent = "3단계: 이진수 암호 해독";
    const q = gameState.questions.stage3;
    cardContent.innerHTML = `
      <div class="cipher-box">
        <p class="cipher-title">이진수 코드</p>
        <p class="cipher-text neon-text" style="font-size: 1.6rem; letter-spacing: 0.2rem;">${q.binary}</p>
      </div>
      <div class="rule-box">
        <p><strong>해독 규칙:</strong> A=1 (00001), B=2 (00010), C=3 (00011) ... Z=26 (11010)</p>
        <p class="sub-rule">이진수의 각 자리값은 왼쪽부터 <strong>16, 8, 4, 2, 1</strong> 입니다. 1이 켜진 자리의 숫자를 더하세요!</p>
      </div>
    `;
  } else if (stage === 4) {
    stageTitle.textContent = "4단계: 수열 금고 해결";
    const q = gameState.questions.stage4;
    cardContent.innerHTML = `
      <div class="cipher-box">
        <p class="cipher-title">금고 비밀번호 규칙</p>
        <p class="cipher-text neon-text">${q.seq}</p>
      </div>
      <div class="rule-box">
        <p>물음표(?)에 들어갈 올바른 규칙의 숫자를 입력해 금고를 여세요.</p>
        ${gameState.difficulty === 'normal' || gameState.difficulty === 'hard' ? 
          `<p class="sub-rule">비밀번호는 <strong>[이전 단계 정답 단어 + 숫자]</strong> 형식일 수도 있습니다. (예: ${q.prevWord}?)</p>` : ''
        }
      </div>
    `;
  }
}

// --- 정답 검증 처리 ---
function handleAnswerSubmit() {
  const stage = gameState.currentStage;
  const inputVal = document.getElementById('answer-input').value;
  const feedback = document.getElementById('answer-feedback');
  
  let isCorrect = false;
  let correctWord = "";

  if (stage === 1) {
    correctWord = gameState.questions.stage1.word;
    isCorrect = (normalize(inputVal) === normalize(correctWord));
  } else if (stage === 2) {
    correctWord = gameState.questions.stage2.word;
    isCorrect = (normalize(inputVal) === normalize(correctWord));
  } else if (stage === 3) {
    correctWord = gameState.questions.stage3.word;
    isCorrect = (normalize(inputVal) === normalize(correctWord));
  } else if (stage === 4) {
    const q = gameState.questions.stage4;
    // 수열의 숫자 정답들
    const baseAnswers = q.ans;
    // 이전 3단계 단어 + 숫자 조합 정답들 추가
    const combinedAnswers = baseAnswers.map(ans => q.prevWord + ans);
    const allAcceptable = [...baseAnswers, ...combinedAnswers];
    
    isCorrect = allAcceptable.some(ans => normalize(inputVal) === normalize(ans));
    correctWord = baseAnswers[0]; // 표시용 기본 정답
  }

  if (isCorrect) {
    feedback.textContent = "★ 정답입니다! 다음 단계로 이동합니다. ★";
    feedback.className = "feedback-msg success-msg";
    setTimeout(() => {
      if (gameState.currentStage < 4) {
        gameState.currentStage++;
        renderStage();
      } else {
        // 모든 미션 완료!
        completeGame();
      }
    }, 1200);
  } else {
    feedback.textContent = "❌ 틀렸습니다. 다시 고민해 보세요!";
    feedback.className = "feedback-msg error-msg";
    // 진동 효과 애니메이션 추가
    const card = document.querySelector('.question-card');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
  }
}

// --- 게임 완료 처리 ---
function completeGame() {
  stopTimer();
  gameState.currentStage = 5;
  
  // 완료 기록 저장
  const record = {
    name: gameState.playerName,
    difficulty: gameState.difficulty,
    clearTime: gameState.clearTimeSeconds,
    clearTimeText: formatTime(gameState.clearTimeSeconds),
    createdAt: new Date().toISOString()
  };
  saveRecord(record);
  
  // 결과 화면 렌더링 및 이동
  renderCertificate();
  renderLeaderboard(gameState.difficulty);
  showScreen('screen-result');
}

// --- 인증서 렌더링 ---
function renderCertificate() {
  document.getElementById('cert-name').textContent = gameState.playerName;
  let diffKorean = "보통";
  if (gameState.difficulty === 'easy') diffKorean = "쉬움";
  else if (gameState.difficulty === 'hard') diffKorean = "어려움";
  
  document.getElementById('cert-difficulty').textContent = diffKorean;
  document.getElementById('cert-time').textContent = formatTime(gameState.clearTimeSeconds);
  document.getElementById('cert-date').textContent = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// --- 랭킹판 렌더링 ---
function renderLeaderboard(difficulty) {
  const listContainer = document.getElementById('ranking-rows');
  const listContainerResult = document.getElementById('ranking-rows-result');
  const difficultyTitle = document.getElementById('ranking-difficulty-title');
  const diffDisplay = document.getElementById('game-difficulty-display');
  
  let diffKorean = "보통";
  if (difficulty === 'easy') diffKorean = "쉬움";
  else if (difficulty === 'hard') diffKorean = "어려움";
  
  if (difficultyTitle) {
    difficultyTitle.textContent = `${diffKorean} 난이도 TOP 10`;
  }
  if (diffDisplay) {
    diffDisplay.textContent = diffKorean;
  }
  
  const tops = getTopRecords(difficulty);
  let htmlContent = "";
  
  if (tops.length === 0) {
    htmlContent = `<tr><td colspan="4" class="no-record">아직 기록이 없습니다. 첫 주인공이 되어보세요!</td></tr>`;
  } else {
    htmlContent = tops.map((record, index) => {
      let medalClass = "";
      if (index === 0) medalClass = "rank-gold";
      else if (index === 1) medalClass = "rank-silver";
      else if (index === 2) medalClass = "rank-bronze";
      
      return `
        <tr class="${medalClass}">
          <td>${index + 1}</td>
          <td>${escapeHtml(record.name)}</td>
          <td>${diffKorean}</td>
          <td>${record.clearTimeText}</td>
        </tr>
      `;
    }).join('');
  }

  if (listContainer) {
    listContainer.innerHTML = htmlContent;
  }
  if (listContainerResult) {
    listContainerResult.innerHTML = htmlContent;
  }
}


// HTML 이스케이프 (보안 대비)
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- 이벤트 바인딩 ---
document.addEventListener('DOMContentLoaded', () => {
  // 시작 화면 난이도 선택 버튼 제어
  const diffButtons = document.querySelectorAll('.diff-btn');
  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.difficulty = btn.dataset.difficulty;
      
      // 시작 화면 랭킹 갱신
      renderLeaderboard(gameState.difficulty);
    });
  });
  
  // 시작 버튼
  document.getElementById('start-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name-input').value.trim();
    gameState.playerName = nameInput || "수학탐정";
    if (gameState.playerName.length > 12) {
      gameState.playerName = gameState.playerName.substring(0, 12);
    }
    
    // 게임 리셋 및 준비
    gameState.currentStage = 1;
    gameState.clearTimeSeconds = 0;
    selectRandomQuestions();
    
    // 화면 보이기
    showScreen('screen-game');
    renderStage();
    startTimer();
  });
  
  // 정답 입력 확인
  document.getElementById('submit-btn').addEventListener('click', handleAnswerSubmit);
  document.getElementById('answer-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleAnswerSubmit();
    }
  });
  
  // 힌트 버튼 클릭
  document.getElementById('hint-btn').addEventListener('click', () => {
    const hintBox = document.getElementById('hint-box');
    const stage = gameState.currentStage;
    let hintText = "";
    
    if (stage === 1) hintText = gameState.questions.stage1.hint;
    else if (stage === 2) hintText = gameState.questions.stage2.hint;
    else if (stage === 3) hintText = gameState.questions.stage3.hint;
    else if (stage === 4) hintText = gameState.questions.stage4.hint;
    
    document.getElementById('hint-text').textContent = hintText;
    hintBox.classList.remove('hidden');
  });
  
  // 다시 하기 버튼
  document.getElementById('restart-btn').addEventListener('click', () => {
    showScreen('screen-start');
    renderLeaderboard(gameState.difficulty);
  });
  
  // 랭킹 난이도 토글 (결과 화면용)
  const rankTabBtns = document.querySelectorAll('.rank-tab-btn');
  rankTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rankTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLeaderboard(btn.dataset.difficulty);
    });
  });
  
  // 랭킹 초기화 버튼
  document.getElementById('clear-rank-btn').addEventListener('click', () => {
    const activeTab = document.querySelector('.rank-tab-btn.active');
    const difficulty = activeTab ? activeTab.dataset.difficulty : gameState.difficulty;
    
    let diffKorean = "보통";
    if (difficulty === 'easy') diffKorean = "쉬움";
    else if (difficulty === 'hard') diffKorean = "어려움";
    
    if (confirm(`정말로 ${diffKorean} 난이도의 모든 랭킹 기록을 초기화하시겠습니까?`)) {
      clearCurrentRanking(difficulty);
      renderLeaderboard(difficulty);
    }
  });

  // 인쇄 버튼
  document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
  });
  
  // 초기 로드 시 랭킹 표시
  renderLeaderboard(gameState.difficulty);
});
