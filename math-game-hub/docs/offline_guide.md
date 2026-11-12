# 오프라인 사용 가이드 (교사/운영자용)

이 사이트는 **PWA(설치형 웹앱)** 입니다. 한 번 인터넷으로 열어 두면 태블릿에 저장되어, 이후 인터넷 없이 실행되고 순위도 그 태블릿에 기록됩니다. 화면 안내는 사이트의 `offline.html`(오프라인 사용 안내)에도 있습니다.

## 1. 행사 전날 체크리스트 (태블릿마다)

1. 인터넷이 되는 곳에서 사이트 주소를 엽니다.
2. `offline.html` 에서 **오프라인 준비 ✅ 준비 완료** 가 뜰 때까지 기다립니다.
3. 홈 화면에 추가 / 앱 설치
   - 안드로이드 Chrome: ⋮ → 앱 설치
   - 아이패드 Safari: 공유 → 홈 화면에 추가
   - 윈도우/크롬북 Chrome·Edge: 주소창 설치 아이콘
4. **와이파이를 끄고(비행기 모드) 설치된 아이콘으로 열어** 허브 → 각 게임 한 판씩 확인합니다.
5. 테스트로 만든 기록은 허브 또는 `offline.html` 에서 삭제합니다.
6. 사이트가 수정되어 다시 배포되었다면, 행사 전에 인터넷에서 한 번 더 열어 최신 버전을 받아 둡니다.

PC·크롬북은 대안으로 zip(`https://github.com/boundaryx01-uniquelife/math-game-hub/archive/refs/heads/main.zip`)을 받아 풀고 `math-game-hub/index.html` 을 Chrome/Edge로 열어도 됩니다. 이때는 `file://` 이라 앱 설치/서비스 워커는 쓰이지 않습니다(아래 5절).

## 2. 순위 기록에 대해

- 기록은 브라우저 `localStorage` 의 `math_hub_records` 키에 저장됩니다. **그 태블릿, 그 브라우저, 그 주소(origin)** 안에서만 보입니다.
- 태블릿끼리 공유되지 않습니다. 사이트 데이터 삭제, 시크릿 창 사용 시 사라집니다.
- iPad 의 홈 화면 앱과 Safari 탭은 저장소가 분리될 수 있으므로 **한 가지 방법만** 사용하세요.
- 백업: `offline.html` 의 "순위 기록 백업" 에서 JSON(재가져오기용) / CSV(엑셀용, UTF-8 BOM) 내보내기, JSON 가져오기(합치기·중복 제외)가 가능합니다. 행사 종료 후 태블릿마다 내보내 두세요.
- `shared/pwa.js` 는 브라우저에 저장 공간 보존(`navigator.storage.persist()`)을 요청하지만 브라우저가 허락하지 않을 수 있습니다.

## 3. 캐시 전략 (개발자용)

`sw.js` 상단에 `CACHE_VERSION` 과 `PRECACHE_URLS` 가 있습니다.

- **설치 시 사전 저장(precache)**: 목록의 파일을 하나씩 받아 저장합니다. 없는 파일(404)이나 실패한 파일이 있어도 설치 전체가 실패하지 않습니다. 저장된 HTML/CSS 안의 같은 사이트 `src/href/url()` 도 자동으로 따라가 저장하므로, 목록에서 빠진 새 파일도 대개 함께 저장됩니다.
- **실행 중 저장 + stale-while-revalidate**: 같은 사이트 GET 요청은 저장본을 즉시 돌려주고(오프라인에서도 즉시 열림), 온라인이면 뒤에서 새 파일을 받아 저장본을 갱신합니다. 그래서 재배포 후 **다음 방문**부터 최신 내용이 보이며, 오래된 코드에 영구히 갇히지 않습니다.
- **버전 캐시**: 캐시 이름은 `mathhub-<CACHE_VERSION>` 입니다. 값을 바꾸면 새 서비스 워커가 설치되며 전체를 새 캐시에 다시 받고(HTTP 캐시 우회), 완료 후 즉시 활성화되고 옛 캐시는 삭제됩니다. 열려 있던 페이지에는 `MathHubPWA` 의 `update` 이벤트가 발생합니다(자동 새로고침은 하지 않아 게임 도중 끊기지 않음).
- **디렉터리 주소** (`games/cipher/`)는 저장된 `index.html` 로 응답합니다. 쿼리스트링(`?x=1`)은 무시하고 매칭합니다.
- **외부 주소**(구글 폰트 등)는 저장하지 않고 가로채서 4초 안에 응답이 없거나 오프라인이면 빈 504 응답을 줘서 페이지가 멈추지 않게 합니다.
- 오프라인이면서 저장본도 없는 페이지 이동은 `offline.html` 로 대체됩니다.

