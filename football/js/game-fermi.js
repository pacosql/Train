// "¿De qué orden?": problemas de estimación (Fermi). No hace falta acertar
// el número exacto, solo el ORDEN DE MAGNITUD (la potencia de 10) más
// cercano a la respuesta real, entre 5 opciones consecutivas en la escala.
import { pick, shuffle, saveScore } from "./utils.js";

// Banco de preguntas. Cada entrada fija de antemano la potencia de 10
// correcta (documentada a partir de una referencia real aproximada), así
// el acierto es inequívoco y no depende de redondear "al vuelo".
const BANK = [
  {
    q: "¿Cuántos huesos tiene el esqueleto de una persona adulta?",
    correct: 100,
    // ref: 206 huesos — más de 100, muy lejos de 1.000.
    why: "El esqueleto adulto tiene 206 huesos: más de 100, pero muy lejos de 1.000.",
  },
  {
    q: "¿Cuántos litros de agua caben en una bañera llena hasta arriba?",
    correct: 100,
    // ref: ~150-200 L en una bañera doméstica típica.
    why: "Una bañera llena tiene unos 150-200 litros: por encima de 100, pero muy lejos de 1.000.",
  },
  {
    q: "¿Cuántos alumnos estudian en un colegio grande?",
    correct: 1000,
    // ref: ~800-1.200 alumnos en un colegio grande.
    why: "Un colegio grande ronda los 1.000 alumnos: muchos más que 100, pero muy lejos de 10.000.",
  },
  {
    q: "¿Cuántas estrellas se ven a simple vista en una noche muy oscura y despejada?",
    correct: 1000,
    // ref: ~2.000-2.500 estrellas visibles sin contaminación lumínica.
    why: "En una noche muy oscura se ven unas 2.000 estrellas: más de 1.000, pero muy lejos de 10.000.",
  },
  {
    q: "¿Cuántos pasos da una persona en un día normal?",
    correct: 10000,
    // ref: ~6.000-8.000 pasos con actividad moderada.
    why: "Con actividad normal se dan unos 7.000 pasos al día: mucho más que 1.000, pero menos de 100.000.",
  },
  {
    q: "¿Cuántas palabras pronuncia una persona a lo largo de un día?",
    correct: 10000,
    // ref: estudios lo sitúan entre 7.000 y 20.000 palabras/día.
    why: "Se calcula que hablamos unas 16.000 palabras al día: mucho más que 1.000, pero menos de 100.000.",
  },
  {
    q: "¿Cuántos granos de arroz caben en un vaso normal (200 ml) sin cocer?",
    correct: 10000,
    // ref: ~160 g de arroz, ~20 mg por grano → ~8.000 granos.
    why: "Un vaso de arroz pesa unos 160 g y cada grano pesa ~20 mg: salen unos 8.000 granos, más de 1.000 pero lejos de 100.000.",
  },
  {
    q: "¿Cuántos dientes le llegan a crecer a un tiburón a lo largo de toda su vida?",
    correct: 10000,
    // ref: al reponerlos sin parar, un tiburón puede llegar a tener
    // 20.000-30.000 dientes a lo largo de su vida.
    why: "Un tiburón repone dientes toda su vida y puede llegar a tener unos 20.000-30.000: más de 1.000, lejos de 1.000.000.",
  },
  {
    q: "¿Cuántas veces late el corazón de una persona en un día?",
    correct: 100000,
    // ref: ~70 lat/min × 1440 min ≈ 100.800.
    why: "El corazón late unas 70 veces por minuto: 70 × 60 × 24 ≈ 100.000 latidos al día, más de 10.000 pero lejísimos de 1.000.000.",
  },
  {
    q: "¿Cuántos pelos tiene una persona en la cabeza?",
    correct: 100000,
    // ref: ~100.000-150.000 pelos según densidad y color.
    why: "Una cabeza tiene entre 100.000 y 150.000 pelos: muy por encima de 10.000, pero lejos de 1.000.000.",
  },
  {
    q: "¿Cuántos segundos tiene un día completo?",
    correct: 100000,
    // ref: 24 × 60 × 60 = 86.400 (exacto).
    why: "Un día tiene 24 × 60 × 60 = 86.400 segundos: está mucho más cerca de 100.000 que de 10.000.",
  },
  {
    q: "¿Cuántos habitantes tiene una ciudad española grande como Zaragoza o Málaga?",
    correct: 1000000,
    // ref: ~650.000-800.000 habitantes.
    why: "Ciudades como Zaragoza o Málaga rondan los 700.000-800.000 habitantes: mucho más que 100.000, sin llegar a 10.000.000.",
  },
  {
    q: "¿Cuántas palabras tiene el Quijote completo?",
    correct: 1000000,
    // ref: ~380.000 palabras — claramente por encima de 100.000 y más
    // cerca del millón que de 100.000 en la escala de potencias de 10.
    why: "El Quijote completo tiene unas 380.000 palabras: muy por encima de 100.000, ya en el escalón del millón.",
  },
  {
    q: "¿Cuántas hormigas puede llegar a tener una colonia grande de hormigas cortadoras de hojas?",
    correct: 10000000,
    // ref: colonias maduras de Atta pueden superar los 5-8 millones de individuos.
    why: "Una colonia madura de hormigas cortadoras de hojas puede superar los 5-8 millones de individuos: mucho más que 1.000.000.",
  },
  {
    q: "¿Cuántos granos de arena puede haber en un vaso pequeño (200 ml) lleno?",
    correct: 10000000,
    // ref: para arena fina se estiman varios millones de granos por vaso,
    // más cerca de la decena de millones que del millón.
    why: "En un vaso de arena fina caben varios millones de granos, más cerca de 10.000.000 que de 1.000.000.",
  },
];

