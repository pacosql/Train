import { mountQuizGame } from "./quiz-engine.js";
import { QUIZ_GAMES } from "./games-data.js";
import { mountGameEscena } from "./game-escena.js";
import { mountGameCadena } from "./game-cadena.js";
import { mountGameMemoria } from "./game-memoria.js";
import { getRating, getRatingNote, setRating, initRatings, reloadRatings, fetchReworkNote } from "./ratings.js";

// El número de cada juego (#1, #2…) es su posición en este array — los
// juegos nuevos siempre se añaden al final, igual que en Math Games.
const GAMES = [
  ...QUIZ_GAMES,
  { id: "viste-la-escena", title: "Viste la escena", emoji: "🧥", topic: "Varias palabras a la vez, en contexto", custom: mountGameEscena },
  { id: "cadena-escena", title: "La cadena de la escena", emoji: "🎬", topic: "Palabras relacionadas, en pantallas seguidas", custom: mountGameCadena },
  { id: "memoria-bilingue", title: "Memoria bilingüe", emoji: "🃏", topic: "Repaso y consolidación", custom: mountGameMemoria },
].map((g, i) => ({ ...g, num: i + 1 }));
const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

const { url, anonKey } = window.VOCAB_CONFIG || {};
const client =
  url && anonKey && window.supabase ? window.supabase.createClient(url, anonKey) : null;

const root = document.getElementById("app");
let cleanupCurrent = null;
let activeTab = "new";
let reworkNote = null;

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function teardown() {
  if (cleanupCurrent) {
    cleanupCurrent();
    cleanupCurrent = null;
  }
}

function categorize() {
  const groups = { new: [], like: [], dislike: [], review: [] };
  GAMES.forEach((g) => {
    const r = getRating(g.id);
    const key = r === "like" || r === "dislike" || r === "review" ? r : "new";
    groups[key].push(g);
  });
  return groups;
}

function renderReworkNote() {
  if (!reworkNote || !Array.isArray(reworkNote.games) || !reworkNote.games.length) return "";
  const names = reworkNote.games
    .map((id) => (GAMES_BY_ID[id] ? `#${GAMES_BY_ID[id].num} ${GAMES_BY_ID[id].title}` : id))
    .join(", ");
  const when = reworkNote.at ? new Date(reworkNote.at).toLocaleString() : "";
  return `<div class="rework-note">🔧 <b>Última tanda de mejoras</b>${when ? ` · ${when}` : ""}<br>${names}${
    reworkNote.summary ? `<br><span class="rework-sum">${reworkNote.summary}</span>` : ""
  }</div>`;
}

async function renderMenu() {
  teardown();
  const groups = categorize();
  root.innerHTML = `
    <div class="menu-wrap">
      <div class="menu-header">
        <h1>📚 Vocabulary</h1>
        <p>Aprende las 1000 primeras palabras de inglés. Valora cada ejercicio con 👍 / 👎 para organizar las ideas.</p>
      </div>
      <div class="tab-bar" data-tabs>
        <button class="tab-btn" data-tab="new">🆕 Nuevos (${groups.new.length})</button>
        <button class="tab-btn" data-tab="like">👍 Me gusta (${groups.like.length})</button>
        <button class="tab-btn" data-tab="dislike">👎 No me gusta (${groups.dislike.length})</button>
        <button class="tab-btn" data-tab="review">🔧 Revisar (${groups.review.length})</button>
      </div>
      ${renderReworkNote()}
      <div class="game-grid" data-grid></div>
      <div class="recent">
        <h2>Últimas partidas</h2>
        <ul data-recent><li class="empty">Cargando…</li></ul>
      </div>
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
        ? "No quedan ejercicios nuevos — ¡los has valorado todos!"
        : activeTab === "like"
        ? "Aún no has marcado ningún ejercicio con 👍."
        : activeTab === "dislike"
        ? "Aún no has marcado ningún ejercicio con 👎."
        : "Aún no has marcado ningún ejercicio para revisar.";
    grid.innerHTML = `<div class="tab-empty">${msg}</div>`;
    return;
  }
  grid.innerHTML = "";
  list.forEach((g) => {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `#/game/${g.id}`;
    const note = activeTab === "review" ? getRatingNote(g.id) : "";
    card.innerHTML = `<span class="num-badge">#${g.num}</span>${g.v ? `<span class="v-badge">v${g.v}</span>` : ""}<span class="emoji">${g.emoji}</span><span class="name">${g.title}</span><span class="topic">${g.topic}</span>${
      note ? `<span class="note-hint">📝 ${escapeHtml(note)}</span>` : ""
    }`;
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
    .from("vocab_scores")
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
      <div class="game-num-header">Ejercicio #${game.num} · ${game.title}${game.v ? ` · v${game.v}` : ""}</div>
      <div class="game-mount" data-mount></div>
      <div class="rate-bar" data-rate-bar>
        <button class="rate-btn dislike" data-rate="dislike">👎 No me gusta</button>
        <button class="rate-btn review" data-rate="review">🔧 Revisar</button>
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
  function openReviewNote(isEditing) {
    if (root.querySelector("[data-review-box]")) return;
    const screen = root.querySelector("[data-screen]");
    const box = document.createElement("div");
    box.className = "review-note-box";
    box.setAttribute("data-review-box", "");
    box.innerHTML = `
      <label for="review-note-input">¿Qué falla? Cuéntalo y se usará para mejorarlo</label>
      <textarea id="review-note-input" data-review-input rows="3" placeholder="Ej.: los distractores son demasiado fáciles..."></textarea>
      <div class="review-note-actions">
        <button type="button" data-review-cancel>Cancelar</button>
        ${isEditing ? `<button type="button" class="review-note-remove" data-review-remove>Quitar de 🔧 Revisar</button>` : ""}
        <button type="button" class="review-note-save" data-review-save>${
          isEditing ? "Guardar nota" : "Guardar y marcar 🔧"
        }</button>
      </div>
    `;
    screen.appendChild(box);
    const textarea = box.querySelector("[data-review-input]");
    textarea.value = getRatingNote(id);
    textarea.focus();
    const disableBox = () => box.querySelectorAll("button, textarea").forEach((el) => (el.disabled = true));
    box.querySelector("[data-review-cancel]").addEventListener("click", () => box.remove());
    box.querySelector("[data-review-remove]")?.addEventListener("click", async () => {
      disableBox();
      await setRating(id, "new");
      onExit();
    });
    box.querySelector("[data-review-save]").addEventListener("click", async () => {
      disableBox();
      await setRating(id, "review", textarea.value.trim());
      onExit();
    });
  }
  rateBar.querySelectorAll(".rate-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.rate;
      const current = getRating(id);
      if (value === "review") {
        openReviewNote(current === "review");
        return;
      }
      rateBar.querySelectorAll(".rate-btn").forEach((b) => (b.disabled = true));
      await setRating(id, current === value ? "new" : value);
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

(async () => {
  try {
    await initRatings(client);
    reworkNote = await fetchReworkNote();
  } catch (_) {
    // Sin red se juega igual, solo que sin valoraciones.
  }
  if (!location.hash || location.hash === "#/") route();
})();

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") return;
  if (location.hash && location.hash !== "#/") return;
  await reloadRatings();
  reworkNote = await fetchReworkNote();
  route();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
