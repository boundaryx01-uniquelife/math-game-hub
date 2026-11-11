/*!
 * 수학 게임 허브 - PWA 도우미 (shared/pwa.js)
 * 서비스 워커(sw.js)를 등록하고 오프라인 준비 상태 / 설치 / 업데이트 정보를 제공합니다.
 * UI 는 없습니다. 어느 깊이의 페이지에서든 <script src="…/shared/pwa.js" defer> 로 불러오세요.
 *
 * window.MathHubPWA
 *   .supported           서비스 워커 사용 가능 여부 (file:// 이거나 미지원 브라우저면 false)
 *   .reason              supported 가 false 일 때 이유 ('file' | 'unsupported' | 'insecure')
 *   .ready               오프라인 사용 준비 완료 여부 (boolean)
 *   .status()            { supported, registered, controlled, ready, online, standalone,
 *                          installable, version, done, total, failed:[], missing:[] }
 *   .whenReady()         오프라인 준비가 끝나면 resolve 되는 Promise (미지원이면 영원히 대기하지 않고 false 로 resolve)
 *   .canInstall()        설치 프롬프트를 띄울 수 있는지 (beforeinstallprompt 발생 여부)
 *   .promptInstall()     설치 프롬프트 표시. Promise<'accepted'|'dismissed'|'unavailable'>
 *   .isStandalone()      홈 화면 앱(독립 창)으로 실행 중인지
 *   .checkForUpdate()    새 버전 확인 (온라인일 때)
 *   .requestPersistentStorage()  브라우저가 사이트 데이터(순위 기록)를 임의로 지우지 않도록 요청
 *   .on(event, fn) / .off(event, fn) / .once(event, fn)
 *   이벤트: 'ready'(오프라인 준비 완료), 'progress'(저장 진행), 'update'(새 버전 적용됨, 새로고침하면 반영),
 *           'installable'(설치 가능), 'installed'(설치됨), 'online', 'offline', 'status'(상태가 바뀔 때마다)
 *   .onReady / .onUpdate  (선택) 콜백 속성
 * 같은 이벤트가 window 에도 CustomEvent('mathhub:' + 이름) 로 발생합니다.
 */
