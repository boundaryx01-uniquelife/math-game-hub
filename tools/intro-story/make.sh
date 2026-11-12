#!/usr/bin/env bash
# 미션 이야기 영상 만들기: ./make.sh  →  ../../math-game-hub/media/intro-story.mp4 + 포스터 이미지
# 필요: node + playwright, python3 + numpy, ffmpeg(libx264, aac)
set -euo pipefail
cd "$(dirname "$0")"
OUT=../../math-game-hub/media
TMP=${TMPDIR:-/tmp}/intro-story-build
rm -rf "$TMP"; mkdir -p "$TMP/frames" "$OUT"
node render.js "$TMP/frames" 30
python3 audio.py "$TMP/frames/times.json" "$TMP/story.wav"
ffmpeg -y -loglevel error -framerate 30 -i "$TMP/frames/f_%04d.jpg" -i "$TMP/story.wav" \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart \
  -c:a aac -b:a 96k -shortest "$OUT/intro-story.mp4"
# 영상이 올라오기 전에 보이는 대표 그림(포스터): 점화 직후 장면
node render.js "$TMP/poster" 30 19.6 >/dev/null
cp "$TMP/poster/t_19_6.jpg" "$OUT/intro-story-poster.jpg"
ls -la "$OUT"
