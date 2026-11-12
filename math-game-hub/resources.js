/**
 * 학습 자료 · 부스 운영 페이지 (도우미·교사용)
 * - 모든 미션 열기(시연용), 순위 기록 지우기는 도우미 코드를 확인한 뒤에만 동작
 * - 허브(script.js)는 같은 키로 "모든 미션 열기" 상태를 읽습니다.
 */
const UI = window.MathHubUI;
const KEY_RECORDS = 'math_hub_records';
const KEY_STAFF_UNLOCK = 'math_hub_staff_unlock';   // 탭을 닫으면 해제

function staffUnlocked() { return sessionStorage.getItem(KEY_STAFF_UNLOCK) === '1'; }
function recordCount() {
  try { const list = JSON.parse(localStorage.getItem(KEY_RECORDS) || '[]'); return Array.isArray(list) ? list.length : 0; }
  catch (e) { return 0; }
}

document.addEventListener('DOMContentLoaded', () => {
  // ---- 모든 미션 열기 ----
  const btnUnlock = document.getElementById('btn-staff-unlock');
  const unlockTitle = document.getElementById('staff-unlock-title');
  const unlockDesc = document.getElementById('staff-unlock-desc');
  function syncUnlock() {
    const on = staffUnlocked();
    unlockTitle.textContent = on ? '미션 잠금 되돌리기' : '모든 미션 열기 🔑';
    unlockDesc.textContent = on ? '지금은 모든 미션이 열려 있어요' : '시연용. 이 탭을 닫으면 원래대로 돌아가요';
    btnUnlock.setAttribute('aria-pressed', String(on));
  }
  syncUnlock();
  btnUnlock.addEventListener('click', () => {
    if (staffUnlocked()) {
      sessionStorage.removeItem(KEY_STAFF_UNLOCK); syncUnlock();
      UI.toast('미션 잠금을 되돌렸습니다.', 'ok');
      return;
    }
    UI.askCode({ message: '모든 미션을 잠금 없이 엽니다. 도우미 코드를 입력해 주세요.' }).then(ok => {
      if (!ok) return;
      sessionStorage.setItem(KEY_STAFF_UNLOCK, '1'); syncUnlock();
      UI.toast('모든 미션을 열었습니다. 미션 허브에서 확인하세요.', 'ok');
    });
  });

  // ---- 순위 기록 지우기 ----
  const btnClear = document.getElementById('btn-clear-records');
  const countText = document.getElementById('record-count-text');
  function syncCount() { countText.textContent = '이 기기에 저장된 기록 ' + recordCount() + '개를 모두 지워요'; }
  syncCount();
  btnClear.addEventListener('click', () => {
    UI.askCode({
      title: '순위 기록 초기화',
      message: '이 기기의 모든 순위 기록이 지워지고 되돌릴 수 없습니다. 도우미 코드를 입력해 주세요.',
      okText: '모두 지우기',
      danger: true
    }).then(ok => {
      if (!ok) return;
      localStorage.removeItem(KEY_RECORDS); syncCount();
      UI.toast('순위 기록을 초기화했습니다.', 'ok');
    });
  });

  // ---- 오프라인 준비 상태 ----
  const text = document.getElementById('offline-status-text');
  const show = () => {
    const pwa = window.MathHubPWA;
    if (pwa && pwa.ready) text.textContent = '✅ 오프라인 준비 완료 · 설치 방법과 기록 백업';
  };
  window.addEventListener('mathhub:ready', show);
  window.addEventListener('load', () => setTimeout(show, 1000));
});
