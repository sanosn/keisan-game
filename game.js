'use strict';

/* =========================================================
   けいさんパチパチ（試作版）
   - LEVELS にレベルを追加すると、スタート画面に自動で並びます
   ========================================================= */

const QUESTIONS_PER_PLAY = 10; // 10もん チャレンジの問題数
const TIME_LIMIT_SEC = 300;    // 5ふん チャレンジの制限時間
const HURRY_SEC = 10;          // のこり何秒から「いそいで！」表示にするか

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ヒント：● を並べて数えられるようにする（1年生向け）
const dots = (n, cls) => `<span class="dot ${cls}"></span>`.repeat(n);
function dotsHint(a, b) {
  return `${dots(a, 'a')}<span class="dot-gap">＋</span>${dots(b, 'b')}`;
}
// ひきざん用：a こ の ● から b こ に × をつける
function takeAwayHint(a, b) {
  return `${dots(a - b, 'a')}${dots(b, 'a gone')}`;
}

// ===== かずを かぞえる問題用の絵（仮素材） =====
const COUNT_ITEMS = {
  apple: `<path d="M20 12c-4-3-14-2-14 9 0 9 7 15 14 12 7 3 14-3 14-12 0-11-10-12-14-9z" fill="#FF5A5A" stroke="#2B2B45" stroke-width="2.5"/>
          <path d="M20 12q1-5 4-7" stroke="#2B2B45" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M22 9q6-5 10 0q-5 4-10 0z" fill="#5FD068" stroke="#2B2B45" stroke-width="2"/>`,
  star: `<path d="M20 3l5 10.5 11.5 1.5-8.5 8 2 11.5L20 29l-10 5.5 2-11.5-8.5-8L15 13.5z" fill="#FFC93C" stroke="#2B2B45" stroke-width="2.5" stroke-linejoin="round"/>`,
  fish: `<path d="M30 20l8-7v14z" fill="#3EC1F3" stroke="#2B2B45" stroke-width="2.5" stroke-linejoin="round"/>
         <ellipse cx="18" cy="20" rx="14" ry="10" fill="#3EC1F3" stroke="#2B2B45" stroke-width="2.5"/>
         <circle cx="11" cy="18" r="2.2" fill="#2B2B45"/>`,
  flower: `<g fill="#FF7FA0" stroke="#2B2B45" stroke-width="2">
             <circle cx="20" cy="11" r="7"/><circle cx="28.6" cy="17.2" r="7"/><circle cx="25.3" cy="27.3" r="7"/>
             <circle cx="14.7" cy="27.3" r="7"/><circle cx="11.4" cy="17.2" r="7"/>
           </g>
           <circle cx="20" cy="20" r="6" fill="#FFC93C" stroke="#2B2B45" stroke-width="2"/>`,
};
const COUNT_TYPES = Object.keys(COUNT_ITEMS);

// 絵を5こずつの列にならべる（「5と あと いくつ」で数えやすくするため）
function countItemsHTML(n, type) {
  let html = '';
  for (let row = 0; row < n; row += 5) {
    html += '<span class="count-row">';
    for (let i = row; i < Math.min(row + 5, n); i++) {
      html += `<span class="count-item" style="animation-delay:${i * 50}ms">
        <svg viewBox="0 0 40 40" aria-hidden="true">${COUNT_ITEMS[type]}</svg>
        <span class="num">${i + 1}</span></span>`;
    }
    html += '</span>';
  }
  return `<span class="count-items">${html}</span>`;
}

function makeCountQuestion(min, max) {
  const n = rand(min, max);
  const type = COUNT_TYPES[rand(0, COUNT_TYPES.length - 1)];
  return { a: n, b: type, op: 'count', answer: n };
}

