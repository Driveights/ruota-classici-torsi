const canvas = document.getElementById("ruota");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("giraBtn");
const msg = document.getElementById("messaggio");

// PRELOAD immagini/fette (SVG o PNG)
const icone = [
  "assets/ape.svg",
  "assets/bianco.svg",
  "assets/rosso.svg",
  "assets/premio1.png",
  "assets/premio2.png"
];

const immagini = icone.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// Disabilita pulsante finché le immagini non sono caricate
let immaginiCaricate = 0;
immagini.forEach(img => {
  img.onload = () => {
    immaginiCaricate++;
    if (immaginiCaricate === immagini.length) {
      btn.disabled = false;
    }
  };
});
btn.disabled = true;

// Premi e probabilità
const premi = [
  { nome: "Sconto 10%", probabilita: 0.4 },
  { nome: "Calice Gratis", probabilita: 0.2 },
  { nome: "Brindisi Speciale", probabilita: 0.2 },
  { nome: "Sconto 20%", probabilita: 0.15 },
  { nome: "Super Premio 🍷", probabilita: 0.05 }
];

// Colori alternati
const colori = ["#FFD700", "#8B0000", "#228B22"];

// Controllo giocata giornaliera
const oggi = new Date().toLocaleDateString();
if (localStorage.getItem("ultimaGiocata") === oggi) {
  btn.disabled = true;
  msg.innerText = "Hai già giocato oggi, torna domani! 🍷";
}

// Resize canvas responsive
function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = size;
  canvas.height = size;
  disegnaRuota();
}
window.addEventListener("resize", resizeCanvas);

// Disegna ruota con colori, testo e icone
function disegnaRuota(rotazione = 0) {
  const tot = premi.length;
  const angolo = (2 * Math.PI) / tot;
  const raggio = canvas.width / 2;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(raggio, raggio);
  ctx.rotate(rotazione);
  ctx.translate(-raggio, -raggio);

  premi.forEach((p, i) => {
    // SEZIONE
    ctx.beginPath();
    ctx.moveTo(raggio, raggio);
    ctx.arc(raggio, raggio, raggio, i * angolo, (i + 1) * angolo);
    ctx.fillStyle = colori[i % colori.length];
    ctx.fill();
    ctx.stroke();

    // TESTO
    ctx.save();
    ctx.translate(raggio, raggio);
    ctx.rotate(i * angolo + angolo / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(canvas.width / 22)}px Arial`;
    ctx.fillText(p.nome, raggio - 40, 10);
    ctx.restore();

    // ICONA/SVG
    ctx.save();
    ctx.translate(raggio, raggio);
    ctx.rotate(i * angolo + angolo / 2);
    const dist = raggio * 0.65; // distanza dal centro
    const img = immagini[i];
    if (img.complete) {
      ctx.drawImage(img, dist - 15, -15, 30, 30);
    }
    ctx.restore();
  });

  ctx.restore();
}

// Estrazione casuale basata su probabilità
function estraiPremio() {
  let r = Math.random();
  let somma = 0;
  for (let p of premi) {
    somma += p.probabilita;
    if (r <= somma) return p;
  }
  return premi[premi.length - 1];
}

// Rotazione
let girando = false;
btn.addEventListener("click", () => {
  if (girando) return;

  if (localStorage.getItem("ultimaGiocata") === oggi) {
    msg.innerText = "Hai già giocato oggi, torna domani! 🍷";
    return;
  }

  girando = true;
  const premio = estraiPremio();
  const giri = 5; // giri completi
  const targetIndex = premi.indexOf(premio);
  const angoloPerPremio = (2 * Math.PI) / premi.length;
  const angoloTarget = targetIndex * angoloPerPremio + angoloPerPremio / 2;

  let rot = 0;
  const rotFinale = giri * 2 * Math.PI + angoloTarget;

  const durata = 4000;
  const start = performance.now();

  function anima(t) {
    const progresso = Math.min((t - start) / durata, 1);
    rot = rotFinale * easeOutCubic(progresso);
    disegnaRuota(rot);

    if (progresso < 1) {
      requestAnimationFrame(anima);
    } else {
      girando = false;
      msg.innerText = `Hai vinto: ${premio.nome}! 🎉`;
      btn.disabled = true;
      localStorage.setItem("ultimaGiocata", oggi);
    }
  }
  requestAnimationFrame(anima);
});

// easing
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

// Primo render
resizeCanvas();
