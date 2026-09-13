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

### 웹 배포 (GitHub Pages / Vercel / Netlify)
- 정적 웹 애플리케이션으로 바로 배포 가능합니다.
