"""
꼬마 요원 미션 이야기의 배경 음악과 효과음을 코드로 직접 만들어 kids.wav 로 저장합니다(직접 지은 가락, 저작권 걱정 없음).
  python3 audio.py <times.json> <kids.wav>
"""
import json, sys, wave
import numpy as np
SR = 44100
T = 32.0
tm = json.load(open(sys.argv[1]))
out = np.zeros(int(SR * T) + SR * 2, dtype=np.float64)
N = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def hz(n):
    if n is None: return None
    sharp = '#' in n; name = n[0]; octv = int(n[-1])
    return 440 * 2 ** ((N[name] + (1 if sharp else 0) - 9) / 12 + (octv - 4))

def add(t, sig, gain=1.0):
    i = int(t * SR)
    if i < 0: return
    n = min(len(sig), len(out) - i)
    out[i:i + n] += sig[:n] * gain

def tt(dur): return np.arange(int(SR * dur)) / SR
def marimba(f, dur=.6):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / .22) + .35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / .05)) * np.minimum(1, t / .004)
def glock(f, dur=.9):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / .3) * np.minimum(1, t / .003)
def bass(f, dur=.4):
    t = tt(dur); ph = 2 * np.pi * f * t
    return (2 / np.pi * np.arcsin(np.sin(ph)) * .8 + np.sin(ph) * .5) * np.exp(-t / (dur * .6)) * np.minimum(1, t / .008)
def pluck(f, dur=.3):
    t = tt(dur); ph = 2 * np.pi * f * t
    return (np.sign(np.sin(ph)) * .35 + np.sin(ph) * .65) * np.exp(-t / .09) * np.minimum(1, t / .004)