// ===== レベル定義 =====
// grade: 0 は「にゅうがく まえ」
// render(q): 式のかわりに絵などを出したいときに使う / eq: 「=」のかわりに出す文字
// make(): 問題を1つ作る / hint(q): まちがえたときに出すヒント
// targetSec: 10もんの もくひょうタイム(秒) / targetCount: 5ふんの もくひょう問題数
const LEVELS = [
  {
    id: 'k-count5',
    grade: 0,
    title: 'かぞえよう 1〜5',
    sample: 'りんごが 3こ → 3',
    color: '#FF7FA0',
    targetSec: 40,
    targetCount: 60,
    eq: 'いくつ？',
    make() { return makeCountQuestion(1, 5); },
    render(q) { return countItemsHTML(q.a, q.b); },
    hint() { return 'ゆびで さしながら かぞえてみよう'; },
  },
  {
    id: 'k-count10',
    grade: 0,
    title: 'かぞえよう 1〜10',
    sample: 'ほしが 7こ → 7',
    color: '#FF9F6B',
    targetSec: 60,
    targetCount: 45,
    eq: 'いくつ？',
    make() { return makeCountQuestion(1, 10); },
    render(q) { return countItemsHTML(q.a, q.b); },
    hint() { return '5 の まとまりを みつけて、ゆびで さしながら かぞえよう'; },
  },
  {
    id: 'g1-add10',
    grade: 1,
    title: '10までの たしざん',
    sample: '5 + 3',
    color: '#3EC1F3',
    targetSec: 60,
    targetCount: 50,
    make() {
      const a = rand(1, 9);
      const b = rand(1, 10 - a);
      return { a, b, op: '+', answer: a + b };
    },
    hint(q) { return dotsHint(q.a, q.b); },
  },
  {
    id: 'g1-carry',
    grade: 1,
    title: 'くりあがりの たしざん',
    sample: '8 + 5',
    color: '#FF8A3D',
    targetSec: 90,
    targetCount: 35,
    make() {
      const a = rand(2, 9);
      const b = rand(11 - a, 9); // こたえが 11〜18 になる
      return { a, b, op: '+', answer: a + b };
    },
    hint(q) {
      const need = 10 - q.a;
      const rest = q.b - need;
      return `${q.a} は あと <b>${need}</b> で 10。 ${q.b} を <b>${need}</b> と <b>${rest}</b> に わけよう`;
    },
  },
  {
    id: 'g1-sub10',
    grade: 1,
    title: '10までの ひきざん',
    sample: '8 − 5',
    color: '#3CC75A',
    targetSec: 60,
    targetCount: 45,
    make() {
      const a = rand(2, 10);
      const b = rand(1, a); // こたえが 0 になることもある
      return { a, b, op: '−', answer: a - b };
    },
    hint(q) { return takeAwayHint(q.a, q.b); },
  },
  {
    id: 'g1-borrow',
    grade: 1,
    title: 'くりさがりの ひきざん',
    sample: '13 − 7',
    color: '#B46CFF',
    targetSec: 90,
    targetCount: 30,
    make() {
      const a = rand(11, 18);
      const b = rand(a - 9, 9); // 一の位どうしでは ひけない組み合わせ
      return { a, b, op: '−', answer: a - b };
    },
    hint(q) {
      const ones = q.a - 10;
      return `${q.a} を 10 と <b>${ones}</b> に わけよう。 10 − ${q.b} を して、 <b>${ones}</b> を たそう`;
    },
  },
];

// 5ふん チャレンジ用：直前に出た問題と かぶらないように1問つくる
function makeNextQuestion(level, recent) {
  let q;
  for (let i = 0; i < 30; i++) {
    q = level.make();
    if (!recent.includes(`${q.a}${q.op}${q.b}`)) break;
  }
  return q;
}

// 同じ問題が続かないように10問つくる
function makeQuestions(level) {
  const list = [];
  const seen = new Set();
  let guard = 0;
  while (list.length < QUESTIONS_PER_PLAY) {
    const q = level.make();
    const key = `${q.a}${q.op}${q.b}`;
    if (!seen.has(key) || guard++ > 200) {
      seen.add(key);
      list.push(q);
    }
  }
  return list;
}

/* ===== 記録の保存（タブレットのブラウザ内に保存） ===== */
// mode: 'ten'（10もん）/ 'time'（5ふん）で別々に記録する
const bestKey = (mode, levelId) => (mode === 'time' ? 'best-5min:' : 'best:') + levelId;
function loadBest(mode, levelId) {
  try { return JSON.parse(localStorage.getItem(bestKey(mode, levelId))); } catch { return null; }
}
function saveBest(mode, levelId, rec) {
  try { localStorage.setItem(bestKey(mode, levelId), JSON.stringify(rec)); } catch { /* 保存できなくても遊べる */ }
}
function loadMode() {
  try { return localStorage.getItem('mode') === 'time' ? 'time' : 'ten'; } catch { return 'ten'; }
}
function saveMode(mode) {
  try { localStorage.setItem('mode', mode); } catch { /* 無視 */ }
}

const gradeLabel = (lv) => (lv.grade === 0 ? 'にゅうがく まえ' : `${lv.grade}ねんせい`);

const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/* =========================================================
   パーフェクト用「キュイキュイキュイン！」（ファミコン風）
   お手本の音声を分析した形に合わせています：
   - 音色：矩形波（ファミコンの電子音）
   - 高さ：約1960〜2660Hzのあいだを3回上下（キュイ・キュイ・キュイ）
   - 最後：2667Hzで止めて伸ばし（イーン）、1.1秒で消える
   ========================================================= */
