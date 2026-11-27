# 🔟 Ortografía 10 — aprender ortografía jugando

PWA en blanco y negro con el logotipo elegido en [`ortologo/`](../ortologo)
(familia «Ortografía10» en bloque y alineado a la izquierda, como el nº 1968).

- **URL:** https://pacosql.github.io/Train/ortografia10/
- **Prefijo Supabase:** `ortografia10_` · **caché:** `ortografia10-*`

## Dos lados

- **Jugar**: rondas de 10 ejercicios de tipos variados. Los tipos con 👍
  salen el triple y los 👎 no salen. Cada respuesta enseña la regla
  (competencia de Orto, con su truco) y deja votar ese tipo ahí mismo.
- **Valorar**: los 20 tipos con descripción, ejemplo, de dónde sale la
  idea, ▶ Probar (3 seguidos de ese tipo) y 👍/👎 con el total de todos los
  dispositivos.

## Tipos de ejercicio

| id | Tipo | Idea de |
|---|---|---|
| `caza` | 🎯 Caza la falta (frase real; o «No hay ninguna falta») | Projet Voltaire |
| `porque` | 💡 ¿Por qué se escribe así? (elige la regla) | Projet Voltaire |
| `bienmal` | ✅ ¿Bien o mal? | Instagram (encuesta) |
| `elige` | 🅰️ ¿Cómo se escribe? A/B/C | Instagram (quiz) |
| `intruso` | 🕵️ El intruso (4 palabras, 1 mal) | Instagram |
| `cuantas` | 🔢 ¿Cuántas faltas hay? (0-3) | Instagram |
| `cartel` | 🪧 El cartel con falta | Instagram (carteles reales) |
| `hueco` | 🕳️ Rellena el hueco (homófonos, diacríticas) | Instagram + Orto |
| `refran` | 📜 El refrán roto (20 refranes hechos a mano) | Orto Redes |
| `reloj` | ⏱️ Contrarreloj 20 s | Orto (semáforo) |
| `letra` | 🔤 Falta la letra | Orto |
| `tilde` | ´ Pon la tilde | Orto |
| `dictado` | 🎧 Dictado (voz del navegador) | Orto |
| `junto` | 🔗 ¿Junto o separado? | Orto |
| `tonica` | 🔊 La sílaba fuerte | Orto |
| `clase` | 🏷️ Aguda, llana o esdrújula | Orto |
| `puntua` | ❗ Comas y puntos | Orto |
| `mayus` | 🔠 Mayúsculas | Orto |
| `parejas` | 🃏 Une las parejas | Orto |
| `corrige` | ✏️ Corrígela tú (escribir sin opciones) | nuevo |

## Material

`datos.json` sale de `orto/datos` con `python3 ortografia10/tools/datos.py`:
4.000 palabras con sus faltas típicas, 1.500 frases de prensa, 1.300
ejercicios hechos a mano (hueco, elige, caza, frase, parejas) y las 86
competencias con regla y truco. `silabas.js` es una copia del motor de
sílabas de Orto.

## Tablas

`tablas.sql`: `ortografia10_votos` (`tipo`, `valor` 1/-1/0, `dispositivo`)
y `ortografia10_respuestas` (`tipo`, `acierto`, `dispositivo`). La app
guarda todo en `localStorage` y lo sube en cola: si la tabla no existe o no
hay red, lo reintenta al abrir.
