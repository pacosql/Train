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
import { GAMES_PACK_29 } from "./games-pack-29.js";
import { GAMES_PACK_30 } from "./games-pack-30.js";
import { GAMES_PACK_31 } from "./games-pack-31.js";
import { GAMES_PACK_32 } from "./games-pack-32.js";
import { GAMES_PACK_33 } from "./games-pack-33.js";
import { GAMES_PACK_34 } from "./games-pack-34.js";
import {
  getRating,
  getRatingNote,
  getAudioUrl,
  isReview,
  setRating,
  setReview,
  initRatings,
  reloadRatings,
  fetchReworkNote,
} from "./ratings.js";
import { startRecording, canRecord, canTranscribe } from "./voice.js";

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
  ...GAMES_PACK_29,
  ...GAMES_PACK_30,
  ...GAMES_PACK_31,
  ...GAMES_PACK_32,
  ...GAMES_PACK_33,
  ...GAMES_PACK_34,
].map((g, i) => ({ ...g, num: i + 1 }));
const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

const { url, anonKey } = window.FOOTBALL_CONFIG || {};
const client =
  url && anonKey && window.supabase ? window.supabase.createClient(url, anonKey) : null;

const root = document.getElementById("app");
let cleanupCurrent = null;
let cleanupReview = null; // corta una grabación en curso al salir
let activeTab = "new";

// Nota de la última tanda de mejoras publicada por el agente revisor; se
// pinta en el menú para saber qué ha cambiado desde la última vez.
let reworkNote = null;

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function teardown() {
  if (cleanupReview) {
    cleanupReview();
    cleanupReview = null;
  }
  if (cleanupCurrent) {
    cleanupCurrent();
    cleanupCurrent = null;
  }
}

