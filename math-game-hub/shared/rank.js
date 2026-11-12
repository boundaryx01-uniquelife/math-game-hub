/**
 * 순위 TOP 10 화면 (게임 종류별 4칸을 한 화면에)
 * - 수열 금고·오메가 프로토콜이 끝나면 결과 대신 이 화면을 먼저 보여 줍니다.
 * - 기록은 localStorage 의 math_hub_records (각 게임이 저장). 마스터 키를 쓴 기록은 순위에서 뺍니다.
 * - 난이도 칩(초등·중등·고등·전체)으로 바꿔 볼 수 있고, 처음에는 지금 참가자의 난이도로 보여 줍니다.
 *   (오메가는 난이도가 하나라 항상 전체를 보여 줌)
 * 사용: MathHubRank.mount(sectionEl, { difficulty, finished, actions:[{label, variant, onClick|href}] })
 */
(function () {
  var KEY_RECORDS = 'math_hub_records';
  var KEY_PLAYER = 'math_hub_current_player';
  var GAMES = [
    { id: 'cipher_escape', icon: '🕵️', name: '암호 탈출', kind: 'time' },
    { id: 'galton_drop', icon: '🔮', name: '확률 구슬', kind: 'score' },
    { id: 'sequence_vault', icon: '🔐', name: '수열 금고', kind: 'score' },
    { id: 'omega_protocol', icon: '👑', name: '오메가', kind: 'time', allLevels: true }
  ];
  var LEVELS = [
    { id: 'easy', label: '🌱 초등' },
    { id: 'normal', label: '⭐ 중등' },
    { id: 'hard', label: '🔥 고등' },
    { id: 'all', label: '전체' }
  ];
  var MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
  var LEVEL_EMOJI = { easy: '🌱', normal: '⭐', hard: '🔥' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }
  function read() {
    try { var l = JSON.parse(localStorage.getItem(KEY_RECORDS) || '[]'); return Array.isArray(l) ? l : []; }
    catch (e) { return []; }
  }
  function top(records, game, level) {
    var list = records.filter(function (r) {
      if (!r || r.gameId !== game.id || r.masterKeyUsed) return false;
      if (game.allLevels || level === 'all') return true;
      return r.difficulty === level;
    });
    list.sort(function (a, b) { return (a.clearTimeSeconds - b.clearTimeSeconds) || ((a.timestamp || 0) - (b.timestamp || 0)); });
    return list;
  }
  function recText(r) { return r.clearTimeFormatted || (r.score != null ? r.score + '점' : '-'); }

  // currentScript 는 로드 중에만 값이 있으므로 미리 기준 주소를 저장해 둠
  var BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/shared\/rank\.js.*$/, '') : '';
  function introUrl() { return BASE ? BASE + 'index.html' : 'index.html'; }

  function mount(root, opts) {
    opts = opts || {};
    var level = opts.difficulty && LEVELS.some(function (l) { return l.id === opts.difficulty; }) ? opts.difficulty : 'all';
    var fin = opts.finished || null;

    function draw() {
      var records = read();
      var me = (localStorage.getItem(KEY_PLAYER) || (fin && fin.name) || '').trim();
      var myLine = '';
      if (fin) {
        var g = GAMES.filter(function (x) { return x.id === fin.gameId; })[0];
        if (fin.masterKeyUsed) {
          myLine = '마스터 키를 쓴 기록은 순위에 들어가지 않아요';
        } else if (g) {
          var list = top(records, g, level);
          var idx = list.findIndex(function (r) { return r.timestamp === fin.timestamp && r.name === fin.name; });
          myLine = '<b>' + esc(fin.name) + '</b> 님 ' + esc(g.name) + ' <b>' + esc(recText(fin)) + '</b>' +
            (idx >= 0 ? ' · <b class="rk-place">' + (idx + 1) + '위</b>' : ' · 이 표에서는 10위 밖이거나 다른 난이도예요');
        }
      }
      var cols = GAMES.map(function (g) {
        var list = top(records, g, level);
        var rows = '';
        for (var i = 0; i < 10; i++) {
          var r = list[i];
          if (!r) { rows += '<li class="rk-row rk-empty"><span class="rk-no">' + (i + 1) + '</span><span class="rk-name">-</span><span class="rk-rec"></span></li>'; continue; }
          var mine = fin && r.timestamp === fin.timestamp && r.name === fin.name;
          var cls = 'rk-row' + (mine ? ' rk-fin' : (me && r.name === me ? ' rk-me' : ''));
          var lv = (level === 'all' || g.allLevels) && LEVEL_EMOJI[r.difficulty] ? '<i class="rk-lv" aria-hidden="true">' + LEVEL_EMOJI[r.difficulty] + '</i>' : '';
          rows += '<li class="' + cls + '"><span class="rk-no">' + (MEDAL[i + 1] || (i + 1)) + '</span><span class="rk-name" title="' + esc(r.name) + '">' + lv + esc(r.name) + '</span><span class="rk-rec">' + esc(recText(r)) + '</span></li>';
        }
        return '<section class="rk-col" aria-label="' + esc(g.name) + ' TOP 10"><h3>' + g.icon + ' ' + esc(g.name) +
          ' <small>' + (g.kind === 'time' ? '빠른 시간' : '높은 점수') + '</small></h3><ol class="rk-list">' + rows + '</ol></section>';
      }).join('');
      var chips = LEVELS.map(function (l) {
        return '<button type="button" class="rk-chip' + (l.id === level ? ' active' : '') + '" data-level="' + l.id + '" aria-pressed="' + (l.id === level) + '">' + l.label + '</button>';
      }).join('');
      root.innerHTML =
        '<div class="rk-wrap">' +
          '<header class="rk-head"><h2>🏆 순위 TOP 10</h2><p class="rk-my">' + myLine + '</p><div class="rk-chips" role="group" aria-label="난이도">' + chips + '</div></header>' +
          '<div class="rk-grid">' + cols + '</div>' +
          '<footer class="rk-actions" id="rk-actions"></footer>' +
        '</div>';
      var bar = root.querySelector('#rk-actions');
      var acts = [{ label: '🙋 다음 친구 차례 (처음 화면으로)', variant: 'primary', intro: true }].concat(opts.actions || []);
      acts.forEach(function (a) {
        var el;
        if (a.href) { el = document.createElement('a'); el.href = a.href; }
        else { el = document.createElement('button'); el.type = 'button'; }
        el.className = 'btn rk-btn ' + (a.variant === 'primary' ? 'btn-primary' : a.variant === 'omega' ? 'btn-omega' : 'btn-secondary');
        el.innerHTML = '<span>' + esc(a.label) + '</span>';
        if (a.intro) el.addEventListener('click', goIntro);
        else if (a.onClick) el.addEventListener('click', a.onClick);
        bar.appendChild(el);
      });
      root.querySelectorAll('.rk-chip').forEach(function (b) {
        b.addEventListener('click', function () { level = b.getAttribute('data-level'); draw(); var again = root.querySelector('.rk-chip.active'); if (again) again.focus(); });
      });
    }
    draw();
  }
  function goIntro() {
    try { localStorage.removeItem(KEY_PLAYER); } catch (e) {}
    window.location.href = introUrl();
  }
  // 기본 3개 미션을 모두 마쳤는지(히든 미션 버튼을 보여 줄지 정할 때)
  function hasClearedBasics(name) {
    var recs = read().filter(function (r) { return r && r.name === name; });
    return ['cipher_escape', 'galton_drop', 'sequence_vault'].every(function (id) { return recs.some(function (r) { return r.gameId === id; }); });
  }
  window.MathHubRank = { mount: mount, goIntro: goIntro, hasClearedBasics: hasClearedBasics };
})();
