// "Cuenta los cubos": un bloque de cubitos dibujado en isométrica, a
// veces con una esquina mordida. Hay que contar cuántos cubitos hay en
// total, contando también los que quedan escondidos detrás.
import { randInt, pick, buildChoices, saveScore } from "./utils.js";

// Proporción 2:1: con estas medidas los hexágonos de los cubos encajan
// sin solaparse salvo en la dirección de la vista, que es justo lo que
// hace válido pintar en orden x+y+z (algoritmo del pintor).
const W2 = 16, H2 = 8, CH = 16;

function buildStack() {
  let w, d, h, mx, my, mz, total;
  do {
    w = randInt(2, 4);
    d = randInt(2, 3);
    h = randInt(2, 4);
    mx = 0; my = 0; mz = 0;
    // La mordida sale de la esquina de arriba-delante y nunca abarca una
    // dimensión entera: así siempre se ve, y el bloque no se confunde con
    // otro prisma más pequeño.
    if (Math.random() < 0.55) {
      mx = randInt(1, w - 1);
      my = randInt(1, d - 1);
      mz = randInt(1, h - 1);
    }
    total = w * d * h - mx * my * mz;
  } while (w * d * h > 36 || total < 4);

  const cells = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < d; y++) {
      for (let z = 0; z < h; z++) {
        const cut = x >= w - mx && y >= d - my && z >= h - mz;
        if (!cut) cells.push([x, y, z]);
      }
    }
  }
  return { w, d, h, total, cells, full: w * d * h };
}

function stackSvg(cells) {
  const sorted = cells.slice().sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const parts = sorted
    .map(([x, y, z]) => {
      const sx = (x - y) * W2;
      const sy = (x + y) * H2 - z * CH;
      minX = Math.min(minX, sx - W2); maxX = Math.max(maxX, sx + W2);
      minY = Math.min(minY, sy - H2); maxY = Math.max(maxY, sy + H2 + CH);
      const top = `${sx},${sy - H2} ${sx + W2},${sy} ${sx},${sy + H2} ${sx - W2},${sy}`;
      const left = `${sx - W2},${sy} ${sx},${sy + H2} ${sx},${sy + H2 + CH} ${sx - W2},${sy + CH}`;
      const right = `${sx + W2},${sy} ${sx},${sy + H2} ${sx},${sy + H2 + CH} ${sx + W2},${sy + CH}`;
      return (
        `<polygon class="pe-cubos-l" points="${left}"/>` +
        `<polygon class="pe-cubos-r" points="${right}"/>` +
        `<polygon class="pe-cubos-t" points="${top}"/>`
      );
    })
    .join("");
  const vb = `${minX - 4} ${minY - 4} ${maxX - minX + 8} ${maxY - minY + 8}`;
  return `<svg class="pe-cubos-svg" viewBox="${vb}" role="img" aria-label="bloque de cubos">${parts}</svg>`;
}

export function mountCubosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let answered = false;
  let total = 0;

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

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    if (finished) return;
    let stack, opts, guard = 0;
    // Repite hasta tener 4 opciones distintas: con pocas alternativas
    // plausibles el Set de buildChoices puede quedarse corto.
    do {
      stack = buildStack();
      opts = buildChoices(stack.total, () => {
        const v = pick([
          stack.full,
          stack.full - 1,
          stack.total + randInt(1, 6),
          stack.total - randInt(1, 6),
          stack.w * stack.d,
        ]);
        return v > 0 ? v : stack.total + randInt(1, 6);
      }, 4);
      guard++;
    } while (opts.length < 4 && guard < 30);
    total = stack.total;
    answered = false;

    body.innerHTML = `
      <p class="prompt">¿Cuántos cubos hay?<small>Cuenta también los que quedan escondidos detrás</small></p>
      <div class="pe-cubos-wrap">${stackSvg(stack.cells)}</div>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;
    const choices = body.querySelector("[data-choices]");
    opts.forEach((v) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = v;
      btn.addEventListener("click", () => answer(v, btn));
      choices.appendChild(btn);
    });
  }

  function answer(v, btn) {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    body.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
    if (v === total) {
      btn.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Exacto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 750);
    } else {
      btn.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = `Eran ${total} cubos`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 850);
      setTimeout(nextRound, 1100);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "cubos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧊</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} bloques</p>
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
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
  };
}
