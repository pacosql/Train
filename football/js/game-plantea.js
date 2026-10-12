// "Plantea el problema": un problema corto de una operación y fichas con
// los números del enunciado (a veces uno que sobra) y los signos. Se
// tocan para rellenar [12] [−] [5]; al completar se evalúa solo. Lo que
// se enseña es ELEGIR la operación: el resultado lo pone la máquina.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const NOMBRES = ["Ana", "Luis", "Marta", "Pablo", "Sofía", "Hugo", "Lucía", "Mateo", "Carla", "Diego", "Elena", "Nico"];
const COSAS = ["cromos", "canicas", "caramelos", "pegatinas", "globos", "libros", "galletas", "lápices"];
// k: operación; l: nivel mínimo (0 suma/resta, 1 mult/div, 2 comparar); t: texto; h: 💡.
export const PLANTILLAS = [
  { k: "+", l: 0, t: (v) => `${v.N} tiene ${v.a} ${v.o} y le regalan ${v.b} más. ¿Cuántos tiene ahora?`, h: "Le dan más → junto, sumo" },
  { k: "+", l: 0, t: (v) => `En una clase hay ${v.a} niñas y ${v.b} niños. ¿Cuántos alumnos hay en total?`, h: "El total de dos grupos → suma" },
  { k: "+", l: 0, t: (v) => `${v.N} tenía ${v.a} € y ha ganado ${v.b} €. ¿Cuánto dinero tiene?`, h: "Ganar es añadir → suma" },
  { k: "+", l: 0, t: (v) => `En un autobús van ${v.a} personas y suben ${v.b} más. ¿Cuántas van ahora?`, h: "Suben más → suma" },
  { k: "+", l: 0, t: (v) => `${v.N} leyó ${v.a} páginas el lunes y ${v.b} el martes. ¿Cuántas leyó en total?`, h: "Juntar lo de los dos días → suma" },
  { k: "+", l: 0, t: (v) => `Un tren recorre ${v.a} km y después otros ${v.b} km. ¿Cuántos km recorre?`, h: "Un trayecto y luego otro → suma" },
  { k: "−", l: 0, t: (v) => `${v.N} tiene ${v.a} ${v.o} y regala ${v.b}. ¿Cuántos le quedan?`, h: "Regalar es quitar → resta" },
  { k: "−", l: 0, t: (v) => `Había ${v.a} pájaros en un árbol y se van volando ${v.b}. ¿Cuántos quedan?`, h: "Se van → quito, resto" },
  { k: "−", l: 0, t: (v) => `${v.N} tenía ${v.a} € y se gasta ${v.b} €. ¿Cuánto le queda?`, h: "Gastar es quitar → resta" },
  { k: "−", l: 0, t: (v) => `Un libro tiene ${v.a} páginas y ${v.N} ya ha leído ${v.b}. ¿Cuántas le faltan?`, h: "Lo que falta para el total → resta" },
  { k: "−", l: 0, t: (v) => `Hay ${v.a} sillas y se sientan ${v.b} niños. ¿Cuántas sillas quedan libres?`, h: "Las que quedan libres → resta" },
  { k: "−", l: 2, t: (v) => `${v.N} tiene ${v.a} ${v.o} y ${v.M} tiene ${v.b}. ¿Cuántos más tiene ${v.N}?`, h: "«Cuántos más» compara dos cantidades → resta" },
  { k: "−", l: 2, t: (v) => `${v.N} mide ${v.a} cm y ${v.M} mide ${v.b} cm. ¿Cuántos cm más mide ${v.N}?`, h: "Comparar alturas → resta la pequeña a la grande" },
  { k: "−", l: 2, t: (v) => `Un pantalón cuesta ${v.a} € y una camiseta ${v.b} €. ¿Cuánto más caro es el pantalón?`, h: "«Cuánto más caro» es una diferencia → resta" },
  { k: "−", l: 2, t: (v) => `${v.N} tiene ${v.a} años y su primo ${v.M} tiene ${v.b}. ¿Cuántos años se llevan?`, h: "«Se llevan» = diferencia → resta" },
  { k: "×", l: 1, t: (v) => `Hay ${v.a} cajas con ${v.b} ${v.o} cada una. ¿Cuántos ${v.o} hay en total?`, h: "Grupos iguales → multiplico" },
  { k: "×", l: 1, t: (v) => `Un cuaderno cuesta ${v.b} €. ¿Cuánto cuestan ${v.a} cuadernos?`, h: "Precio de uno × cantidad → multiplicación" },
  { k: "×", l: 1, t: (v) => `En el cine hay ${v.a} filas de ${v.b} butacas. ¿Cuántas butacas hay?`, h: "Filas iguales → multiplico" },
  { k: "×", l: 1, t: (v) => `${v.N} da ${v.b} vueltas al parque cada día. ¿Cuántas da en ${v.a} días?`, h: "Lo mismo cada día → multiplico" },
  { k: "×", l: 1, b: 8, t: (v) => `Una araña tiene 8 patas. ¿Cuántas patas tienen ${v.a} arañas?`, h: "8 patas por araña → multiplico" },
  { k: "×", l: 1, t: (v) => `Un paquete trae ${v.b} pilas. ¿Cuántas pilas hay en ${v.a} paquetes?`, h: "Paquetes iguales → multiplico" },
  { k: "÷", l: 1, t: (v) => `${v.N} reparte ${v.a} ${v.o} entre ${v.b} amigos a partes iguales. ¿Cuántos recibe cada uno?`, h: "Repartir a partes iguales → divido" },
  { k: "÷", l: 1, t: (v) => `${v.a} huevos se guardan en cajas de ${v.b}. ¿Cuántas cajas se llenan?`, h: "Hacer grupos iguales → divido" },
  { k: "÷", l: 1, t: (v) => `${v.a} alumnos se sientan en ${v.b} mesas iguales. ¿Cuántos hay en cada mesa?`, h: "Repartir en mesas iguales → divido" },
  { k: "÷", l: 1, t: (v) => `${v.b} bolígrafos iguales cuestan ${v.a} € en total. ¿Cuánto cuesta cada uno?`, h: "Total ÷ unidades = precio de uno" },
  { k: "÷", l: 1, t: (v) => `Una cuerda de ${v.a} m se corta en trozos de ${v.b} m. ¿Cuántos trozos salen?`, h: "¿Cuántas veces cabe? → divido" },
  { k: "÷", l: 1, t: (v) => `${v.N} tiene ${v.a} € y compra bollos de ${v.b} €. ¿Cuántos bollos puede comprar?`, h: "¿Cuántas veces cabe el precio? → divido" },
];
const DISTRACTOR = [(v) => `${v.N} tiene ${v.d} años.`, (v) => `Hoy es día ${v.d}.`, (v) => `${v.N} vive en el piso ${v.d}.`, (v) => `Son las ${v.d}.`];
const calc = (x, op, y) => (op === "+" ? x + y : op === "−" ? x - y : op === "×" ? x * y : y !== 0 && x % y === 0 ? x / y : NaN);

