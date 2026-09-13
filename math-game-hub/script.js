/**
 * 수학 게임 허브 메인 컨트롤러 (Hub Controller)
 * 세션 및 통합 랭킹 관리
 */

// DOM 요소 참조
const inputHubPlayerName = document.getElementById('hub-player-name');
const btnSavePlayer = document.getElementById('btn-save-player');

const btnOpenRankings = document.getElementById('btn-open-rankings');
const btnOpenGuide = document.getElementById('btn-open-guide');

const modalRankings = document.getElementById('modal-rankings');
const modalGuide = document.getElementById('modal-guide');
const closeButtons = document.querySelectorAll('[data-close]');

const rankTabButtons = document.querySelectorAll('.rank-tab-btn');
const rankingTbody = document.getElementById('ranking-tbody');
const btnClearRankings = document.getElementById('btn-clear-rankings');

// 초기 상태
let currentRankGame = 'all';
let currentRankDiff = 'all';

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('math_hub_current_player') || '';
  if (savedName && inputHubPlayerName) {
    inputHubPlayerName.value = savedName;
  }

  const savedGrade = localStorage.getItem('math_hub_grade_level') || 'elem';
  const gradeBadge = document.getElementById('hub-grade-badge');
  if (gradeBadge) {
    if (savedGrade === 'elem') gradeBadge.textContent = '🌱 초등부';
    else if (savedGrade === 'mid') gradeBadge.textContent = '⭐ 중등부';
    else if (savedGrade === 'high') gradeBadge.textContent = '🔥 고등부';
  }

  checkCourseCompletion();
});

// 순차적 미션 진행 상태 검사 및 단계별 잠금/해금
function checkCourseCompletion() {
  try {
    const raw = localStorage.getItem('math_hub_records');
    const records = raw ? JSON.parse(raw) : [];

    const hasCipher = records.some(r => r.gameId === 'cipher_escape');
    const hasGalton = records.some(r => r.gameId === 'galton_drop');
    const hasSequence = records.some(r => r.gameId === 'sequence_vault');

    // DOM 요소
    const cardCipher = document.getElementById('card-game-cipher');
    const badgeCipher = document.getElementById('badge-game-cipher');
    const btnPlayCipher = document.getElementById('btn-play-cipher');

    const cardGalton = document.getElementById('card-game-galton');
    const badgeGalton = document.getElementById('badge-game-galton');
    const iconGalton = document.getElementById('icon-game-galton');
    const btnPlayGalton = document.getElementById('btn-play-galton');

    const cardSequence = document.getElementById('card-game-sequence');
    const badgeSequence = document.getElementById('badge-game-sequence');
    const iconSequence = document.getElementById('icon-game-sequence');
    const btnPlaySequence = document.getElementById('btn-play-sequence');

    const cardOmega = document.getElementById('card-game-omega');
    const rankTabOmega = document.getElementById('rank-tab-omega');

    // [1단계: 암호 연구소 탈출 완료 시]
    if (hasCipher) {
      if (badgeCipher) {
        badgeCipher.className = 'game-status-tag ready';
        badgeCipher.textContent = '✅ STEP 1 클리어 완료';
      }
      if (btnPlayCipher) {
        btnPlayCipher.innerHTML = '<span>다시 도전하기</span> 🔄';
      }

      // ➔ 2단계 (갈톤 확률) 해금!
      if (cardGalton) {
        cardGalton.classList.remove('card-locked');
        cardGalton.classList.add('card-active');
      }
      if (badgeGalton) {
        badgeGalton.className = 'game-status-tag ready';
        badgeGalton.textContent = 'STEP 2 · 도전 가능';
      }
      if (iconGalton) iconGalton.textContent = '🔮';
      if (btnPlayGalton) {
        btnPlayGalton.className = 'btn btn-primary btn-play';
        btnPlayGalton.innerHTML = '<span>2단계 도전하기</span> ➔';
      }
    }

    // [2단계: 갈톤 확률 완료 시]
    if (hasGalton) {
      if (badgeGalton) {
        badgeGalton.className = 'game-status-tag ready';
        badgeGalton.textContent = '✅ STEP 2 클리어 완료';
      }
      if (btnPlayGalton) {
        btnPlayGalton.innerHTML = '<span>다시 실험하기</span> 🔄';
      }

      // ➔ 3단계 (수열 금고) 해금!
      if (cardSequence) {
        cardSequence.classList.remove('card-locked');
        cardSequence.classList.add('card-active');
      }
      if (badgeSequence) {
        badgeSequence.className = 'game-status-tag ready';
        badgeSequence.textContent = 'STEP 3 · 도전 가능';
      }
      if (iconSequence) iconSequence.textContent = '🔐';
      if (btnPlaySequence) {
        btnPlaySequence.className = 'btn btn-primary btn-play';
        btnPlaySequence.innerHTML = '<span>3단계 도전하기</span> ⚡';
      }
    }

    // [3단계: 수열 금고 완료 시]
    if (hasSequence) {
      if (badgeSequence) {
        badgeSequence.className = 'game-status-tag ready';
        badgeSequence.textContent = '✅ STEP 3 클리어 완료';
      }
      if (btnPlaySequence) {
        btnPlaySequence.innerHTML = '<span>다시 스피드런</span> 🔄';
      }
    }

    // [3개 모두 완료 시 ➔ 공식 수료 & 오메가 프로토콜 개방!]
    if (hasCipher && hasGalton && hasSequence) {
      if (cardOmega) {
        cardOmega.classList.remove('hidden');
      }
      if (rankTabOmega) {
        rankTabOmega.classList.remove('hidden');
      }

      // 수료 팝업 노출 (세션당 1회)
      const hasShownModal = sessionStorage.getItem('math_hub_completion_shown');
      if (!hasShownModal) {
        sessionStorage.setItem('math_hub_completion_shown', 'true');
        setTimeout(() => {
          showCompletionModal();
        }, 500);
      }
    } else {
      if (cardOmega) cardOmega.classList.add('hidden');
      if (rankTabOmega) rankTabOmega.classList.add('hidden');
    }
  } catch (e) {
    console.error('순차적 진행 상태 검사 실패:', e);
  }
}