const KYUIN_PITCH = [
  // [何秒後, 高さHz]
  [0.00, 2480], [0.09, 1960], [0.17, 2660],
  [0.25, 1970], [0.34, 2660], [0.42, 1960], [0.50, 2667],
];

function kyuinVoice(ac, dest, t) {
  const o = ac.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(KYUIN_PITCH[0][1], t);
  KYUIN_PITCH.slice(1).forEach(([sec, hz]) => o.frequency.linearRampToValueAtTime(hz, t + sec));

  // 耳に痛くならないよう、高すぎる成分を少しけずる
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 9000;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  g.gain.setValueAtTime(0.12, t + 0.58);
  g.gain.exponentialRampToValueAtTime(0.006, t + 1.1);
  g.gain.linearRampToValueAtTime(0.0001, t + 1.14);

  o.connect(filter);
  filter.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + 1.15);
}

/* =========================================================
   サウンド（仮素材：ブラウザの機能で音を合成しています）
   本物の効果音ファイルに差し替えるときはここを変更します
   ========================================================= */
const Sound = (() => {
  let ctx = null;
  let master = null;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function tone(freq, when, dur, { type = 'sine', vol = 0.2, slide = null } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(when, dur, vol) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
  }

  function sparkle(n, start = 0) {
    for (let i = 0; i < n; i++) tone(midi(rand(86, 100)), start + i * 0.045, 0.14, { vol: 0.07 });
  }

  return {
    unlock,
    tap() { tone(1046, 0, 0.07, { type: 'triangle', vol: 0.18 }); },
    erase() { tone(520, 0, 0.08, { type: 'triangle', vol: 0.12, slide: 330 }); },
    // 連続正解するほど音が高くなる
    correct(combo) {
      const base = 72 + Math.min(combo - 1, 12);
      [0, 4, 7, 12].forEach((s, i) => {
        tone(midi(base + s), i * 0.065, 0.2, { type: 'square', vol: 0.07 });
        tone(midi(base + s), i * 0.065, 0.25, { type: 'sine', vol: 0.14 });
      });
      if (combo >= 4) sparkle(6, 0.28);
    },
    boom() {
      noise(0, 0.55, 0.45);
      tone(140, 0, 0.45, { vol: 0.4, slide: 40 });
    },
    wrong() {
      tone(330, 0, 0.14, { type: 'square', vol: 0.07 });
      tone(247, 0.15, 0.3, { type: 'square', vol: 0.07 });
    },
    count() { tone(midi(76), 0, 0.16, { type: 'square', vol: 0.09 }); },
    tick() { tone(midi(93), 0, 0.05, { type: 'square', vol: 0.06 }); },
    timeup() {
      tone(midi(84), 0, 0.12, { type: 'square', vol: 0.1 });
      tone(midi(84), 0.16, 0.12, { type: 'square', vol: 0.1 });
      tone(midi(79), 0.34, 0.6, { type: 'square', vol: 0.1 });
    },
    go() { tone(midi(88), 0, 0.45, { type: 'square', vol: 0.1 }); sparkle(4, 0.05); },
    fanfare() {
      const seq = [[72, 0, 0.12], [72, 0.13, 0.12], [72, 0.26, 0.12], [76, 0.4, 0.35], [74, 0.8, 0.12], [76, 0.93, 0.12], [79, 1.06, 0.8]];
      seq.forEach(([n, t, d]) => {
        tone(midi(n), t, d, { type: 'square', vol: 0.08 });
        tone(midi(n - 12), t, d, { type: 'triangle', vol: 0.12 });
      });
    },
    star(i) { tone(midi(84 + i * 4), 0, 0.35, { vol: 0.2 }); sparkle(4, 0.05); },
    kyuin() {
      if (!ctx) return;
      kyuinVoice(ctx, master, ctx.currentTime);
    },
  };
})();

/* =========================================================
   紙ふぶき・ハート・星・花の演出（canvas に描画）
   ========================================================= */
