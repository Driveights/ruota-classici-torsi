// Ruota a 3 spicchi con probabilità 60/20/20
const canvas = document.getElementById('ruota');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('giraBtn');
const msg = document.getElementById('messaggio');

// Segments in senso orario a partire dall'alto
const segments = [
  { label: 'Sei un Torso',        weight: 0.60, color: '#B30000' },
  { label: 'Il Classico Calice',  weight: 0.20, color: '#D4AF37' },
  { label: 'SpizziCantina',       weight: 0.20, color: '#5C1349' }
];

const TWO_PI = Math.PI * 2;
const INDICATOR_ANGLE = -Math.PI / 2; // indicatore in alto
let spinning = false;
let lastRotation = 0;

// HiDPI setup per canvas nitido
function setupHiDPI() {
  const dpr = window.devicePixelRatio || 1;
  const css = parseInt(getComputedStyle(canvas).width, 10) || 520;
  canvas.width = Math.floor(css * dpr);
  canvas.height = Math.floor(css * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupHiDPI();
window.addEventListener('resize', () => { setupHiDPI(); recalcGeometry(); drawWheel(lastRotation); });

// Geometria
let center = { x: 0, y: 0 }, radius = 0, segAngles = [];
function recalcGeometry() {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.width / dpr, cssH = canvas.height / dpr;
  center = { x: cssW / 2, y: cssH / 2 };
  radius = Math.min(center.x, center.y) - 10;
  buildAngles();
}

function buildAngles() {
  let start = 0;
  segAngles = segments.map(s => {
    const sweep = s.weight * TWO_PI;
    const record = { ...s, start, end: start + sweep, sweep };
    start += sweep;
    return record;
  });
}
recalcGeometry();

// Disegno ruota
function drawWheel(rotation = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation);

  // Disco base
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  const back = ctx.createRadialGradient(0, 0, radius * 0.05, 0, 0, radius);
  back.addColorStop(0, '#ffffff');
  back.addColorStop(1, '#f0e9db');
  ctx.fillStyle = back;
  ctx.fill();

  // Spicchi
  segAngles.forEach(s => {
    // riempimento spicchio
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

    // testo centrato sullo spicchio
    const mid = (s.start + s.end) / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '700 22px var(--brand-font, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif)';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    wrapText(ctx, s.label, radius * 0.60, 0, radius * 0.28, 24);
    ctx.restore();
  });

  // Anello interno
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.48, 0, TWO_PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.stroke();

  ctx.restore();
}

// Utilità colore (schiarisci/scurisci HEX)
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

// Testo a capo centrato
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

// Gating giornaliero opzionale (mantiene comportamento originario)
const todayKey = new Date().toLocaleDateString();
if (localStorage.getItem('ultimaGiocata') === todayKey) {
  btn.disabled = true;
  msg.textContent = 'Hai già giocato oggi, torna domani! 🍷';
}

// Animazione
btn.addEventListener('click', () => {
  if (spinning) return;
  if (localStorage.getItem('ultimaGiocata') === todayKey) return;

  spinning = true;
  msg.textContent = 'In bocca al lupo…';

  // rotazione finale uniforme (0..2π) => probabilità = ampiezza spicchi
  const extraTurns = 5 + Math.random() * 2; // 5-7 giri
  const finalOffset = Math.random() * TWO_PI;
  const target = lastRotation + extraTurns * TWO_PI + finalOffset;
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

      const pointerAngle = (INDICATOR_ANGLE - lastRotation + TWO_PI) % TWO_PI;
      const winner = segAngles.find(s => {
        const start = (s.start + TWO_PI) % TWO_PI;
        const end = (s.end + TWO_PI) % TWO_PI;
        return start < end ? (pointerAngle >= start && pointerAngle < end)
                           : (pointerAngle >= start || pointerAngle < end);
      });

      msg.textContent = `Hai vinto: ${winner.label}! 🎉`;
      btn.disabled = true;
      localStorage.setItem('ultimaGiocata', todayKey);
    }
  })(performance.now());
});

function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Disegno iniziale
drawWheel(lastRotation);
