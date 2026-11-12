/**
 * 수학 게임 허브 메인 컨트롤러 (Hub Controller)
 * - 참가자(요원) 관리: 이름 저장, 다음 친구 차례
 * - 참가자별 단계 잠금/해금과 진행 표시
 * - 기기 내 통합 랭킹(명예의 전당)
 */

const UI = window.MathHubUI;
const KEY_PLAYER = 'math_hub_current_player';
const KEY_GRADE = 'math_hub_grade_level';
const KEY_DIFF = 'math_hub_difficulty';
const KEY_RECORDS = 'math_hub_records';
const KEY_STAFF_UNLOCK = 'math_hub_staff_unlock';   // 도우미가 모든 미션을 열어 둔 상태(탭을 닫으면 해제)

const inputHubPlayerName = document.getElementById('hub-player-name');
const btnSavePlayer = document.getElementById('btn-save-player');
const btnNewPlayer = document.getElementById('btn-new-player');
const btnOpenRankings = document.getElementById('btn-open-rankings');
const btnOpenGuide = document.getElementById('btn-open-guide');
const modalRankings = document.getElementById('modal-rankings');
const modalGuide = document.getElementById('modal-guide');
const rankingTbody = document.getElementById('ranking-tbody');
const btnClearRankings = document.getElementById('btn-clear-rankings');

let currentRankGame = 'cipher_escape';
let currentRankDiff = 'all';

// 단계 정의: 앞 단계를 끝내야 다음 단계가 열립니다.
const STEPS = [
  {
    key: 'cipher', gameId: 'cipher_escape', icon: '🕵️‍♂️', num: 1,
    card: 'card-game-cipher', badge: 'badge-game-cipher', iconEl: null, btn: 'btn-play-cipher',
    play: '<span>1단계 도전하기</span> ➔', replay: '<span>다시 도전하기</span> 🔄'
  },
  {
    key: 'galton', gameId: 'galton_drop', icon: '🔮', num: 2,
    card: 'card-game-galton', badge: 'badge-game-galton', iconEl: 'icon-game-galton', btn: 'btn-play-galton',
    play: '<span>2단계 도전하기</span> ➔', replay: '<span>다시 실험하기</span> 🔄'
  },
  {
    key: 'sequence', gameId: 'sequence_vault', icon: '🔐', num: 3,
    card: 'card-game-sequence', badge: 'badge-game-sequence', iconEl: 'icon-game-sequence', btn: 'btn-play-sequence',
    play: '<span>3단계 도전하기</span> ⚡', replay: '<span>다시 스피드런</span> 🔄'
  }
];

function readRecords() {
  try {
    const raw = localStorage.getItem(KEY_RECORDS);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function currentPlayer() {
  return (localStorage.getItem(KEY_PLAYER) || '').trim();
}

function staffUnlocked() {
  return sessionStorage.getItem(KEY_STAFF_UNLOCK) === '1';
}

document.addEventListener('DOMContentLoaded', () => {
  const savedName = currentPlayer();
  if (savedName) inputHubPlayerName.value = savedName;

  initGradeSwitch();

  checkCourseCompletion();
  initOfflineStatus();
});

/**
 * 허브에서 바로 학년(난이도) 고르기.
 * 학년→난이도: 초등=easy, 중등=normal, 고등=hard (인트로와 같은 저장 키 사용)
 */
const GRADE_DIFF = { elem: 'easy', mid: 'normal', high: 'hard' };
const GRADE_LABEL = { elem: '초등부', mid: '중등부', high: '고등부' };

function renderGradeSwitch() {
  const grade = GRADE_DIFF[localStorage.getItem(KEY_GRADE)] ? localStorage.getItem(KEY_GRADE) : 'elem';
  document.querySelectorAll('.grade-switch .grade-opt').forEach(btn => {
    const on = btn.dataset.grade === grade;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.tabIndex = on ? 0 : -1;
  });
}

function setGrade(grade, announce) {
  if (!GRADE_DIFF[grade]) return;
  localStorage.setItem(KEY_GRADE, grade);
  localStorage.setItem(KEY_DIFF, GRADE_DIFF[grade]);
  renderGradeSwitch();
  if (announce && UI && UI.toast) UI.toast(`${GRADE_LABEL[grade]} 난이도로 바꿨어요.`, 'success');
}

function initGradeSwitch() {
  const btns = Array.from(document.querySelectorAll('.grade-switch .grade-opt'));
  // 인트로를 거치지 않고 들어와도 학년과 난이도가 서로 맞도록 저장
  const saved = localStorage.getItem(KEY_GRADE);
  setGrade(GRADE_DIFF[saved] ? saved : 'elem', false);
  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-checked') !== 'true') setGrade(btn.dataset.grade, true);
    });
    // 방향키로 이동(라디오 그룹 관례)
    btn.addEventListener('keydown', (e) => {
      const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = btns[(i + step + btns.length) % btns.length];
      setGrade(next.dataset.grade, true);
      next.focus();
    });
  });
}

