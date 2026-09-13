/**
 * 인트로 페이지 컨트롤러 (Intro & Flowchart Controller)
 */

document.addEventListener('DOMContentLoaded', () => {
  const inputPlayerName = document.getElementById('intro-player-name');
  const btnEnterHub = document.getElementById('btn-enter-hub');
  const gradeButtons = document.querySelectorAll('.btn-grade-opt');

  let selectedGrade = 'elem';
  let selectedDiff = 'easy';

  // 1. 기존 데이터 로드
  const savedName = localStorage.getItem('math_hub_current_player') || '';
  if (savedName && inputPlayerName) {
    inputPlayerName.value = savedName;
  }

  const savedGrade = localStorage.getItem('math_hub_grade_level');
  if (savedGrade) {
    selectedGrade = savedGrade;
    gradeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-grade') === savedGrade) {
        btn.classList.add('active');
        selectedDiff = btn.getAttribute('data-diff');
      }
    });
  }

  // 학년 버튼 클릭 이벤트
  gradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      gradeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedGrade = btn.getAttribute('data-grade');
      selectedDiff = btn.getAttribute('data-diff');
    });
  });

  // 2. 단계별 진행 상태 순서도 연동
  updateFlowchartProgress();

  // 3. 작전 개시 버튼
  btnEnterHub.addEventListener('click', () => {
    const name = inputPlayerName.value.trim();
    if (!name) {
      alert('요원 닉네임을 입력해주세요!');
      inputPlayerName.focus();
      return;
    }

    localStorage.setItem('math_hub_current_player', name);
    localStorage.setItem('math_hub_grade_level', selectedGrade);
    localStorage.setItem('math_hub_difficulty', selectedDiff);
    window.location.href = 'index.html';
  });

  inputPlayerName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnEnterHub.click();
    }
  });
});

// 순서도 진행 상태 반영
function updateFlowchartProgress() {
  try {
    const raw = localStorage.getItem('math_hub_records');
    const records = raw ? JSON.parse(raw) : [];

    const hasCipher = records.some(r => r.gameId === 'cipher_escape');
    const hasGalton = records.some(r => r.gameId === 'galton_drop');
    const hasSequence = records.some(r => r.gameId === 'sequence_vault');
    const hasOmega = records.some(r => r.gameId === 'omega_protocol');

    // Step 1 상태
    const st1 = document.getElementById('status-step-1');
    if (hasCipher && st1) {
      st1.textContent = '✅ 클리어 완료';
      st1.className = 'node-status cleared';
    }

    // Step 2 상태
    const st2 = document.getElementById('status-step-2');
    if (hasGalton && st2) {
      st2.textContent = '✅ 클리어 완료';
      st2.className = 'node-status cleared';
    }

    // Step 3 상태
    const st3 = document.getElementById('status-step-3');
    if (hasSequence && st3) {
      st3.textContent = '✅ 클리어 완료';
      st3.className = 'node-status cleared';
    }

    // Step 4 (3개 모두 완료 시)
    const node4 = document.getElementById('node-step-4');
    if (hasCipher && hasGalton && hasSequence && node4) {
      node4.style.borderColor = '#10b981';
      node4.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
    }

    // Omega 상태
    const nodeOmega = document.getElementById('node-step-omega');
    if (hasOmega && nodeOmega) {
      nodeOmega.style.borderColor = '#fbbf24';
      nodeOmega.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.4)';
    }
  } catch (e) {
    console.error('순서도 상태 갱신 실패:', e);
  }
}
