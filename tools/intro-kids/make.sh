#!/usr/bin/env bash
# 꼬마 요원 미션 이야기 영상 만들기: ./make.sh  →  ../../math-game-hub/media/intro-kids.mp4 + 포스터 이미지
# 필요: node + playwright, python3 + numpy, ffmpeg(libx264, aac)
set -euo pipefail
cd "$(dirname "$0")"
OUT=../../math-game-hub/media
TMP=${TMPDIR:-/tmp}/intro-kids-build
rm -rf "$TMP"; mkdir -p "$TMP/frames" "$OUT"
node render.js "$TMP/frames" 30
python3 audio.py "$TMP/frames/times.json" "$TMP/kids.wav"
ffmpeg -y -loglevel error -framerate 30 -i "$TMP/frames/f_%04d.jpg" -i "$TMP/kids.wav" \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart \
  -c:a aac -b:a 96k -shortest "$OUT/intro-kids.mp4"
# 영상이 올라오기 전에 보이는 대표 그림(포스터): 마지막 제목 장면
node render.js "$TMP/poster" 30 30.6 >/dev/null
cp "$TMP/poster/t_30_6.jpg" "$OUT/intro-kids-poster.jpg"
ls -la "$OUT"
