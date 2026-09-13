/**
 * 3D 프린터 실물 갈톤보드 1:1 완벽 시뮬레이터 (Real 3D Printed Galton Board) v4.3
 * 낙하 완료 후 충분한 감상 시간 제공 + [📊 결과 분석 보기] 인터랙티브 버튼 지원
 */

// Web Audio 신디사이저
class RealGaltonAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playMetalClick(row = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastTime < 16) return;
    this.lastTime = now;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 750 + row * 60 + (Math.random() - 0.5) * 40;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }
}

const audio = new RealGaltonAudio();

// 캔버스 및 DOM 초기화
const canvas = document.getElementById('galton-canvas');
const ctx = canvas.getContext('2d');

const ballCountPills = document.querySelectorAll('#ball-count-group .btn-pill');
const btnSoundToggle = document.getElementById('btn-sound-toggle');
const soundIcon = document.getElementById('sound-icon');

const droppedCountEl = document.getElementById('dropped-count');
const totalTargetCountEl = document.getElementById('total-target-count');

const predictSlidersGrid = document.getElementById('predict-sliders-grid');
const predictTotalPct = document.getElementById('predict-total-pct');
const predictWarnMsg = document.getElementById('predict-warn-msg');

const btnQuickNormal = document.getElementById('btn-quick-normal');
const btnQuickFlat = document.getElementById('btn-quick-flat');

const btnStartDrop = document.getElementById('btn-start-drop');
const btnResetSim = document.getElementById('btn-reset-sim');

const modalResult = document.getElementById('modal-result');
const resScoreVal = document.getElementById('res-score-val');
const resGradeBadge = document.getElementById('res-grade-badge');
const resultChartBars = document.getElementById('result-chart-bars');
const btnSaveRanking = document.getElementById('btn-save-ranking');
const closeButtons = document.querySelectorAll('[data-close]');

// 실물 3D 프린터 갈톤보드 스펙: 16개 슬롯 & 15단 핀
const NUM_SLOTS = 16;
const NUM_ROWS = 15;

// 이항계수 Binomial(15, k) / 32768 (16개 슬롯 이론값)
function calculateBinomial15() {
  const binom = [1, 15, 105, 455, 1365, 3003, 5005, 6435, 6435, 5005, 3003, 1365, 455, 105, 15, 1];
  const total = 32768;
  return binom.map(v => (v / total) * 100);
}
const THEORETICAL_PCT_16 = calculateBinomial15();

// 기하구조 레이아웃
const LAYOUT = {
  width: 460,
  height: 580,
  centerX: 230,
  topPegY: 125,
  pegSpacingX: 18.5,
  pegSpacingY: 13.5,
  pegRadius: 1.8,
  ballRadius: 1.8,
  binTopY: 330,
  binBottomY: 515,
  slotWidth: 18.5
};

// 시뮬레이터 상태
const simState = {
  totalTargetBalls: 300,
  isRunning: false,
  isFinished: false,
  spawnInterval: null,
  spawnedCount: 0,
  settledCount: 0,
  balls: [],
  slotCounts: new Array(NUM_SLOTS).fill(0),
  userPredictions: new Array(NUM_SLOTS).fill(0),
  pegs: [],
  slotDividers: [],
  slotBounds: [],
  lastScore: 0
};

// 1. 기하구조 완벽 정렬 초기화
function initRealGeometry() {
  const L = LAYOUT;
  simState.pegs = [];

  for (let r = 0; r < NUM_ROWS; r++) {
    const rowY = L.topPegY + r * L.pegSpacingY;
    const countInRow = r + 1;
    const startX = L.centerX - (r * L.pegSpacingX) / 2;

    for (let c = 0; c < countInRow; c++) {
      simState.pegs.push({
        x: startX + c * L.pegSpacingX,
        y: rowY,
        radius: L.pegRadius,
        row: r,
        col: c,
        flashTimer: 0
      });
    }
  }

  const binStartX = L.centerX - (NUM_SLOTS * L.slotWidth) / 2;
  simState.slotDividers = [];
  simState.slotBounds = [];

  for (let i = 0; i <= NUM_SLOTS; i++) {
    simState.slotDividers.push(binStartX + i * L.slotWidth);
  }

  for (let i = 0; i < NUM_SLOTS; i++) {
    simState.slotBounds.push({
      left: simState.slotDividers[i],
      right: simState.slotDividers[i + 1],
      center: (simState.slotDividers[i] + simState.slotDividers[i + 1]) / 2,
      width: L.slotWidth,
      index: i
    });
  }
}

