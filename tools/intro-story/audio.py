"""
효과음·배경음을 코드로 만들어 story.wav 로 저장합니다(저작권 걱정 없는 직접 합성).
  python3 audio.py <times.json> <story.wav>
소리가 없어도 영상은 자막이 있어서 이해되도록 만들었습니다.
"""
import json, sys, wave
import numpy as np
SR = 44100
T = 24.0
tm = json.load(open(sys.argv[1]))
out = np.zeros(int(SR * T) + SR, dtype=np.float64)

def add(t, sig, gain=1.0):
    i = int(t * SR)
    if i < 0: return
    n = min(len(sig), len(out) - i)
    out[i:i + n] += sig[:n] * gain

def tone(freq, dur, shape='sine', attack=.005, decay=None, vib=0):
    t = np.arange(int(SR * dur)) / SR
    f = freq * (1 + vib * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    if shape == 'sine': w = np.sin(ph)
    elif shape == 'tri': w = 2 / np.pi * np.arcsin(np.sin(ph))
    elif shape == 'sq': w = np.sign(np.sin(ph)) * .6 + np.sin(ph) * .4
    else: w = np.sin(ph)
    env = np.minimum(1, t / attack) * np.exp(-t / (decay if decay else dur / 3))
    return w * env

def noise(dur, lp=0.0):
    n = np.random.RandomState(5).randn(int(SR * dur))
    if lp:
        k = int(lp); n = np.convolve(n, np.ones(k) / k, mode='same')
    return n

def sweep(f0, f1, dur, shape='sine'):
    t = np.arange(int(SR * dur)) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.sin(np.pi * t / dur) ** 1.5

# 바닥에 깔리는 낮은 소리(장면마다 화음이 바뀜)
def pad(t0, t1, freqs, gain):
    dur = t1 - t0
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    sig = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate(freqs)) / len(freqs)
    add(t0, sig * env, gain)
pad(0.2, 7.2, [110, 164.8, 196], .10)       # 긴장감(Am 느낌)
pad(7.0, 15.2, [130.8, 196, 261.6, 329.6], .09)
pad(15.0, 23.8, [130.8, 196, 261.6, 329.6, 392], .11)

# 장면 1: 경보 + 자물쇠
a0, a1 = tm['T_ALARM']
t = a0
k = 0
while t < a1 + .8:
    f = 880 if k % 2 == 0 else 622
    fade = 1 - np.clip((t - a1) / .8, 0, 1)
    add(t, tone(f, .2, 'sq', decay=.25), .09 * fade)
    t += .22; k += 1
tl = tm['T_LOCK']
add(tl, tone(55, .6, 'sine', decay=.18), .55)
add(tl, noise(.08, 6) * np.exp(-np.arange(int(SR * .08)) / SR / .02), .5)
add(tl + .02, tone(1800, .25, 'sine', decay=.07), .12)

# 장면 2: 카드가 튀어나올 때, 글자 밀기, 구슬 부딪힘, 수열 정답
for i, ct in enumerate(tm['T_CARD']):
    add(ct, tone([523, 659, 784][i], .22, 'tri', decay=.12), .18)
add(8.4, sweep(300, 1200, .5), .08)
for i in range(4):
    add(9.1 + i * .3, tone(880 + 110 * i, .12, 'sine', decay=.05), .12)
for lt in tm['landTimes']:
    add(lt, noise(.03, 3) * np.exp(-np.arange(int(SR * .03)) / SR / .01), .22)
    add(lt, tone(1400 + (hash(round(lt, 2)) % 5) * 90, .09, 'sine', decay=.03), .05)
add(12.4, tone(1318, .8, 'sine', decay=.3), .22); add(12.4, tone(1976, .6, 'sine', decay=.2), .10)

# 장면 3: 하나씩 열림, 점화, 마지막 인사
for i, ut in enumerate(tm['T_UNLOCK']):
    add(ut, noise(.05, 4) * np.exp(-np.arange(int(SR * .05)) / SR / .015), .3)
    add(ut, tone(523 * (1.25 ** i), .45, 'sine', decay=.2), .22)
    add(ut + .12, tone(784 * (1.25 ** i), .5, 'sine', decay=.22), .16)
ig = tm['T_IGNITE']
add(ig - .6, sweep(200, 2400, .7), .22)
for j, f in enumerate([261.6, 329.6, 392, 523.3, 659.3, 784]):
    add(ig + .02 * j, tone(f, 2.2, 'tri', decay=.9), .12)
for j in range(10):
    add(ig + .3 + j * .09, tone(1046 * (1.12 ** (j % 7)), .25, 'sine', decay=.08), .08)
fi = tm['T_FINAL']
add(fi, tone(659, .5, 'sine', decay=.2), .18); add(fi + .22, tone(988, 1.1, 'sine', decay=.4), .20)

# 처음과 끝은 부드럽게, 너무 크지 않게(최대치 0.7)
fade = np.ones_like(out); n_in = int(SR * .5); n_out = int(SR * .8)
fade[:n_in] = np.linspace(0, 1, n_in); end = int(SR * T); fade[end - n_out:end] = np.linspace(1, 0, n_out); fade[end:] = 0
out *= fade
out = out[:int(SR * T)]
out = out / max(1e-6, np.max(np.abs(out))) * .7
data = (out * 32767).astype('<i2')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('audio ok', round(len(out) / SR, 1), 's')
