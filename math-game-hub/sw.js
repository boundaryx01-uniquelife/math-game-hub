/* ==========================================================================
 * 수학 게임 허브 서비스 워커 (오프라인 지원)
 *
 * [배포할 때마다 해야 할 일]  ->  아래 CACHE_VERSION 숫자(또는 날짜)를 바꾸세요.
 *   바꾸면 태블릿이 인터넷에 연결될 때 새 캐시를 통째로 다시 받고,
 *   옛 캐시는 자동으로 삭제됩니다. (docs/offline_guide.md 참고)
 *
 * [파일을 추가했을 때]  ->  PRECACHE_URLS 에 경로를 한 줄 추가하세요.
 *   (빠뜨려도 괜찮습니다: HTML 안의 src/href 링크는 자동으로 찾아 저장하고,
 *    그 밖의 파일도 한 번 열어 보면 실행 중에 저장됩니다.)
 * ========================================================================== */

// 배포할 때마다 이 값을 올리세요. (예: '2026-11-12-3')
const CACHE_VERSION = '2026-11-12-11';

// 사이트 루트(이 sw.js가 있는 폴더) 기준 상대 경로. 없는 파일은 건너뜁니다(설치 실패 아님).
const PRECACHE_URLS = [
  './',
  'index.html',
  'hub.html',
  'resources.html',
  'resources.js',
  'resources.css',
  'style.css',
  'script.js',
  'intro.html',
  'intro.css',
  'intro.js',
  'offline.html',
  'manifest.webmanifest',

  // 공통 스크립트
  'shared/pwa.js',
  'shared/records.js',
  'shared/assist.js',
  'shared/ui.js',
  'shared/theme.css',
  'media/intro-story.mp4',
  'media/intro-story-poster.jpg',
  'shared/fit.css',
  'shared/fit.js',

  // 데이터 (cipher_bank.js 는 file:// 에서도 쓰기 위한 JS 버전)
  'data/cipher_bank.json',
  'data/cipher_bank.js',
  'data/procedural_generator.js',

  // 게임
  'games/cipher/',
  'games/cipher/index.html',
  'games/cipher/style.css',
  'games/cipher/game.js',
  'games/probability/',
  'games/probability/index.html',
  'games/probability/style.css',
  'games/probability/game.js',
  'games/sequence/',
  'games/sequence/index.html',
  'games/sequence/style.css',
  'games/sequence/game.js',
  'games/hidden_omega/',
  'games/hidden_omega/index.html',
  'games/hidden_omega/style.css',
  'games/hidden_omega/game.js',

  // 학습/인쇄 자료
  'learn/worksheet.html',
  'learn/concepts.html',
  'learn/worksheet-answers.html',
  'learn/booth-guide.html',
  'learn/galton-build.html',
  'learn/galton-build-detail.html',
  'learn/img/cut-case.webp',
  'learn/img/cut-frame.webp',
  'learn/img/cut-stand.webp',
  'learn/img/cut-scoop.webp',
  'learn/img/cut-done.webp',
  'learn/img/galton-scale.jpg',

  // 아이콘
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

/* ------------------------- 아래는 수정하지 않아도 됩니다 ------------------------- */

const CACHE_PREFIX = 'mathhub-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const META_KEY = '__mathhub_meta__'; // 설치 결과를 저장하는 가짜 URL 키
const ROOT = new URL('./', self.location.href); // 사이트 루트 URL
const MAX_DISCOVER = 150; // HTML 링크 자동 탐색 최대 파일 수

let status = { version: CACHE_VERSION, ready: false, done: 0, total: PRECACHE_URLS.length, failed: [], missing: [] };

function metaUrl() { return new URL(META_KEY, ROOT).href; }

async function saveMeta(cache) {
  await cache.put(metaUrl(), new Response(JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } }));
}

async function loadMeta() {
  try {
    const c = await caches.open(CACHE_NAME);
    const r = await c.match(metaUrl());
    if (r) return await r.json();
  } catch (e) { /* 무시 */ }
  return null;
}

async function broadcast(msg) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage(msg));
}

// 한 파일을 받아 캐시에 저장. 반환: 'ok' | 'missing'(404 등) | 'failed'(네트워크 오류)
async function addOne(cache, url, discovered) {
  try {
    const res = await fetch(new Request(url, { cache: 'reload' }));
    if (!res.ok) return 'missing';
    await cache.put(url, res.clone());
    // 디렉터리 주소(…/)는 index.html 내용이므로 같은 응답으로 저장
    if (discovered) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const html = await res.clone().text();
        extractLinks(html, url).forEach((u) => discovered.add(u));
      } else if (ct.includes('text/css')) {
        const css = await res.clone().text();
        extractCssUrls(css, url).forEach((u) => discovered.add(u));
      }
    }
    return 'ok';
  } catch (e) {
    return 'failed';
  }
}

// HTML 안의 같은 사이트 src/href 링크 추출 (외부 주소, #, mailto 제외)
function extractLinks(html, base) {
  const out = [];
  const re = /(?:src|href)\s*=\s*["']([^"'#?][^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const u = toSameOrigin(m[1], base);
    if (u) out.push(u);
  }
  return out;
}

function extractCssUrls(css, base) {
  const out = [];
  const re = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  let m;
  while ((m = re.exec(css))) {
    if (m[1].startsWith('data:')) continue;
    const u = toSameOrigin(m[1], base);
    if (u) out.push(u);
  }
  return out;
}