// 2. 16개 슬롯 UI 컨트롤 동적 생성
function initControlsUI() {
  const defaultPreds = [0, 0, 1, 2, 5, 9, 15, 18, 18, 15, 9, 5, 2, 1, 0, 0];
  simState.userPredictions = [...defaultPreds];

  predictSlidersGrid.innerHTML = '';

  for (let i = 0; i < NUM_SLOTS; i++) {
    const col = document.createElement('div');
    col.className = 'predict-slot-col';
    col.innerHTML = `
      <span class="slot-label">${i + 1}</span>
      <div class="slider-track-v">
        <input type="range" class="slider-v" min="0" max="30" value="${defaultPreds[i]}" data-idx="${i}" />
        <div class="slider-fill" style="height: ${(defaultPreds[i] / 30) * 100}%;"></div>
      </div>
      <span class="pred-val" id="pred-val-${i}">${defaultPreds[i]}%</span>
    `;
    predictSlidersGrid.appendChild(col);
  }

  const sliders = predictSlidersGrid.querySelectorAll('.slider-v');
  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      const val = parseInt(e.target.value, 10);
      simState.userPredictions[idx] = val;

      const fill = e.target.parentElement.querySelector('.slider-fill');
      fill.style.height = `${(val / 30) * 100}%`;

      document.getElementById(`pred-val-${idx}`).textContent = `${val}%`;
      updatePredictTotal();
    });
  });

  updatePredictTotal();
}

function updatePredictTotal() {
  const sum = simState.userPredictions.reduce((a, b) => a + b, 0);
  predictTotalPct.textContent = `${sum}%`;

  if (sum === 100) {
    predictTotalPct.className = 'mono text-success';
    predictWarnMsg.classList.add('hidden');
  } else {
    predictTotalPct.className = 'mono text-warn';
    predictWarnMsg.classList.remove('hidden');
  }
}

// 3. 실버 크롬 쇠구슬 클래스 (자연스러운 템포 궤적)
class RealChromeBall {
  constructor(index, slotCountsSnapshot) {
    this.index = index;
    this.radius = LAYOUT.ballRadius;
    this.settled = false;
    this.hasSettledCounted = false;

    // 15단계 좌/우 독립시행 -> 0 ~ 15 슬롯 결정
    this.finalSlot = 0;
    this.pathChoices = [];
    for (let r = 0; r < NUM_ROWS; r++) {
      const choice = Math.random() < 0.5 ? 0 : 1;
      this.pathChoices.push(choice);
      this.finalSlot += choice;
    }

    // 슬롯 안착 위치 계산
    const slot = simState.slotBounds[this.finalSlot];
    const countInSlot = slotCountsSnapshot[this.finalSlot];
    slotCountsSnapshot[this.finalSlot]++;

    const d = this.radius * 2;
    const colsInSlot = 3;
    const layer = Math.floor(countInSlot / colsInSlot);
    const colIdx = countInSlot % colsInSlot;

    const stackY = LAYOUT.binBottomY - (layer * (d * 0.84) + this.radius + 1.5);
    const stackX = (slot.left + this.radius + 1.2) + colIdx * (d + 0.5);

    this.targetX = Math.max(slot.left + this.radius + 1, Math.min(slot.right - this.radius - 1, stackX));
    this.targetY = stackY;

    // 고정 웨이포인트 생성
    this.waypoints = [];
    const jitterX = (Math.random() - 0.5) * 1.5;
    this.waypoints.push({ x: LAYOUT.centerX + jitterX, y: 40, row: -1 });
    this.waypoints.push({ x: LAYOUT.centerX, y: LAYOUT.topPegY - 14, row: -1 });

    let curX = LAYOUT.centerX;
    for (let r = 0; r < NUM_ROWS; r++) {
      const pegY = LAYOUT.topPegY + r * LAYOUT.pegSpacingY;
      const dir = this.pathChoices[r] === 0 ? -1 : 1;

      this.waypoints.push({ x: curX, y: pegY - 2, row: r, isPeg: true });
      curX += dir * (LAYOUT.pegSpacingX / 2);
      this.waypoints.push({ x: curX, y: pegY + LAYOUT.pegSpacingY * 0.55, row: r });
    }

    this.waypoints.push({ x: slot.center, y: LAYOUT.binTopY + 2, row: 99 });
    this.waypoints.push({ x: this.targetX, y: this.targetY, row: 99 });

    this.currentWaypointIdx = 0;
    this.progress = 0;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    
    // 자연스러운 관찰 템포 (적절한 속도감)
    this.speed = 0.075;
  }

