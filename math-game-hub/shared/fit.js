/**
 * 화면에 키보드가 올라왔는지 알아내서 <html class="kb-open">을 붙이고 뗍니다.
 * - 글자를 입력하는 칸에 커서가 있고, 보이는 높이가 평소보다 크게 줄었을 때만 켭니다.
 *   (주소창이 접히거나 분할 화면일 때는 켜지지 않습니다)
 * - 켜지면 shared/fit.css 가 문제와 입력칸만 남기고 나머지를 접어 줍니다.
 * - 주소 끝에 ?size 를 붙이면 화면 크기를 왼쪽 아래에 보여 줍니다(기기 점검용).
 */
(function () {
  var root = document.documentElement;
  var vv = window.visualViewport;
  var baseH = 0;

  function isTextField(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && /^(text|search|number|tel|email|password|url|)$/i.test(el.type || '');
  }
  function visibleH() { return vv ? vv.height : window.innerHeight; }

  function resetBase() { baseH = Math.max(window.innerHeight, visibleH()); }

  function update() {
    var h = visibleH();
    root.style.setProperty('--vvh', Math.round(h) + 'px');
    var kbWas = root.classList.contains('kb-open');
    if (!kbWas) baseH = Math.max(baseH, window.innerHeight, h);
    var open = isTextField(document.activeElement) && (baseH - h) > Math.max(120, baseH * 0.18);
    root.classList.toggle('kb-open', open);
    if (open && !kbWas) {
      var el = document.activeElement;
      setTimeout(function () { try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }, 80);
    }
    if (badge) showSize();
  }

  var badge = null;
  function showSize() {
    var h = visibleH();
    badge.textContent = Math.round(window.innerWidth) + '×' + Math.round(h) + ' @' + (window.devicePixelRatio || 1) +
      (root.classList.contains('kb-open') ? ' · 키보드' : '');
  }
  if (/[?&]size\b/.test(location.search)) {
    badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99999;background:#000c;color:#fff;font:700 12px/1.2 monospace;padding:4px 8px;border-radius:6px;pointer-events:none';
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(badge); showSize(); });
  }

  resetBase();
  if (vv) { vv.addEventListener('resize', update); }
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', function () { baseH = 0; setTimeout(function () { resetBase(); update(); }, 350); });
  document.addEventListener('focusin', function () { setTimeout(update, 60); setTimeout(update, 380); });
  document.addEventListener('focusout', function () { setTimeout(update, 120); });
  update();
})();
