/**
 * 인트로: 요원 등록 → 미션 이야기 → 게임 시작
 * - 1단계에서 이름과 학년을 저장하면 바로 2단계(미션 이야기)가 나오고,
 *   이야기가 끝나면 1단계 게임(암호 연구소 탈출)으로 바로 들어갑니다.
 * - 허브의 "미션 이야기" 버튼으로 오면(주소 끝 #story) 등록을 건너뛰고 이야기만 보여 주고 허브로 돌아갑니다.
 */

// 이야기 영상을 만들면 이 줄에 경로를 넣으세요. 예: 'media/intro-story.mp4'
// (넣으면 왼쪽 그림 자리에 영상이 나오고, 영상이 끝나면 시작 버튼이 강조됩니다.
//  sw.js 의 PRECACHE_URLS 에 같은 경로를 추가하고 CACHE_VERSION 도 올려야 태블릿이 오프라인에서도 재생합니다.)
const STORY_VIDEO_SRC = '';

const KEY_PLAYER = 'math_hub_current_player';
const KEY_GRADE = 'math_hub_grade_level';
const KEY_DIFF = 'math_hub_difficulty';
const FIRST_GAME_URL = 'games/cipher/index.html?from=intro';
const HUB_URL = 'index.html';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('intro-app');
  const inputName = document.getElementById('intro-player-name');
  const gradeButtons = Array.from(document.querySelectorAll('.btn-grade-opt'));
  const btnRegister = document.getElementById('btn-register-next');
  const slides = Array.from(document.querySelectorAll('.story-slide'));
  const dots = Array.from(document.querySelectorAll('.s-dot'));
  const btnPrev = document.getElementById('btn-story-prev');
  const btnNext = document.getElementById('btn-story-next');
  const btnSkip = document.getElementById('btn-story-skip');
  const btnBack = document.getElementById('btn-back-register');
  const sceneMain = document.getElementById('scene-main');
  const sceneSub = document.getElementById('scene-sub');
  const scene = document.getElementById('story-scene');
  const video = document.getElementById('story-video');

  const replayOnly = location.hash === '#story' && !!(localStorage.getItem(KEY_PLAYER) || '').trim();
  let selectedGrade = 'elem';
  let selectedDiff = 'easy';
  let slideIdx = 0;
  let videoDone = false;

  // ---------- 저장된 값 불러오기 ----------
  const savedName = localStorage.getItem(KEY_PLAYER) || '';
  if (savedName) inputName.value = savedName;
  const savedGrade = localStorage.getItem(KEY_GRADE);
  if (savedGrade) {
    const btn = gradeButtons.find(b => b.dataset.grade === savedGrade);
    if (btn) { selectGrade(btn); }
  }

  function selectGrade(btn) {
    gradeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
    selectedGrade = btn.dataset.grade;
    selectedDiff = btn.dataset.diff;
  }
  gradeButtons.forEach(btn => btn.addEventListener('click', () => selectGrade(btn)));

  // ---------- 단계 전환 ----------
  function setStage(name) {
    app.dataset.stage = name;
    document.getElementById('stage-register').hidden = name !== 'register';
    document.getElementById('stage-story').hidden = name !== 'story';
    document.querySelectorAll('.is-step').forEach(li => {
      const order = ['register', 'story', 'play'];
      const here = order.indexOf(name);
      const me = order.indexOf(li.dataset.for);
      li.classList.toggle('active', me === here);
      li.classList.toggle('done', me < here);
    });
    window.scrollTo(0, 0);
    if (name === 'story') startStory();
  }

  function startAgent() {
    const name = (localStorage.getItem(KEY_PLAYER) || '').trim();
    document.getElementById('story-agent').textContent = name || '요원';
  }

  // ---------- 1단계: 등록 ----------
  function register() {
    const name = inputName.value.trim();
    if (!name) {
      window.MathHubUI.toast('요원 닉네임을 입력해 주세요!', 'warn');
      inputName.focus();
      return;
    }
    localStorage.setItem(KEY_PLAYER, name);
    localStorage.setItem(KEY_GRADE, selectedGrade);
    localStorage.setItem(KEY_DIFF, selectedDiff);
    inputName.blur();               // 키보드를 내려서 이야기 화면이 가려지지 않게
    setStage('story');
  }
  btnRegister.addEventListener('click', register);
  inputName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); register(); } });

  // ---------- 2단계: 미션 이야기 ----------
  function showSlide(i) {
    slideIdx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => { s.hidden = k !== slideIdx; });
    dots.forEach((d, k) => d.classList.toggle('active', k === slideIdx));
    const s = slides[slideIdx];
    sceneMain.textContent = s.dataset.icon;
    sceneSub.textContent = s.dataset.sub;
    scene.dataset.scene = String(slideIdx);
    btnPrev.disabled = slideIdx === 0;
    const last = slideIdx === slides.length - 1;
    btnNext.querySelector('span').textContent = last ? (replayOnly ? '🏠 허브로 돌아가기' : '🚀 미션 시작') : '다음 ▶';
    btnNext.classList.toggle('pulse', last);
    btnSkip.hidden = replayOnly || last;
  }

  function startStory() {
    startAgent();
    showSlide(0);
    btnBack.hidden = replayOnly;
    if (STORY_VIDEO_SRC && !video.getAttribute('src')) {
      video.src = STORY_VIDEO_SRC;
      video.hidden = false;
      scene.hidden = true;
      video.addEventListener('ended', () => { videoDone = true; showSlide(slides.length - 1); }, { once: true });
    }
  }

  function goPlay() {
    window.location.href = replayOnly ? HUB_URL : FIRST_GAME_URL;
  }

  btnNext.addEventListener('click', () => {
    if (slideIdx >= slides.length - 1) { goPlay(); return; }
    showSlide(slideIdx + 1);
  });
  btnPrev.addEventListener('click', () => showSlide(slideIdx - 1));
  dots.forEach(d => d.addEventListener('click', () => showSlide(parseInt(d.dataset.go, 10))));
  btnSkip.addEventListener('click', goPlay);
  btnBack.addEventListener('click', () => setStage('register'));

  // 좌우 방향키로도 넘길 수 있게 (외부 키보드)
  document.addEventListener('keydown', (e) => {
    if (app.dataset.stage !== 'story') return;
    if (e.key === 'ArrowRight') { btnNext.click(); }
    else if (e.key === 'ArrowLeft') { btnPrev.click(); }
  });

  // ---------- 시작 ----------
  setStage(replayOnly ? 'story' : 'register');
});
