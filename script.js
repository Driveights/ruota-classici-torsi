const canvas = document.getElementById("ruota");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("giraBtn");
const msg = document.getElementById("messaggio");

function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.9, 420);
  canvas.width = size;
  canvas.height = size;
  disegnaRuota();
}
window.addEventListener("resize", resizeCanvas);

// Premi
const premi = [
  { nome: "Sconto 10%" , probabilita: 0.4 },
  { nome: "Calice Gratis", probabilita: 0.2 },
  { nome: "Brindisi Speciale", probabilita: 0.2 },
  { nome: "Sconto 20%" , probabilita: 0.15 },
  { nome: "Super Premio 🍷", probabilita: 0.05 }
];

// Colori alternati
const colori = ["#FFD700", "#8B0000", "#228B22", "#1E90FF", "#FF4500"];

// Controllo giocata giornaliera
const oggi = new Date().toLocaleDateString();
if(localStorage.getItem("ultimaGiocata") === oggi){
  btn.disabled = true;
  msg.innerText = "Hai già giocato oggi, torna domani! 🍷";
}

// Disegno della ruota
function disegnaRuota(rotazione=0){
  const tot = premi.length;
  const angolo = (2*Math.PI)/tot;
  const raggio = canvas.width/2;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(raggio,raggio);
  ctx.rotate(rotazione);

  premi.forEach((p,i)=>{
    // Fetta
    const start = i*angolo;
    const end = (i+1)*angolo;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,raggio,start,end);
    ctx.closePath();

    // Colore con bordo
    ctx.fillStyle = colori[i % colori.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Testo nello spicchio
    const angoloCentrale = start + angolo/2;
    ctx.save();
    ctx.rotate(angoloCentrale);
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillStyle="white";
    ctx.font = `bold ${Math.floor(canvas.width/36)}px sans-serif`;

    // Ombra per leggibilità
    ctx.shadowColor="black";
    ctx.shadowBlur=6;
    ctx.shadowOffsetX=2;
    ctx.shadowOffsetY=2;

    ctx.fillText(p.nome, raggio*0.6, 0); 
    ctx.restore();
  });

  // Cerchio esterno decorativo
  ctx.beginPath();
  ctx.arc(0,0,raggio,0,2*Math.PI);
  ctx.lineWidth=8;
  ctx.strokeStyle="#333";
  ctx.stroke();

  // Logo centrale
  ctx.beginPath();
  ctx.arc(0,0,raggio*0.25,0,2*Math.PI);
  ctx.fillStyle="#fff";
  ctx.fill();
  ctx.strokeStyle="#8B0000";
  ctx.lineWidth=4;
  ctx.stroke();
  ctx.fillStyle="#8B0000";
  ctx.font=`bold ${Math.floor(raggio*0.2)}px serif`;
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("🍷",0,0);

  ctx.restore();

  // // Indicatore in alto
  // ctx.beginPath();
  // ctx.moveTo(raggio-18, 15);
  // ctx.lineTo(raggio+18, 15);
  // ctx.lineTo(raggio, 50);
  // ctx.closePath();
  // ctx.fillStyle="red";
  // ctx.fill();
  // ctx.strokeStyle="#333";
  // ctx.lineWidth=2;
  // ctx.stroke();
}

// Estrazione premio basata su probabilità
function estraiPremio(){
  let r=Math.random();
  let somma=0;
  for(let p of premi){
    somma+=p.probabilita;
    if(r<=somma) return p;
  }
  return premi[premi.length-1];
}

// Animazione rotazione
let girando=false;
btn.addEventListener("click",()=>{
  if(girando) return;
  if(localStorage.getItem("ultimaGiocata") === oggi){
    msg.innerText="Hai già giocato oggi, torna domani! 🍷";
    return;
  }

  girando=true;
  const premio = estraiPremio();
  const giri = 6; 
  const targetIndex = premi.indexOf(premio);
  const angoloPerPremio = (2*Math.PI)/premi.length;
  const angoloTarget = targetIndex*angoloPerPremio + angoloPerPremio/2;

  // Calcolo posizione finale (indicatore in alto)
  const rotFinale = giri*2*Math.PI + (2*Math.PI - angoloTarget); 
  const durata = 4500;
  const start = performance.now();

  function anima(t){
    const progresso = Math.min((t-start)/durata,1);
    const rot = rotFinale*easeOutCubic(progresso);
    disegnaRuota(rot);

    if(progresso<1) requestAnimationFrame(anima);
    else {
      girando=false;
      msg.innerText=`Hai vinto: ${premio.nome}! 🎉`;
      btn.disabled=true;
      localStorage.setItem("ultimaGiocata",oggi);
    }
  }
  requestAnimationFrame(anima);
});

function easeOutCubic(x){ return 1-Math.pow(1-x,3); }

resizeCanvas();
