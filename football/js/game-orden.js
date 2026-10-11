// "Ordena los números" v2 (rehecho a petición de Paco).
//
// Antes: tocar chips en orden, sin ver el porqué. Ahora la regla se ve:
// huecos separados por el símbolo (  ▢ < ▢ < ▢  o  ▢ > ▢ > ▢ ) y una
// bandeja de números. Tocar un número lo lleva al primer hueco libre;
// también se puede ARRASTRAR a un hueco concreto (si está ocupado, se
// intercambian), y tocar uno ya colocado lo devuelve a la bandeja. Al
// llenar todos los huecos se comprueba cada símbolo: los que se cumplen
// se ponen en verde y los que no en rojo, diciendo cuál falla. El fallo
// cuesta una vida pero no borra nada: se corrige y se vuelve a comprobar.
import { randInt, shuffle, saveScore } from "./utils.js";

// Nivel → cuántos números y de qué rango. Desde el nivel 3 los números
// salen "cercanos" (misma decena o centena) para que comparar exija
// mirar de verdad las cifras.
function buildRound(level) {
  const count = Math.min(3 + Math.floor(level / 2), 6);
  const max = level < 2 ? 50 : level < 4 ? 99 : 999;
  const set = new Set();
  if (level >= 3) {
    const base = randInt(1, Math.floor(max / 10) - 1) * 10;
    while (set.size < count) set.add(base + randInt(0, 9) + (level >= 5 ? randInt(0, 2) * 10 : 0));
  } else {
    while (set.size < count) set.add(randInt(1, max));
  }
  const nums = shuffle(Array.from(set));
  const asc = Math.random() < 0.5;
  return { nums, asc };
}

export function mountOrdenGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let slots = []; // valor en cada hueco o null
  let tray = []; // valores aún en la bandeja
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
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const sym = () => (round.asc ? "<" : ">");

  function nextRound() {
    round = buildRound(level);
    slots = round.nums.map(() => null);
    tray = [...round.nums];
    busy = false;
    body.innerHTML = `
      <p class="prompt">Ordena de ${round.asc ? "menor a mayor" : "mayor a menor"}
        <small>Toca un número para colocarlo, o arrástralo a un hueco</small></p>
      <div class="ord-line" data-line></div>
      <div class="ord-tray" data-tray></div>
      <div class="feedback" data-feedback></div>
    `;
    paint();
  }

  function paint(results) {
    const line = body.querySelector("[data-line]");
    line.innerHTML = slots
      .map((v, i) => {
        const s =
          i < slots.length - 1
            ? `<span class="ord-sym ${results ? (results[i] ? "ok" : "bad") : ""}">${sym()}</span>`
            : "";
        return `<button type="button" class="ord-slot ${v === null ? "empty" : ""}" data-slot="${i}">${
          v === null ? "" : v
        }</button>${s}`;
      })
      .join("");
    const trayEl = body.querySelector("[data-tray]");
    trayEl.innerHTML = tray.map((v) => `<button type="button" class="ord-chip" data-val="${v}">${v}</button>`).join("");
    line.querySelectorAll("[data-slot]").forEach((b) => bindSlot(b));
    trayEl.querySelectorAll("[data-val]").forEach((b) => bindChip(b));
  }

  function placeAt(val, idx) {
    // De la bandeja o de otro hueco al hueco idx (si estaba ocupado, el
    // que había va a donde estaba el que llega, o a la bandeja).
    const from = slots.indexOf(val);
    const prev = slots[idx];
    if (from === idx) return;
    if (from >= 0) slots[from] = prev;
    else {
      tray = tray.filter((v) => v !== val);
      if (prev !== null) tray.push(prev);
    }
    slots[idx] = val;
  }

  function afterMove() {
    paint();
    if (slots.every((v) => v !== null)) check();
  }

  // Chip de la bandeja: tocar → primer hueco libre; arrastrar → hueco.
  function bindChip(el) {
    const val = Number(el.dataset.val);
    dragGesture(el, val, () => {
      const idx = slots.indexOf(null);
      if (idx >= 0) {
        placeAt(val, idx);
        afterMove();
      }
    });
  }
  // Hueco ocupado: tocar → vuelve a la bandeja; arrastrar → otro hueco.
  function bindSlot(el) {
    const idx = Number(el.dataset.slot);
    const val = slots[idx];
    if (val === null) return;
    dragGesture(el, val, () => {
      slots[idx] = null;
      tray.push(val);
      afterMove();
    });
  }

  function dragGesture(el, val, onTap) {
    el.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      const sx = e.clientX;
      const sy = e.clientY;
      let ghost = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!ghost) {
          ghost = document.createElement("div");
          ghost.className = "ord-ghost";
          ghost.textContent = val;
          document.body.appendChild(ghost);
          el.classList.add("lifting");
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        body.querySelectorAll("[data-slot]").forEach((s) => s.classList.toggle("over", hit(s, ev)));
      };
      const up = (ev) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if (!ghost) return onTap();
        ghost.remove();
        el.classList.remove("lifting");
        const target = [...body.querySelectorAll("[data-slot]")].find((s) => hit(s, ev));
        if (target) {
          placeAt(val, Number(target.dataset.slot));
          afterMove();
        } else paint();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  }
  function hit(el, ev) {
    const r = el.getBoundingClientRect();
    return ev.clientX >= r.left - 6 && ev.clientX <= r.right + 6 && ev.clientY >= r.top - 14 && ev.clientY <= r.bottom + 14;
  }

  function check() {
    rounds++;
    const results = slots.slice(0, -1).map((v, i) => (round.asc ? v < slots[i + 1] : v > slots[i + 1]));
    paint(results);
    const feedback = body.querySelector("[data-feedback]");
    const bad = results.indexOf(false);
    if (bad === -1) {
      busy = true;
      score += 10;
      level++;
      renderScore();
      feedback.textContent = `¡Bien! ${slots.join(` ${sym()} `)}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 1100);
      return;
    }
    lives--;
    renderLives();
    const a = slots[bad];
    const b = slots[bad + 1];
    feedback.textContent = `✗ ${a} no es ${round.asc ? "menor" : "mayor"} que ${b}. Toca un número para devolverlo y corrige.`;
    feedback.className = "feedback bad";
    if (lives <= 0) {
      busy = true;
      pending = setTimeout(() => finish(false), 1400);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "orden", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📶</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} filas ordenadas</p>
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
    level = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    document.querySelectorAll(".ord-ghost").forEach((g) => g.remove());
  };
}
