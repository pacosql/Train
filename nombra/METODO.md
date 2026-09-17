# Cómo se generan los nombres en Nombra

Este fichero existe porque las primeras tandas de esta app fueron un
mezclador mecánico de raíz + sufijo (`remateqo`, `golpeito`, `piqueqo`)
y eso no es un proceso de naming: es ruido con el `.com` libre. Lo que
sigue es el método que se aplica ahora, tomado de literatura real de
naming, y el registro que evita repetir trabajo.

## 1. Nunca se comprueba dos veces lo mismo

Toda comprobación de dominio se guarda en la tabla
`nombra_comprobados` (`nombre`, `com_libre`, `checked_at`), tanto si
salió libre como si salió ocupado. Antes de gastar una llamada a la
función `check-dominio` hay que consultar esa tabla. El histórico de
las primeras tandas ya está cargado ahí.

Esto importa porque cada comprobación tarda segundos y la mayoría de
los `.com` cortos y evidentes están cogidos: sin registro, cada tanda
vuelve a tropezar con los mismos nombres ocupados.

## 2. Los tres filtros que pasa un candidato

### SMILE — lo que hace bueno un nombre (Alexandra Watkins)

| Letra | Criterio | Pregunta |
|---|---|---|
| **S**uggestive | Evoca algo de la marca | ¿Sugiere el juego, no solo lo describe? |
| **M**emorable | Se engancha a algo familiar | ¿Se recuerda tras oírlo una vez? |
| **I**magery | Imagen mental | ¿Se ve algo al oírlo? |
| **L**egs | Recorrido | ¿Da juego para campañas, secciones, productos? |
| **E**motional | Emoción | ¿Mueve algo? |

### SCRATCH — lo que mata un nombre (Alexandra Watkins)

Spelling challenged (no se sabe escribir) · Copycat (se parece a otro) ·
Restrictive (encierra el negocio) · Annoying (forzado) · Tame (soso,
plano, descriptivo) · Curse of knowledge (solo se entiende con
explicación) · Hard to pronounce.

Los sufijos inventados tipo `-qo` fallan tres de golpe: no se saben
escribir, no se pronuncian solos y son forzados.

### Simbolismo fonético (Lexicon Branding)

El sonido comunica antes que el significado: la **v** transmite
vitalidad (Corvette, Vercel), la **b** fiabilidad (BlackBerry), la **z**
llama la atención (Azure), la **x** innovación, las oclusivas sordas
(p, t, k) son rápidas y explosivas — justo el golpeo de una raqueta —, y
las nasales (n, m) zumban y dan continuidad.

## 3. Tipos de nombre que se buscan (Igor Naming Guide)

- **Funcional/descriptivo** — dice lo que hace (`padelclub`). Es el más
  débil como marca y el peor para registrar: se evita.
- **Experiencial** — habla de la experiencia de uso.
- **Evocativo** — evoca el posicionamiento sin describir el producto
  (Uber, Apple, Virgin). Es el objetivo: más registrable y con más
  recorrido.
- **Inventado** — palabra nueva memorable (Oreo, Snapple). Vale si es
  divertida de decir; no vale si es una raíz con un sufijo pegado.

## 4. Familias creativas que se usan en este proyecto

1. **Léxico con doble sentido**: términos reales del juego que además
   significan algo bueno fuera de la pista (`ventaja`, `iguales`,
   `remontada`, `puntodulce`). Es la familia que mejor puntúa en SMILE.
2. **Onomatopeya del golpeo**: el sonido de la bola (`pock`, `clac`),
   apoyado en oclusivas sordas.
3. **Superficie y materia**: tierra batida, cristal, polvo de ladrillo.
4. **Comunidad y dobles**: el pádel es social (`dobles`, `lapareja`).
5. **Espacio de juego**: fondo de pista, línea de fondo, media pista.
6. **Inventado con sonido trabajado**: solo si suena bien dicho en voz
   alta y se escribe como se oye.

## 5. Qué se guarda de cada nombre

En `nombra_ideas`, además del estado y las comprobaciones:

- `metodo`: la familia de la que salió.
- `porque`: qué evoca, en una línea, para que la decisión no sea a
  ciegas.
- `colision_detalle`: qué se encontró al buscar colisiones de marca.

## 6. Lo que el cribado NO es

La comprobación de colisión es una búsqueda web contra marcas y
negocios existentes en España y EEUU. No hay API pública de OEPM, del
Registro Mercantil ni de USPTO, así que es un filtro serio de "no hay
nada evidente", no un certificado legal. Antes de registrar de verdad,
búsqueda de marca profesional.
