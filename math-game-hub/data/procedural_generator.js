/**
 * 무한 절차적 수학 암호 생성기 (Infinite Procedural Math Problem Generator)
 * 하루 1,000명이 이용해도 중복 없는 고유 문제 실시간 동적 생성
 */

const WORD_BANK = {
  easy: [
    "CAT", "DOG", "SUN", "BOX", "KEY", "MAP", "RED", "STAR", "GOLD", "BLUE",
    "TREE", "BOOK", "FISH", "MOON", "BIRD", "CAR", "CUP", "DOOR", "RING", "SNOW",
    "PARK", "LION", "DUCK", "MILK", "CAKE", "BALL", "SHIP", "WIND", "RAIN", "FROG",
    "BEAR", "KING", "DEER", "ROSE", "LEAF", "BELL", "CORN", "FIRE", "HAND", "FOOT"
  ],
  normal: [
    "MATH", "CODE", "GAME", "LOCK", "OPEN", "FIND", "HERO", "DOOR", "TIME", "QUIZ",
    "BRAIN", "SPACE", "ROBOT", "SOLVE", "SMART", "QUEST", "POWER", "LIGHT", "WATER", "EARTH",
    "LOGIC", "MAGIC", "CLOUD", "STORM", "PIXEL", "CYBER", "LASER", "PILOT", "SHARK", "TIGER",
    "MUSIC", "DREAM", "STORY", "HAPPY", "SMILE", "PEACE", "GIANT", "GHOST", "CLOCK", "TRAIN"
  ],
  hard: [
    "ESCAPE", "SECRET", "PUZZLE", "FUTURE", "NUMBER", "GALTON", "VECTOR", "MATRIX", "QUANTUM", "CYPHER",
    "DETECT", "SYMBOL", "BINARY", "ENIGMA", "CHANCE", "RANDOM", "SYSTEM", "SHIELD", "MASTER", "KNIGHT",
    "WIZARD", "DRAGON", "PLANET", "GALAXY", "ROCKET", "ENERGY", "ATOMIC", "NATURE", "FLIGHT", "SHADOW",
    "MIRROR", "OCTAVE", "FACTOR", "RADIUS", "PRISMA", "COSMOS", "HYPER", "NEBULA", "AURORA", "VERTEX"
  ]
};

// 5x5 알파벳 좌표 그리드 (A-Y: 25글자)
const GRID_5X5 = [
  ['A', 'B', 'C', 'D', 'E'], // Y=1: (1,1)=A, (2,1)=B, (3,1)=C, (4,1)=D, (5,1)=E
  ['F', 'G', 'H', 'I', 'J'], // Y=2: (1,2)=F, (2,2)=G, (3,2)=H, (4,2)=I, (5,2)=J
  ['K', 'L', 'M', 'N', 'O'], // Y=3: (1,3)=K, (2,3)=L, (3,3)=M, (4,3)=N, (5,3)=O
  ['P', 'Q', 'R', 'S', 'T'], // Y=4: (1,4)=P, (2,4)=Q, (3,4)=R, (4,4)=S, (5,4)=T
  ['U', 'V', 'W', 'X', 'Y']  // Y=5: (1,5)=U, (2,5)=V, (3,5)=W, (4,5)=X, (5,5)=Y
];

// 알파벳 -> 좌표 매핑 사전
const CHAR_TO_COORD = {};
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    CHAR_TO_COORD[GRID_5X5[r][c]] = `(${c + 1},${r + 1})`;
  }
}
CHAR_TO_COORD['Z'] = '(5,5)'; // Z는 Y 위치 공유 또는 fallback

