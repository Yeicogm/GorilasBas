// --- Variables globales ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const inputPanel = document.getElementById("inputPanel");
const angleInput = document.getElementById("angleInput");
const velocityInput = document.getElementById("velocityInput");
const angleSlider = document.getElementById("angleSlider");
const velocitySlider = document.getElementById("velocitySlider");
const throwBtn = document.getElementById("throwBtn");
const turnInfo = document.getElementById("turnInfo");
// Las variables de presentación y nombres se inicializan en window.onload
let player1NameInput, player2NameInput, startBtn, presentation;
// Nombres de jugadores (persistentes)
let playerNames = ["David", "Abel"];
try {
  const pn = localStorage.getItem("gorilas_playerNames");
  if (pn) playerNames = JSON.parse(pn);
} catch (e) {}

window.onload = function () {
  player1NameInput = document.getElementById("player1Name");
  player2NameInput = document.getElementById("player2Name");
  startBtn = document.getElementById("startBtn");
  presentation = document.getElementById("presentation");
  if (player1NameInput && player2NameInput) {
    player1NameInput.value = playerNames[0];
    player2NameInput.value = playerNames[1];
  }
  if (startBtn) {
    startBtn.onclick = () => {
      // Leer y guardar nombres
      if (player1NameInput && player2NameInput) {
        let n1 = player1NameInput.value.trim() || "Jugador 1";
        let n2 = player2NameInput.value.trim() || "Jugador 2";
        playerNames = [n1, n2];
        try {
          localStorage.setItem(
            "gorilas_playerNames",
            JSON.stringify(playerNames)
          );
        } catch (e) {}
      }
      if (presentation) presentation.style.display = "none";
      startGame();
    };
  }
};

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.5;
const BUILDING_MIN = 80;
const BUILDING_MAX = 220;
const BUILDING_WIDTH = 50;
const GORILLA_SIZE = 32;
const BANANA_RADIUS = 6;

let buildings = [];
let gorillas = [];
let currentPlayer = 0; // 0: jugador 1, 1: jugador 2
let banana = null;
let gameActive = false;
// Últimos valores de cada jugador (persistentes)
let lastAngles = [55, 55];
let lastForces = [20, 20];
// Cargar de localStorage si existen
try {
  const la = localStorage.getItem("gorilas_lastAngles");
  const lf = localStorage.getItem("gorilas_lastForces");
  if (la) lastAngles = JSON.parse(la);
  if (lf) lastForces = JSON.parse(lf);
} catch (e) {}

// --- Sonidos ---
const sounds = {
  throw: new Audio("sounds/throw.mp3"),
  explosion: new Audio("sounds/explosion.mp3"),
  win: new Audio("sounds/win.mp3"),
};

function playSound(name) {
  if (sounds[name]) {
    // Reinicia el sonido si ya está sonando
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// --- Inicialización del juego ---
function startGame() {
  generateBuildings();
  placeGorillas();
  currentPlayer = 0;
  banana = null;
  gameActive = true;
  inputPanel.classList.remove("hidden");
  updateTurnInfo();
  draw();
}

function generateBuildings() {
  buildings = [];
  let x = 0;
  while (x < WIDTH) {
    let h = rand(BUILDING_MIN, BUILDING_MAX);
    buildings.push({ x, y: HEIGHT - h, w: BUILDING_WIDTH, h });
    x += BUILDING_WIDTH;
  }
}

function placeGorillas() {
  // Uno en el 2º edificio, otro en el antepenúltimo
  gorillas = [];
  let g1 = buildings[1];
  let g2 = buildings[buildings.length - 2];
  // Levantar al gorila para que quede bien sobre el edificio
  const gorillaYOffset = GORILLA_SIZE * 0.7; // Ajusta este valor para que quede bien
  gorillas.push({
    x: g1.x + g1.w / 2,
    y: g1.y - gorillaYOffset,
    color: "#ff4081",
  });
  gorillas.push({
    x: g2.x + g2.w / 2,
    y: g2.y - gorillaYOffset,
    color: "#40c4ff",
  });
}

function updateTurnInfo() {
  turnInfo.textContent = `Turno de ${playerNames[currentPlayer]}`;
  angleInput.value = lastAngles[currentPlayer];
  angleSlider.value = lastAngles[currentPlayer];
  velocityInput.value = lastForces[currentPlayer];
  velocitySlider.value = lastForces[currentPlayer];
  angleInput.focus();
}

// Sincronización sliders <-> inputs
angleSlider.addEventListener("input", () => {
  angleInput.value = angleSlider.value;
});
angleInput.addEventListener("input", () => {
  let v = Math.max(0, Math.min(91, Number(angleInput.value)));
  angleInput.value = v;
  angleSlider.value = v;
});
velocitySlider.addEventListener("input", () => {
  velocityInput.value = velocitySlider.value;
});
velocityInput.addEventListener("input", () => {
  let v = Math.max(1, Math.min(35, Number(velocityInput.value)));
  velocityInput.value = v;
  velocitySlider.value = v;
});

// --- Dibujo ---
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBuildings();
  drawGorillas();
  if (banana) drawBanana();
}

function drawBuildings() {
  for (let b of buildings) {
    ctx.fillStyle = "#888";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // Ventanas
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = "#ffe082";
        ctx.fillRect(b.x + 8 + j * 20, b.y + 10 + i * 30, 10, 16);
      }
    }
  }
}

