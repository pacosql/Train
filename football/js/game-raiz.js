// "¿Entre qué números?": "√50 está entre…" sobre una recta con los enteros.
// Se toca el TRAMO entre dos enteros consecutivos donde cae la raíz (o el
// punto exacto si es un cuadrado perfecto). Al tocar aparecen los
// cuadrados a los lados (49 y 64) y se comprueba. Niveles: raíces exactas
// hasta 100 → entre enteros hasta 100 → hasta 150 (recta 0-13) → raíces
// cúbicas (recta 0-10).
import { randInt, saveScore } from "./utils.js";

const SUP = { 2: "²", 3: "³" };

// Ronda: { n, p (índice de la raíz), max (recta 0..max), k (entero inferior), exact, hint }
export function buildRound(level) {
  const p = level === 3 ? 3 : 2;
  const max = level === 3 ? 10 : level === 2 ? 13 : 12;
  const top = level === 3 ? 1000 : level === 2 ? 150 : 100;
  let n;
  if (level === 0) n = randInt(1, 10) ** 2;
  else n = randInt(level === 2 ? 50 : 2, top);
  if (level >= 1 && Math.random() < 0.25) n = randInt(level === 2 ? 8 : 2, level === 2 ? 12 : 10) ** p;
  let k = 0;
  while ((k + 1) ** p <= n) k++;
  const exact = k ** p === n;
  const sym = p === 2 ? "√" : "∛";
  const nearK = Math.pow(n, 1 / p) - k < 0.5;
  const hint = exact
    ? `${k}${SUP[p]} = ${n}, así que ${sym}${n} = ${k} justo`
    : `${k}${SUP[p]} = ${k ** p} < ${n} < ${(k + 1) ** p} = ${k + 1}${SUP[p]}, así que ${sym}${n} está entre ${k} y ${k + 1} (más cerca de ${nearK ? k : k + 1})`;
  return { n, p, max, k, exact, sym, hint };
}

export function mountRaizGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let busy = false;
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body rz-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  const X0 = 16;
  const X1 = 364;
  const Y = 58;
  const xOf = (v) => X0 + ((X1 - X0) * v) / round.max;

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(score / 30)));
    busy = false;
    let svg = "";
    for (let i = 0; i < round.max; i++) svg += `<rect class="rz-seg" data-seg="${i}" x="${xOf(i)}" y="10" width="${xOf(i + 1) - xOf(i)}" height="96" rx="4"/>`;
    svg += `<line class="rz-axis" x1="${X0}" y1="${Y}" x2="${X1}" y2="${Y}"/>`;
    for (let i = 0; i <= round.max; i++) {
      svg += `<circle class="rz-pt" data-pt="${i}" cx="${xOf(i)}" cy="${Y}" r="9"/>`;
      svg += `<text class="rz-num" x="${xOf(i)}" y="${Y + 66}">${i}</text>`;
      svg += `<text class="rz-sq" data-sq="${i}" x="${xOf(i)}" y="${Y - 26}"></text>`;
    }
    body.innerHTML = `
      <p class="prompt rz-prompt">¿Dónde cae <b>${round.sym}${round.n}</b>?<small>Toca el tramo entre dos números (o el número justo)</small></p>
      <svg class="rz-line" viewBox="0 0 380 132" data-line>${svg}</svg>
      <div class="rz-sol" data-sol></div>
      <div class="feedback rz-fb" data-feedback></div>
    `;
    body.querySelectorAll("[data-seg]").forEach((r) => r.addEventListener("click", () => tap("seg", Number(r.dataset.seg))));
    body.querySelectorAll("[data-pt]").forEach((c) => c.addEventListener("click", () => tap("pt", Number(c.dataset.pt))));
  }

  // Enseña los cuadrados (o cubos) de los enteros a los lados.
  function showPow(i, good) {
    const t = body.querySelector(`[data-sq="${i}"]`);
    if (!t) return;
    t.textContent = i ** round.p;
    if (good) t.classList.add("q");
  }

  function tap(kind, i) {
    if (finished || busy) return;
    busy = true;
    rounds++;
    const { k, exact, p, n, sym } = round;
    const ok = exact ? kind === "pt" && i === k : kind === "seg" && i === k;
    const sel = body.querySelector(kind === "seg" ? `[data-seg="${i}"]` : `[data-pt="${i}"]`);
    sel.classList.add(ok ? "good" : "bad");
    if (kind === "seg") {
      showPow(i);
      showPow(i + 1);
    } else showPow(i);
    // La respuesta correcta en verde en la propia recta, con la raíz marcada.
    const goodEl = body.querySelector(exact ? `[data-pt="${k}"]` : `[data-seg="${k}"]`);
    goodEl.classList.add("good");
    showPow(k, true);
    if (!exact) showPow(k + 1, true);
    const x = xOf(Math.pow(n, 1 / p));
    body.querySelector("[data-line]").insertAdjacentHTML("beforeend", `<circle class="rz-mark" cx="${x}" cy="${Y}" r="5"/><text class="rz-marklab" x="${x}" y="${Y + 30}">${sym}${n}</text>`);
    body.querySelector("[data-sol]").textContent = exact ? `${sym}${n} = ${k}` : `${k} < ${sym}${n} < ${k + 1}`;
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = `💡 ${round.hint}`;
    fb.className = `feedback rz-fb ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 10;
      renderScore();
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    if (lives <= 0) return (pending = setTimeout(() => finish(false), 2200));
    pending = setTimeout(nextRound, 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla "← Menú" debe seguir funcionando.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "raiz", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>√</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} raíces situadas</p>
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
    clearTimeout(pending);
  };
}
