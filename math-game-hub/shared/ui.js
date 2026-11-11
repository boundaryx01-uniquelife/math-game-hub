/**
 * 공통 UI 도우미 (모든 페이지에서 불러옵니다)
 * - MathHubUI.toast(message, kind)   : alert 대신 쓰는 짧은 알림
 * - MathHubUI.confirm({...})         : 확인 대화상자 (Promise<boolean>)
 * - MathHubUI.askCode({...})         : 도우미 코드 입력 대화상자 (Promise<boolean>)
 * - 게임 진행 중 표시(body.is-playing), 진행 중 허브 이동 확인, ESC로 모달 닫기,
 *   정답 입력칸의 대문자·숫자 키보드 설정, 화면 꺼짐 방지
 */
(function () {
  'use strict';

  var STAFF_CODE = '8680';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- 토스트 ----------
  var toastWrap = null;
  function toast(message, kind) {
    if (!toastWrap) {
      toastWrap = el('div', 'mh-toast-wrap');
      toastWrap.setAttribute('role', 'status');
      toastWrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastWrap);
    }
    var item = el('div', 'mh-toast' + (kind ? ' is-' + kind : ''), message);
    toastWrap.appendChild(item);
    setTimeout(function () { item.remove(); }, 2600);
  }

  // ---------- 대화상자 ----------
  function dialog(opts) {
    return new Promise(function (resolve) {
      var previous = document.activeElement;
      var overlay = el('div', 'mh-dialog');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      var card = el('div', 'mh-dialog-card');
      card.appendChild(el('h3', '', opts.title || '확인'));
      if (opts.message) card.appendChild(el('p', '', opts.message));

      var input = null;
      if (opts.input) {
        input = el('input');
        input.type = 'password';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.placeholder = opts.placeholder || '';
        input.setAttribute('aria-label', opts.placeholder || '코드');
        card.appendChild(input);
      }

      var actions = el('div', 'mh-dialog-actions');
      var btnCancel = el('button', '', opts.cancelText || '취소');
      btnCancel.type = 'button';
      var btnOk = el('button', opts.danger ? 'is-danger' : 'is-primary', opts.okText || '확인');
      btnOk.type = 'button';
      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      function close(result) {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        if (previous && previous.focus) previous.focus();
        resolve(result);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); close(input ? null : false); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); btnOk.click(); }
      }
      document.addEventListener('keydown', onKey, true);
      btnCancel.addEventListener('click', function () { close(input ? null : false); });
      btnOk.addEventListener('click', function () { close(input ? input.value.trim() : true); });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(input ? null : false);
      });
      (input || btnOk).focus();
    });
  }

  function confirmDialog(opts) {
    return dialog(opts).then(function (v) { return v === true; });
  }

  // 도우미(운영자) 코드 확인. 맞으면 true
  function askCode(opts) {
    opts = opts || {};
    return dialog({
      title: opts.title || '도우미 선생님 확인',
      message: opts.message || '도우미 코드를 입력해 주세요.',
      input: true,
      placeholder: '도우미 코드',
      okText: opts.okText || '확인',
      danger: opts.danger
    }).then(function (value) {
      if (value === null) return false;
      if (value === STAFF_CODE) return true;
      toast('코드가 맞지 않습니다.', 'warn');
      return false;
    });
  }

  // ---------- 게임 진행 상태 ----------
  // 각 게임은 #screen-game 의 hidden/active 클래스로 화면을 바꿉니다.
  function isPlaying() {
    var game = document.getElementById('screen-game');
    return !!game && !game.classList.contains('hidden');
  }
  function syncPlayingClass() {
    document.body.classList.toggle('is-playing', isPlaying());
  }
  function watchScreens() {
    var game = document.getElementById('screen-game');
    if (!game) return;
    syncPlayingClass();
    new MutationObserver(function () {
      var before = document.body.classList.contains('is-playing');
      syncPlayingClass();
      if (!before && isPlaying()) window.scrollTo(0, 0);
    }).observe(game, { attributes: true, attributeFilter: ['class'] });
  }

  // 진행 중에 허브로 나가려 하면 한 번 확인
  function guardHubLinks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a.btn-hub-back') : null;
      if (!link || !isPlaying()) return;
      e.preventDefault();
      confirmDialog({
        title: '게임을 그만둘까요?',
        message: '지금 나가면 이번 도전 기록은 저장되지 않아요.',
        okText: '허브로 나가기',
        cancelText: '계속 풀기'
      }).then(function (ok) { if (ok) window.location.href = link.href; });
    });
  }

  // ESC로 열려 있는 모달 닫기 (닫기 버튼이 있는 모달만)
  function escClosesModals() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = document.querySelectorAll('.modal:not(.hidden)');
      var top = open[open.length - 1];
      if (!top) return;
      var closer = top.querySelector('[data-close], .btn-modal-close');
      if (closer) closer.click();
    });
  }

  // 정답 입력칸: 영문 대문자 자동, 맞춤법 교정 끔
  function tuneInputs() {
    var answer = document.getElementById('input-answer');
    if (answer) {
      answer.setAttribute('autocapitalize', 'characters');
      answer.setAttribute('autocorrect', 'off');
      answer.setAttribute('spellcheck', 'false');
      answer.setAttribute('enterkeyhint', 'done');
    }
    ['player-name', 'hub-player-name', 'intro-player-name'].forEach(function (id) {
      var name = document.getElementById(id);
      if (name) { name.setAttribute('enterkeyhint', 'go'); name.setAttribute('spellcheck', 'false'); }
    });
  }

  // 부스 태블릿이 체험 도중 꺼지지 않도록 (지원 브라우저만)
  function keepAwake() {
    if (!('wakeLock' in navigator)) return;
    var lock = null;
    function request() {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {});
    }
    document.addEventListener('visibilitychange', request);
    document.addEventListener('pointerdown', function once() {
      document.removeEventListener('pointerdown', once);
      if (!lock) request();
    });
  }

  function init() {
    watchScreens();
    guardHubLinks();
    escClosesModals();
    tuneInputs();
    keepAwake();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.MathHubUI = {
    toast: toast,
    confirm: confirmDialog,
    askCode: askCode,
    isPlaying: isPlaying
  };
})();
