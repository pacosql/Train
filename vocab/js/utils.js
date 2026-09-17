// Utilidades compartidas por todos los juegos de Vocabulary.
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Elige `count` elementos distintos de `arr` (sin repetir), excluyendo
// opcionalmente uno concreto — para sacar distractores de la misma
// categoría que la palabra objetivo.
export function pickN(arr, count, exclude = null) {
  const pool = exclude == null ? arr.slice() : arr.filter((x) => x !== exclude);
  return shuffle(pool).slice(0, count);
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Normaliza texto escrito por el alumno para comparar: minúsculas, sin
// espacios sobrantes, sin acentos (para no penalizar un acento que en
// inglés no existe siquiera, como al escribir "cafe").
export function normalizeAnswer(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export async function saveScore(client, game, { score, rounds, avgMs }) {
  if (!client) return;
  try {
    await client.from("vocab_scores").insert({
      game,
      score,
      rounds: rounds ?? null,
      avg_ms: avgMs ?? null,
    });
  } catch (_) {
    // El marcador es una guinda, nunca debe romper la partida.
  }
}