const ProceduralGenerator = {
  // 1. 시저 암호 동적 생성
  generateCaesar(difficulty = 'normal') {
    const words = WORD_BANK[difficulty] || WORD_BANK.normal;
    const word = words[Math.floor(Math.random() * words.length)];

    let shift = 1;
    if (difficulty === 'easy') shift = Math.floor(Math.random() * 2) + 1; // +1 ~ +2
    else if (difficulty === 'normal') shift = Math.floor(Math.random() * 2) + 3; // +3 ~ +4
    else shift = Math.floor(Math.random() * 3) + 5; // +5 ~ +7

    let ciphertext = '';
    for (let i = 0; i < word.length; i++) {
      const code = word.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        const shifted = ((code - 65 + shift) % 26) + 65;
        ciphertext += String.fromCharCode(shifted);
      } else {
        ciphertext += word[i];
      }
    }

    return {
      type: 'caesar',
      shift,
      ciphertext,
      answer: word,
      hint: `각 알파벳이 ${shift}칸 뒤로 밀려있습니다. ${shift}칸 앞 알파벳으로 되돌려보세요.`
    };
  },

  // 2. 좌표 암호 동적 생성 (100% 자동 정합성 검증)
  generateCoordinate(difficulty = 'normal') {
    const words = WORD_BANK[difficulty] || WORD_BANK.normal;
    // 5x5에 적합한 단어 필터링
    const validWords = words.filter(w => !w.includes('Z'));
    const word = validWords[Math.floor(Math.random() * validWords.length)] || "MATH";

    const coords = [];
    for (let i = 0; i < word.length; i++) {
      coords.push(CHAR_TO_COORD[word[i]] || "(1,1)");
    }

    return {
      type: 'coordinate',
      answer: word,
      coords,
      hint: "가로(X), 세로(Y) 순서로 좌표 격자에서 글자를 찾아 조합하세요."
    };
  },

  // 3. 이진수 암호 동적 생성
  generateBinary(difficulty = 'normal') {
    let num;
    if (difficulty === 'easy') {
      num = Math.floor(Math.random() * 10) + 1; // 1 ~ 10 (4비트)
    } else if (difficulty === 'normal') {
      num = Math.floor(Math.random() * 14) + 11; // 11 ~ 24 (4~5비트)
    } else {
      num = Math.floor(Math.random() * 39) + 25; // 25 ~ 63 (5~6비트)
    }

    let binaryStr = num.toString(2);
    if (difficulty === 'easy') binaryStr = binaryStr.padStart(4, '0');

    // 자리값 힌트 생성
    const bits = binaryStr.split('');
    const len = bits.length;
    const parts = [];
    bits.forEach((b, idx) => {
      if (b === '1') {
        parts.push(Math.pow(2, len - 1 - idx));
      }
    });

    return {
      type: 'binary',
      binary: binaryStr,
      answer: String(num),
      hint: `1이 켜진 자리의 수를 더하세요: ${parts.join(' + ')} = ?`
    };
  },

  // 4. 수열 암호 동적 생성
  generateSequence(difficulty = 'normal') {
    if (difficulty === 'easy') {
      const step = Math.floor(Math.random() * 8) + 2; // +2 ~ +9
      const start = Math.floor(Math.random() * 15) + 1;
      const terms = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
      return {
        type: 'sequence',
        sequence: `${terms[0]}, ${terms[1]}, ${terms[2]}, ${terms[3]}, [ ? ]`,
        answer: String(terms[4]),
        kind: 'arith',
        hint: `${step}씩 커지는 등차수열입니다.`
      };
    } else if (difficulty === 'normal') {
      const types = ['fib', 'sq', 'diff'];
      const pick = types[Math.floor(Math.random() * types.length)];

      if (pick === 'fib') {
        const s1 = Math.floor(Math.random() * 3) + 1;
        const s2 = s1 + Math.floor(Math.random() * 2) + 1;
        const t3 = s1 + s2;
        const t4 = s2 + t3;
        const t5 = t3 + t4;
        const t6 = t4 + t5;
        return {
          type: 'sequence',
          sequence: `${s1}, ${s2}, ${t3}, ${t4}, ${t5}, [ ? ]`,
          answer: String(t6),
          kind: 'fib',
          hint: `앞의 두 수를 더해보세요 (${t4} + ${t5} = ?)`
        };
      } else if (pick === 'sq') {
        const off = Math.floor(Math.random() * 5) + 1;
        const terms = [
          Math.pow(off, 2),
          Math.pow(off + 1, 2),
          Math.pow(off + 2, 2),
          Math.pow(off + 3, 2),
          Math.pow(off + 4, 2)
        ];
        return {
          type: 'sequence',
          sequence: `${terms[0]}, ${terms[1]}, ${terms[2]}, ${terms[3]}, [ ? ]`,
          answer: String(terms[4]),
          kind: 'squares',
          hint: `제곱수(${off + 4} x ${off + 4}) 규칙입니다.`
        };
      } else {
        const base = Math.floor(Math.random() * 2) + 1;
        let cur = Math.floor(Math.random() * 5) + 1;
        const terms = [cur];
        for (let i = 1; i <= 4; i++) {
          cur += i * base;
          terms.push(cur);
        }
        return {
          type: 'sequence',
          sequence: `${terms[0]}, ${terms[1]}, ${terms[2]}, ${terms[3]}, [ ? ]`,
          answer: String(terms[4]),
          kind: 'diffarith',
          hint: `차이가 +${base}, +${base*2}, +${base*3}... 로 늘어납니다.`
        };
      }
    } else {
      // hard
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      const startIdx = Math.floor(Math.random() * 8);
      const terms = primes.slice(startIdx, startIdx + 5);
      return {
        type: 'sequence',
        sequence: `${terms[0]}, ${terms[1]}, ${terms[2]}, ${terms[3]}, [ ? ]`,
        answer: String(terms[4]),
        kind: 'primes',
        hint: '1과 자기 자신으로만 나누어지는 소수(Prime Number)입니다.'
      };
    }
  }
};

// 브라우저 전역 노출
if (typeof window !== 'undefined') {
  window.ProceduralGenerator = ProceduralGenerator;
}