// 다른 탭(또는 설치된 앱)에서 기록이 바뀌면 바로 반영
window.addEventListener('storage', (e) => {
  if (e.key === KEY_RECORDS || e.key === KEY_PLAYER) checkCourseCompletion();
  if (e.key === KEY_GRADE) renderGradeSwitch();
});
// 게임에서 뒤로 가기로 돌아왔을 때도 최신 상태로
window.addEventListener('pageshow', () => {
  const name = currentPlayer();
  if (name && inputHubPlayerName.value !== name) inputHubPlayerName.value = name;
  checkCourseCompletion();
  renderGradeSwitch();
});

/**
 * 참가자별 진행 상태 검사와 단계 잠금/해금.
 * 한 태블릿을 여러 학생이 쓰므로, 지금 이름으로 남긴 기록만 진행으로 인정합니다.
 */
function checkCourseCompletion() {
  const player = currentPlayer();
  const mine = readRecords().filter(r => r && r.name === player && player);
  const done = {};
  STEPS.forEach(s => { done[s.key] = mine.some(r => r.gameId === s.gameId); });
  done.omega = mine.some(r => r.gameId === 'omega_protocol');
  const openAll = staffUnlocked();

  let previousDone = true;
  STEPS.forEach(step => {
    const card = document.getElementById(step.card);
    const badge = document.getElementById(step.badge);
    const btn = document.getElementById(step.btn);
    const iconEl = step.iconEl ? document.getElementById(step.iconEl) : null;
    const unlocked = previousDone || openAll || done[step.key];

    card.classList.toggle('card-locked', !unlocked);
    card.classList.toggle('card-active', unlocked);
    card.classList.toggle('card-done', done[step.key]);
    if (iconEl) iconEl.textContent = unlocked ? step.icon : '🔒';

    if (done[step.key]) {
      badge.className = 'game-status-tag done';
      badge.textContent = `✅ STEP ${step.num} 완료`;
      btn.className = 'btn btn-outline btn-play';
      btn.innerHTML = step.replay;
    } else if (unlocked) {
      badge.className = 'game-status-tag ready';
      badge.textContent = `STEP ${step.num} · 도전 가능`;
      btn.className = 'btn btn-primary btn-play';
      btn.innerHTML = step.play;
    } else {
      badge.className = 'game-status-tag locked';
      badge.textContent = `🔒 STEP ${step.num}`;
      btn.className = 'btn btn-secondary btn-play';
      btn.innerHTML = `<span>🔒 ${step.num - 1}단계를 먼저 끝내요</span>`;
    }
    btn.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    previousDone = done[step.key];
  });

  const allDone = STEPS.every(s => done[s.key]);
  const cardOmega = document.getElementById('card-game-omega');
  const rankTabOmega = document.getElementById('rank-tab-omega');
  const omegaOpen = allDone || openAll;
  cardOmega.classList.toggle('hidden', !omegaOpen);
  cardOmega.classList.toggle('card-done', done.omega);
  // 오메가 기록이 하나라도 있으면 랭킹 탭은 항상 보여 줍니다.
  const anyOmega = readRecords().some(r => r && r.gameId === 'omega_protocol');
  rankTabOmega.classList.toggle('hidden', !(omegaOpen || anyOmega));

  renderProgress(done, allDone, player);

  if (allDone && player) {
    const shownKey = 'math_hub_completion_shown:' + player;
    if (!sessionStorage.getItem(shownKey)) {
      sessionStorage.setItem(shownKey, 'true');
      setTimeout(showCompletionModal, 500);
    }
  }
}

