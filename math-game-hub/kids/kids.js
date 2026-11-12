/**
 * 꼬마 요원 출동! (유아·초등 저학년용)
 * 친구 고르기 → 미션 이야기 영상 → 놀이 4개(세기·모양·구슬·짝꿍) → 인증서
 * - 글자를 몰라도 할 수 있게: 문제를 소리로 읽어 주고(기기의 읽어 주기 기능), 큰 그림 버튼만 누릅니다.
 * - 틀려도 감점·시간 제한·순위가 없습니다. 맞을 때까지 다시 고를 수 있어요.
 * - 본 게임의 순위 기록(math_hub_records)에는 아무것도 남기지 않습니다.
 */
(function () {
  'use strict';
  const VIDEO_SRC = '../media/intro-kids.mp4';
  const HOME_URL = '../index.html';
  const KEY_LOG = 'math_hub_kids_log';        // 참여 수만 세는 간단한 기록 (이름·시각·단계)

  // 영상 자막과 같은 문장을 같은 때에 읽어 줌
  const STORY_CUES = [
    [0.6, '반짝반짝 수학 마을에 별님 넷이 살았어요.'],
    [6.9, '앗! 심술 구름이 나타났어요!'],
    [9.9, '별님들을 상자에 꼭꼭 숨겨 버렸어요.'],
    [13.6, '걱정 마요! 꼬마 요원이 출동해요!'],
    [16.8, '열쇠 네 개를 찾으면 상자가 열려요.'],
    [21.2, '수학 놀이를 하고 열쇠를 모아요!'],
    [24.4, '별님을 모두 구해 줄래요?'],
    [27.8, '꼬마 요원 출동!'],
  ];
  const MISSIONS = [
    { id: 'count', tag: '열쇠 1 · 세기', rounds: 3 },
    { id: 'pattern', tag: '열쇠 2 · 모양', rounds: 3 },
    { id: 'ball', tag: '열쇠 3 · 구슬', rounds: 1 },
    { id: 'match', tag: '열쇠 4 · 짝꿍', rounds: 1 },
  ];
  const PRAISE = ['딩동댕! 잘했어요!', '우와, 최고예요!', '맞았어요! 멋져요!', '척척박사네요!'];
  const RETRY = ['다시 한번 세어 볼까요?', '괜찮아요, 다시 골라 봐요!', '음, 다른 걸 골라 볼까요?'];
  const THINGS = ['🍎', '🐟', '🚗', '🌼', '🐞', '🧁', '🎈', '🍓', '🐤', '⚽'];

  const $ = (id) => document.getElementById(id);
  const app = $('app'), board = $('q-board'), choices = $('q-choices'), qText = $('q-text'), qTag = $('q-tag'), qDots = $('q-dots');
  const video = $('kid-video'), kong = document.querySelector('.q-kong');
  const state = { buddy: '토끼', emoji: '🐰', level: 'k', name: '', sound: true, mission: 0, round: 0, lastSay: '', busy: false };

  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- 소리: 읽어 주기 + 효과음 ----------
  let actx = null;
  function beep(freqs, step = 0.09, type = 'sine', vol = 0.18) {
    if (!state.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * step;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.3);
      });
    } catch (e) { /* 소리가 안 나도 놀이는 계속 */ }
  }
  const sfx = {
    tap: () => beep([660], 0.05, 'sine', 0.1),
    ok: () => beep([784, 988, 1319], 0.09, 'triangle'),
    no: () => beep([330, 262], 0.12, 'sine', 0.14),
    star: () => beep([523, 659, 784, 1047, 1319, 1568], 0.08, 'triangle', 0.2),
    drop: (i) => beep([900 + (i % 5) * 120], 0.03, 'sine', 0.06),
  };
  let koVoice = null;
  function findVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = window.speechSynthesis.getVoices() || [];
    koVoice = vs.find(v => /^ko/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { findVoice(); window.speechSynthesis.onvoiceschanged = findVoice; }
  function say(text, remember = true) {
    if (remember) state.lastSay = text;
    if (!state.sound || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; if (koVoice) u.voice = koVoice; u.rate = 0.92; u.pitch = 1.25;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 읽어 주기가 없는 기기 */ }
  }
  function hush() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }

  // ---------- 화면 전환 ----------
  function setStage(name) {
    app.dataset.stage = name;
    ['start', 'story', 'play', 'cert'].forEach(s => { $('stage-' + s).hidden = s !== name; });
  }
  function setStars(n) {
    document.querySelectorAll('.k-starslot').forEach((el, i) => el.classList.toggle('on', i < n));
  }
  function ask(text, cls) {
    qText.textContent = text; qText.className = 'q-text' + (cls ? ' ' + cls : '');
  }
  function setDots() {
    const m = MISSIONS[state.mission];
    qDots.innerHTML = '';
    for (let i = 0; i < m.rounds && m.rounds > 1; i++) { const d = document.createElement('i'); if (i < state.round) d.className = 'done'; else if (i === state.round) d.className = 'now'; qDots.appendChild(d); }
  }

  // ---------- 1. 시작 ----------
  document.querySelectorAll('.buddy').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.buddy').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-checked', 'false'); });
    b.classList.add('active'); b.setAttribute('aria-checked', 'true');
    state.buddy = b.dataset.buddy; state.emoji = b.dataset.emoji; sfx.tap(); say(b.dataset.buddy, false);
  }));
  document.querySelectorAll('.level').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.level').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-checked', 'false'); });
    b.classList.add('active'); b.setAttribute('aria-checked', 'true'); state.level = b.dataset.level; sfx.tap();
  }));
  $('btn-start').addEventListener('click', () => {
    state.name = $('kid-name').value.trim() || (state.buddy + ' 요원');
    $('kid-name').blur(); sfx.tap();
    startStory();
  });
  $('kid-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('btn-start').click(); } });

  // ---------- 2. 미션 이야기 ----------
  let cueIdx = 0;
  function startStory() {
    setStage('story');
    $('btn-vstart').classList.remove('pulse'); $('btn-vplay').hidden = true;
    if (!video.getAttribute('src')) video.src = VIDEO_SRC;
    try { video.currentTime = 0; } catch (e) {}
    video.muted = !state.sound; cueIdx = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => { $('btn-vplay').hidden = false; });
  }
  video.addEventListener('timeupdate', () => {
    while (cueIdx < STORY_CUES.length && video.currentTime >= STORY_CUES[cueIdx][0]) {
      if (video.currentTime - STORY_CUES[cueIdx][0] < 1.2) say(STORY_CUES[cueIdx][1], false);
      cueIdx++;
    }
  });
  video.addEventListener('ended', () => { $('btn-vstart').classList.add('pulse'); $('btn-vplay').textContent = '↻'; $('btn-vplay').hidden = false; });
  video.addEventListener('play', () => { $('btn-vplay').hidden = true; });
  video.addEventListener('error', () => { $('btn-vstart').classList.add('pulse'); });   // 영상이 없어도 대표 그림을 보고 출발할 수 있음
  video.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else { video.pause(); hush(); $('btn-vplay').textContent = '▶'; $('btn-vplay').hidden = false; } });
  function replay() { hush(); try { video.currentTime = 0; } catch (e) {} cueIdx = 0; $('btn-vstart').classList.remove('pulse'); video.play().catch(() => {}); }
  $('btn-vplay').addEventListener('click', () => { if (video.ended) replay(); else video.play().catch(() => {}); });
  $('btn-vreplay').addEventListener('click', replay);
  $('btn-vstart').addEventListener('click', () => { video.pause(); hush(); sfx.tap(); state.mission = 0; state.round = 0; setStars(0); setStage('play'); nextRound(); });

  // ---------- 3. 놀이 공통 ----------
  function nextRound() {
    const m = MISSIONS[state.mission];
    state.busy = false;
    qTag.textContent = m.tag; setDots();
    board.innerHTML = ''; choices.innerHTML = ''; choices.hidden = false;
    ({ count: playCount, pattern: playPattern, ball: playBall, match: playMatch })[m.id]();
  }
  async function roundDone(msg) {
    state.busy = true;
    const text = msg || pick(PRAISE);
    ask(text, 'ok'); say(text, false); sfx.ok();
    kong.classList.remove('happy'); void kong.getBoundingClientRect(); kong.classList.add('happy');
    await wait(msg ? 2600 : 1500);
    const m = MISSIONS[state.mission];
    state.round++;
    if (state.round < m.rounds) { nextRound(); return; }
    // 이 놀이의 별을 얻음
    state.mission++; state.round = 0;
    setStars(state.mission); sfx.star(); confetti(1400);
    const last = state.mission >= MISSIONS.length;
    const title = last ? '별님 넷을 모두 구했어요!' : ['첫 번째', '두 번째', '세 번째'][state.mission - 1] + ' 별님을 구했어요!';
    $('pop-title').textContent = title;
    const starEl = document.querySelector('.k-pop-star'); starEl.style.color = ['#ffd84d', '#ff9ec4', '#6fdcb6', '#7cc8ff'][state.mission - 1];
    $('btn-pop-next').textContent = last ? '인증서 받기 ▶' : '다음 놀이 ▶';
    $('k-pop').hidden = false; say(title, false);
  }
  function wrong(btn) {
    sfx.no(); if (btn) btn.classList.add('wrong');
    const text = pick(RETRY); ask(text, 'no'); say(text, false);
    setTimeout(() => { if (!state.busy) ask(state.lastSay); }, 1600);
  }
  $('btn-pop-next').addEventListener('click', () => {
    $('k-pop').hidden = true; sfx.tap();
    if (state.mission >= MISSIONS.length) showCert(); else nextRound();
  });
  function makeChoices(items, isRight, render) {
    shuffle(items).forEach(it => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'choice';
      render(b, it);
      b.addEventListener('click', () => {
        if (state.busy) return;
        if (isRight(it)) { b.classList.add('right'); roundDone(); } else wrong(b);
      });
      choices.appendChild(b);
    });
  }
  // 정답과 가까운 수 2개를 더해 보기 3개 만들기
  function nearNumbers(ans, lo, hi) {
    const set = new Set([ans]);
    const cand = shuffle([ans - 1, ans + 1, ans - 2, ans + 2].filter(v => v >= lo && v <= hi));
    for (const v of cand) { if (set.size < 3) set.add(v); }
    return Array.from(set);
  }

  // ---------- 놀이 1: 세기 ----------
  function playCount() {
    const hard = state.level === 'e';
    const thing = pick(THINGS);
    const wrap = document.createElement('div'); wrap.className = 'count-wrap';
    let ans, q;
    if (hard && state.round === 2) {            // 초등: 마지막은 모으기(덧셈)
      const a = 2 + rand(4), b = 1 + rand(4); ans = a + b;
      const other = pick(THINGS.filter(t => t !== thing));
      wrap.classList.add('many');
      for (let i = 0; i < a; i++) wrap.appendChild(el('span', thing, i));
      const plus = el('span', '+'); plus.className = 'plus'; wrap.appendChild(plus);
      for (let i = 0; i < b; i++) wrap.appendChild(el('span', other, a + i));
      q = '모두 합치면 몇 개일까요?';
    } else {
      ans = hard ? 6 + rand(5) : (state.round === 0 ? 2 + rand(2) : 3 + rand(3));   // 유치원 2~5, 초등 6~10
      if (ans > 6) wrap.classList.add('many');
      for (let i = 0; i < ans; i++) wrap.appendChild(el('span', thing, i));
      q = '모두 몇 개일까요?';
    }
    // 그림을 하나씩 누르면 번호가 붙어서 세기 쉬움
    let n = 0;
    wrap.querySelectorAll('span:not(.plus)').forEach(s => s.addEventListener('click', () => {
      if (s.dataset.n || state.busy) return;
      n++; s.dataset.n = n; s.classList.add('tapped'); beep([440 + n * 60], 0.05, 'sine', 0.12); say(['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'][n - 1] || String(n), false);
    }));
    board.appendChild(wrap);
    ask(q); say(q);
    makeChoices(nearNumbers(ans, 1, 10), v => v === ans, (b, v) => { b.textContent = v; });
  }
  function el(tag, text, i) { const e = document.createElement(tag); e.textContent = text; if (i != null) e.style.animationDelay = (i * 0.06) + 's'; return e; }

  // ---------- 놀이 2: 모양 규칙 ----------
  const SHAPES = {
    circle: (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${c}"/></svg>`,
    square: (c) => `<svg viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="14" fill="${c}"/></svg>`,
    triangle: (c) => `<svg viewBox="0 0 100 100"><path d="M50 14 L88 82 L12 82Z" fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/></svg>`,
    star: (c) => `<svg viewBox="-60 -60 120 120"><path d="M0 -44 L12.9 -17.8 41.8 -13.6 20.9 6.8 25.9 35.6 0 22 -25.9 35.6 -20.9 6.8 -41.8 -13.6 -12.9 -17.8Z" fill="${c}" stroke="${c}" stroke-width="12" stroke-linejoin="round"/></svg>`,
    heart: (c) => `<svg viewBox="0 0 100 100"><path d="M50 84 C0 48 22 8 50 34 C78 8 100 48 50 84Z" fill="${c}"/></svg>`,
  };
  const TOKENS = [['circle', '#ff7a9a'], ['square', '#3d6df2'], ['triangle', '#ffb14a'], ['star', '#22b07d'], ['heart', '#a78bfa']];
  function playPattern() {
    const hard = state.level === 'e';
    const rules = hard ? [[0, 0, 1], [0, 1, 2], [0, 1, 1]] : [[0, 1], [0, 1], [0, 0, 1]];
    const rule = rules[state.round % rules.length];
    const toks = shuffle(TOKENS).slice(0, 3);
    const len = rule.length === 2 ? 5 : 6;      // 마지막 칸이 물음표
    const seq = Array.from({ length: len + 1 }, (_, i) => rule[i % rule.length]);
    const ans = seq[len];
    const row = document.createElement('div'); row.className = 'pat-row';
    seq.slice(0, len).forEach((k, i) => { const c = document.createElement('div'); c.className = 'cell'; c.style.animationDelay = (i * 0.1) + 's'; c.innerHTML = SHAPES[toks[k][0]](toks[k][1]); row.appendChild(c); });
    const qc = document.createElement('div'); qc.className = 'cell q'; qc.textContent = '?'; row.appendChild(qc);
    board.appendChild(row);
    const q = '다음에 올 모양은 무엇일까요?';
    ask(q); say(q);
    makeChoices([0, 1, 2], v => v === ans, (b, v) => { b.innerHTML = SHAPES[toks[v][0]](toks[v][1]); });
    // 맞히면 물음표 칸에 정답이 들어감
    choices.addEventListener('click', function once(e) { const b = e.target.closest('.choice.right'); if (b) { qc.classList.remove('q'); qc.innerHTML = b.innerHTML; choices.removeEventListener('click', once); } });
  }

  // ---------- 놀이 3: 구슬은 어디로? (작은 갈톤 보드) ----------
  function playBall() {
    const ROWS = 4, BINS = 5, BALLS = 24;
    const cols = ['#ff7a9a', '#ffb14a', '#22b07d', '#3d6df2', '#a78bfa'];
    const cv = document.createElement('canvas'); cv.id = 'ball-canvas'; board.appendChild(cv);
    const g = cv.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { const r = board.getBoundingClientRect(); W = Math.max(200, r.width - 8); H = Math.max(140, r.height - 8); cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    const counts = new Array(BINS).fill(0);
    const balls = [];
    let guess = -1, started = false, done = false, raf = 0;
    const geo = () => { const binW = Math.min(W / (BINS + 1.5), H * 0.42); const x0 = W / 2 - binW * BINS / 2; const top = H * 0.06, pegGap = (H * 0.5) / ROWS, binTop = top + pegGap * (ROWS + 0.4); return { binW, x0, top, pegGap, binTop, r: Math.min(binW * 0.11, (H - binTop) / 16) }; };
    function pegPos(row, k, G) { return { x: W / 2 + (k - row / 2) * G.binW, y: G.top + G.pegGap * (row + 0.7) }; }
    function draw(now) {
      const G = geo(); g.clearRect(0, 0, W, H);
      // 칸
      for (let b = 0; b < BINS; b++) {
        const x = G.x0 + b * G.binW;
        g.fillStyle = cols[b] + (guess === b ? '55' : '22'); g.beginPath(); g.roundRect(x + 3, G.binTop, G.binW - 6, H - G.binTop - 2, 12); g.fill();
        if (guess === b) { g.strokeStyle = cols[b]; g.lineWidth = 4; g.stroke(); }
        g.fillStyle = cols[b]; g.font = `${Math.round(G.binW * 0.3)}px Jua, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom';
        if (!started) g.fillText(String(b + 1), x + G.binW / 2, H - 8);
        // 쌓인 구슬
        const per = Math.max(1, Math.floor((G.binW - 12) / (G.r * 2.1)));
        for (let i = 0; i < counts[b]; i++) { const cx = x + G.binW / 2 + ((i % per) - (per - 1) / 2) * G.r * 2.1, cy = H - 8 - G.r - Math.floor(i / per) * G.r * 2.05; g.beginPath(); g.arc(cx, cy, G.r, 0, 7); g.fillStyle = cols[b]; g.fill(); }
      }
      // 못
      g.fillStyle = '#b9b2dd';
      for (let r = 0; r < ROWS; r++) for (let k = 0; k <= r; k++) { const p = pegPos(r, k, G); g.beginPath(); g.arc(p.x, p.y, G.r * 0.7, 0, 7); g.fill(); }
      // 떨어지는 구슬
      let moving = false;
      balls.forEach((bl, bi) => {
        const t = (now - bl.t0) / 260;                 // 한 줄 내려가는 데 0.26초
        if (t < 0) { moving = true; return; }
        if (bl.landed) return;
        const step = Math.floor(t), f = t - step;
        if (step > ROWS) { bl.landed = true; counts[bl.bin]++; sfx.drop(bl.bin); return; }
        moving = true;
        const pts = bl.pts(G), a = pts[step], b2 = pts[Math.min(step + 1, pts.length - 1)];
        const x = a.x + (b2.x - a.x) * f, y = a.y + (b2.y - a.y) * (f * f) - Math.sin(f * Math.PI) * G.pegGap * 0.18;
        g.beginPath(); g.arc(x, y, G.r, 0, 7); g.fillStyle = '#35307a'; g.fill();
      });
      if (started && !moving && !done) { done = true; finish(); }
      if (!done || moving) raf = requestAnimationFrame(draw);
    }
    function start() {
      started = true; state.busy = true; choices.hidden = true;
      const now = performance.now();
      for (let i = 0; i < BALLS; i++) {
        const path = []; let k = 0;
        for (let r = 0; r < ROWS; r++) { const right = Math.random() < 0.5; path.push(k); if (right) k++; }
        const bin = k, ks = path.slice();
        balls.push({ t0: now + 500 + i * 190, bin, landed: false, pts: (G) => { const pts = [{ x: W / 2, y: G.top - G.r }]; ks.forEach((kk, r) => { const p = pegPos(r, kk, G); pts.push({ x: p.x, y: p.y - G.r * 1.6 }); }); pts.push({ x: G.x0 + (bin + 0.5) * G.binW, y: G.binTop + G.r }); return pts; } });
      }
      const t = '구슬이 떨어져요! 어디에 모이는지 잘 봐요.'; ask(t); say(t, false);
    }
    function finish() {
      const max = Math.max(...counts), best = counts.indexOf(max), mid = (BINS - 1) / 2;
      const where = best === mid ? '가운데 칸' : (best + 1) + '번 칸';
      const hit = counts[guess] === max;
      const msg = (hit ? '맞았어요! ' : '') + where + '에 가장 많이 모였어요!' + (Math.abs(best - mid) <= 1 ? ' 구슬은 가운데를 좋아해요.' : '');
      state.busy = false; roundDone(msg);
    }
    const q = '구슬이 어느 칸에 가장 많이 모일까요? 칸을 눌러 봐요.';
    ask(q); say(q);
    makeChoicesBins();
    function makeChoicesBins() {
      choices.hidden = true;
      cv.addEventListener('click', (e) => {
        if (started) return;
        const r = cv.getBoundingClientRect(), G = geo(), x = e.clientX - r.left;
        const b = Math.floor((x - G.x0) / G.binW);
        if (b < 0 || b >= BINS) return;
        guess = b; sfx.tap(); setTimeout(start, 350);
      });
    }
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(draw);
  }

  // ---------- 놀이 4: 짝꿍 찾기 (숫자 ↔ 점) ----------
  function playMatch() {
    const hard = state.level === 'e';
    const pairs = hard ? 4 : 3;
    const nums = shuffle(hard ? [3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5]).slice(0, pairs);
    const cards = shuffle(nums.map(n => ({ n, kind: 'num' })).concat(nums.map(n => ({ n, kind: 'dots' }))));
    const grid = document.createElement('div'); grid.className = 'match-grid'; grid.style.setProperty('--cols', pairs);
    let sel = null, left = pairs;
    cards.forEach(c => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mcard ' + c.kind;
      if (c.kind === 'num') b.textContent = c.n;
      else { const p = document.createElement('div'); p.className = 'pips'; for (let i = 0; i < c.n; i++) p.appendChild(document.createElement('i')); b.appendChild(p); }
      b.addEventListener('click', () => {
        if (state.busy || b.classList.contains('gone')) return;
        sfx.tap();
        if (!sel) { sel = { b, c }; b.classList.add('sel'); return; }
        if (sel.b === b) { b.classList.remove('sel'); sel = null; return; }
        const a = sel; sel = null; a.b.classList.remove('sel');
        if (a.c.n === c.n && a.c.kind !== c.kind) {
          [a.b, b].forEach(x => x.classList.add('right')); sfx.ok(); left--;
          setTimeout(() => { [a.b, b].forEach(x => x.classList.add('gone')); if (left === 0) roundDone(); }, 500);
        } else {
          [a.b, b].forEach(x => { x.classList.remove('wrong'); void x.offsetWidth; x.classList.add('wrong'); });
          wrong(null);
        }
      });
      grid.appendChild(b);
    });
    board.appendChild(grid); choices.hidden = true;
    const q = '숫자와 점의 수가 같은 짝꿍을 찾아요!';
    ask(q); say(q);
  }

  // ---------- 4. 인증서 ----------
  function showCert() {
    setStage('cert');
    $('cert-emoji').textContent = state.emoji; $('cert-name').textContent = state.name;
    sfx.star(); confetti(3500);
    say(state.name + ', 별님 넷을 모두 구했어요! 멋진 꼬마 요원이에요!', false);
    try {
      const log = JSON.parse(localStorage.getItem(KEY_LOG) || '[]');
      log.push({ name: state.name, level: state.level, timestamp: new Date().toISOString() });
      localStorage.setItem(KEY_LOG, JSON.stringify(log.slice(-500)));
    } catch (e) { /* 저장이 안 돼도 괜찮음 */ }
  }
  $('btn-again').addEventListener('click', () => { hush(); state.mission = 0; state.round = 0; setStars(0); setStage('play'); nextRound(); });
  $('btn-finish').addEventListener('click', () => { hush(); location.href = HOME_URL; });

  // ---------- 위쪽 버튼 ----------
  $('btn-say').addEventListener('click', () => { ask(state.lastSay); say(state.lastSay); });
  $('btn-sound').addEventListener('click', () => {
    state.sound = !state.sound;
    $('btn-sound').textContent = state.sound ? '🔊' : '🔇'; $('btn-sound').setAttribute('aria-pressed', String(state.sound));
    video.muted = !state.sound; if (!state.sound) hush();
  });
  $('btn-home').addEventListener('click', () => {
    if (app.dataset.stage === 'start') { location.href = HOME_URL; return; }
    $('k-ask').hidden = false;
  });
  $('btn-ask-no').addEventListener('click', () => { $('k-ask').hidden = true; });
  $('btn-ask-yes').addEventListener('click', () => { hush(); video.pause(); location.href = HOME_URL; });

  // ---------- 색종이 ----------
  const cf = $('k-confetti'), cg = cf.getContext('2d');
  let cfUntil = 0, cfParts = [], cfRaf = 0;
  function confetti(ms) {
    const r = app.getBoundingClientRect(); cf.width = r.width; cf.height = r.height;
    const cols = ['#ffd84d', '#ff9ec4', '#6fdcb6', '#7cc8ff', '#ffb14a', '#a78bfa'];
    cfParts = Array.from({ length: 110 }, (_, i) => ({ x: Math.random() * cf.width, y: -20 - Math.random() * cf.height * 0.6, v: 2 + Math.random() * 4, w: 8 + Math.random() * 8, a: Math.random() * 7, s: (Math.random() - 0.5) * 0.3, c: cols[i % 6] }));
    cfUntil = performance.now() + ms;
    cancelAnimationFrame(cfRaf);
    (function loop(now) {
      cg.clearRect(0, 0, cf.width, cf.height);
      const fade = Math.max(0, Math.min(1, (cfUntil - (now || performance.now())) / 500));
      cfParts.forEach(p => { p.y += p.v; p.x += Math.sin(p.a) * 1.5; p.a += p.s; cg.save(); cg.globalAlpha = fade; cg.translate(p.x, p.y); cg.rotate(p.a * 3); cg.fillStyle = p.c; cg.fillRect(-p.w / 2, -p.w / 3, p.w, p.w / 1.5); cg.restore(); });
      if (fade > 0) cfRaf = requestAnimationFrame(loop); else cg.clearRect(0, 0, cf.width, cf.height);
    })();
  }

  // 시험·점검용: 주소 끝에 #play, #cert 를 붙이면 그 화면부터
  if (location.hash === '#play') { setStage('play'); nextRound(); }
  else if (location.hash === '#cert') { state.name = '토끼 요원'; setStars(4); showCert(); }
  else setStage('start');
})();