function formatNumber(n) {
  return n.toLocaleString("es-ES");
}

export function mountFermiGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita doble click mientras se resuelve la ronda
  let currentQuestion = null;
  let lastQuestion = null;
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
    // Evita repetir la misma pregunta que la ronda anterior.
    const candidates = BANK.filter((item) => item !== lastQuestion);
    currentQuestion = pick(candidates.length ? candidates : BANK);
    lastQuestion = currentQuestion;
    locked = false;

    // Las 5 opciones son la potencia correcta + las dos vecinas por abajo
    // y las dos vecinas por arriba en la escala de potencias de 10.
    const exp = Math.round(Math.log10(currentQuestion.correct));
    const values = [-2, -1, 0, 1, 2].map((d) => 10 ** (exp + d));
    const choices = shuffle(values);

    body.innerHTML = `
      <p class="prompt fm-question">🔭 ${currentQuestion.q}</p>
      <small class="fm-hint">Elige el orden de magnitud más cercano</small>
      <div class="fm-choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;

    const choicesEl = body.querySelector("[data-choices]");
    choices.forEach((value) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn fm-choice";
      btn.type = "button";
      btn.dataset.choice = String(value);
      btn.textContent = formatNumber(value);
      btn.addEventListener("click", () => answer(value, btn));
      choicesEl.appendChild(btn);
    });
  }

  function answer(value, btnEl) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const buttons = Array.from(body.querySelectorAll("[data-choice]"));
    buttons.forEach((b) => { b.disabled = true; });

    if (value === currentQuestion.correct) {
      btnEl.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${currentQuestion.why}`;
      feedback.className = "feedback ok";
      later(nextRound, 1600);
    } else {
      btnEl.classList.add("wrong");
      const correctBtn = buttons.find((b) => Number(b.dataset.choice) === currentQuestion.correct);
      if (correctBtn) correctBtn.classList.add("correct");
      lives--;
      renderLives();
      feedback.textContent = `Lo correcto era ${formatNumber(currentQuestion.correct)}. ${currentQuestion.why}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1900);
      later(nextRound, 1900);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "fermi", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔭</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} estimaciones respondidas</p>
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
    lastQuestion = null;
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
