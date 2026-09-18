import { mountQuizGame } from "./quiz-engine.js";
import { mountBalloonsGame } from "./balloons-game.js";
import { QUIZ_GAMES } from "./games-data.js";
import { CREATIVE_GAMES } from "./games-creative.js";
import { QUIZ_GAMES_2 } from "./games-data-2.js";
import { CREATIVE_GAMES_2 } from "./games-creative-2.js";
import { GAMES_PACK_3 } from "./games-pack.js";
import { GAMES_PACK_4 } from "./games-pack-4.js";
import { GAMES_PACK_5 } from "./games-pack-5.js";
import { GAMES_PACK_6 } from "./games-pack-6.js";
import { GAMES_PACK_7 } from "./games-pack-7.js";
import { GAMES_PACK_8 } from "./games-pack-8.js";
import { GAMES_PACK_9 } from "./games-pack-9.js";
import { GAMES_PACK_10 } from "./games-pack-10.js";
import { GAMES_PACK_11 } from "./games-pack-11.js";
import { GAMES_PACK_12 } from "./games-pack-12.js";
import { GAMES_PACK_13 } from "./games-pack-13.js";
import { GAMES_PACK_14 } from "./games-pack-14.js";
import { GAMES_PACK_15 } from "./games-pack-15.js";
import { GAMES_PACK_16 } from "./games-pack-16.js";
import { GAMES_PACK_17 } from "./games-pack-17.js";
import { GAMES_PACK_18 } from "./games-pack-18.js";
import { GAMES_PACK_19 } from "./games-pack-19.js";
import { GAMES_PACK_20 } from "./games-pack-20.js";
import { GAMES_PACK_21 } from "./games-pack-21.js";
import { GAMES_PACK_22 } from "./games-pack-22.js";
import { GAMES_PACK_23 } from "./games-pack-23.js";
import { GAMES_PACK_24 } from "./games-pack-24.js";
import { GAMES_PACK_25 } from "./games-pack-25.js";
import { GAMES_PACK_26 } from "./games-pack-26.js";
import { GAMES_PACK_27 } from "./games-pack-27.js";
import { GAMES_PACK_28 } from "./games-pack-28.js";
import { getRating, getRatingNote, setRating, initRatings, reloadRatings, fetchReworkNote } from "./ratings.js";

// El número de cada juego (#1, #2…) es su posición en este array — para
// que sea estable de verdad, los juegos nuevos SIEMPRE se añaden al
// final (nunca se insertan en medio ni se reordenan los existentes).
const GAMES = [
  { id: "globos", title: "Globos de multiplicar", emoji: "🎈", topic: "Multiplicación", custom: mountBalloonsGame },
  ...CREATIVE_GAMES,
  ...QUIZ_GAMES,
  ...QUIZ_GAMES_2,
  ...CREATIVE_GAMES_2,
  ...GAMES_PACK_3,
  ...GAMES_PACK_4,
  ...GAMES_PACK_5,
  ...GAMES_PACK_6,
  ...GAMES_PACK_7,
  ...GAMES_PACK_8,
  ...GAMES_PACK_9,
  ...GAMES_PACK_10,
  ...GAMES_PACK_11,
  ...GAMES_PACK_12,
  ...GAMES_PACK_13,
  ...GAMES_PACK_14,
  ...GAMES_PACK_15,
  ...GAMES_PACK_16,
  ...GAMES_PACK_17,
  ...GAMES_PACK_18,
  ...GAMES_PACK_19,
  ...GAMES_PACK_20,
  ...GAMES_PACK_21,
  ...GAMES_PACK_22,
  ...GAMES_PACK_23,
  ...GAMES_PACK_24,
  ...GAMES_PACK_25,
  ...GAMES_PACK_26,
  ...GAMES_PACK_27,
  ...GAMES_PACK_28,
].map((g, i) => ({ ...g, num: i + 1 }));
const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

const { url, anonKey } = window.FOOTBALL_CONFIG || {};
const client =
  url && anonKey && window.supabase ? window.supabase.createClient(url, anonKey) : null;

const root = document.getElementById("app");
let cleanupCurrent = null;
let activeTab = "new";

// Nota de la última tanda de mejoras publicada por el agente revisor; se
// pinta en el menú para saber qué ha cambiado desde la última vez.
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
        <h1>🧠 Math Games</h1>
        <p>Elige un juego y a jugar. Puntúalo con 👍 / 👎 para organizar tus ideas.</p>
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
        : activeTab === "dislike"
        ? "Aún no has marcado ningún juego con 👎."
        : "Aún no has marcado ningún juego para revisar.";
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
  // Marcar "🔧 Revisar" abre un cuadro para explicar qué falla — ese
  // texto se guarda junto con la valoración y lo lee quien mejora el
  // ejercicio, en vez de tener que adivinar por qué se marcó.
  function openReviewNote(isEditing) {
    if (root.querySelector("[data-review-box]")) return;
    const screen = root.querySelector("[data-screen]");
    const box = document.createElement("div");
    box.className = "review-note-box";
    box.setAttribute("data-review-box", "");
    box.innerHTML = `
      <label for="review-note-input">¿Qué falla? Cuéntalo y se usará para mejorarlo</label>
      <textarea id="review-note-input" data-review-input rows="3" placeholder="Ej.: la ruleta gira muy deprisa, cuesta leer el número a tiempo..."></textarea>
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
      // Se espera a que Supabase lo confirme antes de volver al menú, para
      // que la pestaña de destino ya muestre el cambio al llegar.
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

// Se pinta ya, sin esperar a la red: si Supabase tarda o no hay conexión
// la app tiene que arrancar igual (es una PWA). Cuando llegan las
// valoraciones se vuelve a pintar el menú con sus cuentas.
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

// Al volver a la pestaña, recarga por si se ha valorado desde otro
// dispositivo o el agente ha limpiado la bandeja de revisar.
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