const FX = (() => {
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  const COLORS = ['#FF4F8B', '#FFC93C', '#3EC1F3', '#5FD068', '#B46CFF', '#FF8A3D'];
  const SHAPES = ['rect', 'rect', 'circle', 'star', 'heart', 'flower'];
  let parts = [];
  let W = 0, H = 0;
  let running = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function particle(x, y, vx, vy, sizeMax) {
    return {
      kind: 'p', x, y, vx, vy,
      g: 0.22, drag: 0.975,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      size: 7 + Math.random() * sizeMax,
      color: pick(COLORS), shape: pick(SHAPES),
      life: 0, max: 70 + Math.random() * 60,
    };
  }

  // tier: 1(ふつう) 〜 3(すごく派手)
  function burst(x, y, tier) {
    const n = [0, 45, 100, 170][tier];
    const power = [0, 9, 13, 17][tier];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * power;
      parts.push(particle(x, y, Math.cos(a) * s, Math.sin(a) * s - 3, 6 + tier * 4));
    }
    for (let i = 0; i < tier; i++) {
      parts.push({ kind: 'ring', x, y, r: 10, vr: 7 + i * 4, color: pick(COLORS), life: 0, max: 32 });
    }
    if (tier >= 3) {
      // 画面の左下・右下から紙ふぶきキャノン
      for (let i = 0; i < 70; i++) {
        const s = 14 + Math.random() * 12;
        const aL = -Math.PI / 2 + 0.25 + Math.random() * 0.5;
        const aR = -Math.PI / 2 - 0.25 - Math.random() * 0.5;
        parts.push(particle(0, H, Math.cos(aL) * s, Math.sin(aL) * s, 12));
        parts.push(particle(W, H, Math.cos(aR) * s, Math.sin(aR) * s, 12));
      }
    }
    start();
  }

  // 上から紙ふぶきが降ってくる（けっか画面用）
  function rain(n) {
    for (let i = 0; i < n; i++) {
      const p = particle(Math.random() * W, -20 - Math.random() * H * 0.8, (Math.random() - 0.5) * 2, 2 + Math.random() * 3, 10);
      p.g = 0.05; p.drag = 0.99; p.max = 260;
      parts.push(p);
    }
    start();
  }

  function drawShape(p) {
    ctx.fillStyle = p.color;
    const s = p.size;
    switch (p.shape) {
      case 'rect':
        ctx.fillRect(-s / 2, -s / 4, s, s / 2);
        break;
      case 'circle':
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'star':
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? s * 0.25 : s * 0.6;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        break;
      case 'heart':
        ctx.beginPath();
        ctx.moveTo(0, s * 0.35);
        ctx.bezierCurveTo(-s * 0.9, -s * 0.2, -s * 0.35, -s * 0.8, 0, -s * 0.3);
        ctx.bezierCurveTo(s * 0.35, -s * 0.8, s * 0.9, -s * 0.2, 0, s * 0.35);
        ctx.fill();
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35, s * 0.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#FFF4B0';
        ctx.beginPath(); ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2); ctx.fill();
        break;
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.life < p.max);
    for (const p of parts) {
      p.life++;
      const fade = Math.min(1, (p.max - p.life) / 20);
      ctx.globalAlpha = Math.max(0, fade);
      if (p.kind === 'ring') {
        p.r += p.vr; p.vr *= 0.93;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 8 * fade;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        continue;
      }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      drawShape(p);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(loop);
    else running = false;
  }

  function start() {
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  return { burst, rain };
})();

/* =========================================================
   キャラクター（仮素材）
   ========================================================= */
