const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SETTINGS = {
  fov: Math.PI / 3,
  rays: 520,
  maxDepth: 22,
  moveSpeed: 2.6,
  turnSpeed: 2.35,
  secondsPerMaze: 60,
  totalMazes: 5
};

// Small handcrafted mazes. "1" = wall, "0" = walkable.
const MAZES = [
  [
    "111111111111111",
    "100000000000001",
    "101111011111101",
    "100001000001001",
    "111101011101101",
    "100001010100001",
    "101111010111101",
    "100000010000001",
    "101111111110101",
    "100000000000001",
    "111111111111111"
  ],
  [
    "111111111111111",
    "100000100000001",
    "101110101111101",
    "100010100000001",
    "101010111011101",
    "101000001010001",
    "101111101010101",
    "100000001000001",
    "111011111011101",
    "100000000000001",
    "111111111111111"
  ],
  [
    "111111111111111",
    "100000001000001",
    "101111101011101",
    "100000101000001",
    "111110101111101",
    "100010100000001",
    "101010111110101",
    "101000000010001",
    "101111111010101",
    "100000000000001",
    "111111111111111"
  ],
  [
    "111111111111111",
    "100000000000001",
    "101111111110101",
    "100000000010101",
    "111011111010101",
    "100010000010001",
    "101110111111101",
    "100000100000001",
    "101111101111101",
    "100000000000001",
    "111111111111111"
  ],
  [
    "111111111111111",
    "100000000000001",
    "101111111111101",
    "100000000000001",
    "111111101110101",
    "100000001010001",
    "101111101011101",
    "101000001000001",
    "101011111111101",
    "100000000000001",
    "111111111111111"
  ]
];

const START = { x: 1.5, y: 1.5, angle: 0 };
const EXIT = { x: 13.5, y: 9.5 };

let mazeIndex = 0;
let map = MAZES[0];
let player = { ...START };
let exit = { ...EXIT };

let playing = false;
let paused = false;
let timeLeft = SETTINGS.secondsPerMaze;
let last = performance.now();
let totalTime = 0;
let rafId = 0;

const keys = {};

