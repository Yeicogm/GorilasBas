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
const presentation = document.getElementById("presentation");
const startBtn = document.getElementById("startBtn");

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

// --- Presentación ---
startBtn.onclick = () => {
  presentation.style.display = "none";
  startGame();
};

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
  gorillas.push({ x: g1.x + g1.w / 2, y: g1.y, color: "#ff4081" });
  gorillas.push({ x: g2.x + g2.w / 2, y: g2.y, color: "#40c4ff" });
}

function updateTurnInfo() {
  turnInfo.textContent = `Turno del Jugador ${currentPlayer + 1}`;
  angleInput.value = 45;
  angleSlider.value = 45;
  velocityInput.value = 25;
  velocitySlider.value = 25;
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



function drawGorillas() {
  for (let i = 0; i < gorillas.length; i++) {
    let g = gorillas[i];
    ctx.save();
    ctx.translate(g.x, g.y - GORILLA_SIZE / 2);
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(0, 0, GORILLA_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    // Carita
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -2, 2, 0, Math.PI * 2);
    ctx.arc(4, -2, 2, 0, Math.PI * 2);
    ctx.fill();
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
      alert(`¡Jugador ${currentPlayer + 1} gana!`);
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
