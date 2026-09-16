import { mountQuizGame } from "./quiz-engine.js";
import { mountBalloonsGame } from "./balloons-game.js";
import { QUIZ_GAMES } from "./games-data.js";
import { CREATIVE_GAMES } from "./games-creative.js";
import { getRating, setRating } from "./ratings.js";

const GAMES = [
  { id: "globos", title: "Globos de multiplicar", emoji: "🎈", topic: "Multiplicación", custom: mountBalloonsGame },
  ...CREATIVE_GAMES,
  ...QUIZ_GAMES,
];
const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

const { url, anonKey } = window.FOOTBALL_CONFIG || {};
const client =
  url && anonKey && window.supabase ? window.supabase.createClient(url, anonKey) : null;

const root = document.getElementById("app");
let cleanupCurrent = null;
let activeTab = "new";

function teardown() {
  if (cleanupCurrent) {
    cleanupCurrent();
    cleanupCurrent = null;
  }
}

function categorize() {
  const groups = { new: [], like: [], dislike: [] };
  GAMES.forEach((g) => {
    const r = getRating(g.id);
    const key = r === "like" || r === "dislike" ? r : "new";
    groups[key].push(g);
  });
  return groups;
}

async function renderMenu() {
  teardown();
  const groups = categorize();
  root.innerHTML = `
    <div class="menu-wrap">
      <div class="menu-header">
        <h1>🧠 Math Games</h1>
        <p>Elige un juego y a jugar. Puntúalo con 👍 / 👎 para organizar tus ideas.</p>
      </div>
      <div class="tab-bar" data-tabs>
        <button class="tab-btn" data-tab="new">🆕 Nuevos (${groups.new.length})</button>
        <button class="tab-btn" data-tab="like">👍 Me gusta (${groups.like.length})</button>
        <button class="tab-btn" data-tab="dislike">👎 No me gusta (${groups.dislike.length})</button>
      </div>
      <div class="game-grid" data-grid></div>
      <div class="recent">
        <h2>Últimas partidas</h2>
        <ul data-recent><li class="empty">Cargando…</li></ul>
      </div>
      <div class="build-id">build __BUILD_ID__</div>
    </div>
  `;
  root.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderGrid(groups);
    });
  });
  renderGrid(groups);
  await renderRecent();
}

function renderGrid(groups) {
  root.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === activeTab);
  });
  const grid = root.querySelector("[data-grid]");
  if (!grid) return;
  const list = groups[activeTab];
  if (!list.length) {
    const msg =
      activeTab === "new"
        ? "No quedan juegos nuevos — ¡los has valorado todos!"
        : activeTab === "like"
        ? "Aún no has marcado ningún juego con 👍."
        : "Aún no has marcado ningún juego con 👎.";
    grid.innerHTML = `<div class="tab-empty">${msg}</div>`;
    return;
  }
  grid.innerHTML = "";
  list.forEach((g) => {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `#/game/${g.id}`;
    card.innerHTML = `<span class="emoji">${g.emoji}</span><span class="name">${g.title}</span><span class="topic">${g.topic}</span>`;
    grid.appendChild(card);
  });
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
  root.innerHTML = `
    <div class="game-screen" data-screen>
      <div class="game-mount" data-mount></div>
      <div class="rate-bar" data-rate-bar>
        <button class="rate-btn dislike" data-rate="dislike">👎 No me gusta</button>
        <button class="rate-btn like" data-rate="like">👍 Me gusta</button>
      </div>
    </div>
  `;
  const mount = root.querySelector("[data-mount]");
  const onExit = () => {
    location.hash = "#/";
  };
  if (game.custom) {
    cleanupCurrent = game.custom(mount, { client, onExit });
  } else {
    cleanupCurrent = mountQuizGame(mount, { ...game, client, onExit });
  }

  const rateBar = root.querySelector("[data-rate-bar]");
  function refreshRateButtons() {
    const current = getRating(id);
    rateBar.querySelectorAll(".rate-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.rate === current);
    });
  }
  rateBar.querySelectorAll(".rate-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.rate;
      const current = getRating(id);
      setRating(id, current === value ? "new" : value);
      onExit();
    });
  });
  refreshRateButtons();
}

function route() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/game\/([a-z0-9-]+)$/);
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