function showCompletionModal() {
  const modal = document.getElementById('modal-completion');
  if (modal) {
    modal.classList.remove('hidden');

    const btnClose = document.getElementById('btn-close-completion');
    if (btnClose) {
      btnClose.onclick = () => modal.classList.add('hidden');
    }
  }
}

// 플레이어 이름 저장
btnSavePlayer.addEventListener('click', () => {
  const name = inputHubPlayerName.value.trim();
  if (!name) {
    alert('체험 요원 이름을 입력해주세요!');
    inputHubPlayerName.focus();
    return;
  }
  localStorage.setItem('math_hub_current_player', name);
  alert(`'${name}' 요원 이름이 저장되었습니다.`);
});

// 엔터 키로 이름 저장
inputHubPlayerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnSavePlayer.click();
  }
});

// 모달 제어
btnOpenRankings.addEventListener('click', () => {
  renderRankings();
  modalRankings.classList.remove('hidden');
});

btnOpenGuide.addEventListener('click', () => {
  modalGuide.classList.remove('hidden');
});

closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-close');
    const modal = document.getElementById(targetId);
    if (modal) modal.classList.add('hidden');
  });
});

// 모달 배경 클릭 시 닫기
[modalRankings, modalGuide].forEach(modal => {
  const backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => modal.classList.add('hidden'));
  }
});

// 게임 탭 필터링
const gameTabButtons = document.querySelectorAll('.game-filter-tabs .rank-tab-btn');
gameTabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    gameTabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRankGame = btn.getAttribute('data-filter-game');
    renderRankings();
  });
});

// 난이도 탭 필터링
const diffTabButtons = document.querySelectorAll('.diff-filter-tabs .rank-tab-btn');
diffTabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    diffTabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRankDiff = btn.getAttribute('data-filter-diff');
    renderRankings();
  });
});

// 랭킹 테이블 렌더링
function renderRankings() {
  let records = [];
  try {
    const raw = localStorage.getItem('math_hub_records');
    records = raw ? JSON.parse(raw) : [];
  } catch (err) {
    records = [];
  }

  // 게임 필터링
  let filtered = [...records];
  if (currentRankGame !== 'all') {
    filtered = filtered.filter(r => r.gameId === currentRankGame);
  }

  // 난이도 필터링
  if (currentRankDiff !== 'all') {
    filtered = filtered.filter(r => r.difficulty === currentRankDiff);
  }

  // 정렬: 암호탈출은 시간 오름차순, 갈톤확률은 점수 내림차순 (clearTimeSeconds 기준)
  filtered.sort((a, b) => a.clearTimeSeconds - b.clearTimeSeconds);

  // TOP 10만 추출
  const topList = filtered.slice(0, 10);

  rankingTbody.innerHTML = '';
  if (topList.length === 0) {
    rankingTbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding: 24px; color: var(--text-muted);">
          아직 등록된 랭킹 기록이 없습니다.<br>첫 번째 도전의 주인공이 되어보세요!
        </td>
      </tr>
    `;
    return;
  }

  topList.forEach((item, index) => {
    const rank = index + 1;
    let rankBadge = `${rank}위`;
    let rankClass = '';
    if (rank === 1) { rankBadge = '🥇 1위'; rankClass = 'rank-top-1'; }
    else if (rank === 2) { rankBadge = '🥈 2위'; rankClass = 'rank-top-2'; }
    else if (rank === 3) { rankBadge = '🥉 3위'; rankClass = 'rank-top-3'; }

    const dateStr = formatDate(item.timestamp);
    const diffBadge = getDiffBadge(item.difficulty);
    let gameLabel = '🕵️ 암호';
    if (item.gameId === 'galton_drop') gameLabel = '🔮 갈톤';
    else if (item.gameId === 'sequence_vault') gameLabel = '🔐 수열';
    else if (item.gameId === 'omega_protocol') gameLabel = '👑 오메가';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="${rankClass}">${rankBadge}</td>
      <td style="font-weight: 700; color: #fff;">
        ${escapeHtml(item.name)}
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${gameLabel}</span>
      </td>
      <td>${diffBadge}</td>
      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${item.clearTimeFormatted || `${item.score}점`}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
    `;
    rankingTbody.appendChild(tr);
  });
}

// 난이도 뱃지
function getDiffBadge(diff) {
  switch (diff) {
    case 'easy': return '<span style="color: #4ade80;">쉬움</span>';
    case 'hard': return '<span style="color: #f87171;">어려움</span>';
    default: return '<span style="color: #38bdf8;">보통</span>';
  }
}

// 날짜 포맷
function formatDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}.${day} ${h}:${min}`;
}

// HTML 이스케이프
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// 랭킹 초기화
btnClearRankings.addEventListener('click', () => {
  if (confirm('모든 랭킹 기록을 초기화하시겠습니까? (되돌릴 수 없습니다)')) {
    localStorage.removeItem('math_hub_records');
    renderRankings();
    alert('랭킹이 초기화되었습니다.');
  }
});