export function buildRound(stage) {
  for (;;) {
    const pool = PLANTILLAS.filter((p) => (stage === 0 ? p.l === 0 : stage === 1 ? p.l === 1 : true));
    const p = pick(pool);
    const big = stage >= 2;
    let a, b;
    if (p.k === "+") { a = randInt(3, big ? 90 : 40); b = randInt(3, big ? 90 : 40); }
    else if (p.k === "−") { a = randInt(6, big ? 100 : 50); b = randInt(2, a - 1); }
    else if (p.k === "×") { a = randInt(2, big ? 12 : 9); b = p.b || randInt(2, big ? 12 : 9); }
    else { b = randInt(2, big ? 12 : 9); a = b * randInt(2, big ? 12 : 9); }
    const sol = calc(a, p.k, b);
    const [N, M] = shuffle(NOMBRES);
    const v = { N, M, a, b, o: pick(COSAS), d: randInt(3, 12) };
    const conD = big && Math.random() < 0.6 && ![a, b, sol].includes(v.d);
    const nums = shuffle(conD ? [a, b, v.d] : [a, b]);
    // Regla de oro: ninguna otra expresión con esas fichas da la solución.
    let ambiguo = false;
    nums.forEach((x, i) => nums.forEach((y, j) => {
      if (i === j) return;
      ["+", "−", "×", "÷"].forEach((op) => {
        if (calc(x, op, y) !== sol) return;
        const okPar = op === p.k && ((x === a && y === b) || ((op === "+" || op === "×") && x === b && y === a));
        if (!okPar) ambiguo = true;
      });
    }));
    if (ambiguo) continue;
    const text = (conD ? pick(DISTRACTOR)(v) + " " : "") + p.t(v);
    return { text, nums, a, b, op: p.k, sol, hint: `${p.h}: ${a} ${p.k} ${b} = ${sol}` };
  }
}

