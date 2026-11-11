# 🎮 수학 게임 허브 (Math Game Hub) & 수학 암호 탈출

2026 수학체험전 공식 웹 기반 인터랙티브 수학 게임 및 부스 운영 시스템입니다.

---

## 📂 프로젝트 구성

```text
math-game-hub/
├── math-game-hub/               # [최신 v4.0] 멀티 모듈 수학 게임 허브
│   ├── games/
│   │   ├── cipher/              # [게임 1] 암호 연구소 탈출 (시저, 좌표, 이진수, 수열)
│   │   ├── probability/         # [게임 2] 확률 갈톤보드 시뮬레이터
│   │   ├── sequence/            # [게임 3] 수열 금고 스피드런
│   │   └── hidden_omega/        # [게임 4] 히든 오메가
│   ├── data/
│   │   ├── cipher_bank.json     # 120개 검증된 문제 뱅크
│   │   └── procedural_generator.js # 문제 자동 생성 로직
│   ├── docs/                    # 운영 매뉴얼, 문제 해설지, 아카이브
│   ├── index.html               # 메인 포털 & 실시간 대시보드
│   └── intro.html               # 스토리 인트로 씬
│
└── math-cipher-escape/          # 수학 암호 탈출 게임 단독 버전 (v2)
    ├── index.html
    ├── script.js
    └── style.css
```

---

## 🚀 실행 방법

### 로컬 실행
별도의 빌드나 서버 설치 없이 최신 브라우저(Chrome, Edge, Safari 등)에서 `index.html` 파일을 더블 클릭하여 즉시 실행할 수 있습니다.

- **종합 게임 허브 실행**: `math-game-hub/index.html`
- **단독 암호 탈출 실행**: `math-cipher-escape/index.html`

### 인터넷 없이 사용 (부스 태블릿)
- 인터넷이 될 때 사이트를 한 번 열고 `인터넷 없이 쓰기`(offline.html)에서 "준비 완료"를 확인한 뒤 홈 화면에 설치합니다.
- 순위 기록은 해당 기기 브라우저에만 저장되며, 같은 화면에서 JSON/CSV로 백업·가져오기를 할 수 있습니다.
- 파일을 고쳐 다시 배포할 때는 `math-game-hub/sw.js`의 `CACHE_VERSION`을 올려 주세요. 자세한 내용: `math-game-hub/docs/offline_guide.md`

### 학습 자료 · 부스 운영 (`math-game-hub/learn/`)
- `worksheet.html` 체험 학습지 · `concepts.html` 개념 정리 · `worksheet-answers.html` 교사용 정답
- `booth-guide.html` 체험 방법 안내판(A3/A4) · `galton-build.html` 갈톤 보드 제작 설명서

### 도우미(운영자) 기능
- 게임 정답 입력칸에 마스터 키를 넣으면 정답과 풀이가 표시됩니다. 힌트는 2단계로 제공됩니다.
- 순위 기록 초기화와 "모든 미션 열기"는 도우미 코드 확인 후 동작합니다.

### 웹 배포 (GitHub Pages / Vercel / Netlify)
- 정적 웹 애플리케이션으로 바로 배포 가능합니다.