function mascotSVG() {
  return `
  <svg class="mascot" viewBox="0 0 120 124" aria-hidden="true">
    <ellipse cx="60" cy="118" rx="30" ry="5" fill="rgba(0,0,0,.18)"/>
    <line x1="60" y1="22" x2="60" y2="8" stroke="#2B2B45" stroke-width="4" stroke-linecap="round"/>
    <path d="M60 -2 l3.5 7 7.5 1 -5.5 5.2 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.2 7.5 -1z" fill="#FFC93C" stroke="#2B2B45" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse class="m-arm m-arm-l" cx="16" cy="72" rx="11" ry="7" fill="#FFB43C" stroke="#2B2B45" stroke-width="4"/>
    <ellipse class="m-arm m-arm-r" cx="104" cy="72" rx="11" ry="7" fill="#FFB43C" stroke="#2B2B45" stroke-width="4"/>
    <circle cx="60" cy="66" r="44" fill="#FFB43C" stroke="#2B2B45" stroke-width="4"/>
    <ellipse cx="46" cy="40" rx="12" ry="7" fill="#fff" opacity=".45" transform="rotate(-25 46 40)"/>
    <circle cx="32" cy="78" r="7" fill="#FF7FA0" opacity=".75"/>
    <circle cx="88" cy="78" r="7" fill="#FF7FA0" opacity=".75"/>
    <g class="e-normal" fill="#2B2B45">
      <circle cx="44" cy="62" r="6.5"/><circle cx="76" cy="62" r="6.5"/>
      <circle cx="46" cy="60" r="2" fill="#fff"/><circle cx="78" cy="60" r="2" fill="#fff"/>
    </g>
    <g class="e-happy" fill="none" stroke="#2B2B45" stroke-width="4.5" stroke-linecap="round">
      <path d="M37 64 Q44 53 51 64"/><path d="M69 64 Q76 53 83 64"/>
    </g>
    <g class="e-sad" fill="none" stroke="#2B2B45" stroke-width="4.5" stroke-linecap="round">
      <path d="M37 59 Q44 66 51 62"/><path d="M69 62 Q76 66 83 59"/>
    </g>
    <path class="m-normal" d="M52 80 Q60 87 68 80" fill="none" stroke="#2B2B45" stroke-width="4" stroke-linecap="round"/>
    <path class="m-happy" d="M47 77 Q60 98 73 77 Z" fill="#8A2C3B" stroke="#2B2B45" stroke-width="4" stroke-linejoin="round"/>
    <path class="m-sad" d="M52 86 Q60 79 68 86" fill="none" stroke="#2B2B45" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

/* =========================================================
   画面とゲームの進行
   ========================================================= */
const $ = (id) => document.getElementById(id);

const el = {
  levelList: $('level-list'),
  qno: $('qno'),
  progress: $('progress-bar'),
  timer: $('timer'),
  mascot: $('game-mascot'),
  combo: $('combo'),
  card: $('card'),
  levelName: $('level-name'),
  expr: $('expr'),
  exprWrap: $('expr-wrap'),
  eq: $('eq'),
  boxes: $('answer-boxes'),
  maru: $('maru'),
  hint: $('hint'),
  pad: $('pad'),
  countdown: $('countdown'),
  praise: $('praise'),
  flash: $('flash'),
  rays: $('rays'),
};

const state = {
  mode: loadMode(), // 'ten'＝10もん チャレンジ / 'time'＝5ふん チャレンジ
  level: null,
  questions: [],
  index: 0,
  input: [],
  locked: true,
  combo: 0,
  maxCombo: 0,
  correct: 0,
  firstTry: 0,
  missThisQ: 0,
  totalMiss: 0,
  startTime: 0,
  timerId: null,
  lastTickSec: null,
  timeouts: [],
};

const isTimeMode = () => state.mode === 'time';

// 画面を切り替えたときに、動いている予約処理をまとめて止められるようにする
function later(fn, ms) {
  const id = setTimeout(fn, ms);
  state.timeouts.push(id);
  return id;
}
function clearLater() {
  state.timeouts.forEach(clearTimeout);
  state.timeouts = [];
}

// CSSアニメーションを最初からもう一度再生する
function replay(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
}

function setMascot(wrap, face, move) {
  wrap.classList.remove('face-happy', 'face-sad', 'idle', 'jump', 'dance', 'droop');
  if (face !== 'normal') wrap.classList.add('face-' + face);
  void wrap.offsetWidth;
  wrap.classList.add(move || 'idle');
}

/* ----- スタート画面 ----- */
function bestText(lv) {
  const best = loadBest(state.mode, lv.id);
  if (!best) return 'まだ あそんで ないよ';
  const stars = '★'.repeat(best.stars);
  return isTimeMode() ? `ベスト ${best.count}もん　${stars}` : `ベスト ${fmtTime(best.time)}　${stars}`;
}

function renderLevels() {
  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.classList.toggle('selected', b.dataset.mode === state.mode);
  });
  el.levelList.innerHTML = '';
  LEVELS.forEach((lv) => {
    const btn = document.createElement('button');
    btn.className = 'level-card';
    btn.style.setProperty('--c', lv.color);
    btn.innerHTML = `
      <span class="lv-grade">${gradeLabel(lv)}</span>
      <span class="lv-title">${lv.title}</span>
      <span class="lv-sample">れい： ${lv.sample}</span>
      <span class="lv-best">${bestText(lv)}</span>`;
    btn.addEventListener('click', () => {
      Sound.unlock(); // iPad は「タップしたとき」でないと音が出せないため、ここで準備する
      Sound.tap();
      startLevel(lv);
    });
    el.levelList.appendChild(btn);
  });
}

/* ----- ゲーム開始 ----- */
function startLevel(level) {
  clearLater();
  stopTimer();
  Object.assign(state, {
    level,
    questions: isTimeMode() ? [level.make()] : makeQuestions(level),
    index: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    firstTry: 0,
    totalMiss: 0,
    lastTickSec: null,
    locked: true,
  });
  el.levelName.textContent = `${gradeLabel(level)} ・ ${level.title}`;
  el.combo.textContent = '';
  el.timer.textContent = isTimeMode() ? fmtTime(TIME_LIMIT_SEC) : '0:00';
  el.timer.parentElement.classList.remove('hurry');
  el.progress.classList.toggle('time', isTimeMode());
  el.rays.className = '';
  showScreen('game');
  showQuestion();
  if (isTimeMode()) el.progress.style.width = '100%';
  el.pad.classList.add('locked');
  runCountdown(() => {
    el.pad.classList.remove('locked');
    state.locked = false;
    startTimer();
  });
}

function runCountdown(done) {
  const steps = ['3', '2', '1', 'スタート！'];
  el.countdown.classList.add('show');
  steps.forEach((txt, i) => {
    later(() => {
      el.countdown.innerHTML = `<span>${txt}</span>`;
      if (i < 3) Sound.count(); else Sound.go();
    }, i * 700);
  });
  later(() => {
    el.countdown.classList.remove('show');
    el.countdown.innerHTML = '';
    done();
  }, steps.length * 700 - 100);
}

function startTimer() {
  state.startTime = performance.now();
  state.timerId = setInterval(tickTimer, 200);
}
function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}
const elapsedSec = () => (performance.now() - state.startTime) / 1000;

function tickTimer() {
  if (!isTimeMode()) {
    el.timer.textContent = fmtTime(elapsedSec());
    return;
  }
  // 5ふん チャレンジ：のこり時間を表示する
  const left = Math.max(0, TIME_LIMIT_SEC - elapsedSec());
  const sec = Math.ceil(left);
  el.timer.textContent = fmtTime(sec);
  el.progress.style.width = `${(left / TIME_LIMIT_SEC) * 100}%`;
  if (sec <= HURRY_SEC && sec > 0 && sec !== state.lastTickSec) {
    state.lastTickSec = sec;
    el.timer.parentElement.classList.add('hurry');
    Sound.tick();
  }
  if (left <= 0) timeUp();
}

function timeUp() {
  stopTimer();
  clearLater(); // 次の問題へ進む予約などを止める
  state.locked = true;
  el.pad.classList.add('locked');
  el.rays.className = '';
  el.timer.parentElement.classList.remove('hurry');
  el.countdown.innerHTML = '<span class="timeup">タイムアップ！</span>';
  el.countdown.classList.add('show');
  Sound.timeup();
  later(() => {
    el.countdown.classList.remove('show');
    el.countdown.innerHTML = '';
    el.pad.classList.remove('locked');
    finish();
  }, 1800);
}

/* ----- 問題の表示 ----- */
function currentQ() { return state.questions[state.index]; }

function showQuestion() {
  const q = currentQ();
  state.input = [];
  state.missThisQ = 0;
  if (isTimeMode()) {
    el.qno.innerHTML = `${state.index + 1}<small> もんめ</small>`;
  } else {
    el.qno.innerHTML = `${state.index + 1}<small> / ${QUESTIONS_PER_PLAY}</small>`;
    el.progress.style.width = `${(state.index / QUESTIONS_PER_PLAY) * 100}%`;
  }
  const lv = state.level;
  if (lv.render) el.expr.innerHTML = lv.render(q);
  else el.expr.textContent = `${q.a} ${q.op} ${q.b}`;
  el.eq.textContent = lv.eq || '=';
  el.exprWrap.classList.toggle('counting', !!lv.render);
  el.card.classList.remove('hinted');
  el.boxes.innerHTML = '';
  String(q.answer).split('').forEach(() => {
    const b = document.createElement('span');
    b.className = 'box';
    el.boxes.appendChild(b);
  });
  el.maru.classList.remove('draw');
  el.hint.classList.remove('show');
  el.hint.innerHTML = '';
  updateBoxes();
  replay(el.card, 'slide-in');
  setMascot(el.mascot, 'normal');
}

function updateBoxes() {
  [...el.boxes.children].forEach((b, i) => {
    const v = state.input[i];
    b.classList.remove('current', 'filled', 'ok', 'ng');
    if (v !== undefined) {
      b.textContent = v;
      b.classList.add('filled');
    } else if (i === state.input.length) {
      b.textContent = '?';
      b.classList.add('current');
    } else {
      b.textContent = '';
    }
  });
}

/* ----- テンキー入力 ----- */
function onKey(key) {
  if (state.locked) return;
  const digits = el.boxes.children.length;
  if (key === 'del') {
    if (!state.input.length) return;
    state.input.pop();
    Sound.erase();
    updateBoxes();
    return;
  }
  if (state.input.length >= digits) return;
  state.input.push(key);
  Sound.tap();
  updateBoxes();
  replay(el.boxes.children[state.input.length - 1], 'pop');
  if (state.input.length === digits) {
    state.locked = true;
    later(judge, 150);
  }
}

function judge() {
  const value = Number(state.input.join(''));
  if (value === currentQ().answer) onCorrect();
  else onWrong();
}

const PRAISE = {
  1: ['せいかい！', 'いいね！', 'OK！', 'ピンポン！'],
  2: ['すごい！', 'やったね！', 'いいかんじ！', 'ばっちり！'],
  3: ['てんさい！', 'さいこう！', 'とまらない！', 'かみわざ！'],
};

// 正解してから次の問題までの待ち時間(ミリ秒)。5ふん チャレンジは時間が大事なので短め
const NEXT_WAIT = {
  ten: [0, 850, 1100, 1300],
  time: [0, 550, 700, 850],
};

function onCorrect() {
  state.combo++;
  state.correct++;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  if (state.missThisQ === 0) state.firstTry++;

  // 連続正解が増えるほど演出が派手になる
  const tier = state.combo >= 7 ? 3 : state.combo >= 4 ? 2 : 1;

  [...el.boxes.children].forEach((b) => b.classList.add('ok'));
  replay(el.maru, 'draw');

  if (isTimeMode()) {
    // 5ふん チャレンジ：10れんぞく・20れんぞく…のたびに キュイン！
    if (state.combo % 10 === 0) {
      celebrateKyuin(`${state.combo}れんぞく！`, 1500);
      return;
    }
  } else {
    el.progress.style.width = `${((state.index + 1) / QUESTIONS_PER_PLAY) * 100}%`;
    // 10問すべて一発正解（パーフェクト）なら、最後の1問は特別演出
    if (state.index === QUESTIONS_PER_PLAY - 1 && state.totalMiss === 0) {
      celebrateKyuin('パーフェクト！', 2300);
      return;
    }
  }

  Sound.correct(state.combo);
  setMascot(el.mascot, 'happy', tier >= 2 ? 'dance' : 'jump');

  const words = PRAISE[tier];
  el.praise.textContent = words[Math.floor(Math.random() * words.length)];
  el.praise.className = 'praise t' + tier;
  replay(el.praise, 'show');

  if (state.combo >= 2) {
    el.combo.textContent = `${state.combo} れんぞく！`;
    replay(el.combo, 'pop');
  }

  const r = el.card.getBoundingClientRect();
  FX.burst(r.left + r.width / 2, r.top + r.height / 2, tier);

  if (tier >= 2) el.rays.className = tier === 3 ? 'on gold' : 'on';
  if (tier === 3) {
    Sound.boom();
    replay(el.flash, 'go');
  }

  later(nextQuestion, NEXT_WAIT[state.mode][tier]);
}

// キュイン！の特別演出（パーフェクト・10れんぞくごと）
function celebrateKyuin(text, wait) {
  Sound.kyuin();
  setMascot(el.mascot, 'happy', 'dance');
  el.combo.textContent = `${state.combo} れんぞく！`;
  replay(el.combo, 'pop');
  el.praise.textContent = text;
  el.praise.className = 'praise perfect';
  replay(el.praise, 'show');
  el.rays.className = 'on gold';

  const r = el.card.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  // 光と紙ふぶきを3回つづけて出す
  [0, 350, 700].forEach((ms) => {
    later(() => {
      replay(el.flash, 'go');
      FX.burst(cx, cy, 3);
    }, ms);
  });
  later(nextQuestion, wait);
}

function onWrong() {
  state.combo = 0;
  state.missThisQ++;
  state.totalMiss++;
  el.combo.textContent = '';
  el.rays.className = '';
  [...el.boxes.children].forEach((b) => b.classList.add('ng'));
  replay(el.card, 'shake');
  Sound.wrong();
  setMascot(el.mascot, 'sad', 'droop');

  later(() => {
    state.input = [];
    updateBoxes();
    el.hint.innerHTML = state.level.hint(currentQ());
    el.hint.classList.add('show');
    el.card.classList.add('hinted'); // かぞえる問題では 絵に番号を出す
    setMascot(el.mascot, 'normal');
    state.locked = false;
  }, 700);
}

function nextQuestion() {
  state.index++;
  if (isTimeMode()) {
    const recent = state.questions.slice(-6).map((q) => `${q.a}${q.op}${q.b}`);
    state.questions.push(makeNextQuestion(state.level, recent));
  } else if (state.index >= QUESTIONS_PER_PLAY) {
    finish();
    return;
  }
  showQuestion();
  state.locked = false;
}

/* ----- けっか ----- */
function setStat(n, label, value) {
  $('r-l' + n).textContent = label;
  $('r-v' + n).textContent = value;
}

function finish() {
  stopTimer();
  state.locked = true;
  el.rays.className = '';
  const lv = state.level;

  let stars = 1;
  let isRecord;
  let title;

  if (isTimeMode()) {
    // 5ふん チャレンジ：正解した問題数で★を決める
    const count = state.correct;
    if (count >= lv.targetCount * 0.6) stars = 2;
    if (count >= lv.targetCount) stars = 3;
    const best = loadBest('time', lv.id);
    isRecord = count > 0 && (!best || count > best.count);
    if (isRecord) saveBest('time', lv.id, { count, stars });
    title = 'タイムアップ！';
    setStat(1, 'せいかい', `${count}もん`);
    setStat(2, 'いっぱつ せいかい', `${state.firstTry}もん`);
    setStat(3, 'さいだい れんぞく', state.maxCombo);
    setStat(4, 'もくひょう', `${lv.targetCount}もん`);
  } else {
    const time = elapsedSec();
    if (state.totalMiss <= 2 && time <= lv.targetSec * 1.5) stars = 2;
    if (state.totalMiss === 0 && time <= lv.targetSec) stars = 3;
    const best = loadBest('ten', lv.id);
    isRecord = !best || stars > best.stars || (stars === best.stars && time < best.time);
    if (isRecord) saveBest('ten', lv.id, { time, stars });
    title = state.totalMiss === 0 ? 'パーフェクト！' : 'おわり！';
    setStat(1, 'タイム', fmtTime(time));
    setStat(2, 'いっぱつ せいかい', `${state.firstTry} / ${QUESTIONS_PER_PLAY}`);
    setStat(3, 'さいだい れんぞく', state.maxCombo);
    setStat(4, 'もくひょう タイム', fmtTime(lv.targetSec));
  }

  document.querySelector('.result-title').textContent = title;
  $('new-record').classList.remove('show');
  const starEls = [...$('stars').children];
  starEls.forEach((s) => s.classList.remove('on'));

  showScreen('result');
  const resultMascot = document.querySelector('.result-mascot');
  setMascot(resultMascot, 'happy', 'dance');
  Sound.fanfare();
  FX.rain(120);

  for (let i = 0; i < stars; i++) {
    later(() => {
      starEls[i].classList.add('on');
      Sound.star(i);
      const r = starEls[i].getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, 1);
    }, 900 + i * 450);
  }
  if (isRecord) {
    later(() => {
      $('new-record').classList.add('show');
      Sound.boom();
      replay(el.flash, 'go');
    }, 900 + stars * 450 + 200);
  }
}

/* ----- ボタンの設定 ----- */
// テンキーは「指が触れた瞬間」に反応させる（click より速い）
el.pad.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('.key');
  if (!btn) return;
  e.preventDefault();
  Sound.unlock();
  btn.classList.add('pressed');
  onKey(btn.dataset.key);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
  el.pad.addEventListener(type, () => {
    el.pad.querySelectorAll('.pressed').forEach((b) => b.classList.remove('pressed'));
  });
});

// パソコンで試すとき用：キーボードでも入力できる
window.addEventListener('keydown', (e) => {
  if (!$('screen-game').classList.contains('active')) return;
  if (/^[0-9]$/.test(e.key)) onKey(e.key);
  else if (e.key === 'Backspace') onKey('del');
});

// モードの切りかえ（10もん / 5ふん）
document.querySelectorAll('.mode-btn').forEach((b) => {
  b.addEventListener('click', () => {
    Sound.unlock();
    Sound.tap();
    state.mode = b.dataset.mode;
    saveMode(state.mode);
    renderLevels();
  });
});

function goHome() {
  clearLater();
  stopTimer();
  state.locked = true;
  el.rays.className = '';
  el.countdown.classList.remove('show');
  el.pad.classList.remove('locked');
  renderLevels();
  showScreen('title');
}

$('btn-quit').addEventListener('click', () => {
  if (!confirm('やめて レベルえらびに もどる？')) return;
  goHome();
});

$('btn-retry').addEventListener('click', () => { Sound.tap(); startLevel(state.level); });
$('btn-home').addEventListener('click', () => { Sound.tap(); goHome(); });

/* ----- 起動 ----- */
document.querySelectorAll('.mascot-wrap').forEach((w) => { w.innerHTML = mascotSVG(); });
renderLevels();
