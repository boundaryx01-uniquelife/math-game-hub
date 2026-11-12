/**
 * story.html 의 애니메이션을 프레임 단위로 캡처합니다.
 *   node render.js <출력폴더> [fps=30] [시각,시각,...(미리보기용 몇 장만)]
 * 전체 영상 만들기: ./make.sh
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'frames';
  const fps = parseInt(process.argv[3] || '30', 10);
  const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'story.html'));
  await page.evaluate(() => document.fonts.ready);
  const dur = await page.evaluate(() => window.DURATION);
  fs.writeFileSync(path.join(out, 'times.json'), JSON.stringify(await page.evaluate(() => window.TIMES)));
  const times = only || Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.render(t), times[i]);
    const name = only ? `t_${String(times[i]).replace('.', '_')}.jpg` : `f_${String(i).padStart(4, '0')}.jpg`;
    await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 92 });
  }
  await browser.close();
  console.log('frames', times.length, '→', out);
})();