### 배포할 때마다

1. `math-game-hub/sw.js` 의 `CACHE_VERSION` 을 바꿉니다 (예: `'2026-11-12-1'`).
2. 새 파일을 추가했다면 `PRECACHE_URLS` 에 한 줄 추가합니다. (빠뜨려도 실행 중 저장되지만, 사전 저장해야 첫 방문 직후 오프라인이 보장됩니다.)
3. 배포 후, 각 태블릿을 인터넷에 연결해 한 번 열고 `offline.html` 에서 버전과 "준비 완료"를 확인합니다.

### 사전 저장 목록 다시 만들기

`math-game-hub/` 에서 아래 명령으로 현재 파일 목록을 출력해 `PRECACHE_URLS` 에 붙여 넣을 수 있습니다.

```bash
cd math-game-hub
find . -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' -o -name '*.png' -o -name '*.svg' -o -name '*.webmanifest' \) \
  ! -path './docs/*' ! -name sw.js | sed "s#^\./#  '#; s#\$#',#" | sort
```

## 4. 페이지에 넣을 태그

사이트 루트의 페이지(`index.html`, `hub.html`, `resources.html`, `offline.html`, `learn/` 아님):

```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#090d16">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<script src="shared/pwa.js" defer></script>
```

두 단계 아래 페이지(`games/x/index.html`):

```html
<link rel="manifest" href="../../manifest.webmanifest">
<meta name="theme-color" content="#090d16">
<link rel="apple-touch-icon" href="../../icons/apple-touch-icon.png">
<script src="../../shared/pwa.js" defer></script>
```

한 단계 아래(`learn/*.html`)는 `../` 를 사용합니다. 서비스 워커 경로는 `pwa.js` 자신의 주소 기준으로 계산되므로 페이지 깊이와 무관하게 동작합니다. 허브에서 기록 백업을 연결하려면 `shared/records.js` 도 추가하세요.

## 5. file:// 로 열 때의 제한 (Chromium 에서 시험)

- 허브, 소개, 4개 게임, 오프라인 안내 페이지 모두 열리고 플레이되며, 순위 기록도 저장되어 새로고침 후 허브에 나타납니다. (Chrome 은 모든 `file://` 페이지가 같은 저장소를 공유)
- 서비스 워커/설치는 불가 (`MathHubPWA.supported === false`, `reason: 'file'`). 오프라인 안내 페이지에는 "지원 안 됨"으로 표시됩니다.
- `fetch` 로 `data/cipher_bank.json` 을 읽는 방식은 `file://` 에서 브라우저 보안으로 막힙니다. 최신 코드는 `data/cipher_bank.js` 를 `<script>` 로 읽어 콘솔 오류 없이 동작했습니다(시험 시점 기준). 막히더라도 암호 게임은 절차 생성기/내장 문제은행으로 동작합니다.
- 기록은 파일 경로가 바뀌면(폴더 이동, 다른 브라우저) 보이지 않을 수 있습니다. Firefox/Safari 는 `file://` 저장소 정책이 달라 시험하지 못했습니다.
- iPad/안드로이드 태블릿에서는 로컬 HTML 열기가 번거로워 설치 방식(방법 1)을 권장합니다.