def sweep(f0, f1, dur, power=1.5):
    t = tt(dur); f = f0 * (f1 / f0) ** (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** power
def noise(dur, k=4, seed=3, decay=.02):
    n = np.random.RandomState(seed).randn(int(SR * dur))
    if k > 1: n = np.convolve(n, np.ones(k) / k, mode='same')
    return n * np.exp(-tt(dur) / decay)
def seq(t0, step, notes, inst, gain):
    for i, n in enumerate(notes):
        if n: add(t0 + i * step, inst(hz(n)), gain)
def chord(t, names, inst, gain, strum=.03):
    for j, n in enumerate(names): add(t + j * strum, inst(hz(n)), gain)

# ---------- 1. 반짝반짝 수학 마을 (0.5~6.5초): 오르골 느낌 ----------
seq(0.5, .25, ['E5','G5','C6','G5', 'A5','G5','E5',None, 'F5','A5','C6','A5', 'G5',None,'E5',None, 'D5','F5','A5','F5', 'G5',None,'C6',None], marimba, .20)
seq(0.5, 1.0, ['C3','C3','F3','C3','G3','C3'], bass, .16)
for i, st in enumerate(tm['T_STAR']):        # 하나, 둘, 셋, 넷 (점점 높아지는 소리)
    add(st, glock(hz(['C6','E6','G6','C7'][i])), .26); add(st + .08, glock(hz(['E6','G6','C7','E7'][i]), .5), .12)

# ---------- 2. 심술 구름 (6.6~13초): 살금살금 낮은 소리 ----------
tc = tm['T_CLOUD']
add(tc - .1, sweep(500, 110, 1.2), .20)
seq(tc + .4, .5, ['A2',None,'C3',None,'E3',None,'D#3',None,'A2',None,'C3',None], pluck, .22)
seq(tc + .65, .5, [None,'A3',None,'A3',None,'G#3',None,'G#3',None,'A3',None,'A3'], pluck, .10)
for i, su in enumerate(tm['T_SUCK']):        # 쏙! 빨려 들어감
    add(su, sweep(1500 - i * 60, 260, .55), .16); add(su + .52, pluck(hz('E3'), .2), .22); add(su + .52, noise(.06, 6, 5 + i), .25)
tl = tm['T_LOCK']                            # 찰칵
add(tl, noise(.05, 2, 9, .012), .5); add(tl + .09, noise(.05, 3, 10, .015), .4); add(tl, glock(1900, .2), .10); add(tl + .09, bass(70, .3), .5)
td = tm['T_DROP']                            # 쿵
add(td, sweep(700, 200, .55), .10); add(td + .55, bass(58, .6), .7); add(td + .55, noise(.12, 10, 11, .04), .4)
add(td + .7, sweep(260, 700, 1.3), .07)      # 구름이 슝 달아남

# ---------- 3. 콩이 출동 (13.2~21초): 통통 튀는 행진 ----------
th = tm['T_HERO']
for hp in tm['T_HOP']: add(hp, sweep(330, 760, .22, 1.0), .16)       # 깡충
seq(th + .3, .5, ['C3','G3','C3','G3','F3','C4','G3','D4', 'C3','G3','C3','G3','F3','A3','G3','B3'], bass, .17)
seq(th + .3, .25, ['G5','G5','A5','G5','C6',None,'E6',None, 'A5','A5','B5','A5','D6',None,'B5',None,
                   'G5','G5','A5','G5','C6',None,'E6',None, 'F6',None,'E6',None,'D6',None,'G5',None], marimba, .16)
for i, kt in enumerate(tm['T_KEY']):         # 열쇠가 하나씩 짠!
    a, b = [('C6','G6'), ('D6','A6'), ('E6','B6'), ('G6','C7')][i]
    add(kt, glock(hz(a)), .24); add(kt + .1, glock(hz(b)), .22)

# ---------- 4. 열쇠를 모아 상자 열기 (21.2~27.5초) ----------
seq(21.3, .3, ['C3','E3','G3','C3','E3','G3','C3','E3','G3'], bass, .15)
for i, ft in enumerate(tm['T_FLY']):
    add(ft, sweep(500, 1500, .45), .09)
    add(ft + .5, glock(hz(['C6','E6','G6','C7'][i])), .28); add(ft + .5, pluck(hz(['C4','E4','G4','C5'][i])), .2)
to = tm['T_OPEN']
add(to - .9, sweep(180, 1300, .9, 1.0), .16)                         # 두근두근 올라감
t = tt(.9); add(to - .9, np.sin(2 * np.pi * 34 * t) * (t / .9) * noise(.9, 8, 21, 9) * 3, .10)
chord(to, ['C4','E4','G4','C5','E5','G5'], marimba, .2)              # 활짝!
chord(to, ['C3','G3'], bass, .3, 0)
add(to, noise(.4, 3, 22, .12), .16)
for j in range(14): add(to + .15 + j * .07, glock(hz(['C6','E6','G6','C7','E7','G7','C7'][j % 7]), .5), .10)
for i, fr in enumerate(tm['T_FREE']): add(fr, sweep(600, 2200, .5), .07); add(fr + .9, glock(hz(['C6','E6','G6','C7'][i])), .2)
seq(to + .5, .25, ['E5','G5','C6','E6', 'D6','C6','A5','C6', 'G5','A5','B5','D6', 'C6',None,None,None], marimba, .17)
seq(to + .5, .5, ['C3','G3','F3','C4','G3','D4','C3','G3'], bass, .16)

# ---------- 5. 꼬마 요원 출동! (27.6~32초) ----------
tf = tm['T_TITLE']
seq(tf, .14, ['G4','C5','E5','G5'], pluck, .22)
chord(tf + .56, ['C5','E5','G5','C6'], marimba, .24)
chord(tf + .56, ['C3','G3'], bass, .3, 0)
seq(tf + 1.0, .25, ['G5','G5','A5','B5'], marimba, .2)
seq(tf + 1.0, .5, ['G3','G3'], bass, .2)
tg = tm['T_GO']
chord(tg, ['C4','G4','C5','E5','G5','C6'], marimba, .26); chord(tg, ['C3','C2'], bass, .34, 0)
for j in range(10): add(tg + .1 + j * .08, glock(hz(['C6','E6','G6','C7','E7'][j % 5]), .6), .10)
chord(tg + 1.0, ['E5','G5','C6'], glock, .14, .12)

# 처음과 끝은 부드럽게, 너무 크지 않게(최대치 0.7)
fade = np.ones_like(out); n_in = int(SR * .3); n_out = int(SR * .7); end = int(SR * T)
fade[:n_in] = np.linspace(0, 1, n_in); fade[end - n_out:end] = np.linspace(1, 0, n_out); fade[end:] = 0
out *= fade
out = out[:end]
out = np.tanh(out * 1.4) / 1.4                # 살짝 눌러서 소리가 튀지 않게
out = out / max(1e-6, np.max(np.abs(out))) * .7
data = (out * 32767).astype('<i2')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('audio ok', round(len(out) / SR, 1), 's')