function toSameOrigin(ref, base) {
  try {
    const u = new URL(ref, base);
    if (u.origin !== ROOT.origin) return null;
    if (!u.pathname.startsWith(ROOT.pathname)) return null;
    u.hash = ''; u.search = '';
    if (/\.(zip|pdf|mp4)$/i.test(u.pathname)) return null;
    return u.href;
  } catch (e) { return null; }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const listed = PRECACHE_URLS.map((p) => new URL(p, ROOT).href);
    const seen = new Set(listed);
    const discovered = new Set();
    status = { version: CACHE_VERSION, ready: false, done: 0, total: listed.length, failed: [], missing: [] };

    // 1) 목록의 파일을 하나씩(병렬 6개) 저장. 하나가 실패해도 계속 진행.
    const queue = listed.slice();
    async function worker() {
      while (queue.length) {
        const url = queue.shift();
        const r = await addOne(cache, url, discovered);
        if (r === 'failed') status.failed.push(url);
        else if (r === 'missing') status.missing.push(url);
        status.done++;
        broadcast({ type: 'MATHHUB_PROGRESS', status });
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));

    // 2) HTML/CSS 에서 발견된, 목록에 없는 같은 사이트 파일을 추가로 저장
    let rounds = 0, extra = 0;
    while (rounds++ < 5 && extra < MAX_DISCOVER) {
      const todo = [...discovered].filter((u) => !seen.has(u));
      if (!todo.length) break;
      todo.forEach((u) => seen.add(u));
      status.total += todo.length;
      for (const url of todo) {
        if (extra++ >= MAX_DISCOVER) break;
        const r = await addOne(cache, url, discovered);
        if (r === 'failed') status.failed.push(url);
        status.done++;
      }
    }

    // 필수 파일(첫 화면)이 저장되고 네트워크 오류가 없으면 '오프라인 준비 완료'
    const hasIndex = !!(await cache.match(new URL('index.html', ROOT).href));
    status.ready = hasIndex && status.failed.length === 0;
    await saveMeta(cache);
    broadcast({ type: 'MATHHUB_PROGRESS', status });
    if (status.ready) broadcast({ type: 'MATHHUB_READY', status });
    // 새 버전을 기다리지 않고 바로 적용 (캐시가 통째로 완성된 뒤에만 여기에 도달)
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
    const meta = await loadMeta();
    if (meta) status = meta;
    broadcast({ type: 'MATHHUB_ACTIVATED', status });
  })());
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'GET_STATUS') {
    loadMeta().then((m) => {
      const s = m || status;
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ type: 'MATHHUB_STATUS', status: s });
      else if (event.source) event.source.postMessage({ type: 'MATHHUB_STATUS', status: s });
    });
  } else if (d.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 요청 -> 캐시 조회 (디렉터리 주소는 index.html 로 대응, 쿼리스트링 무시)
async function cacheLookup(cache, request) {
  const url = new URL(request.url);
  url.hash = '';
  let hit = await cache.match(url.href, { ignoreSearch: true });
  if (hit) return hit;
  if (url.pathname.endsWith('/')) {
    hit = await cache.match(new URL('index.html', url).href, { ignoreSearch: true });
  } else if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
    hit = await cache.match(url.href + '/index.html', { ignoreSearch: true });
  }
  return hit || null;
}

/* 전략: stale-while-revalidate (캐시 즉시 응답 + 뒤에서 최신본으로 갱신)
 *  - 오프라인에서도 즉시 열림, 온라인이면 다음 방문부터 최신 내용이 보임.
 *  - CACHE_VERSION 을 올리면 새 서비스 워커가 전체를 다시 받고 옛 캐시를 지움. */

// 저장해 둔 파일(영상 등)에서 Range 요청 구간만 돌려줌
async function rangeResponse(req, cached) {
  const buf = await cached.clone().arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = 0, end = size - 1;
  if (m) {
    if (m[1] !== '') { start = parseInt(m[1], 10); if (m[2] !== '') end = parseInt(m[2], 10); }
    else if (m[2] !== '') { start = Math.max(0, size - parseInt(m[2], 10)); }
  }
  end = Math.min(end, size - 1);
  if (start > end || start >= size) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
      'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 외부 주소(구글 폰트 등)는 저장하지 않음. 오프라인에서 실패해도 페이지가 깨지지 않게 빈 응답.
  if (url.origin !== self.location.origin) {
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      // 와이파이만 연결되고 인터넷이 안 되는 경우 무한정 기다리지 않도록 4초 후 포기
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      event.respondWith(
        fetch(req, { signal: ctl.signal })
          .catch(() => new Response('', { status: 504, statusText: 'Offline' }))
          .finally(() => clearTimeout(timer))
      );
    }
    return;
  }
  if (url.pathname.endsWith('/' + META_KEY)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cacheLookup(cache, req);

    // 영상(Range 요청): 저장된 파일에서 요청한 구간만 잘라 206 으로 답해야 사파리(아이패드)도 재생됨
    if (req.headers.has('range')) {
      if (cached) return rangeResponse(req, cached);
      return fetch(req);
    }

    const network = fetch(req).then(async (res) => {
      if (res && res.ok && res.type === 'basic' && res.status === 200) {
        const u = new URL(req.url); u.hash = '';
        await cache.put(u.href, res.clone());
      }
      return res;
    });

    if (cached) {
      event.waitUntil(network.catch(() => {}));
      return cached;
    }
    try {
      return await network;
    } catch (e) {
      // 오프라인 + 캐시 없음: 페이지 이동이면 안내 페이지로
      if (req.mode === 'navigate') {
        const off = await cache.match(new URL('offline.html', ROOT).href);
        if (off) return off;
      }
      return new Response('오프라인 상태이며 저장된 파일이 없습니다.', { status: 504, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