  update() {
    if (this.settled) return;

    this.progress += this.speed;

    if (this.progress >= 1) {
      this.progress = 0;
      this.currentWaypointIdx++;

      if (this.currentWaypointIdx >= this.waypoints.length - 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.settled = true;

        if (!this.hasSettledCounted) {
          this.hasSettledCounted = true;
          simState.slotCounts[this.finalSlot]++;
          simState.settledCount++;
          droppedCountEl.textContent = simState.settledCount;
        }
        return;
      }

      const wp = this.waypoints[this.currentWaypointIdx];
      if (wp && wp.isPeg && wp.row >= 0) {
        audio.playMetalClick(wp.row);
        const peg = simState.pegs.find(p => p.row === wp.row && Math.abs(p.x - wp.x) < 3);
        if (peg) peg.flashTimer = 4;
      }
    }

    const p0 = this.waypoints[this.currentWaypointIdx];
    const p1 = this.waypoints[this.currentWaypointIdx + 1];

    if (p0 && p1) {
      const t = this.progress;
      const easeT = (1 - Math.cos(t * Math.PI)) / 2;
      this.x = p0.x + (p1.x - p0.x) * easeT;
      this.y = p0.y + (p1.y - p0.y) * easeT;
    }
  }

  draw(c) {
    c.save();
    const grad = c.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.35,
      this.radius * 0.1,
      this.x,
      this.y,
      this.radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, `hsl(215, 15%, 80%)`);
    grad.addColorStop(0.75, `hsl(215, 20%, 45%)`);
    grad.addColorStop(1, `#0f172a`);

    c.fillStyle = grad;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

// 4. 메인 렌더링 루프 (Canvas 60 FPS)
function render() {
  ctx.clearRect(0, 0, LAYOUT.width, LAYOUT.height);

  // 1. 화이트 3D 프린팅 하우징
  drawRealHousing();

  // 2. 핀 렌더링
  for (const peg of simState.pegs) {
    ctx.save();
    if (peg.flashTimer > 0) {
      peg.flashTimer--;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 1.5;
    }
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 구슬 렌더링
  for (const ball of simState.balls) {
    ball.update();
    ball.draw(ctx);
  }

  // 4. 슬롯 라벨 & 실시간 카운트
  drawSlotLabels();

  // 5. 완료 체크: 모든 구슬이 착지했을 때 즉시 팝업을 띄우지 않고, 여유롭게 감상할 수 있도록 처리
  const allSettled = simState.balls.length > 0 && simState.balls.every(b => b.settled);
  if (simState.isRunning && simState.spawnedCount >= simState.totalTargetBalls && allSettled) {
    simState.isRunning = false;
    simState.isFinished = true;
    clearInterval(simState.spawnInterval);

    // 버튼을 [📊 결과 분석 보기]로 전환하여 사용자가 쌓인 정규분포를 충분히 감상한 후 누를 수 있게 함
    btnStartDrop.classList.add('hidden');
    btnResetSim.classList.remove('hidden');

    // 2.5초 후 자동으로 팝업을 띄우거나 버튼 클릭 시 열림
    setTimeout(() => {
      if (simState.isFinished) {
        showAnalysisResult();
      }
    }, 2500);
  }

  requestAnimationFrame(render);
}

// 3D 프린터 실물 하우징 렌더링
function drawRealHousing() {
  const L = LAYOUT;
  ctx.save();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 8, L.width - 16, L.height - 16);

  drawCornerBolt(22, 22);
  drawCornerBolt(L.width - 22, 22);
  drawCornerBolt(22, L.height - 22);
  drawCornerBolt(L.width - 22, L.height - 22);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const neckHalfW = 8;
  const leftWallX = simState.slotDividers[0];
  const rightWallX = simState.slotDividers[NUM_SLOTS];

  ctx.beginPath();
  ctx.moveTo(35, 45);
  ctx.lineTo(L.centerX - neckHalfW, L.topPegY - 22);
  ctx.lineTo(L.centerX - neckHalfW, L.topPegY - 10);
  ctx.lineTo(leftWallX, L.binTopY);
  ctx.lineTo(leftWallX, L.binBottomY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(L.width - 35, 45);
  ctx.lineTo(L.centerX + neckHalfW, L.topPegY - 22);
  ctx.lineTo(L.centerX + neckHalfW, L.topPegY - 10);
  ctx.lineTo(rightWallX, L.binTopY);
  ctx.lineTo(rightWallX, L.binBottomY);
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftWallX, L.binBottomY);
  ctx.lineTo(rightWallX, L.binBottomY);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.8;
  for (let i = 1; i < NUM_SLOTS; i++) {
    const divX = simState.slotDividers[i];
    ctx.beginPath();
    ctx.moveTo(divX, L.binTopY);
    ctx.lineTo(divX, L.binBottomY);
    ctx.stroke();
  }

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(35, 45);
  ctx.lineTo(L.width - 35, 45);
  ctx.lineTo(L.centerX + neckHalfW, L.topPegY - 22);
  ctx.lineTo(L.centerX - neckHalfW, L.topPegY - 22);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCornerBolt(x, y) {
  ctx.save();
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x - 3.5, y);
  ctx.lineTo(x + 3.5, y);
  ctx.moveTo(x, y - 3.5);
  ctx.lineTo(x, y + 3.5);
  ctx.stroke();
  ctx.restore();
}

// 하단 슬롯 번호 및 실시간 카운트
function drawSlotLabels() {
  ctx.save();
  ctx.textAlign = 'center';

  for (let i = 0; i < NUM_SLOTS; i++) {
    const bounds = simState.slotBounds[i];
    const count = simState.slotCounts[i];

    // 번호 (1 ~ 16)
    ctx.font = '700 10px Pretendard, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${i + 1}`, bounds.center, LAYOUT.binBottomY + 14);

    // 실시간 카운트
    ctx.font = '700 10px "Share Tech Mono", monospace';
    if (count > 0) {
      ctx.fillStyle = '#0284c7';
      ctx.fillText(`${count}`, bounds.center, LAYOUT.binBottomY + 27);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`0`, bounds.center, LAYOUT.binBottomY + 27);
    }
  }
  ctx.restore();
}