(function () {
  'use strict';
  if (window.MathHubPWA) return;

  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var listeners = {};
  var state = {
    registered: false, controlled: false, ready: false, installable: false,
    version: null, done: 0, total: 0, failed: [], missing: []
  };
  var deferredPrompt = null;
  var readyResolvers = [];
  var hadController = false;

  var supported = false, reason = '';
  if (location.protocol === 'file:') reason = 'file';
  else if (!('serviceWorker' in navigator)) reason = window.isSecureContext === false ? 'insecure' : 'unsupported';
  else supported = true;

  function emit(name, detail) {
    (listeners[name] || []).slice().forEach(function (fn) { try { fn(detail, api.status()); } catch (e) { console.error(e); } });
    try { window.dispatchEvent(new CustomEvent('mathhub:' + name, { detail: detail })); } catch (e) {}
    var cb = name === 'ready' ? api.onReady : name === 'update' ? api.onUpdate : null;
    if (typeof cb === 'function') { try { cb(detail, api.status()); } catch (e) {} }
    if (name !== 'status') emit2status();
  }
  var inStatus = false;
  function emit2status() {
    if (inStatus) return; inStatus = true;
    try { emit('status', api.status()); } finally { inStatus = false; }
  }

  function applyStatus(s) {
    if (!s) return;
    state.version = s.version || state.version;
    state.done = s.done || 0;
    state.total = s.total || 0;
    state.failed = s.failed || [];
    state.missing = s.missing || [];
    var wasReady = state.ready;
    state.ready = !!s.ready;
    emit('progress', { done: state.done, total: state.total });
    if (state.ready && !wasReady) {
      readyResolvers.splice(0).forEach(function (r) { r(true); });
      emit('ready', api.status());
    }
  }

  function isStandalone() {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true;
    } catch (e) { return false; }
  }

  function askStatus(reg) {
    var sw = (reg && reg.active) || navigator.serviceWorker.controller;
    if (!sw) return;
    var ch = new MessageChannel();
    ch.port1.onmessage = function (e) { if (e.data && e.data.status) applyStatus(e.data.status); };
    sw.postMessage({ type: 'GET_STATUS' }, [ch.port2]);
  }

  var api = {
    supported: supported,
    reason: reason,
    get ready() { return state.ready; },
    onReady: null,
    onUpdate: null,
    status: function () {
      return {
        supported: supported, reason: reason, registered: state.registered, controlled: state.controlled,
        ready: state.ready, online: navigator.onLine !== false, standalone: isStandalone(),
        installable: !!deferredPrompt, version: state.version, done: state.done, total: state.total,
        failed: state.failed.slice(), missing: state.missing.slice()
      };
    },
    whenReady: function () {
      if (state.ready) return Promise.resolve(true);
      if (!supported) return Promise.resolve(false);
      return new Promise(function (res) { readyResolvers.push(res); });
    },
    canInstall: function () { return !!deferredPrompt; },
    promptInstall: function () {
      if (!deferredPrompt) return Promise.resolve('unavailable');
      var p = deferredPrompt;
      deferredPrompt = null;
      p.prompt();
      return p.userChoice.then(function (c) { emit('status'); return c.outcome; }, function () { return 'dismissed'; });
    },
    isStandalone: isStandalone,
    checkForUpdate: function () {
      if (!supported) return Promise.resolve(false);
      return navigator.serviceWorker.getRegistration().then(function (reg) {
        return reg ? reg.update().then(function () { return true; }) : false;
      }).catch(function () { return false; });
    },
    requestPersistentStorage: function () {
      try {
        if (navigator.storage && navigator.storage.persist) return navigator.storage.persist();
      } catch (e) {}
      return Promise.resolve(false);
    },
    on: function (n, fn) { (listeners[n] = listeners[n] || []).push(fn); return api; },
    off: function (n, fn) { listeners[n] = (listeners[n] || []).filter(function (f) { return f !== fn; }); return api; },
    once: function (n, fn) {
      function w(d, s) { api.off(n, w); fn(d, s); }
      return api.on(n, w);
    }
  };
  window.MathHubPWA = api;

  window.addEventListener('online', function () { emit('online'); });
  window.addEventListener('offline', function () { emit('offline'); });
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    emit('installable');
  });
  window.addEventListener('appinstalled', function () { deferredPrompt = null; emit('installed'); });

  if (!supported) return;

  hadController = !!navigator.serviceWorker.controller;
  state.controlled = hadController;

  navigator.serviceWorker.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'MATHHUB_PROGRESS' || d.type === 'MATHHUB_READY' || d.type === 'MATHHUB_STATUS' || d.type === 'MATHHUB_ACTIVATED') {
      applyStatus(d.status);
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    state.controlled = true;
    if (hadController) {
      // 이미 옛 버전으로 열려 있던 페이지에 새 버전이 적용됨 -> 새로고침하면 새 내용
      emit('update', { version: state.version });
    }
    hadController = true;
    navigator.serviceWorker.getRegistration().then(askStatus);
  });

  function register() {
    var swUrl = scriptSrc ? new URL('../sw.js', scriptSrc).href : 'sw.js';
    navigator.serviceWorker.register(swUrl).then(function (reg) {
      state.registered = true;
      askStatus(reg);
      navigator.serviceWorker.ready.then(askStatus);
      // 온라인 상태로 돌아오면 업데이트 확인
      window.addEventListener('online', function () { reg.update().catch(function () {}); });
      emit('status');
    }).catch(function (err) {
      console.warn('[MathHubPWA] 서비스 워커 등록 실패:', err);
    });
  }

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);

  api.requestPersistentStorage();
})();
