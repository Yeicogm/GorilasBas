// --- Frases del sol ---
const sunPhrases = [
  // Frases originales

  "¿Quién ganará esta vez?",
  "¡Buen lanzamiento!",
  "¡No me tapen, por favor!",
  "¡A ver si le das!",
  "¡No olvides el ángulo!",
  // Frases personalizadas del usuario
  "¿Has reiniciado el platano?",
  "¡Eso va a ser del cicutrino!",
  "¡Quizas si pones los numero de Mayusculas!",
  "¡Te voy a quizar un recuperable por eso!",
  "¡Esto lo ha echo una IA SEGURO!",
  "Las 12? Cafe?",
  "¡Disfruta de la playa!",
  "En serio eso es un mono?!",
  "¡En MS-DOS se veia mejor!",
  "Windows?! EN SERIO!",
];
let currentSunPhrase = null; // No mostrar frase al inicio
let sunHasSpoken = false;
// --- Variables globales ---

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let playerNames = ["David", "Abel"];

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

// Variables del sol
let sunX = null;
let sunY = null;
let sunRadius = null;

let buildings = [];
// Cada edificio tendrá un array de "agujeros" (círculos de destrucción)

let gorillas = [];
let currentPlayer = 0; // 0: jugador 1, 1: jugador 2
let banana = null;
let gameActive = false;
// Últimos valores de cada jugador (persistentes)
let lastAngles = [60, 60];
let lastForces = [18, 18];
// Cargar de localStorage si existen
try {
  const la = localStorage.getItem("gorilas_lastAngles");
  const lf = localStorage.getItem("gorilas_lastForces");
  sunHasSpoken = true; // Marcar que el sol ha hablado
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
  placeSun(); // Nueva posición aleatoria del sol al iniciar
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
  let count = Math.ceil(WIDTH / BUILDING_WIDTH);
  // Determinar los índices de los 3 edificios centrales
  let centralStart = Math.floor((count - 3) / 2);
  let centralEnd = centralStart + 2;
  for (let i = 0; i < count; i++) {
    let min = BUILDING_MIN;
    // Solo los 3 edificios centrales serán más altos
    if (i >= centralStart && i <= centralEnd) {
      min = BUILDING_MIN + 280; // Puedes ajustar este valor
    }
    let h = rand(min, BUILDING_MAX);
    buildings.push({ x, y: HEIGHT - h, w: BUILDING_WIDTH, h, holes: [] });
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

function placeSun() {
  // El sol estará en la parte superior, con margen a los lados
  sunRadius = 24; // Más pequeño
  const margin = 30 + sunRadius;
  sunX = Math.floor(Math.random() * (WIDTH - 2 * margin)) + margin;
  sunY = 38; // Siempre arriba
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
  drawSun();
  drawBuildings();
  drawGorillas();
  if (banana) drawBanana();
}

// Dibuja un sol pixel art en la esquina superior derecha
function drawSun() {
  if (sunX === null || sunY === null || sunRadius === null) placeSun();
  ctx.save();
  // Círculo principal
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe082";
  ctx.shadowColor = "#ffd54f";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Rayos
  ctx.strokeStyle = "#ffd54f";
  ctx.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    let angle = (i * Math.PI * 2) / 12;
    let x1 = sunX + Math.cos(angle) * (sunRadius + 6);
    let y1 = sunY + Math.sin(angle) * (sunRadius + 6);
    let x2 = sunX + Math.cos(angle) * (sunRadius + 16);
    let y2 = sunY + Math.sin(angle) * (sunRadius + 16);
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();
  }
  // Cara sonriente
  // Ojos
  ctx.beginPath();
  ctx.arc(sunX - 7, sunY - 5, 2.2, 0, Math.PI * 2);
  ctx.arc(sunX + 7, sunY - 5, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = "#333";
  ctx.fill();
  // Boca (arco)
  ctx.beginPath();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.arc(sunX, sunY + 2, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // --- Bocadillo tipo cómic ---
  if (sunHasSpoken && currentSunPhrase) {
    ctx.font = "bold 11px 'Press Start 2P', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let phrase = currentSunPhrase;
    if (phrase && phrase !== "null") {
      let padding = 12;
      let textWidth = ctx.measureText(phrase).width;
      let boxWidth = textWidth + padding * 2;
      let boxHeight = 38;
      // Determinar si el bocadillo se sale del canvas por la derecha
      let preferRight = true;
      let boxX = sunX + sunRadius + 18;
      let boxY = sunY - boxHeight / 2;
      if (boxX + boxWidth > WIDTH - 10) {
        // Si se sale, dibujar a la izquierda
        preferRight = false;
        boxX = sunX - sunRadius - 18 - boxWidth;
      }
      // Bocadillo
      ctx.save();
      ctx.beginPath();
      if (preferRight) {
        ctx.moveTo(boxX, boxY + boxHeight / 2);
        ctx.lineTo(boxX - 14, sunY + 6); // Puntero
        ctx.lineTo(boxX, boxY + boxHeight - 8);
        ctx.arcTo(
          boxX,
          boxY + boxHeight,
          boxX + boxWidth,
          boxY + boxHeight,
          12
        );
        ctx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth, boxY, 12);
        ctx.arcTo(boxX + boxWidth, boxY, boxX, boxY, 12);
        ctx.arcTo(boxX, boxY, boxX, boxY + boxHeight, 12);
      } else {
        ctx.moveTo(boxX + boxWidth, boxY + boxHeight / 2);
        ctx.lineTo(boxX + boxWidth + 14, sunY + 6); // Puntero a la derecha
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - 8);
        ctx.arcTo(
          boxX + boxWidth,
          boxY + boxHeight,
          boxX,
          boxY + boxHeight,
          12
        );
        ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY, 12);
        ctx.arcTo(boxX, boxY, boxX + boxWidth, boxY, 12);
        ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxHeight, 12);
      }
      ctx.closePath();
      ctx.fillStyle = "#fffbe9";
      ctx.globalAlpha = 0.92;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      // Frase
      ctx.fillStyle = "#333";
      ctx.fillText(phrase, boxX + padding, boxY + 10);
    }
  }
  ctx.restore();
}

