// Ruota con 3 spicchi uguali; font Special Elite ovunque; indicatore: assets/indicatore.svg
const canvas = document.getElementById('ruota');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('giraBtn');
const msg = document.getElementById('messaggio');

const TWO_PI = Math.PI * 2;
const INDICATOR_ANGLE = -Math.PI / 2; // in alto

// Segmenti in senso orario a partire dall'alto (tutti uguali)
const segments = [
  { label: 'Sei un Torso',       color: '#B30000' },
  { label: 'Il Classico Calice', color: '#D4AF37' },
  { label: 'SpizziCantina',      color: '#5C1349' }
];

let spinning = false;
let lastRotation = 0;

// Font del canvas: usa Special Elite (come nel resto del sito)
const CANVAS_FONT = '700 22px \"Special Elite\", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'; // leggermente più grande

function setupHiDPI() {
  const dpr = window.devicePixelRatio || 1;
  const css = parseInt(getComputedStyle(canvas).width, 10) || 520;
  canvas.width = Math.floor(css * dpr);
  canvas.height = Math.floor(css * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupHiDPI();
window.addEventListener('resize', () => { setupHiDPI(); recalcGeometry(); drawWheel(lastRotation); });

let center = { x: 0, y: 0 }, radius = 0, segAngles = [];
function recalcGeometry() {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.width / dpr, cssH = canvas.height / dpr;
  center = { x: cssW / 2, y: cssH / 2 };
  radius = Math.min(center.x, center.y) - 8;

  const sweep = TWO_PI / segments.length;
  segAngles = segments.map((s, i) => {
    const start = i * sweep;
    return { ...s, start, end: start + sweep, sweep };
  });
}
recalcGeometry();

function drawWheel(rotation = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation);

  // Disco base
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Spicchi (uguali)
  segAngles.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.94, s.start, s.end);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.stroke();

    // Testo (Special Elite, più grande)
    const mid = (s.start + s.end) / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = CANVAS_FONT;
    wrapText(ctx, s.label, radius * 0.60, 0, radius * 0.28, 24); // maxWidth e interlinea maggiorati
    ctx.restore();
  });

  // Anello interno
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.50, 0, TWO_PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.stroke();

  ctx.restore();
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

// Giocata giornaliera (come prima)
const todayKey = new Date().toLocaleDateString();
if (localStorage.getItem('ultimaGiocata') === todayKey) {
  btn.disabled = true;
  msg.textContent = 'Hai già giocato oggi, torna domani!';
}

btn.addEventListener('click', () => {
  if (spinning) return;
  if (localStorage.getItem('ultimaGiocata') === todayKey) return;

  spinning = true;
  msg.textContent = '...';

  const extraTurns = 5 + Math.random() * 2;
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
        const startA = (s.start + TWO_PI) % TWO_PI;
        const endA = (s.end + TWO_PI) % TWO_PI;
        return startA < endA ? (pointerAngle >= startA && pointerAngle < endA)
                             : (pointerAngle >= startA || pointerAngle < endA);
      });

      if (winner.label === 'Sei un Torso') {
        msg.textContent = 'Sei un Torso';
      } else {
        msg.textContent = `Hai vinto: ${winner.label}!`;
      }
      btn.disabled = true;
      localStorage.setItem('ultimaGiocata', todayKey);
    }
  })(performance.now());
});

function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Assicura che il font Google sia caricato prima del primo disegno
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => drawWheel(lastRotation));
} else {
  setTimeout(() => drawWheel(lastRotation), 150);
}
