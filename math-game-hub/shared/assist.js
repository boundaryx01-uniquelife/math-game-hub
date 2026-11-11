/**
 * MathAssist: 암호 / 수열 / 오메가 게임이 함께 쓰는 "힌트 2단계 + 마스터 키 정답 패널" 도우미
 *
 *  - MathAssist.createHints(opts)   힌트 1/2 → 2/2 단계 UI (버튼/문구는 JS가 만들고 스타일도 JS가 주입)
 *  - MathAssist.showPanel(opts)     정답 + 단계별 풀이 패널 ("다음 문제로" 버튼 포함)
 *  - MathAssist.seq.info(terms,kind) 수열 힌트1/힌트2/풀이 자동 생성
 *  - MathAssist.cipherInfo(step,q)  암호 게임 1~4단계(시저/좌표/이진수/수열) 힌트1/힌트2/풀이 자동 생성
 *
 * 브라우저(<script>)와 node(require) 양쪽에서 로드됩니다. DOM은 UI 함수를 부를 때만 사용합니다.
 * 이 파일은 file:// 에서도 동작하도록 각 game.js 가 <script> 태그를 주입하여 불러옵니다.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MathAssist = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const MINUS = '−';

  /* ------------------------------------------------------------------ *
   * 1. 수열 규칙 분석 + 힌트/풀이 문장 생성
   * ------------------------------------------------------------------ */
  function isPrime(n) {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }
  function nextPrime(n) {
    let c = n + 1;
    while (!isPrime(c)) c++;
    return c;
  }
  function smallestDivisor(n) {
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
    return n;
  }
  const diffsOf = (T) => T.slice(1).map((v, i) => v - T[i]);
  const allEq = (a) => a.length > 0 && a.every((v) => v === a[0]);
  const sgn = (n) => (n >= 0 ? '+' : MINUS);

  // 각 규칙: 주어진 앞부분 항(T)이 그 규칙을 따르면 매개변수를, 아니면 null
  const detectors = {
    arith(T) {
      const d = diffsOf(T);
      return allEq(d) && d[0] !== 0 ? { d: d[0] } : null;
    },
    geom(T) {
      if (!T.every((v) => v > 0)) return null;
      const r = T.slice(1).map((v, i) => v / T[i]);
      return allEq(r) && Number.isInteger(r[0]) && r[0] >= 2 ? { r: r[0] } : null;
    },
    div(T) {
      if (!T.every((v) => v > 0)) return null;
      const r = T.slice(1).map((v, i) => T[i] / v);
      return allEq(r) && Number.isInteger(r[0]) && r[0] >= 2 ? { k: r[0] } : null;
    },
    squares(T) {
      const k = Math.round(Math.sqrt(T[0]));
      return k >= 1 && T.every((v, i) => v === (k + i) * (k + i)) ? { k } : null;
    },
    cubes(T) {
      const k = Math.round(Math.cbrt(T[0]));
      return k >= 1 && T.every((v, i) => v === Math.pow(k + i, 3)) ? { k } : null;
    },
    primes(T) {
      return T.length >= 2 && T.every(isPrime) && T.slice(1).every((v, i) => nextPrime(T[i]) === v) ? {} : null;
    },
    fib(T) {
      return T.length >= 4 && T.slice(2).every((v, i) => v === T[i] + T[i + 1]) ? {} : null;
    },
    leo(T) {
      return T.length >= 4 && T.slice(2).every((v, i) => v === T[i] + T[i + 1] + 1) ? {} : null;
    },
    pronic(T) {
      const k = Math.floor(Math.sqrt(T[0]));
      return k >= 1 && T.every((v, i) => v === (k + i) * (k + i + 1)) ? { k } : null;
    },
    growratio(T) {
      if (!T.every((v) => v > 0)) return null;
      const r = T.slice(1).map((v, i) => v / T[i]);
      if (r.length < 2 || !r.every(Number.isInteger)) return null;
      const dr = diffsOf(r);
      return allEq(dr) && dr[0] === 1 ? { r0: r[0] } : null;
    },
    affine(T) {
      const d = diffsOf(T);
      if (d.length < 2 || d[0] === 0 || d[1] % d[0] !== 0) return null;
      const a = d[1] / d[0];
      if (a < 2) return null;
      const b = T[1] - a * T[0];
      return b !== 0 && T.slice(1).every((v, i) => v === a * T[i] + b) ? { a, b } : null;
    },
    diffarith(T) {
      const d = diffsOf(T);
      const dd = diffsOf(d);
      return d.length >= 2 && allEq(dd) && dd[0] !== 0 ? { e: dd[0] } : null;
    }
  };
  const DETECT_ORDER = ['arith', 'geom', 'div', 'squares', 'cubes', 'primes', 'fib', 'leo', 'pronic', 'growratio', 'affine', 'diffarith'];

  function detectKind(T) {
    for (const kind of DETECT_ORDER) {
      const p = detectors[kind](T);
      if (p) return { kind, p };
    }
    return null;
  }

  // 각 규칙의 문장 생성기 (T = 화면에 주어진 항들)
  const builders = {
    arith(T, p) {
      const n = T.length, last = T[n - 1], d = p.d, up = d > 0, ad = Math.abs(d);
      const answer = last + d;
      const list = T.slice(1).map((v, i) => (up ? `${v}${MINUS}${T[i]}` : `${T[i]}${MINUS}${v}`) + `=${ad}`).join(', ');
      return {
        answer,
        hint1: '이웃한 두 수의 차이를 구해 보세요. 수가 점점 커지는지, 작아지는지도 살펴보세요.',
        hint2: `차이가 매번 ${ad}로 같아요. 마지막 수(${last})에서 ${ad}만큼 ${up ? '더 커지면' : '더 작아지면'} 어떤 수가 될까요?`,
        explain: [
          `이웃한 수의 차이를 구해요 (${up ? '뒤' : '앞'}의 수에서 ${up ? '앞' : '뒤'}의 수를 빼요): ${list}`,
          `차이가 늘 ${ad}로 같으니 ${ad}씩 ${up ? '커지는' : '작아지는'} 규칙이에요.`,
          `마지막 수 ${last} ${sgn(d)} ${ad} = ${answer}`
        ]
      };
    },
    geom(T, p) {
      const n = T.length, last = T[n - 1], r = p.r, answer = last * r;
      return {
        answer,
        hint1: '앞의 수에 어떤 수를 곱하면 다음 수가 되는지 찾아 보세요. (뒤의 수 ÷ 앞의 수를 계산해 보면 알 수 있어요.)',
        hint2: `매번 ${r}배가 돼요. 마지막 수(${last})의 ${r}배는 얼마일까요?`,
        explain: [
          `뒤의 수 ÷ 앞의 수를 구해요: ${T.slice(1).map((v, i) => `${v}÷${T[i]}=${r}`).join(', ')}`,
          `앞의 수에 늘 ${r}을 곱하는 규칙이에요 (×${r}).`,
          `마지막 수 ${last} × ${r} = ${answer}`
        ]
      };
    },
    div(T, p) {
      const n = T.length, last = T[n - 1], k = p.k, answer = last / k;
      return {
        answer,
        hint1: '수가 점점 작아져요. 앞의 수를 어떤 수로 나누면 다음 수가 되는지 찾아 보세요.',
        hint2: `매번 ${k}로 나누고 있어요 (÷${k}). 마지막 수(${last})를 ${k}로 나눈 몫은 얼마일까요?`,
        explain: [
          `앞의 수 ÷ 뒤의 수를 구해요: ${T.slice(1).map((v, i) => `${T[i]}÷${v}=${k}`).join(', ')}`,
          `수가 늘 ${k}로 나누어지는 규칙이에요 (÷${k}).`,
          `마지막 수 ${last} ÷ ${k} = ${answer}`
        ]
      };
    },
    squares(T, p) {
      const n = T.length, k = p.k, nx = k + n, answer = nx * nx;
      return {
        answer,
        hint1: '각 수가 "같은 수를 두 번 곱한 수"인지 살펴보세요. (예: 4 = 2×2)',
        hint2: `곱해지는 수가 ${k}, ${k + 1}, ${k + 2}… 처럼 1씩 커져요. 이번 차례는 ${nx}×${nx} 를 계산하면 돼요.`,
        explain: [
          `각 수를 같은 수끼리 곱한 모양으로 써 봐요: ${T.map((v, i) => `${v}=${k + i}×${k + i}`).join(', ')}`,
          '곱하는 수가 1씩 커지는 "제곱수" 규칙이에요.',
          `다음 차례는 ${nx}×${nx} = ${answer}`
        ]
      };
    },
    cubes(T, p) {
      const n = T.length, k = p.k, nx = k + n, answer = nx * nx * nx;
      return {
        answer,
        hint1: '각 수가 "같은 수를 세 번 곱한 수"인지 살펴보세요. (예: 8 = 2×2×2)',
        hint2: `곱해지는 수가 ${k}, ${k + 1}, ${k + 2}… 처럼 1씩 커져요. 이번 차례는 ${nx}×${nx}×${nx} 를 계산하면 돼요.`,
        explain: [
          `각 수를 같은 수끼리 세 번 곱한 모양으로 써 봐요: ${T.map((v, i) => `${v}=${k + i}×${k + i}×${k + i}`).join(', ')}`,
          '곱하는 수가 1씩 커지는 "세제곱수" 규칙이에요.',
          `다음 차례는 ${nx}×${nx}×${nx} = ${answer}`
        ]
      };
    },
    primes(T) {
      const last = T[T.length - 1], answer = nextPrime(last);
      const steps = [`${T.join(', ')} 은(는) 모두 소수예요. (소수 = 1과 자기 자신으로만 나누어떨어지는 수)`];
      for (let c = last + 1; c < answer; c++) {
        const d = smallestDivisor(c);
        steps.push(`${c}: ${c}÷${d}=${c / d} 로 나누어떨어져서 소수가 아니에요.`);
      }
      steps.push(`${answer}: 1과 ${answer} 말고는 나누어떨어지는 수가 없으니 소수예요.`);
      return {
        answer,
        hint1: '1과 자기 자신으로만 나누어떨어지는 수(소수)들이 차례로 놓여 있어요. 소수가 무엇인지 떠올려 보세요.',
        hint2: `마지막 수(${last})보다 큰 수를 ${last + 1}부터 하나씩 따져서, 처음으로 나오는 소수를 찾아 보세요. (2, 3, 5 같은 작은 수로 나누어 보면 돼요.)`,
        explain: steps
      };
    },
    fib(T) {
      const n = T.length, a = T[n - 2], b = T[n - 1], answer = a + b;
      return {
        answer,
        hint1: '앞의 두 수를 더하면 어떻게 되는지 살펴보세요. 세 번째 수와 비교해 보세요.',
        hint2: `앞의 두 수를 더하면 바로 다음 수가 돼요. 마지막 두 수(${a}, ${b})를 더해 보세요.`,
        explain: [
          `앞의 두 수를 더하면 다음 수가 돼요: ${T.slice(2).map((v, i) => `${T[i]}+${T[i + 1]}=${v}`).join(', ')}`,
          `같은 규칙으로 마지막 두 수를 더해요: ${a} + ${b} = ${answer}`
        ]
      };
    },
    leo(T) {
      const n = T.length, a = T[n - 2], b = T[n - 1], answer = a + b + 1;
      return {
        answer,
        hint1: '앞의 두 수를 더해서 다음 수와 비교해 보세요. 딱 맞나요, 조금 모자라거나 남나요?',
        hint2: `앞의 두 수를 더한 값보다 항상 1이 더 커요. 마지막 두 수(${a}, ${b})를 더한 뒤 그 규칙대로 1을 더해 보세요.`,
        explain: [
          `앞의 두 수를 더한 뒤 1을 더하면 다음 수가 돼요: ${T.slice(2).map((v, i) => `${T[i]}+${T[i + 1]}+1=${v}`).join(', ')}`,
          `같은 규칙으로: ${a} + ${b} + 1 = ${answer}`
        ]
      };
    },
    pronic(T, p) {
      const n = T.length, k = p.k, nx = k + n, answer = nx * (nx + 1);
      return {
        answer,
        hint1: '각 수를 이웃한 두 수의 곱으로 나타낼 수 있는지 살펴보세요. (예: 6 = 2×3)',
        hint2: `곱하는 두 수가 (${k}, ${k + 1}), (${k + 1}, ${k + 2}) … 처럼 1씩 커져요. 이번 차례는 ${nx}×${nx + 1} 을 계산하면 돼요.`,
        explain: [
          `각 수를 이웃한 두 수의 곱으로 써 봐요: ${T.map((v, i) => `${v}=${k + i}×${k + i + 1}`).join(', ')}`,
          '곱하는 두 수가 한 칸씩 커지는 규칙이에요.',
          `다음 차례는 ${nx}×${nx + 1} = ${answer}`
        ]
      };
    },
    growratio(T, p) {
      const n = T.length, last = T[n - 1];
      const rs = T.slice(1).map((v, i) => v / T[i]);
      const rn = rs[rs.length - 1] + 1, answer = last * rn;
      return {
        answer,
        hint1: '뒤의 수 ÷ 앞의 수를 계산해 보세요. 곱하는 수가 매번 같은가요, 달라지나요?',
        hint2: `곱하는 수가 ${rs.join(', ')} 처럼 1씩 커져요. 다음에 곱할 수를 찾아 마지막 수(${last})에 곱해 보세요.`,
        explain: [
          `뒤의 수 ÷ 앞의 수: ${T.slice(1).map((v, i) => `${v}÷${T[i]}=${rs[i]}`).join(', ')}`,
          `곱하는 수가 ${rs.join(', ')} 로 1씩 커지고 있어요. 그러면 다음에 곱할 수는 ${rn}이에요.`,
          `마지막 수 ${last} × ${rn} = ${answer}`
        ]
      };
    },
    affine(T, p) {
      const n = T.length, last = T[n - 1], a = p.a, b = p.b, ab = Math.abs(b);
      const answer = a * last + b;
      return {
        answer,
        hint1: '앞의 수에 무언가를 곱한 다음 다시 더하거나 빼면 다음 수가 되는 규칙이에요. 처음 두 수로 규칙을 찾아 보세요.',
        hint2: `${a}배를 한 뒤 ${ab}만큼 ${b > 0 ? '더해요' : '빼요'}. 확인: ${T[0]}×${a}${sgn(b)}${ab}=${T[1]}. 마지막 수(${last})에도 똑같이 해 보세요.`,
        explain: [
          `앞의 수 → 뒤의 수가 되는 계산을 찾아봐요. ${T[0]}×${a}${sgn(b)}${ab}=${T[1]} 처럼 ${a}배 한 뒤 ${ab}을 ${b > 0 ? '더하면' : '빼면'} 맞아요.`,
          `다른 곳도 확인해요: ${T.slice(1).map((v, i) => `${T[i]}×${a}${sgn(b)}${ab}=${v}`).join(', ')}`,
          `마지막 수에도 똑같이: ${last}×${a} = ${a * last}, 여기에 ${sgn(b)}${ab} 하면 ${answer}`
        ]
      };
    },
    diffarith(T, p) {
      const n = T.length, last = T[n - 1], e = p.e;
      const d = diffsOf(T), nd = d[d.length - 1] + e, answer = last + nd;
      return {
        answer,
        hint1: '이웃한 두 수의 차이를 구해 보세요. 그 차이들끼리는 어떤 규칙이 있나요?',
        hint2: `차이가 ${d.join(', ')} 처럼 ${Math.abs(e)}씩 ${e > 0 ? '커져요' : '작아져요'}. 다음에 더할 차이를 찾아서 마지막 수(${last})에 더해 보세요.`,
        explain: [
          `이웃한 수의 차이를 구해요: ${T.slice(1).map((v, i) => `${v}${MINUS}${T[i]}=${d[i]}`).join(', ')}`,
          `차이만 보면 ${d.join(', ')} → ${Math.abs(e)}씩 ${e > 0 ? '커져요' : '작아져요'}. 그러면 다음 차이는 ${d[d.length - 1]} ${sgn(e)} ${Math.abs(e)} = ${nd}이에요.`,
          `마지막 수 ${last} ${sgn(nd)} ${Math.abs(nd)} = ${answer}`
        ]
      };
    }
  };

  /**
   * 수열 정보 생성. terms = 화면에 보이는 앞부분 숫자들, kind = (선택) 생성기가 알고 있는 규칙 이름
   * 반환: { kind, answer, hint1, hint2, explain: [문장...] } 또는 규칙을 못 찾으면 null
   */
  function seqInfo(terms, kind, expected) {
    const T = terms.map(Number);
    // 후보 규칙: 지정된 kind → 자동 감지 순서. expected(정답)가 주어지면 그 정답을 만드는 규칙을 우선 선택
    // (예: 3, 5, 9, 15 는 피보나치+1 처럼도 보이지만 실제 규칙은 계차수열)
    const cands = (kind ? [kind] : []).concat(DETECT_ORDER).filter((k, i, a) => detectors[k] && a.indexOf(k) === i);
    let first = null;
    for (const k of cands) {
      const p = detectors[k](T);
      if (!p) continue;
      const out = builders[k](T, p);
      out.kind = k;
      if (expected === undefined || expected === null || Number(out.answer) === Number(expected)) return out;
      if (!first) first = out;
    }
    return first;
  }

  /* ------------------------------------------------------------------ *
   * 2. 암호 게임 단계별 정보 (시저 / 좌표 / 이진수 / 수열)
   * ------------------------------------------------------------------ */
  const COORD_GRID = [
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'I', 'J'],
    ['K', 'L', 'M', 'N', 'O'],
    ['P', 'Q', 'R', 'S', 'T'],
    ['U', 'V', 'W', 'X', 'Y']
  ];

  function caesarInfo(q) {
    const s = Number(q.shift) || 3;
    const ct = String(q.ciphertext).toUpperCase();
    const back = (c) => String.fromCharCode(((c.charCodeAt(0) - 65 - s) % 26 + 26) % 26 + 65);
    const wraps = (c) => c.charCodeAt(0) - 65 - s < 0;
    const plain = ct.split('').map(back).join('');
    const anyWrap = ct.split('').some(wraps);
    const c0 = ct[0];
    const explain = [
      `암호문은 알파벳을 ${s}칸 뒤로 밀어서 만든 거예요. 그래서 풀 때는 거꾸로 ${s}칸 앞으로 되돌려요.`,
      `글자마다 ${s}칸씩 앞으로 되돌려요: ${ct.split('').map((c) => `${c}→${back(c)}`).join(', ')}`
    ];
    if (anyWrap) {
      explain.push(`알파벳의 맨 앞(A)보다 더 앞으로 가야 할 때는 맨 뒤(Z)로 이어서 세요. (A의 바로 앞은 Z)`);
    }
    explain.push(`되돌린 글자를 차례대로 이으면 ${plain}`);
    return {
      answer: plain,
      hint1: '암호문은 알파벳을 뒤로 밀어서 만든 거예요. 그러니 풀 때는 반대 방향인 앞으로 되돌려야 해요. A B C D E … 알파벳 순서를 한 줄로 써 놓고 시작해 보세요.',
      hint2: `첫 글자 ${c0}부터 해 봐요. 알파벳 순서에서 ${c0} 바로 앞쪽으로 ${s}칸 되돌아가면 어떤 글자일까요?${wraps(c0) ? ' (A보다 더 앞으로 가면 Z로 이어져요.)' : ''} 나머지 글자도 같은 방법으로 해 보세요.`,
      explain
    };
  }

  function coordsInfo(q) {
    const pts = q.coords.map((s) => {
      const m = String(s).match(/(\d+)\s*,\s*(\d+)/);
      const x = Number(m[1]), y = Number(m[2]);
      const row = COORD_GRID[y - 1];
      return { raw: String(s).replace(/\s+/g, ''), x, y, ch: (row && row[x - 1]) || '?' };
    });
    const plain = pts.map((p) => p.ch).join('');
    const p0 = pts[0];
    return {
      answer: plain,
      hint1: '좌표 (가로, 세로)에서 앞의 수는 표에서 왼쪽부터 센 칸 번호, 뒤의 수는 위에서부터 센 줄 번호예요. 두 수가 만나는 칸을 표에서 찾아 보세요.',
      hint2: `첫 번째 좌표 ${p0.raw}는 왼쪽에서 ${p0.x}번째 칸, 위에서 ${p0.y}번째 줄이에요. 그 칸에 적힌 글자를 읽고, 나머지 좌표도 같은 방법으로 읽어 보세요.`,
      explain: [].concat(
        ['좌표 (가로 X, 세로 Y)는 표에서 왼쪽부터 X번째 칸, 위에서부터 Y번째 줄이에요.'],
        pts.map((p) => `${p.raw} → 왼쪽 ${p.x}번째, 위 ${p.y}번째 → ${p.ch}`),
        [`글자를 차례대로 이으면 ${plain}`]
      )
    };
  }

  function binaryInfo(q) {
    const bits = String(q.binary).split('');
    const len = bits.length;
    const w = bits.map((_, i) => Math.pow(2, len - 1 - i));
    const ones = bits.map((b, i) => (b === '1' ? w[i] : null)).filter((v) => v !== null);
    const num = ones.reduce((a, b) => a + b, 0);
    return {
      answer: String(num),
      hint1: '2진수의 각 자리에는 오른쪽부터 1, 2, 4, 8… 처럼 2배씩 커지는 "자리값"이 있어요. 1이 쓰인 자리와 0이 쓰인 자리를 구분해 보세요.',
      hint2: `1이 쓰인 자리(밝게 켜진 카드)는 모두 ${ones.length}곳이에요. 그 자리의 "자리값"을 카드에서 읽어 모두 더해 보세요.`,
      explain: [
        '2진수는 오른쪽 끝부터 1의 자리, 2의 자리, 4의 자리, 8의 자리… 처럼 자리값이 2배씩 커져요. 1이 쓰인 자리의 값만 더하면 10진수가 돼요.',
        `${q.binary} 의 각 자리: ${bits.map((b, i) => `${w[i]}의 자리=${b}`).join(', ')}`,
        ones.length > 1
          ? `1이 있는 자리의 값만 더해요: ${ones.join(' + ')} = ${num}`
          : `1이 하나뿐이라 그 자리의 값이 바로 답이에요: ${num}`
      ]
    };
  }

  function cipherSeqInfo(q) {
    const terms = String(q.sequence).split('[')[0].split(',').map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
    const r = seqInfo(terms, q.kind, q.answer);
    if (r && Number(r.answer) === Number(q.answer)) return r;
    return {
      answer: String(q.answer),
      hint1: '숫자 사이의 관계(차이나 곱하는 수)를 살펴보세요.',
      hint2: '이웃한 두 수의 차이를 먼저 구해 보세요.',
      explain: [q.hint ? String(q.hint) : '규칙을 찾아 계산해 보세요.']
    };
  }

  const asArray = (x) => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : null);

  /** 암호 게임 단계(1~4)와 문제 객체 → { answer, hint1, hint2, explain[] }. 문제에 hint1/hint2/explain 이 있으면 그것을 우선 */
  function cipherInfo(step, q) {
    let r;
    if (step === 1) r = caesarInfo(q);
    else if (step === 2) r = coordsInfo(q);
    else if (step === 3) r = binaryInfo(q);
    else r = cipherSeqInfo(q);
    return {
      answer: String(q.answer != null ? q.answer : r.answer),
      hint1: q.hint1 || r.hint1,
      hint2: q.hint2 || r.hint2,
      explain: asArray(q.explain) || r.explain,
      computedAnswer: String(r.answer)
    };
  }

  /* ------------------------------------------------------------------ *
   * 3. UI (브라우저 전용): 스타일 주입, 힌트 단계 관리, 정답 패널
   * ------------------------------------------------------------------ */
  const CSS = `
.ma-hint-line{margin:0 0 6px;line-height:1.55}
.ma-hint-line:last-child{margin-bottom:0}
.ma-hint-badge{display:inline-block;margin-right:8px;padding:1px 9px;border-radius:999px;font-size:.75rem;font-weight:800;vertical-align:middle;background:var(--accent,#f59e0b);color:#111827}
.ma-hint-btn{margin-top:8px;cursor:pointer;font-family:inherit}
.ma-hint-btn.ma-own{display:inline-block;margin:8px 8px 0 0;padding:8px 14px;border-radius:10px;font-size:.9rem;font-weight:700;border:1px dashed var(--accent,#f59e0b);background:rgba(255,255,255,.05);color:var(--accent,#f59e0b)}
.ma-hint-btn.ma-own:hover{background:rgba(255,255,255,.12)}
.ma-overlay{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.74);overflow:auto}
.ma-panel{box-sizing:border-box;width:min(580px,100%);max-height:94vh;overflow:auto;background:var(--bg-dark,#0f172a);color:var(--text-main,#f8fafc);border:2px solid var(--primary,#38bdf8);border-radius:16px;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:var(--font-main,system-ui,-apple-system,sans-serif);text-align:left;line-height:1.6}
.ma-panel-title{font-size:1.15rem;font-weight:800;margin:0 0 2px}
.ma-panel-note{font-size:.8rem;color:var(--text-muted,#94a3b8);margin:0 0 12px}
.ma-answer-label{font-size:.85rem;font-weight:700;color:var(--text-muted,#94a3b8)}
.ma-answer{font-family:var(--font-mono,ui-monospace,monospace);font-size:1.9rem;font-weight:800;color:var(--accent,#f59e0b);background:rgba(255,255,255,.07);border-radius:12px;padding:8px 14px;margin:4px 0 14px;word-break:break-all}
.ma-steps-label{font-size:.85rem;font-weight:700;color:var(--text-muted,#94a3b8)}
.ma-steps{margin:6px 0 18px;padding-left:1.3em}
.ma-steps li{margin-bottom:7px;font-size:1rem;word-break:keep-all;overflow-wrap:anywhere}
.ma-next{display:block;width:100%;padding:13px 16px;font-size:1.05rem;font-weight:800;font-family:inherit;border:0;border-radius:12px;cursor:pointer;background:var(--primary,#38bdf8);color:var(--bg-dark,#0f172a)}
.ma-next:focus-visible{outline:3px solid var(--text-main,#f8fafc);outline-offset:2px}
`;

  function injectStyle() {
    if (typeof document === 'undefined' || document.getElementById('ma-style')) return;
    const st = document.createElement('style');
    st.id = 'ma-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function el(tag, props, text) {
    const e = document.createElement(tag);
    if (props) Object.keys(props).forEach((k) => { e[k] = props[k]; });
    if (text != null) e.textContent = text;
    return e;
  }

  // 버튼이 포커스를 가져가면 키보드(Enter/숫자) 입력이 꼬이므로 마우스로는 포커스를 주지 않음
  function noFocusSteal(btn) {
    btn.tabIndex = -1;
    btn.addEventListener('mousedown', (e) => e.preventDefault());
  }

  /**
   * 힌트 2단계 UI.
   * opts: { content: 힌트 문구 element, toggle?: 기존 토글 버튼 (없으면 content 뒤에 만듦),
   *         openText, closeText, hint2Text, idleText (alwaysVisible 일 때 힌트를 안 열었을 때 문구),
   *         alwaysVisible (true: content를 숨기지 않고 idleText 로 대체), noFocusSteal }
   * 반환: { set(hint1, hint2), level(), isOpen() }
   */
  function createHints(opts) {
    injectStyle();
    const content = opts.content;
    let toggle = opts.toggle;
    let anchor = content;
    if (!toggle) {
      toggle = el('button', { type: 'button', id: 'btn-toggle-hint', className: 'ma-hint-btn ma-own' });
      content.insertAdjacentElement('afterend', toggle);
      anchor = toggle;
    }
    const btn2 = el('button', { type: 'button', id: 'btn-hint-2', className: 'ma-hint-btn ma-hint2-btn' + (opts.toggle ? ' btn-hint-toggle' : ' ma-own') });
    btn2.textContent = opts.hint2Text || '🔎 힌트 2 보기 (더 자세히)';
    btn2.style.display = 'none';
    anchor.insertAdjacentElement('afterend', btn2);
    if (opts.noFocusSteal) { noFocusSteal(toggle); noFocusSteal(btn2); }

    const s = { h1: '', h2: '', level: 0, open: false };
    content.setAttribute('aria-live', 'polite');

    function line(n, text) {
      const d = el('div', { className: 'ma-hint-line ma-hint-' + n });
      d.appendChild(el('span', { className: 'ma-hint-badge' }, `힌트 ${n}/2`));
      d.appendChild(el('span', { className: 'ma-hint-text' }, text));
      return d;
    }

    function render() {
      content.innerHTML = '';
      if (!s.open) {
        if (opts.alwaysVisible) content.textContent = opts.idleText || '';
        else content.classList.add('hidden');
      } else {
        content.classList.remove('hidden');
        content.appendChild(line(1, s.h1));
        if (s.level >= 2) content.appendChild(line(2, s.h2));
      }
      toggle.textContent = s.open ? (opts.closeText || '🔒 힌트 닫기') : (opts.openText || '💡 힌트 보기');
      btn2.style.display = s.open && s.level === 1 && s.h2 ? '' : 'none';
    }

    toggle.addEventListener('click', () => {
      s.open = !s.open;
      if (s.open && s.level < 1) s.level = 1;
      render();
    });
    btn2.addEventListener('click', () => {
      if (s.level < 1) return; // 힌트 1을 먼저 열어야 함
      s.level = 2;
      render();
    });

    const api = {
      set(h1, h2) { s.h1 = h1 || ''; s.h2 = h2 || ''; s.level = 0; s.open = false; render(); },
      level() { return s.level; },
      isOpen() { return s.open; },
      toggleButton: toggle,
      hint2Button: btn2
    };
    api.set('', '');
    return api;
  }

  function isPanelOpen() {
    return typeof document !== 'undefined' && !!document.getElementById('ma-overlay');
  }

  /**
   * 정답 + 풀이 패널.
   * opts: { answer, steps: [문장...], onNext(), nextLabel, title, note }
   */
  function showPanel(opts) {
    injectStyle();
    const old = document.getElementById('ma-overlay');
    if (old) old.remove();
    const overlay = el('div', { id: 'ma-overlay', className: 'ma-overlay' });
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const panel = el('div', { className: 'ma-panel' });
    panel.appendChild(el('div', { className: 'ma-panel-title' }, opts.title || '🔑 마스터 키: 정답과 풀이'));
    if (opts.note) panel.appendChild(el('div', { className: 'ma-panel-note' }, opts.note));
    panel.appendChild(el('div', { className: 'ma-answer-label' }, '정답'));
    panel.appendChild(el('div', { id: 'ma-answer', className: 'ma-answer' }, String(opts.answer)));
    panel.appendChild(el('div', { className: 'ma-steps-label' }, '풀이'));
    const ol = el('ol', { id: 'ma-steps', className: 'ma-steps' });
    (opts.steps && opts.steps.length ? opts.steps : ['풀이가 준비되지 않은 문제예요.']).forEach((t) => ol.appendChild(el('li', null, t)));
    panel.appendChild(ol);
    const next = el('button', { type: 'button', id: 'ma-next', className: 'ma-next' }, opts.nextLabel || '다음 문제로');
    panel.appendChild(next);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    let done = false;
    const openedAt = Date.now();
    next.addEventListener('click', () => {
      // 마스터 키를 Enter 로 제출한 키 입력이 곧바로 새 버튼을 눌러 버리는 것을 방지 (열린 직후 0.35초는 무시)
      if (done || Date.now() - openedAt < 350) return;
      done = true;
      overlay.remove();
      if (opts.onNext) opts.onNext();
    });
    // 패널이 열려 있는 동안 게임의 키보드 처리가 끼어들지 않도록 이벤트 전파를 막음 (Enter/Space는 버튼이 처리)
    overlay.addEventListener('keydown', (e) => { e.stopPropagation(); });
    next.focus();
    return { close() { done = true; overlay.remove(); } };
  }

  /** <script> 태그 주입 로더 (file:// 에서도 동작). 성공 여부를 Promise<boolean> 으로 반환 */
  function loadScript(url) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  return {
    seq: { info: seqInfo, detect: detectKind },
    cipherInfo,
    createHints,
    showPanel,
    isPanelOpen,
    injectStyle,
    loadScript,
    MASTER_KEY: '8680'
  };
});