function drawGorillas() {
  for (let i = 0; i < gorillas.length; i++) {
    let g = gorillas[i];
    ctx.save();
    ctx.translate(g.x, g.y - GORILLA_SIZE / 2);
    // Cuerpo cuadrado
    ctx.fillStyle = g.color;
    ctx.fillRect(-13, 2, 26, 22);
    // Barriga clara
    ctx.fillStyle = "#ffe0b2";
    ctx.fillRect(-7, 12, 14, 10);
    // Cabeza cuadrada
    ctx.fillStyle = g.color;
    ctx.fillRect(-10, -16, 20, 18);
    // Cara clara
    ctx.fillStyle = "#ffe0b2";
    ctx.fillRect(-7, -10, 14, 10);
    // Ojos juntos
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-3, -6, 1.7, 0, Math.PI * 2);
    ctx.arc(3, -6, 1.7, 0, Math.PI * 2);
    ctx.fill();
    // Boca recta
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(3, -2);
    ctx.stroke();
    // Brazos levantados
    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-13, 6);
    ctx.lineTo(-20, -18);
    ctx.moveTo(13, 6);
    ctx.lineTo(20, -18);
    ctx.stroke();
    // Manos grandes
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(-20, -18, 5, 0, Math.PI * 2);
    ctx.arc(20, -18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Piernas cortas
    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-7, 24);
    ctx.lineTo(-7, 34);
    ctx.moveTo(7, 24);
    ctx.lineTo(7, 34);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
}

function drawBanana() {
  ctx.save();
  ctx.translate(banana.x, banana.y);
  ctx.rotate(banana.angle);
  ctx.fillStyle = "#ffeb3b";
  ctx.beginPath();
  ctx.arc(0, 0, BANANA_RADIUS, Math.PI * 0.2, Math.PI * 1.8);
  ctx.lineTo(0, 0);
  ctx.fill();
  ctx.restore();
}

// --- Lanzamiento ---
throwBtn.onclick = () => {
  if (!gameActive || banana) return;
  let angle = parseFloat(angleInput.value);
  let velocity = parseFloat(velocityInput.value);
  if (isNaN(angle) || isNaN(velocity))
    return alert("Introduce ángulo y velocidad válidos.");
  if (angle < 0 || angle > 91 || velocity < 1 || velocity > 35)
    return alert("Valores fuera de rango.");
  // Guardar el valor para el jugador actual
  lastAngles[currentPlayer] = angle;
  lastForces[currentPlayer] = velocity;
  // Guardar en localStorage
  try {
    localStorage.setItem("gorilas_lastAngles", JSON.stringify(lastAngles));
    localStorage.setItem("gorilas_lastForces", JSON.stringify(lastForces));
  } catch (e) {}
  playSound("throw");
  launchBanana(angle, velocity);
};

function launchBanana(angle, velocity) {
  // Ángulo en radianes
  let gorilla = gorillas[currentPlayer];
  let dir = currentPlayer === 0 ? 1 : -1;
  let rad = (angle * Math.PI) / 180;
  let vx = Math.cos(rad) * velocity * dir;
  let vy = -Math.sin(rad) * velocity;
  banana = {
    x: gorilla.x,
    y: gorilla.y - GORILLA_SIZE / 2,
    vx,
    vy,
    angle: 0,
  };
  inputPanel.classList.add("hidden");
  animateBanana();
}

function animateBanana() {
  if (!banana) return;
  // Animación más lenta: factor de velocidad
  let steps = 2; // Cuantos pasos pequeños por frame para suavidad
  let slowFactor = 0.35; // <1 = más lento
  for (let i = 0; i < steps; i++) {
    banana.x += (banana.vx * slowFactor) / steps;
    banana.y += (banana.vy * slowFactor) / steps;
    banana.vy += (GRAVITY * slowFactor) / steps;
    banana.angle += (0.2 * slowFactor) / steps;
    if (checkBananaCollision()) return;
    if (banana.x < 0 || banana.x > WIDTH || banana.y > HEIGHT) {
      // Falló
      banana = null;
      nextTurn();
      return;
    }
  }
  draw();
  requestAnimationFrame(animateBanana);
}

function checkBananaCollision() {
  // Con gorila rival
  let rival = gorillas[1 - currentPlayer];
  let dx = banana.x - rival.x;
  let dy = banana.y - (rival.y - GORILLA_SIZE / 2);
  if (Math.sqrt(dx * dx + dy * dy) < GORILLA_SIZE / 2 + BANANA_RADIUS) {
    playSound("win");
    draw();
    setTimeout(() => {
      alert(`¡${playerNames[currentPlayer]} gana!`);
      startGame();
    }, 100);
    banana = null;
    return true;
  }
  // Con edificios
  for (let b of buildings) {
    if (
      banana.x > b.x &&
      banana.x < b.x + b.w &&
      banana.y > b.y &&
      banana.y < b.y + b.h
    ) {
      // Explosión simple
      playSound("explosion");
      ctx.save();
      ctx.beginPath();
      ctx.arc(banana.x, banana.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = "#ff5722aa";
      ctx.fill();
      ctx.restore();
      setTimeout(() => {
        banana = null;
        nextTurn();
      }, 350);
      return true;
    }
  }
  return false;
}

function nextTurn() {
  currentPlayer = 1 - currentPlayer;
  inputPanel.classList.remove("hidden");
  updateTurnInfo();
  draw();
}

// --- Utilidades ---
function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// --- Iniciar con presentación ---
draw();
inputPanel.classList.add("hidden");
