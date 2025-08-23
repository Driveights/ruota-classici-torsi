const canvas = document.getElementById("ruota");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("giraBtn");
const msg = document.getElementById("messaggio");

// Adatta canvas a mobile
function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = size;
  canvas.height = size;
  disegnaRuota();
}
window.addEventListener("resize", resizeCanvas);

// Premi della ruota
const premi = [
  { nome: "Sconto 10%" , probabilita: 0.4 },
  { nome: "Calice Gratis", probabilita: 0.2 },
  { nome: "Brindisi Speciale", probabilita: 0.2 },
  { nome: "Sconto 20%" , probabilita: 0.15 },
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

// Disegna ruota con testo esterno e font bello
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
    // Fetta
    ctx.beginPath();
    ctx.moveTo(raggio, raggio);
    ctx.arc(raggio, raggio, raggio, i * angolo, (i + 1) * angolo);
    ctx.fillStyle = colori[i % colori.length];
    ctx.fill();
    ctx.stroke();

    // Testo più bello e verso l’esterno
    ctx.save();
    ctx.translate(raggio, raggio);
    ctx.rotate(i * angolo + angolo / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(canvas.width / 20)}px "Fredoka One", cursive`;
    const distanzaDalCentro = raggio * 0.8; // più esterno
    ctx.fillText(p.nome, 0, -distanzaDalCentro);
    ctx.restore();
  });

  ctx.restore();
}

// Estrazione basata su probabilità
function estraiPremio() {
  let r = Math.random();
  let somma = 0;
  for (let p of premi) {
    somma += p.probabilita;
    if (r <= somma) return p;
  }
  return premi[premi.length - 1];
}

// Animazione rotazione
let girando = false;
btn.addEventListener("click", () => {
  if (girando) return;
  if (localStorage.getItem("ultimaGiocata") === oggi) {
    msg.innerText = "Hai già giocato oggi, torna domani! 🍷";
    return;
  }

  girando = true;
  const premio = estraiPremio();
  const giri = 5;
  const targetIndex = premi.indexOf(premio);
  const angoloPerPremio = (2 * Math.PI) / premi.length;
  const angoloTarget = targetIndex * angoloPerPremio + angoloPerPremio / 2;

  const rotFinale = giri * 2 * Math.PI + angoloTarget;
  const durata = 4000;
  const start = performance.now();

  function anima(t) {
    const progresso = Math.min((t - start) / durata, 1);
    const rot = rotFinale * easeOutCubic(progresso);
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

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

// Prima render
resizeCanvas();
