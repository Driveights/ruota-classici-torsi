const canvas = document.getElementById("ruota");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("giraBtn");
const msg = document.getElementById("messaggio");

const premi = [
  { nome: "Sconto 10%", img: "assets/premio1.png", probabilita: 0.4 },
  { nome: "Calice Gratis", img: "assets/premio2.png", probabilita: 0.2 },
  { nome: "Brindisi Speciale", img: "assets/premio3.png", probabilita: 0.2 },
  { nome: "Sconto 20%", img: "assets/premio4.png", probabilita: 0.15 },
  { nome: "Super Premio 🍷", img: "assets/premio5.png", probabilita: 0.05 }
];

// Controllo giocata giornaliera
const oggi = new Date().toLocaleDateString();
if (localStorage.getItem("ultimaGiocata") === oggi) {
  btn.disabled = true;
  msg.innerText = "Hai già giocato oggi, torna domani! 🍷";
}

// Disegna ruota
function disegnaRuota(rotazione = 0) {
  const tot = premi.length;
  const angolo = (2 * Math.PI) / tot;

  ctx.save();
  ctx.clearRect(0, 0, 500, 500);
  ctx.translate(250, 250);
  ctx.rotate(rotazione);
  ctx.translate(-250, -250);

  premi.forEach((p, i) => {
    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 250, i * angolo, (i + 1) * angolo);
    ctx.fillStyle = i % 2 === 0 ? "#d4af37" : "#8b0000";
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(i * angolo + angolo / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(p.nome, 230, 10);
    ctx.restore();
  });

  ctx.restore();
}
disegnaRuota();

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

  const durata = 4000; // 4 secondi
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

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}