function renderProgress(done, allDone, player) {
  const steps = document.querySelectorAll('#progress-steps .p-step');
  let nextMarked = false;
  steps.forEach(li => {
    const key = li.getAttribute('data-step');
    const isDone = !!done[key];
    li.classList.toggle('is-done', isDone);
    let isNext = false;
    if (!isDone && !nextMarked && (key !== 'omega' || allDone)) { isNext = true; nextMarked = true; }
    li.classList.toggle('is-next', isNext);
    li.classList.toggle('is-hidden-step', key === 'omega' && !allDone);
    if (isNext) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });

  const msg = document.getElementById('progress-msg');
  const count = STEPS.filter(s => done[s.key]).length;
  if (!player) msg.textContent = '이름을 입력하고 1단계부터 차례로 도전해요. 하나를 끝내면 다음 미션이 열립니다.';
  else if (done.omega) msg.textContent = `${player} 요원, 히든 미션까지 모두 완주했어요! 👑`;
  else if (allDone) msg.textContent = `${player} 요원, 3개 미션 완료! 히든 미션 [오메가 프로토콜]이 열렸어요.`;
  else if (count === 0) msg.textContent = `${player} 요원, 1단계 [암호 연구소 탈출]부터 시작해요.`;
  else msg.textContent = `${player} 요원, 3개 중 ${count}개 완료! 다음 미션이 열렸어요.`;
}

function showCompletionModal() {
  const modal = document.getElementById('modal-completion');
  if (!modal) return;
  modal.classList.remove('hidden');
  const btnClose = document.getElementById('btn-close-completion');
  if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
}

// 잠긴 미션은 눌러도 이동하지 않고 이유를 알려 줍니다.
document.querySelectorAll('.btn-play').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (btn.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      UI.toast('앞 단계를 먼저 끝내면 열려요!', 'warn');
      return;
    }
    if (!currentPlayer()) {
      const typed = inputHubPlayerName.value.trim();
      if (typed) localStorage.setItem(KEY_PLAYER, typed);
    }
  });
});

// 이름 저장
function savePlayer() {
  const name = inputHubPlayerName.value.trim();
  if (!name) {
    UI.toast('요원 이름을 입력해 주세요!', 'warn');
    inputHubPlayerName.focus();
    return;
  }
  localStorage.setItem(KEY_PLAYER, name);
  UI.toast(`'${name}' 요원으로 시작합니다.`, 'ok');
  inputHubPlayerName.blur();
  checkCourseCompletion();
}
btnSavePlayer.addEventListener('click', savePlayer);
inputHubPlayerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') savePlayer();
});

// 다음 친구 차례: 이름을 비우고 첫 화면으로 (기록은 그대로 남습니다)
btnNewPlayer.addEventListener('click', () => {
  UI.confirm({
    title: '다음 친구 차례인가요?',
    message: '지금 이름을 지우고 처음 화면으로 갑니다. 순위 기록은 그대로 남아요.',
    okText: '네, 새로 시작',
    cancelText: '아니요'
  }).then(ok => {
    if (!ok) return;
    localStorage.removeItem(KEY_PLAYER);
    window.location.href = 'intro.html';
  });
});

// 모달
function openModal(modal) {
  modal.classList.remove('hidden');
  const closer = modal.querySelector('.btn-modal-close');
  if (closer) closer.focus();
}
btnOpenRankings.addEventListener('click', () => { renderRankings(); openModal(modalRankings); });
btnOpenGuide.addEventListener('click', () => openModal(modalGuide));

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = document.getElementById(btn.getAttribute('data-close'));
    if (modal) modal.classList.add('hidden');
  });
});
[modalRankings, modalGuide].forEach(modal => {
  const backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', () => modal.classList.add('hidden'));
});

// 랭킹 탭
const gameTabButtons = document.querySelectorAll('.game-filter-tabs .rank-tab-btn');
gameTabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    gameTabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRankGame = btn.getAttribute('data-filter-game');
    renderRankings();
  });
});
const diffTabButtons = document.querySelectorAll('.diff-filter-tabs .rank-tab-btn');
diffTabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    diffTabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRankDiff = btn.getAttribute('data-filter-diff');
    renderRankings();
  });
});

