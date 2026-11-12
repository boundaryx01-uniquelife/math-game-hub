# 미션 이야기 모션 그래픽 영상

인트로의 "미션 이야기"(24초, 1280×720, 소리·자막 포함)를 코드로 만든 도구입니다. 결과물은 사이트 폴더 `math-game-hub/media/` 에 들어갑니다.

| 파일 | 하는 일 |
|---|---|
| `story.html` | 애니메이션 본체. 시간 `t`를 넣으면 그 순간의 화면을 그리는 `render(t)` 하나로 되어 있음. 브라우저로 `story.html?play` 를 열면 실시간 미리보기 |
| `render.js` | `story.html`을 30fps로 한 장씩 캡처 (`node render.js <폴더> 30 [시각,시각…]` 으로 몇 장만 뽑아 볼 수도 있음) |
| `audio.py` | 경보·자물쇠·구슬·정답·점화 효과음과 배경 화음을 직접 합성(저작권 문제 없음) |
| `make.sh` | 위 세 가지를 이어서 `intro-story.mp4`(H.264+AAC)와 `intro-story-poster.jpg`를 만듦 (약 45초) |

## 다시 만들기
```bash
cd tools/intro-story
NODE_PATH=$(npm root -g) ./make.sh
```
필요한 것: node + playwright, python3 + numpy, ffmpeg(libx264·aac).

## 고칠 때
- 글자(자막)·장면 길이·색은 `story.html`의 `CAPS`, 맨 위 타임라인 상수(`S1`, `T_UNLOCK`, `T_IGNITE`…), CSS에서 바꿉니다. 자막은 영상에 구워져 있어서 기기 글꼴과 상관없습니다.
- 효과음 시각은 `story.html`의 `window.TIMES`를 `render.js`가 `times.json`으로 내보내 `audio.py`가 읽으므로, 타임라인을 바꾸면 소리도 같이 맞춰집니다. 길이(`T`)를 바꾸면 `audio.py`의 `T`도 같이 바꾸세요.
- 영상을 새로 만들면 `math-game-hub/sw.js`의 `CACHE_VERSION`을 올려야 태블릿이 새 영상을 받습니다.
- 사이트의 `intro.js` 맨 위 `STORY_VIDEO_SRC`가 영상 경로입니다. 비우거나 영상을 못 불러오면 글 장면(3장)으로 대신 보여 줍니다.
