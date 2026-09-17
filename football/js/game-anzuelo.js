// "Pesca de factores": localizar de un vistazo todos los divisores de un
// número entre peces señuelo — la piscifactoría obliga a comprobar cada
// pez uno a uno en vez de adivinar por intuición.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Todos los divisores de n, de 1 a n, en orden creciente.
function divisoresDe(n) {
  const divs = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) divs.push(i);
  }
  return divs;
}

// Cociente n/d formateado en español: entero si es exacto, con coma y
// como mucho 2 decimales (sin ceros sobrantes) si no lo es.
function formatCociente(n, d) {
  const q = n / d;
  if (Number.isInteger(q)) return `${q}`;
  let s = q.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return s.replace(".", ",");
}

// Construye una ronda: número objetivo N, la lista de peces del estanque
// (números mezclados) y qué números de esa lista son divisores reales de N.
function generaRonda(lastN) {
  let n = 0;
  let divs = [];
  do {
    n = randInt(12, 60);
    divs = divisoresDe(n);
  } while (divs.length < 4 || n === lastN);

  // Divisores "no triviales" (ni 1 ni el propio N): siempre hay al menos
  // 2, porque exigimos 4+ divisores en total.
  const noTriviales = divs.filter((d) => d !== 1 && d !== n);
  const obligatorios = new Set([1, pick(noTriviales)]);

  const resto = shuffle(divs.filter((d) => !obligatorios.has(d)));
  const cuantosMostrar = Math.min(divs.length, randInt(4, 6));
  const mostrar = new Set(obligatorios);
  for (const d of resto) {
    if (mostrar.size >= cuantosMostrar) break;
    mostrar.add(d);
  }
  const divisoresEnEstanque = shuffle(Array.from(mostrar));

  const totalPeces = randInt(8, 10);
  const usados = new Set(divisoresEnEstanque);
  const senuelos = [];
  let guardia = 0;
  // Señuelos cerca de un divisor real (o de N) para que no sean obvios
  // a ojo, verificando siempre que NO dividan a N y no se repitan.
  while (senuelos.length < totalPeces - divisoresEnEstanque.length && guardia < 500) {
    guardia++;
    const base = pick(divisoresEnEstanque.concat([n]));
    const delta = pick([-2, -1, 1, 2]);
    let cand = base + delta;
    if (cand < 2) cand = base + Math.abs(delta) + 2;
    if (usados.has(cand) || n % cand === 0) continue;
    usados.add(cand);
    senuelos.push(cand);
  }
  // Red de seguridad por si el bucle de arriba no encuentra sitio (muy
  // improbable, pero así nunca falta un pez).
  while (senuelos.length < totalPeces - divisoresEnEstanque.length) {
    const cand = randInt(2, n + 12);
    if (usados.has(cand) || n % cand === 0) continue;
    usados.add(cand);
    senuelos.push(cand);
  }

  const peces = shuffle(divisoresEnEstanque.concat(senuelos));
  return { n, peces, divisoresEnEstanque };
}

export function mountAnzueloGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita tocar peces mientras se resuelve la ronda
  let lastN = -1;
  let ronda = null;
  let pescados = new Set(); // índices de peces capturados en esta ronda
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    ronda = generaRonda(lastN);
    lastN = ronda.n;
    pescados = new Set();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Pesca todos los divisores de <b>${ronda.n}</b>
        <small>Toca los peces cuyo número divida exactamente a ${ronda.n}. Vuelve a tocarlos para soltarlos.</small>
      </p>
      <div class="az-pond" data-pond></div>
      <div class="feedback" data-feedback></div>
      <button class="primary az-done-btn" type="button" data-done>¡Listo! 🎣</button>
    `;

    const pondEl = body.querySelector("[data-pond]");
    ronda.peces.forEach((num, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn az-fish";
      btn.dataset.fish = String(idx);
      btn.dataset.num = String(num);
      btn.innerHTML = `<span class="az-fish-emoji">🐟</span><span class="az-fish-num">${num}</span>`;
      btn.addEventListener("click", () => toggleFish(idx, btn));
      pondEl.appendChild(btn);
    });
    body.querySelector("[data-done]").addEventListener("click", evaluar);
  }

  function toggleFish(idx, btn) {
    if (finished || locked) return;
    if (pescados.has(idx)) {
      pescados.delete(idx);
      btn.classList.remove("az-caught");
    } else {
      pescados.add(idx);
      btn.classList.add("az-caught");
    }
  }

  function evaluar() {
    if (finished || locked) return;
    locked = true;
    const { n, peces, divisoresEnEstanque } = ronda;
    const divisorSet = new Set(divisoresEnEstanque);
    const pescadoNums = Array.from(pescados).map((i) => peces[i]);
    const pescadoSet = new Set(pescadoNums);

    const faltantes = divisoresEnEstanque.filter((d) => !pescadoSet.has(d));
    const sobrantes = pescadoNums.filter((num) => !divisorSet.has(num));
    const feedback = body.querySelector("[data-feedback]");

    if (faltantes.length === 0 && sobrantes.length === 0) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! Esos eran todos los divisores de ${n} y ninguno más.`;
      feedback.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 900);
      return;
    }

    rounds++;
    lives--;
    renderLives();
    let mensaje;
    if (faltantes.length > 0) {
      const d = faltantes[0];
      mensaje = `${n} ÷ ${d} = ${formatCociente(n, d)} exacto: el ${d} sí era divisor y se te escapó.`;
    } else {
      const num = sobrantes[0];
      mensaje = `${n} ÷ ${num} = ${formatCociente(n, num)}, no es exacto: el ${num} no era divisor.`;
    }
    feedback.textContent = mensaje;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1200);
    later(() => { locked = false; nextRound(); }, 1600);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "anzuelo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐟</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} estanques pescados</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    finished = false;
    lastN = -1;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