// 스폰 트래커
let spawnSlotTracker = new Array(NUM_SLOTS).fill(0);

// 시뮬레이션 시작
function startSimulation() {
  audio.init();
  resetSimulation();

  simState.isRunning = true;
  simState.isFinished = false;
  btnStartDrop.disabled = true;

  spawnSlotTracker = new Array(NUM_SLOTS).fill(0);

  const intervalMs = 24; // 구슬이 쏟아지는 템포를 여유롭게 조절
  const batchSize = simState.totalTargetBalls >= 600 ? 4 : (simState.totalTargetBalls >= 300 ? 2 : 1);

  simState.spawnInterval = setInterval(() => {
    if (simState.spawnedCount < simState.totalTargetBalls) {
      const remaining = simState.totalTargetBalls - simState.spawnedCount;
      const countToSpawn = Math.min(remaining, batchSize);

      for (let i = 0; i < countToSpawn; i++) {
        const ball = new RealChromeBall(simState.spawnedCount, spawnSlotTracker);
        simState.balls.push(ball);
        simState.spawnedCount++;
      }
    } else {
      clearInterval(simState.spawnInterval);
    }
  }, intervalMs);
}

function resetSimulation() {
  clearInterval(simState.spawnInterval);
  simState.isRunning = false;
  simState.isFinished = false;
  simState.spawnedCount = 0;
  simState.settledCount = 0;
  simState.balls = [];
  simState.slotCounts = new Array(NUM_SLOTS).fill(0);
  spawnSlotTracker = new Array(NUM_SLOTS).fill(0);
  droppedCountEl.textContent = '0';
  btnStartDrop.disabled = false;
  btnStartDrop.classList.remove('hidden');
  btnResetSim.classList.add('hidden');
}

// 프리셋 버튼
btnQuickNormal.addEventListener('click', () => {
  const norm = [0, 0, 1, 2, 5, 9, 15, 18, 18, 15, 9, 5, 2, 1, 0, 0];
  applyPresetPredictions(norm);
});

btnQuickFlat.addEventListener('click', () => {
  const flat = [6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 6, 6, 6, 6, 6, 5];
  applyPresetPredictions(flat);
});

function applyPresetPredictions(arr) {
  simState.userPredictions = [...arr];
  arr.forEach((val, i) => {
    const slider = predictSlidersGrid.querySelector(`.slider-v[data-idx="${i}"]`);
    if (slider) {
      slider.value = val;
      const fill = slider.parentElement.querySelector('.slider-fill');
      fill.style.height = `${(val / 30) * 100}%`;
      document.getElementById(`pred-val-${i}`).textContent = `${val}%`;
    }
  });
  updatePredictTotal();
}

