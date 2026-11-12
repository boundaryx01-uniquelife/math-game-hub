# 꼬마 요원 미션 이야기 영상

유아·초등 저학년용 `math-game-hub/kids/`의 미션 이야기(32초, 1280×720, 음악·효과음·자막 포함)를 코드로 만든 도구입니다. 결과물은 `math-game-hub/media/intro-kids.mp4`와 `intro-kids-poster.jpg`입니다.

이야기: 반짝반짝 수학 마을의 별님 넷 → 심술 구름이 별님을 상자에 숨김 → 병아리 요원 '콩이' 출동 → 열쇠 4개(세기·모양·구슬·짝꿍) → 상자가 열리고 별님 구출 → "꼬마 요원 출동!"

| 파일 | 하는 일 |
|---|---|
| `story.html` | 애니메이션 본체(canvas). 시간 `t`를 넣으면 그 순간을 그리는 `render(t)` 하나. `story.html?play`로 열면 실시간 미리보기 |
| `render.js` | 30fps로 한 장씩 캡처 (`node render.js <폴더> 30 [시각,시각…]`으로 몇 장만 뽑을 수도 있음) |
| `audio.py` | 배경 가락(직접 지음)과 효과음을 합성 |
| `make.sh` | 위를 이어서 mp4(H.264+AAC)와 대표 그림을 만듦 (약 1분) |

## 다시 만들기
```bash
cd tools/intro-kids
NODE_PATH=$(npm root -g) ./make.sh
```
필요한 것: node + playwright, python3 + numpy, ffmpeg(libx264·aac). 글꼴은 `math-game-hub/kids/fonts/Jua-kids.woff2`를 그대로 씁니다.

## 고칠 때
- 자막은 `story.html`의 `CAPS`, 장면 시각은 맨 위 타임라인 상수(`T_STAR`, `T_CLOUD`, `T_OPEN`…)에서 바꿉니다. 효과음 시각은 `window.TIMES`를 통해 `audio.py`로 넘어가므로 같이 맞춰집니다. 길이를 바꾸면 `audio.py`의 `T`도 바꾸세요.
- 자막을 바꾸면 `math-game-hub/kids/kids.js`의 `STORY_CUES`(읽어 주는 문장과 시각)도 같이 바꿉니다.
- 영상을 새로 만들면 `math-game-hub/sw.js`의 `CACHE_VERSION`을 올려야 태블릿이 새 영상을 받습니다.
