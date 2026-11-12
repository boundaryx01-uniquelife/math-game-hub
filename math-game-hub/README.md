# 수학 게임 허브 (Math Game Hub)
## 코드 브레이커 & 갈톤 메이커

2026 수학체험전 공식 웹앱 포털입니다.

---

## 📂 프로젝트 구조

```text
math-game-hub/
├── index.html                   # 시작 화면(인트로): 요원 등록 → 미션 이야기 영상 → 게임
├── hub.html                     # 미션 허브 (게임 선택, 진행 표시, 명예의 전당)
├── resources.html               # 학습 자료 · 부스 운영 (도우미·교사용: 인쇄물, 운영 도구, 부스 소개)
├── intro.html                   # 옛 주소 → index.html 로 안내
├── style.css                    # 허브 공통 스타일 및 테마 시스템
├── script.js                   # 허브 라우팅 및 통합 랭킹 관리자
├── data/
│   └── cipher_bank.json         # 암호 연구소 120문제 (시저/좌표/이진수/수열)
├── games/
│   ├── cipher/                  # [MVP 1] 암호 연구소 탈출
│   │   ├── index.html
│   │   ├── style.css
│   │   └── game.js
│   ├── probability/             # [MVP 2] 확률 구슬 챌린지 (갈톤보드) - 예정
│   └── sequence/                # [MVP 3] 수열 금고 스피드런 - 예정
└── docs/
    ├── question_bank.md         # 문제은행 해설 및 표
    ├── operation_manual.md      # 부스 운영 매뉴얼
    └── archive_20260903.md      # 작업 아카이브
```

---

## 🚀 실행 및 배포 방법

1. **로컬 실행**: `index.html` 파일을 더블클릭하여 브라우저(Chrome, Edge, Safari 등)에서 즉시 실행
2. **웹 배포**: Netlify, Vercel, GitHub Pages 등에 `math-game-hub` 폴더 전체를 드래그 앤 드롭하여 1초 만에 배포 가능