// 구슬 개수 선택
ballCountPills.forEach(pill => {
  pill.addEventListener('click', () => {
    ballCountPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    simState.totalTargetBalls = parseInt(pill.getAttribute('data-count'), 10);
    totalTargetCountEl.textContent = simState.totalTargetBalls;
    resetSimulation();
  });
});

btnSoundToggle.addEventListener('click', () => {
  audio.enabled = !audio.enabled;
  soundIcon.textContent = audio.enabled ? '🔊' : '🔇';
});

// 결과 분석 및 점수 산출
function showAnalysisResult() {
  const total = simState.slotCounts.reduce((a, b) => a + b, 0) || 1;
  const realPcts = simState.slotCounts.map(c => (c / total) * 100);

  let totalDiff = 0;
  for (let i = 0; i < NUM_SLOTS; i++) {
    totalDiff += Math.abs(simState.userPredictions[i] - realPcts[i]);
  }

  let score = Math.max(0, Math.round(100 - totalDiff * 1.15));
  simState.lastScore = score;
  resScoreVal.textContent = score;

  if (score >= 90) resGradeBadge.textContent = '🌟 특급 확률 마스터';
  else if (score >= 75) resGradeBadge.textContent = '🎯 우수 확률 탐정';
  else if (score >= 50) resGradeBadge.textContent = '🌱 수습 확률 탐험가';
  else resGradeBadge.textContent = '🎲 호기심 많은 도전자';

  resultChartBars.innerHTML = '';
  for (let i = 0; i < NUM_SLOTS; i++) {
    const predH = Math.min(100, simState.userPredictions[i] * 3.2);
    const realH = Math.min(100, realPcts[i] * 3.2);
    const theoH = Math.min(100, THEORETICAL_PCT_16[i] * 3.2);

    const group = document.createElement('div');
    group.className = 'chart-bar-group';
    group.innerHTML = `
      <div class="bar-col bar-pred" style="height: ${predH}%;" title="예측: ${simState.userPredictions[i]}%"></div>
      <div class="bar-col bar-real" style="height: ${realH}%;" title="실제: ${realPcts[i].toFixed(1)}%"></div>
      <div class="bar-col bar-theo" style="height: ${theoH}%;" title="이론: ${THEORETICAL_PCT_16[i].toFixed(1)}%"></div>
    `;
    resultChartBars.appendChild(group);
  }

  modalResult.classList.remove('hidden');
}

// 랭킹 저장
btnSaveRanking.addEventListener('click', () => {
  const playerName = localStorage.getItem('math_hub_current_player') || '수학탐정';
  
  const record = {
    gameId: 'galton_drop',
    gameTitle: '확률 구슬 챌린지',
    name: playerName,
    difficulty: simState.totalTargetBalls >= 600 ? 'hard' : (simState.totalTargetBalls >= 300 ? 'normal' : 'easy'),
    score: simState.lastScore,
    clearTimeFormatted: `${simState.lastScore}점`,
    clearTimeSeconds: 1000 - simState.lastScore,
    timestamp: Date.now()
  };

  try {
    const raw = localStorage.getItem('math_hub_records');
    const records = raw ? JSON.parse(raw) : [];
    records.push(record);
    localStorage.setItem('math_hub_records', JSON.stringify(records));
    alert(`'${playerName}' 요원의 확률 예측 점수(${simState.lastScore}점)가 명예의 전당에 등록되었습니다!`);
    modalResult.classList.add('hidden');
  } catch (e) {
    console.error('랭킹 등록 실패:', e);
  }
});

closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-close');
    const modal = document.getElementById(targetId);
    if (modal) modal.classList.add('hidden');
  });
});

btnStartDrop.addEventListener('click', startSimulation);
// 초기화 실행
initRealGeometry();
initControlsUI();

// 인트로 학년 난이도에 따른 구슬 개수 자동 선택
const savedDiff = localStorage.getItem('math_hub_difficulty') || 'easy';
let targetBalls = 300;
if (savedDiff === 'easy') targetBalls = 150;
else if (savedDiff === 'hard') targetBalls = 600;

simState.totalTargetBalls = targetBalls;
totalTargetCountEl.textContent = targetBalls;
ballCountPills.forEach(pill => {
  pill.classList.remove('active');
  if (parseInt(pill.getAttribute('data-count'), 10) === targetBalls) {
    pill.classList.add('active');
  }
});

render();
