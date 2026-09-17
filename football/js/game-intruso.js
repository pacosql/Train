// "El intruso": entre 4 números, tres comparten una propiedad matemática
// concreta (par, múltiplo de N, primo, cuadrado perfecto...) y uno no la
// cumple — hay que tocar ese. El reto no es solo calcular, es razonar qué
// propiedad "manda" en cada ronda.
//
// La parte delicada es que la ronda sea INEQUÍVOCA: entre los 4 números
// debe haber exactamente uno que rompa la propiedad elegida, y ninguna
// otra propiedad del banco debe aislar también, de forma igual de limpia,
// a un número DISTINTO — si pasara eso, un jugador podría señalar otro
// número con toda la razón. `generarRonda` genera y verifica ambas cosas
// antes de aceptar la ronda; ver comentarios más abajo.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const MIN = 2;
const MAX = 99;

function sumaCifras(n) {
  return String(n)
    .split("")
    .reduce((acc, c) => acc + Number(c), 0);
}

function esPrimo(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function esCuadrado(n) {
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

// Banco de propiedades: 7 familias (las pedidas) instanciadas con varios
// parámetros cada una, para tener bastante variedad de rondas y, sobre
// todo, un conjunto amplio contra el que comprobar ambigüedad cruzada.
const K_MULTIPLO = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const D_CIFRA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const T_UMBRAL = [10, 20, 30, 40, 50, 60, 70, 80, 90];

export function construirBanco() {
  const banco = [
    {
      id: "par",
      check: (n) => n % 2 === 0,
      describe: "son pares",
      breakReason: (n) => `${n} es impar`,
    },
    {
      id: "impar",
      check: (n) => n % 2 !== 0,
      describe: "son impares",
      breakReason: (n) => `${n} es par`,
    },
    {
      id: "primo",
      check: esPrimo,
      describe: "son números primos",
      breakReason: (n) => `${n} no es primo`,
    },
    {
      id: "cuadrado",
      check: esCuadrado,
      describe: "son cuadrados perfectos",
      breakReason: (n) => `${n} no es un cuadrado perfecto`,
    },
    {
      id: "suma-par",
      check: (n) => sumaCifras(n) % 2 === 0,
      describe: "tienen la suma de sus cifras par",
      breakReason: (n) => `${n} tiene la suma de sus cifras impar (${sumaCifras(n)})`,
    },
    {
      id: "suma-impar",
      check: (n) => sumaCifras(n) % 2 !== 0,
      describe: "tienen la suma de sus cifras impar",
      breakReason: (n) => `${n} tiene la suma de sus cifras par (${sumaCifras(n)})`,
    },
  ];
  K_MULTIPLO.forEach((k) => {
    banco.push({
      id: `multiplo-${k}`,
      check: (n) => n % k === 0,
      describe: `son múltiplos de ${k}`,
      breakReason: (n) => `${n} no es múltiplo de ${k}`,
    });
  });
  D_CIFRA.forEach((d) => {
    banco.push({
      id: `cifra-${d}`,
      check: (n) => String(n).includes(String(d)),
      describe: `contienen la cifra ${d}`,
      breakReason: (n) => `${n} no contiene la cifra ${d}`,
    });
  });
  T_UMBRAL.forEach((t) => {
    banco.push({
      id: `mayor-${t}`,
      check: (n) => n > t,
      describe: `son mayores que ${t}`,
      breakReason: (n) => `${n} no es mayor que ${t}`,
    });
    banco.push({
      id: `menor-${t}`,
      check: (n) => n < t,
      describe: `son menores que ${t}`,
      breakReason: (n) => `${n} no es menor que ${t}`,
    });
  });
  return banco;
}

// Cuántos de los 4 números rompen (no cumplen) una propiedad.
export function contarRotos(numeros, propiedad) {
  return numeros.filter((n) => !propiedad.check(n)).length;
}

// Genera 3 números que cumplen la propiedad y 1 que no, todos distintos.
function generarCandidato(propiedad) {
  const cumplen = new Set();
  let guard = 0;
  while (cumplen.size < 3 && guard < 500) {
    const n = randInt(MIN, MAX);
    if (propiedad.check(n)) cumplen.add(n);
    guard++;
  }
  if (cumplen.size < 3) return null;

  let intruso = null;
  guard = 0;
  while (guard < 500) {
    const n = randInt(MIN, MAX);
    if (!propiedad.check(n) && !cumplen.has(n)) {
      intruso = n;
      break;
    }
    guard++;
  }
  if (intruso === null) return null;

  return { numeros: shuffle([...cumplen, intruso]), intrusoValor: intruso };
}

// Combinación de reserva fija para el caso — muy improbable — de que 500
// intentos no basten: propiedad "son números primos" con 23, 29, 31
// (primos) y 44 como intruso (44 = 4×11, no primo). Verificada a mano
// contra las ~50 propiedades del banco (script de comprobación aparte):
// "primo" aísla exactamente a 44; otras dos propiedades ("impar" y
// "menor que 40") también aíslan un único número, pero ambas señalan al
// MISMO 44, así que refuerzan la respuesta en vez de crear ambigüedad;
// ninguna propiedad del banco aísla, ella sola, a 23, 29 o 31.
const RONDA_RESERVA = {
  propiedad: {
    id: "primo",
    check: esPrimo,
    describe: "son números primos",
    breakReason: (n) => `${n} no es primo`,
  },
  numeros: [23, 29, 31, 44],
  intrusoValor: 44,
};

// Genera una ronda completa e inequívoca:
// 1) elige una propiedad al azar del banco,
// 2) genera 3 números que la cumplen y 1 que no (todos distintos),
// 3) comprueba que exactamente 1 de los 4 la rompe,
// 4) comprueba que NINGUNA otra propiedad del banco aísla, ella sola, a
//    un número distinto del intruso elegido (si lo hiciera, la ronda
//    sería ambigua de verdad: el jugador podría razonar con esa otra
//    regla y señalar, con razón, a otro número).
// `stats`, si se pasa, acumula contadores para poder medir en pruebas
// cuántas veces hizo falta regenerar por ambigüedad.
export function generarRonda(banco = construirBanco(), stats) {
  const MAX_INTENTOS = 500;
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    if (stats) stats.intentos = (stats.intentos || 0) + 1;
    const propiedad = pick(banco);
    const candidato = generarCandidato(propiedad);
    if (!candidato) continue;
    const { numeros, intrusoValor } = candidato;

    if (contarRotos(numeros, propiedad) !== 1) continue; // guarda de sanidad

    let ambiguo = false;
    for (const otra of banco) {
      if (otra.id === propiedad.id) continue;
      const rotos = numeros.filter((n) => !otra.check(n));
      if (rotos.length === 1 && rotos[0] !== intrusoValor) {
        ambiguo = true;
        break;
      }
    }
    if (ambiguo) {
      if (stats) stats.ambiguas = (stats.ambiguas || 0) + 1;
      continue;
    }

    return { propiedad, numeros, intrusoValor };
  }
  if (stats) stats.reservas = (stats.reservas || 0) + 1;
  return RONDA_RESERVA;
}

export function mountIntrusoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let ronda = null;
  const banco = construirBanco();
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
    ronda = generarRonda(banco);
    locked = false;

    body.innerHTML = `
      <p class="in-prompt">Toca el número que <b>no</b> encaja con los demás</p>
      <div class="in-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
    `;

    const grid = body.querySelector("[data-grid]");
    ronda.numeros.forEach((n, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn in-card";
      btn.type = "button";
      btn.dataset.num = String(n);
      btn.dataset.idx = String(idx);
      btn.textContent = n;
      btn.addEventListener("click", () => elegir(n, btn));
      grid.appendChild(btn);
    });
  }

  function elegir(n, btn) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const { propiedad, intrusoValor } = ronda;
    const acierto = n === intrusoValor;

    body.querySelectorAll(".in-card").forEach((card) => {
      card.disabled = true;
      if (Number(card.dataset.num) === intrusoValor) card.classList.add("correct");
      else if (card === btn) card.classList.add("wrong");
    });

    if (acierto) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! Los otros tres ${propiedad.describe}. En cambio, ${propiedad.breakReason(intrusoValor)} — por eso era el intruso.`;
      feedback.className = "feedback ok";
      later(nextRound, 1600);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Ese no era el intruso: ${n} también cumple lo que comparten los otros (${propiedad.describe}). El intruso real era ${intrusoValor}, porque ${propiedad.breakReason(intrusoValor)}.`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1800);
      later(nextRound, 1800);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "intruso", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕵️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas jugadas</p>
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
    timers.forEach(clearTimeout);
  };
}