function drawBuildings() {
  for (let b of buildings) {
    // Dibuja el edificio como un rectángulo base
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, b.y, b.w, b.h);
    // Recorta agujeros si existen
    for (let hole of b.holes) {
      ctx.moveTo(hole.x + hole.r, hole.y);
      ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fillStyle = "#888";
    ctx.fill("evenodd");
    ctx.restore();
    // Ventanas (solo si no hay agujero en esa zona)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        let wx = b.x + 8 + j * 20;
        let wy = b.y + 10 + i * 30;
        let ventanaTapada = false;
        for (let hole of b.holes) {
          let dx = wx + 5 - hole.x;
          let dy = wy + 8 - hole.y;
          if (Math.sqrt(dx * dx + dy * dy) < hole.r) {
            ventanaTapada = true;
            break;
          }
        }
        if (!ventanaTapada) {
          ctx.fillStyle = "#ffe082";
          ctx.fillRect(wx, wy, 10, 16);
        }
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
  ctx.arc(0, 0, BANANA_RADIUS, Math.PI * 0.2, Math.PI * 1.6);
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
  // Cambiar frase del sol en cada lanzamiento
  let nuevaFrase;
  do {
    nuevaFrase = sunPhrases[Math.floor(Math.random() * sunPhrases.length)];
  } while (nuevaFrase === currentSunPhrase && sunPhrases.length > 1);
  currentSunPhrase = nuevaFrase;
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
  // Identificar todos los edificios bajo gorilas
  let buildingsWithGorilla = [];
  for (let g of gorillas) {
    for (let b of buildings) {
      if (g.x >= b.x && g.x <= b.x + b.w) {
        if (!buildingsWithGorilla.includes(b)) buildingsWithGorilla.push(b);
      }
    }
  }
  // Con edificios (excepto los que tienen gorila encima)
  for (let b of buildings) {
    if (buildingsWithGorilla.includes(b)) continue;
    if (
      banana.x > b.x &&
      banana.x < b.x + b.w &&
      banana.y > b.y &&
      banana.y < b.y + b.h
    ) {
      // Reducir altura del edificio y ajustar posición
      let damage = 32; // cantidad de reducción por impacto
      if (b.h > damage) {
        b.h -= damage;
        b.y += damage;
      } else {
        // Si el edificio es muy pequeño, lo dejamos mínimo
        b.y += b.h - 10;
        b.h = 10;
      }
      playSound("explosion");
      ctx.save();
      ctx.beginPath();
      ctx.arc(banana.x, banana.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = "#ff5722aa";
      ctx.fill();
      ctx.restore();
      setTimeout(() => {
        banana = null;
        draw();
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