export function mountPlanteaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let round = null;
  let slots = [null, null, null]; // índice de ficha (números: n0.., signos: o0..)
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body pl-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const stage = () => Math.min(Math.floor(level / 3), 2);
  const chipText = (id) => (id[0] === "n" ? String(round.nums[Number(id.slice(1))]) : ["+", "−", "×", "÷"][Number(id.slice(1))]);

  function nextRound() {
    round = buildRound(stage());
    slots = [null, null, null];
    busy = false;
    body.innerHTML = `
      <p class="prompt pl-prompt">${round.text}<small>Toca los números y el signo</small></p>
      <div class="pl-expr" data-expr></div>
      <div class="pl-chips" data-chips></div>
      <div class="feedback pl-feedback" data-feedback></div>
    `;
    paint();
  }

  function paint() {
    const ids = [...round.nums.map((_, i) => `n${i}`), "o0", "o1", "o2", "o3"];
    body.querySelector("[data-expr]").innerHTML =
      slots.map((id, i) => `<button type="button" class="pl-slot ${id === null ? "empty" : ""} ${i === 1 ? "pl-slot-op" : ""}" data-slot="${i}">${id === null ? "" : chipText(id)}</button>`).join("") +
      `<span class="pl-eq">=</span><span class="pl-res" data-res>?</span>`;
    // Fichas: los números en una fila y los cuatro signos debajo.
    body.querySelector("[data-chips]").innerHTML = ids
      .map((id) => `${id === "o0" ? '<i class="pl-break"></i>' : ""}<button type="button" class="pl-chip ${id[0] === "o" ? "pl-chip-op" : ""}" data-chip="${id}" ${slots.includes(id) ? "disabled" : ""}>${chipText(id)}</button>`)
      .join("");
    body.querySelectorAll("[data-slot]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy || finished) return;
        slots[Number(b.dataset.slot)] = null; // devolver la ficha
        paint();
      }),
    );
    body.querySelectorAll("[data-chip]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy || finished) return;
        const id = b.dataset.chip;
        const idx = id[0] === "o" ? (slots[1] === null ? 1 : -1) : slots[0] === null ? 0 : slots[2] === null ? 2 : -1;
        if (idx < 0) return;
        slots[idx] = id;
        paint();
        if (!slots.includes(null)) check();
      }),
    );
  }

  function check() {
    rounds++;
    busy = true;
    const x = Number(chipText(slots[0]));
    const op = chipText(slots[1]);
    const y = Number(chipText(slots[2]));
    const value = op === "+" ? x + y : op === "−" ? x - y : op === "×" ? x * y : x / y;
    const res = body.querySelector("[data-res]");
    const fb = body.querySelector("[data-feedback]");
    res.textContent = Number.isInteger(value) ? value : value.toFixed(2).replace(".", ",");
    if (value === round.sol && op === round.op) {
      score += 10;
      level++;
      renderScore();
      body.querySelectorAll(".pl-slot").forEach((s) => s.classList.add("good"));
      fb.className = "feedback pl-feedback ok";
      fb.textContent = `¡Bien! 💡 ${round.hint}`;
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    body.querySelectorAll(".pl-slot").forEach((s) => s.classList.add("bad"));
    // El planteamiento correcto, en verde, debajo del del jugador.
    const ans = document.createElement("div");
    ans.className = "pl-expr pl-answer";
    ans.dataset.answer = "";
    ans.innerHTML = `<span class="pl-slot good">${round.a}</span><span class="pl-slot good pl-slot-op">${round.op}</span><span class="pl-slot good">${round.b}</span><span class="pl-eq">=</span><span class="pl-res good">${round.sol}</span>`;
    body.querySelector("[data-expr]").after(ans);
    fb.className = "feedback pl-feedback bad";
    fb.textContent = `Así no sale ${round.sol}. 💡 ${round.hint}`;
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "plantea", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧩</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} problemas bien planteados de ${rounds}</p>
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
  };
}
