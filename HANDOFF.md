# 작업 인수인계 (2026-11-12 기준)

2026 수학체험전 부스용 정적 웹 사이트입니다. 다른 계정의 Claude Code에서 이어서 작업할 때 이 문서를 먼저 읽으세요.

## 저장소와 배포
- 저장소: `boundaryx01-uniquelife/math-game-hub`, 기본 브랜치 `main`
- 사이트 루트는 `math-game-hub/` 폴더(`netlify.toml`의 `publish = "math-game-hub"`). 빌드 없음, 순수 정적 파일
- 실제 사이트: https://2026mathcipher.netlify.app/ (Netlify, `main`에 병합하면 자동 배포)
- 저장소 맨 위 `index.html`은 `math-game-hub/`로 보내는 진입 페이지(저장소 루트를 그대로 배포하는 경우 대비)
- 작업 흐름: 브랜치에서 작업 → PR → `main` 병합. PR #1~#3은 이미 병합됨

## 병합 완료된 작업
- 마스터 키(`8680`) 입력 시 정답·단계별 풀이 창 표시(시간 정지). 수열 게임은 점수·콤보 없음
- 힌트 2단계(암호·수열·오메가). 문구 생성은 `math-game-hub/shared/assist.js`
- 디자인·사용성 고도화: `shared/theme.css`, `shared/ui.js`, 허브(참가자 바·진행 표시·학습 자료·게임별 TOP 10), 인트로
- 단계 잠금은 참가자 이름 기준. "다음 친구 차례" 버튼, 기록 초기화·"모든 미션 열기"는 도우미 코드 확인
- 학습 자료 `math-game-hub/learn/`: 체험 학습지, 개념 정리, 교사용 정답, 체험 안내판(A3/A4), 갈톤 보드 제작 설명서
- 오프라인(PWA): `sw.js`, `manifest.webmanifest`, `shared/pwa.js`, `shared/records.js`, `offline.html`, `docs/offline_guide.md`
- 문제 은행 오류 수정(`data/cipher_bank.json` ↔ `data/cipher_bank.js` 동기화 필요, 재생성 명령은 `cipher_bank.js` 머리말), 오메가 1·2관문 오류 수정, 확률 게임 기록 자동 저장

## 해야 할 일 (미완료)
0. 2026-11-12: 수열 Backspace 뒤로가기 수정, 확률 게임 "예측 먼저" 적용, 개념 정리 학습지 컬러·형광펜 적용은 완료
1. ~~학년 선택을 허브에서 바꾸기~~ → PR #5로 병합 완료(허브 참가자 바에 초등/중등/고등 선택 버튼)
2. **갈톤 보드 제작 설명서**: 2026-11-12에 A1 한 장 포스터로 새로 만듦(`learn/galton-build.html`, 내려받기용 `learn/galton-poster-A1.pdf`·`.png`). 이전 5쪽짜리 자세한 설명서는 `learn/galton-build-detail.html`로 옮겨 둠. 포스터는 확인하지 못한 수치(출력 시간·판 수·구슬 크기·필라멘트량)를 적지 않고 "모델 페이지 확인"으로 안내함. 아직 사람이 확인할 것: 517003 라이선스, 구슬 크기, 필라멘트량, 부품, 완성 크기. 포스터 내용을 고치면 PDF·PNG를 다시 만들 것(Chromium으로 인쇄/스크린샷)
3. **실기기 확인**: 실제 iPad·Android 태블릿에서 설치·오프라인 실행, 실제 프린터 출력(학습지 A4, 안내판 A3)은 아직 확인하지 못함. Playwright(Chromium)로만 검증
4. 학습지·안내판의 글꼴은 검증 환경에 Pretendard/맑은 고딕이 없어 대체 글꼴로 확인함. 실제 기기에서 줄바꿈 확인 필요
5. 안내판(`learn/booth-guide.html`)의 일부 작은 글씨는 A3에서 2m 거리 읽기에는 작을 수 있음

## 꼭 지킬 점
- **파일을 고쳐 배포할 때마다 `math-game-hub/sw.js`의 `CACHE_VERSION`을 올릴 것.** 안 올리면 태블릿이 옛 버전을 계속 보여 줍니다. 새 파일을 만들면 `PRECACHE_URLS`에도 추가
- 모든 페이지는 외부 요청(웹폰트 등) 없이 동작해야 함(부스에 인터넷이 없을 수 있음). CDN·웹폰트 추가 금지
- 상대 경로만 사용해 `file://`에서도 동작하게 유지
- 순위 기록은 `localStorage`의 `math_hub_records`(기기별). 기록 모양은 각 `games/*/game.js`의 저장 코드 참고
- 한글은 `word-break: keep-all`, 터치 영역 48px 이상

## 알려진 사항
- 문제 은행과 절차 생성기를 50:50으로 섞어 출제(`games/cipher/game.js`의 `BANK_SHARE`)
- 수열 게임의 마스터 키는 점수를 주지 않음(`openMasterPanel`의 한 줄을 바꾸면 정답 처리로 되돌릴 수 있음)
- 도우미 코드는 클라이언트 JS에 있음(`shared/ui.js`, 각 `game.js`). 부스 운영용이며 보안 장치가 아님

## 검증 방법
- 로컬 서버: `cd math-game-hub && python3 -m http.server 8790`, 브라우저로 `http://127.0.0.1:8790/`
- Playwright가 있으면 인트로 → 게임 4개 → 마스터 키·힌트 → 참가자 교체 → 오프라인(`context.setOffline(true)`) 순서로 확인
- 주의: 마스터 키 해설 창은 열린 직후 0.35초 동안 "다음 문제로"가 눌리지 않음(Enter 연타 방지). 자동 테스트에서는 잠시 기다린 뒤 누를 것

## 이어서 시작할 때 쓸 프롬프트 예시
> HANDOFF.md를 읽고 "해야 할 일" 1번(허브에서 학년 바로 고르기)부터 진행해줘. 작업은 새 브랜치에서 하고, 끝나면 PR을 만들어줘.