function categorize() {
  // 🔧 es una marca aparte: un ejercicio 👍+🔧 sale en "Me gusta" y en
  // "Revisar". Solo está en "Nuevos" si no tiene ni valoración ni 🔧.
  const groups = { new: [], like: [], dislike: [], final: [], review: [] };
  GAMES.forEach((g) => {
    const r = getRating(g.id);
    const review = isReview(g.id);
    if (r !== "new") groups[r].push(g);
    if (review) groups.review.push(g);
    if (r === "new" && !review) groups.new.push(g);
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
        <p>Elige un juego y a jugar. Puntúalo con 👍 / 👎 / 🔧 / 🏁 para organizar tus ideas.</p>
      </div>
      <div class="tab-bar" data-tabs>
        <button class="tab-btn" data-tab="new">🆕 Nuevos (${groups.new.length})</button>
        <button class="tab-btn" data-tab="like">👍 Me gusta (${groups.like.length})</button>
        <button class="tab-btn" data-tab="dislike">👎 No me gusta (${groups.dislike.length})</button>
        <button class="tab-btn" data-tab="final">🏁 Final (${groups.final.length})</button>
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

const RATING_ICON = { like: "👍", dislike: "👎", final: "🏁" };
let cardAudio = null;

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
        : activeTab === "review"
        ? "Aún no has marcado ningún juego para revisar."
        : "Aún no has dado ningún juego por 🏁 final.";
    grid.innerHTML = `<div class="tab-empty">${msg}</div>`;
    return;
  }
  grid.innerHTML = "";
  grid.onclick = (e) => {
    const btn = e.target.closest("[data-audio]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (cardAudio) cardAudio.pause();
    cardAudio = new Audio(btn.dataset.audio);
    cardAudio.play().catch(() => {});
  };
  list.forEach((g) => {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `#/game/${g.id}`;
    const inReview = activeTab === "review";
    const note = inReview ? getRatingNote(g.id) : "";
    const audio = inReview ? getAudioUrl(g.id) : "";
    // Marca pequeña con lo que no dice la pestaña: en "Revisar", la
    // valoración que lleva; en las demás, si además está en 🔧.
    const flag = inReview ? RATING_ICON[getRating(g.id)] || "" : isReview(g.id) ? "🔧" : "";
    card.innerHTML = `<span class="num-badge">#${g.num}</span>${g.v ? `<span class="v-badge">v${g.v}</span>` : ""}${
      flag ? `<span class="flag-badge">${flag}</span>` : ""
    }<span class="emoji">${g.emoji}</span><span class="name">${g.title}</span><span class="topic">${g.topic}</span>${
      note ? `<span class="note-hint">📝 ${escapeHtml(note)}</span>` : ""
    }${audio ? `<button type="button" class="note-audio" data-audio="${audio}">▶︎ Oír comentario</button>` : ""}`;
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
        <button class="rate-btn like" data-rate="like">👍 Me gusta</button>
        <button class="rate-btn final" data-rate="final">🏁 Final</button>
        <button class="rate-btn review" data-review-toggle>🔧 Revisar</button>
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
    rateBar.querySelectorAll("[data-rate]").forEach((b) => {
      b.classList.toggle("active", b.dataset.rate === current);
    });
    rateBar.querySelector("[data-review-toggle]").classList.toggle("active", isReview(id));
  }
  const disableBar = () => rateBar.querySelectorAll("button").forEach((b) => (b.disabled = true));
  function showRateMsg(text) {
    let el = root.querySelector("[data-rate-msg]");
    if (!el) {
      el = document.createElement("div");
      el.className = "rate-msg";
      el.setAttribute("data-rate-msg", "");
      rateBar.after(el);
    }
    el.textContent = text;
  }

  // 👍 / 👎 / 🏁: valoración exclusiva. Pulsar la que ya está puesta no la
  // quita: se queda como estaba y vuelve al menú (así lo quiere Paco). No
  // toca la marca 🔧, que va aparte. Vuelve al menú cuando Supabase confirma.
  rateBar.querySelectorAll("[data-rate]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.rate;
      disableBar();
      const err = getRating(id) !== value ? await setRating(id, value) : "";
      if (err) {
        rateBar.querySelectorAll("button").forEach((b) => (b.disabled = false));
        showRateMsg(err);
        return;
      }
      onExit();
    });
  });
  rateBar.querySelector("[data-review-toggle]").addEventListener("click", () => openReviewBox());

  // 🔧 Revisar: cuadro con grabación de voz (🎤), el texto (transcrito o
  // escrito) y la valoración con la que va (👍/👎/🏁 o ninguna).
  function openReviewBox() {
    if (root.querySelector("[data-review-box]")) return;
    const screen = root.querySelector("[data-screen]");
    const editing = isReview(id);
    let chosen = getRating(id);
    let rec = null; // grabación en curso
    let take = null; // { blob, mime, seconds, url } recién grabado
    let dropOld = false; // quitar el audio que ya había guardado
    let timer = null;
    const oldAudio = getAudioUrl(id);
    const box = document.createElement("div");
    box.className = "review-note-box";
    box.setAttribute("data-review-box", "");
    box.innerHTML = `
      <div class="rv-title">🔧 ¿Qué falla? Cuéntalo y se usará para mejorarlo</div>
      ${
        canRecord()
          ? `<button type="button" class="rv-rec" data-rv-rec>🎤 Grabar comentario</button>
             <div class="rv-hint">${
               canTranscribe()
                 ? "Habla con normalidad: se guarda el audio y se transcribe solo."
                 : "Este navegador no transcribe: se guarda el audio y puedes escribir abajo un resumen."
             }</div>`
          : `<div class="rv-hint">Este navegador no permite grabar audio: usa el micrófono del teclado para dictar.</div>`
      }
      <div class="rv-audio" data-rv-audio></div>
      <textarea id="review-note-input" data-review-input rows="3" placeholder="Lo que digas aparecerá aquí escrito (también puedes escribir o corregir)…"></textarea>
      <div class="rv-rating">
        <span>Valoración:</span>
        <button type="button" data-rv-rate="like">👍</button>
        <button type="button" data-rv-rate="dislike">👎</button>
        <button type="button" data-rv-rate="final">🏁</button>
        <button type="button" data-rv-rate="new">sin valorar</button>
      </div>
      <div class="rv-msg" data-rv-msg></div>
      <div class="review-note-actions">
        <button type="button" data-review-cancel>Cancelar</button>
        ${editing ? `<button type="button" class="review-note-remove" data-review-remove>Quitar 🔧</button>` : ""}
        <button type="button" class="review-note-save" data-review-save>Guardar 🔧</button>
      </div>
    `;
    screen.appendChild(box);
    const $ = (sel) => box.querySelector(sel);
    const textarea = $("[data-review-input]");
    textarea.value = getRatingNote(id);
    const msg = (t) => ($("[data-rv-msg]").textContent = t);

    function paintRating() {
      box.querySelectorAll("[data-rv-rate]").forEach((b) => b.classList.toggle("on", b.dataset.rvRate === chosen));
    }
    box.querySelectorAll("[data-rv-rate]").forEach((b) =>
      b.addEventListener("click", () => {
        chosen = b.dataset.rvRate;
        paintRating();
      })
    );
    paintRating();

    function paintAudio() {
      const slot = $("[data-rv-audio]");
      const url = take ? take.url : dropOld ? "" : oldAudio;
      slot.innerHTML = url
        ? `<audio controls src="${url}"></audio><button type="button" class="rv-del" data-rv-del>Borrar audio</button>`
        : "";
      const del = $("[data-rv-del]");
      if (del)
        del.addEventListener("click", () => {
          if (take) {
            URL.revokeObjectURL(take.url);
            take = null;
          } else dropOld = true;
          paintAudio();
        });
    }
    paintAudio();

    const recBtn = $("[data-rv-rec]");
    if (recBtn)
      recBtn.addEventListener("click", async () => {
        if (rec) {
          clearInterval(timer);
          recBtn.disabled = true;
          const got = await rec.stop();
          rec = null;
          recBtn.disabled = false;
          recBtn.classList.remove("on");
          recBtn.textContent = "🎤 Volver a grabar";
          if (take) URL.revokeObjectURL(take.url);
          take = { ...got, url: URL.createObjectURL(got.blob) };
          if (!got.text && canTranscribe()) msg("No se ha podido transcribir: queda el audio (puedes escribir un resumen).");
          paintAudio();
          return;
        }
        msg("");
        const base = textarea.value.trim();
        try {
          rec = await startRecording({
            onText: (finals, interim) => {
              textarea.value = [base, finals, interim].filter(Boolean).join(" ");
            },
          });
        } catch (err) {
          msg("Sin acceso al micrófono: " + (err && err.message ? err.message : err));
          return;
        }
        recBtn.classList.add("on");
        const tick = () => {
          const sec = Math.round((Date.now() - rec.startedAt) / 1000);
          recBtn.textContent = `⏹ Parar · ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
        };
        tick();
        timer = setInterval(tick, 250);
      });

    const close = () => {
      clearInterval(timer);
      if (rec) rec.cancel();
      rec = null;
      if (take) URL.revokeObjectURL(take.url);
      take = null;
      box.remove();
      cleanupReview = null;
    };
    cleanupReview = close;
    const lock = () => box.querySelectorAll("button, textarea").forEach((el) => (el.disabled = true));
    $("[data-review-cancel]").addEventListener("click", close);
    $("[data-review-remove]")?.addEventListener("click", async () => {
      lock();
      const err = await setReview(id, { review: false, rating: chosen });
      if (err) {
        msg(err);
        box.querySelectorAll("button, textarea").forEach((el) => (el.disabled = false));
        return;
      }
      close();
      onExit();
    });
    $("[data-review-save]").addEventListener("click", async () => {
      if (rec) {
        msg("Para la grabación antes de guardar.");
        return;
      }
      lock();
      msg(take ? "Subiendo el audio…" : "Guardando…");
      const audio = take ? { blob: take.blob, mime: take.mime } : dropOld ? null : undefined;
      const err = await setReview(id, { review: true, note: textarea.value.trim(), audio, rating: chosen });
      if (err) {
        msg(err);
        box.querySelectorAll("button, textarea").forEach((el) => (el.disabled = false));
        return;
      }
      close();
      onExit();
    });
  }
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
    // Cuando se publica una versión nueva, el service worker nuevo toma el
    // control: se recarga una vez para que se vea ya, sin tener que cerrar
    // y volver a abrir la app. (No al instalar por primera vez.)
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      // Si estás jugando, espera a que vuelvas al menú para no cortarte.
      const reloadWhenInMenu = () => {
        if (location.hash && location.hash !== "#/") {
          window.addEventListener("hashchange", reloadWhenInMenu, { once: true });
          return;
        }
        location.reload();
      };
      reloadWhenInMenu();
    });
  });
}
