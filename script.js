// Weighted wheel with equal-size slices + precise indicator alignment
const canvas = document.getElementById('ruota');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('giraBtn');
const msg = document.getElementById('messaggio');

// Segments (equal geometry; probabilities via weight)
const segments = [
  { label: 'Sei un Torso',        weight: 0.70, color: '#B30000' },
  { label: 'Il Classico Calice',  weight: 0.15, color: '#D4AF37' },
  { label: 'SpizziCantina',       weight: 0.15, color: '#72B01D' }
];

const TWO_PI = Math.PI * 2;
const INDICATOR_ANGLE = -Math.PI / 2; // 12 o'clock, arrow pointing down
let spinning = false;
let lastRotation = 0;

// HiDPI setup
function setupHiDPI() {
  const dpr = window.devicePixelRatio || 1;
  const css = parseInt(getComputedStyle(canvas).width, 10) || 520;
  canvas.width = Math.floor(css * dpr);
  canvas.height = Math.floor(css * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupHiDPI();
window.addEventListener('resize', () => { setupHiDPI(); recalcGeometry(); drawWheel(lastRotation); });

// Geometry
let center = { x: 0, y: 0 }, radius = 0, segAngles = [];
function recalcGeometry() {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.width / dpr, cssH = canvas.height / dpr;
  center = { x: cssW / 2, y: cssH / 2 };
  radius = Math.min(center.x, center.y) - 10;
  buildAnglesEqual();
}
function buildAnglesEqual() {
  // Build equal-size slices; weights are only for selection
  const n = segments.length;
  const sweep = TWO_PI / n;
  let start = 0;
  segAngles = segments.map(s => {
    const rec = { ...s, start, end: start + sweep, sweep };
    start += sweep;
    return rec;
  });
}
recalcGeometry();

// Drawing
function drawWheel(rotation = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation);

  // Base disc
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  const back = ctx.createRadialGradient(0, 0, radius * 0.05, 0, 0, radius);
  back.addColorStop(0, '#ffffff');
  back.addColorStop(1, '#f0e9db');
  ctx.fillStyle = back;
  ctx.fill();

  // Slices
  segAngles.forEach(s => {
    // slice fill
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.94, s.start, s.end);
    ctx.closePath();
    const band = ctx.createLinearGradient(0, -radius, 0, radius);
    band.addColorStop(0, shade(s.color, 18));
    band.addColorStop(1, shade(s.color, -6));
    ctx.fillStyle = band;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.stroke();

    // centered text (slightly larger)
    const mid = (s.start + s.end) / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '700 24px var(--brand-font, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif)';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    wrapText(ctx, s.label, radius * 0.60, 0, radius * 0.28, 26);
    ctx.restore();
  });

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.48, 0, TWO_PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.stroke();

  ctx.restore();
}

// Color helpers
function shade(hex, percent) {
  const f = parseInt(hex.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = Math.abs(percent) / 100,
        R = f >> 16,
        G = (f >> 8) & 255,
        B = f & 255;
  const to = c => Math.round((t - c) * p) + c;
  return '#' + (0x1000000 + (to(R) << 16) + (to(G) << 8) + to(B)).toString(16).slice(1);
}

// Centered line-wrapping
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (context.measureText(test).width > maxWidth && i > 0) {
      lines.push(line.trim());
      line = words[i] + ' ';
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => context.fillText(l, x, startY + i * lineHeight));
}

// Daily gating (same as before)
const todayKey = new Date().toLocaleDateString();
if (localStorage.getItem('ultimaGiocata') === todayKey) {
  btn.disabled = true;
  msg.textContent = 'Hai già giocato oggi, torna domani! 🍷';
}

// Weighted pick with precise alignment under the indicator
btn.addEventListener('click', () => {
  if (spinning) return;
  if (localStorage.getItem('ultimaGiocata') === todayKey) return;

  spinning = true;
  msg.textContent = 'In bocca al lupo…';

  // 1) choose winner by weight (probabilities)
  const winnerIdx = weightedPick(segments.map(s => s.weight));
  const winnerSeg = segAngles[winnerIdx];
  const winnerMid = (winnerSeg.start + winnerSeg.end) / 2;

  // 2) compute target rotation so winnerMid aligns exactly to indicator
  const extraTurns = 5 + Math.floor(Math.random() * 3); // 5,6,7 full spins
  const delta = normalizeAngle(INDICATOR_ANGLE - (winnerMid + lastRotation)); // exact alignment
  const target = lastRotation + extraTurns * TWO_PI + delta;

  // 3) animate
  const duration = 4200;
  const start = performance.now();

  (function anim(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = easeOutQuint(t);
    const rot = lerp(lastRotation, target, eased);
    drawWheel(rot);
    if (t < 1) requestAnimationFrame(anim);
    else {
      lastRotation = target % TWO_PI;
      spinning = false;
      msg.textContent = `Hai vinto: ${winnerSeg.label}! 🎉`;
      btn.disabled = true;
      localStorage.setItem('ultimaGiocata', todayKey);
    }
  })(performance.now());
});

// Helpers
function weightedPick(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1; // fallback
}
function normalizeAngle(a) { a %= TWO_PI; return a < 0 ? a + TWO_PI : a; }
function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Initial draw
drawWheel(lastRotation);