// 랭킹 표 (게임별 TOP 10). 시간 게임은 빠른 순, 점수 게임은 높은 순으로
// 각 게임이 clearTimeSeconds 에 정렬용 값을 넣어 저장합니다.
function renderRankings() {
  const isScoreGame = currentRankGame === 'galton_drop' || currentRankGame === 'sequence_vault';
  const colRecord = document.getElementById('rank-col-record');
  if (colRecord) colRecord.textContent = isScoreGame ? '점수' : '걸린 시간';

  let filtered = readRecords().filter(r => r && r.gameId === currentRankGame);
  if (currentRankDiff !== 'all') filtered = filtered.filter(r => r.difficulty === currentRankDiff);
  filtered.sort((a, b) => (a.clearTimeSeconds - b.clearTimeSeconds) || (a.timestamp - b.timestamp));
  const topList = filtered.slice(0, 10);
  const player = currentPlayer();

  rankingTbody.innerHTML = '';
  if (topList.length === 0) {
    rankingTbody.innerHTML = `
      <tr>
        <td colspan="5" class="rank-empty">
          아직 기록이 없어요.<br>첫 번째 주인공이 되어 보세요!
        </td>
      </tr>`;
    return;
  }

  topList.forEach((item, index) => {
    const rank = index + 1;
    const medal = { 1: '🥇', 2: '🥈', 3: '🥉' }[rank] || '';
    const tr = document.createElement('tr');
    if (player && item.name === player) tr.className = 'rank-me';
    tr.innerHTML = `
      <td class="${rank <= 3 ? 'rank-top-' + rank : ''}">${medal} ${rank}위</td>
      <td class="rank-name">${escapeHtml(item.name)}</td>
      <td>${getDiffBadge(item.difficulty)}</td>
      <td class="rank-record">${escapeHtml(String(item.clearTimeFormatted || `${item.score}점`))}</td>
      <td class="rank-date">${formatDate(item.timestamp)}</td>`;
    rankingTbody.appendChild(tr);
  });
}

function getDiffBadge(diff) {
  switch (diff) {
    case 'easy': return '<span class="diff-easy">쉬움</span>';
    case 'hard': return '<span class="diff-hard">어려움</span>';
    default: return '<span class="diff-normal">보통</span>';
  }
}

function formatDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

// 기록 초기화: 학생이 실수로 지우지 않도록 도우미 코드 확인
btnClearRankings.addEventListener('click', () => {
  UI.askCode({
    title: '순위 기록 초기화',
    message: '이 기기의 모든 순위 기록이 지워지고 되돌릴 수 없습니다. 도우미 코드를 입력해 주세요.',
    okText: '모두 지우기',
    danger: true
  }).then(ok => {
    if (!ok) return;
    localStorage.removeItem(KEY_RECORDS);
    renderRankings();
    checkCourseCompletion();
    UI.toast('순위 기록을 초기화했습니다.', 'ok');
  });
});

// 도우미용: 시연을 위해 모든 미션 열기 (이 탭을 닫으면 원래대로)
const btnStaffUnlock = document.getElementById('btn-staff-unlock');
if (btnStaffUnlock) {
  const syncLabel = () => {
    btnStaffUnlock.textContent = staffUnlocked() ? '도우미: 미션 잠금 되돌리기' : '도우미: 모든 미션 열기';
  };
  syncLabel();
  btnStaffUnlock.addEventListener('click', () => {
    if (staffUnlocked()) {
      sessionStorage.removeItem(KEY_STAFF_UNLOCK);
      syncLabel(); checkCourseCompletion();
      return;
    }
    UI.askCode({ message: '모든 미션을 잠금 없이 엽니다. 도우미 코드를 입력해 주세요.' }).then(ok => {
      if (!ok) return;
      sessionStorage.setItem(KEY_STAFF_UNLOCK, '1');
      syncLabel(); checkCourseCompletion();
      UI.toast('모든 미션을 열었습니다.', 'ok');
    });
  });
}

// 오프라인 준비 상태 표시 (shared/pwa.js 가 있을 때만)
function initOfflineStatus() {
  const text = document.getElementById('offline-status-text');
  if (!text) return;
  const show = () => {
    const pwa = window.MathHubPWA;
    if (pwa && pwa.ready) text.textContent = '✅ 오프라인 준비 완료 · 설치 방법과 기록 백업';
  };
  window.addEventListener('mathhub:ready', show);
  window.addEventListener('load', () => setTimeout(show, 1000));
}
