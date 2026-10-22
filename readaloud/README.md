# 🔊 Read Aloud

Pega o escribe cualquier texto, guárdalo y escúchalo leído en voz alta
(acento americano por defecto) con la palabra que se está leyendo
resaltada, para practicar la pronunciación.

- **Voz**: Web Speech API del navegador (`speechSynthesis`). Elige sola
  la mejor voz `en-US` disponible (Natural/Premium/Samantha/Google US…);
  se puede cambiar en el selector y se recuerda por dispositivo.
- **Resaltado**: usa los eventos `boundary` de palabra cuando el
  navegador los da (Safari/iOS, Edge, voces locales); si no (voces de
  Google en Chrome de escritorio), lo estima con un reloj que se calibra
  solo con la duración real de cada frase.
- **Lectura por frases**: una utterance por frase (las largas se parten
  por comas), así no se corta a los ~15 s en Chrome y se puede repetir
  la frase en bucle (🔁) o saltar (⏮ ⏭).
- **Tocar una palabra**: la dice sola; ▶ continúa desde ahí.

Supabase: tabla `readaloud_texts` (id, title, body, created_at,
updated_at) con RLS abierta a anon (select/insert/update/delete).
