// Utilidades compartidas por todos los juegos de Math Games.
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

// Genera N opciones únicas (incluye la correcta) a partir de una función
// que produce distractores plausibles cerca del valor correcto.
export function buildChoices(correct, distractorFn, count = 4) {
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < count && guard < 100) {
    set.add(distractorFn());
    guard++;
  }
  return shuffle(Array.from(set));
}

export async function saveScore(client, game, { score, rounds, avgMs }) {
  if (!client) return;
  try {
    await client.from("football_scores").insert({
      game,
      score,
      rounds: rounds ?? null,
      avg_ms: avgMs ?? null,
    });
  } catch (_) {
    // El marcador es una guinda, nunca debe romper la partida.
  }
}
