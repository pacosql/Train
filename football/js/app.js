import { mountQuizGame } from "./quiz-engine.js";
import { mountBalloonsGame } from "./balloons-game.js";
import { QUIZ_GAMES } from "./games-data.js";

const GAMES = [
  { id: "globos", title: "Globos de multiplicar", emoji: "🎈", topic: "Multiplicación", custom: mountBalloonsGame },
  ...QUIZ_GAMES,
];
const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

const { url, anonKey } = window.FOOTBALL_CONFIG || {};
const client =
  url && anonKey && window.supabase ? window.supabase.createClient(url, anonKey) : null;

const root = document.getElementById("app");
let cleanupCurrent = null;

function teardown() {
  if (cleanupCurrent) {
    cleanupCurrent();
    cleanupCurrent = null;
  }
}

async function renderMenu() {
  teardown();
  root.innerHTML = `
    <div class="menu-wrap">
      <div class="menu-header">
        <h1>🧠 Math Games</h1>
        <p>Elige un juego y a jugar. Cada partida mide tu velocidad y puntuación.</p>
      </div>
      <div class="game-grid" data-grid></div>
      <div class="recent">
        <h2>Últimas partidas</h2>
        <ul data-recent><li class="empty">Cargando…</li></ul>
      </div>
      <div class="build-id">build __BUILD_ID__</div>
    </div>
  `;
  const grid = root.querySelector("[data-grid]");
  GAMES.forEach((g) => {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `#/game/${g.id}`;
    card.innerHTML = `<span class="emoji">${g.emoji}</span><span class="name">${g.title}</span><span class="topic">${g.topic}</span>`;
    grid.appendChild(card);
  });
  await renderRecent();
}

async function renderRecent() {
  const list = root.querySelector("[data-recent]");
  if (!list) return;
  if (!client) {
    list.innerHTML = `<li class="empty">Sin conexión con Supabase configurada.</li>`;
    return;
  }
  const { data, error } = await client
    .from("football_scores")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error || !data || data.length === 0) {
    list.innerHTML = `<li class="empty">Aún no hay partidas guardadas — ¡juega una!</li>`;
    return;
  }
  list.innerHTML = data
    .map((row) => {
      const title = GAMES_BY_ID[row.game]?.title || row.game;
      const when = row.created_at ? new Date(row.created_at).toLocaleTimeString() : "";
      return `<li><span>${title} · ${when}</span><b>${row.score} pts</b></li>`;
    })
    .join("");
}

function renderGame(id) {
  teardown();
  const game = GAMES_BY_ID[id];
  if (!game) {
    location.hash = "#/";
    return;
  }
  root.innerHTML = `<div class="game-screen" data-screen></div>`;
  const screen = root.querySelector("[data-screen]");
  const onExit = () => {
    location.hash = "#/";
  };
  if (game.custom) {
    cleanupCurrent = game.custom(screen, { client, onExit });
  } else {
    cleanupCurrent = mountQuizGame(screen, { ...game, client, onExit });
  }
}

function route() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/game\/([a-z]+)$/);
  if (match) {
    renderGame(match[1]);
  } else {
    renderMenu();
  }
}

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