const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const retryBtn = document.getElementById("retryBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const homeBtn1 = document.getElementById("homeBtn1");
const homeBtn2 = document.getElementById("homeBtn2");

const pauseOverlay = document.getElementById("pauseOverlay");
const timeUpOverlay = document.getElementById("timeUpOverlay");
const winOverlay = document.getElementById("winOverlay");

const levelText = document.getElementById("levelText");
const timerText = document.getElementById("timerText");
const finalStats = document.getElementById("finalStats");

function showScreen(screen) {
  menuScreen.classList.toggle("active", screen === "menu");
  gameScreen.classList.toggle("active", screen === "game");
}

function hideOverlays() {
  pauseOverlay.classList.add("hidden");
  timeUpOverlay.classList.add("hidden");
  winOverlay.classList.add("hidden");
}

function startGame() {
  mazeIndex = 0;
  totalTime = 0;
  loadMaze(0);
  hideOverlays();
  playing = true;
  paused = false;
  showScreen("game");
  last = performance.now();
}

function restartCurrentMaze() {
  loadMaze(mazeIndex);
  timeLeft = SETTINGS.secondsPerMaze;
  totalTime = Math.max(0, totalTime - 1);
  hideOverlays();
  playing = true;
  paused = false;
}

function loadMaze(index) {
  map = MAZES[index];
  player = { ...START };
  exit = { ...EXIT };
  timeLeft = SETTINGS.secondsPerMaze;
  levelText.textContent =
    `${String(index + 1).padStart(2, "0")} / ${SETTINGS.totalMazes}`;
  updateTimer();
}

function updateTimer() {
  const safe = Math.max(0, Math.ceil(timeLeft));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  timerText.textContent =
    `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  // Visual warning only; there are deliberately no glitch/corruption effects.
  timerText.style.color = safe <= 10 ? "#d95c55" : "#17212b";
}

function isWall(x, y) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  return !map[gy] || map[gy][gx] !== "0";
}

function movePlayer(dx, dy) {
  const radius = 0.18;

  if (!isWall(player.x + dx + Math.sign(dx) * radius, player.y)) {
    player.x += dx;
  }

  if (!isWall(player.x, player.y + dy + Math.sign(dy) * radius)) {
    player.y += dy;
  }
}

function update(dt) {
  if (!playing || paused) return;

  totalTime += dt;
  timeLeft -= dt;

  if (timeLeft <= 0) {
    timeLeft = 0;
    updateTimer();
    playing = false;
    timeUpOverlay.classList.remove("hidden");
    return;
  }

  let forward = 0;
  let strafe = 0;
  let turn = 0;

  if (keys.w || keys.arrowup) forward += 1;
  if (keys.s || keys.arrowdown) forward -= 1;
  if (keys.a) strafe -= 1;
  if (keys.d) strafe += 1;
  if (keys.arrowleft) turn -= 1;
  if (keys.arrowright) turn += 1;

  player.angle += turn * SETTINGS.turnSpeed * dt;

  const distance = SETTINGS.moveSpeed * dt;
  const dx =
    Math.cos(player.angle) * forward * distance -
    Math.sin(player.angle) * strafe * distance;
  const dy =
    Math.sin(player.angle) * forward * distance +
    Math.cos(player.angle) * strafe * distance;

  movePlayer(dx, dy);

  if (Math.hypot(player.x - exit.x, player.y - exit.y) < 0.58) {
    reachExit();
  }

  updateTimer();
}

function reachExit() {
  if (mazeIndex < SETTINGS.totalMazes - 1) {
    mazeIndex++;
    loadMaze(mazeIndex);
  } else {
    playing = false;
    finalStats.textContent =
      `All 5 mazes cleared in ${formatTime(totalTime)}. You found the way out before time ran out.`;
    winOverlay.classList.remove("hidden");
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// DDA raycaster for the first-person maze.
function castRay(angle) {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let mapX = Math.floor(player.x);
  let mapY = Math.floor(player.y);

  const deltaX = Math.abs(1 / (dirX || 0.00001));
  const deltaY = Math.abs(1 / (dirY || 0.00001));

  const stepX = dirX < 0 ? -1 : 1;
  const stepY = dirY < 0 ? -1 : 1;

  let sideX =
    dirX < 0
      ? (player.x - mapX) * deltaX
      : (mapX + 1 - player.x) * deltaX;

  let sideY =
    dirY < 0
      ? (player.y - mapY) * deltaY
      : (mapY + 1 - player.y) * deltaY;

  let side = 0;
  let distance = SETTINGS.maxDepth;

  for (let i = 0; i < 300; i++) {
    if (sideX < sideY) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
      distance = sideX - deltaX;
    } else {
      sideY += deltaY;
      mapY += stepY;
      side = 1;
      distance = sideY - deltaY;
    }

    if (!map[mapY] || map[mapY][mapX] !== "0") break;
    if (distance > SETTINGS.maxDepth) break;
  }

  return { distance: Math.min(distance, SETTINGS.maxDepth), side };
}

function render() {
  const width = canvas.width;
  const height = canvas.height;
  const horizon = height * 0.50;

  // Creamy sky.
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#fffaf0");
  sky.addColorStop(0.55, "#f9e8c9");
  sky.addColorStop(1, "#f1d8b0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  // Bright creamy floor.
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  floor.addColorStop(0, "#ead8ba");
  floor.addColorStop(1, "#cdbd9f");
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, width, height - horizon);

  const rays = SETTINGS.rays;
  const column = width / rays;
  const z = new Float32Array(rays);

  for (let i = 0; i < rays; i++) {
    const cameraX = i / rays - 0.5;
    const angle = player.angle + cameraX * SETTINGS.fov;
    const hit = castRay(angle);
    const corrected = hit.distance * Math.cos(cameraX * SETTINGS.fov);

    z[i] = corrected;

    const wallHeight = Math.min(
      height * 1.7,
      height / Math.max(corrected, 0.001) * 0.73
    );
    const top = horizon - wallHeight / 2;

    let light = Math.max(0.16, 1 - corrected / SETTINGS.maxDepth);
    if (hit.side) light *= 0.88;

    // Warm cream walls with subtle alternating pastel accents.
    const baseR = Math.floor(244 * light + 8);
    const baseG = Math.floor(224 * light + 12);
    const baseB = Math.floor(188 * light + 16);

    ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    ctx.fillRect(i * column, top, column + 1, wallHeight);

    // Occasional wall panels make the corridors look designed, not flat.
    if (i % 47 === 0 && wallHeight > 80) {
      ctx.fillStyle = `rgba(75,120,255,${0.13 * light})`;
      ctx.fillRect(i * column, top + wallHeight * .14, column * 3, wallHeight * .72);
    }
  }

  renderExit(z, horizon, rays);

  // Soft ceiling/floor guide lines.
  ctx.strokeStyle = "rgba(75,120,255,.08)";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 5; i++) {
    const y = horizon + Math.pow(i / 5, 2) * (height - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function renderExit(zBuffer, horizon, rays) {
  const dx = exit.x - player.x;
  const dy = exit.y - player.y;
  const distance = Math.hypot(dx, dy);

  let relative = Math.atan2(dy, dx) - player.angle;
  while (relative > Math.PI) relative -= Math.PI * 2;
  while (relative < -Math.PI) relative += Math.PI * 2;

  if (Math.abs(relative) > SETTINGS.fov * 0.54) return;

  const ray = Math.floor((relative / SETTINGS.fov + 0.5) * rays);
  if (ray < 0 || ray >= rays) return;
  if (distance > zBuffer[ray] + 0.35) return;

  const x = canvas.width * (0.5 + relative / SETTINGS.fov);
  const size = Math.min(230, (canvas.height / Math.max(distance, .45)) * .75);

  // Warm glow behind the exit.
  const glow = ctx.createRadialGradient(x, horizon, 5, x, horizon, size);
  glow.addColorStop(0, "rgba(255,212,90,.70)");
  glow.addColorStop(.35, "rgba(255,212,90,.20)");
  glow.addColorStop(1, "rgba(255,212,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - size, horizon - size, size * 2, size * 2);

  // Door.
  ctx.fillStyle = "#4b78ff";
  ctx.fillRect(x - size * .19, horizon - size * .48, size * .38, size * .86);

  ctx.fillStyle = "#fff8e9";
  ctx.fillRect(x - size * .12, horizon - size * .39, size * .24, size * .77);

  ctx.fillStyle = "#ffd45a";
  ctx.beginPath();
  ctx.arc(x + size * .07, horizon, size * .025, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#17212b";
  ctx.font = `900 ${Math.max(11, size * .075)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("EXIT", x, horizon + size * .56);
}

function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  update(dt);

  if (gameScreen.classList.contains("active")) {
    render();
  }

  rafId = requestAnimationFrame(loop);
}

// Keyboard.
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","escape"].includes(key)) {
    event.preventDefault();
  }

  keys[key] = true;

  if (key === "escape" && playing) {
    togglePause();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function togglePause() {
  if (!playing) return;
  paused = !paused;
  pauseOverlay.classList.toggle("hidden", !paused);
}

pauseBtn.addEventListener("click", togglePause);

resumeBtn.addEventListener("click", () => {
  paused = false;
  pauseOverlay.classList.add("hidden");
});

restartBtn.addEventListener("click", restartCurrentMaze);
retryBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);

homeBtn1.addEventListener("click", () => {
  playing = false;
  hideOverlays();
  showScreen("menu");
});

homeBtn2.addEventListener("click", () => {
  playing = false;
  hideOverlays();
  showScreen("menu");
});

startBtn.addEventListener("click", startGame);

// Mouse turning while holding left mouse button.
let dragging = false;

canvas.addEventListener("mousedown", () => {
  dragging = true;
  canvas.requestPointerLock?.();
});

window.addEventListener("mouseup", () => {
  dragging = false;
});

window.addEventListener("mousemove", (event) => {
  if (!dragging || paused || !playing) return;
  player.angle += event.movementX * 0.0028;
});

showScreen("menu");
requestAnimationFrame(loop);
