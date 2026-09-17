// Figura de una persona dibujada con CSS (sin imágenes), reutilizada por
// #13 Viste la escena y #14 La cadena de la escena. Cada ancla se pinta
// como un círculo de puntos hasta que se rellena con el emoji correcto.
export function renderPersonFigure(anchors, filled) {
  const anchorsHtml = anchors
    .map((a) => {
      const wordEmoji = filled[a.id];
      return `<button type="button" class="scene-anchor${wordEmoji ? " filled" : ""}" data-anchor="${a.id}" style="left:${a.x}%;top:${a.y}%">${
        wordEmoji || "?"
      }</button>`;
    })
    .join("");
  return `
    <div class="person-figure">
      <div class="person-head"></div>
      <div class="person-torso"></div>
      <div class="person-arm person-arm-l"></div>
      <div class="person-arm person-arm-r"></div>
      <div class="person-leg person-leg-l"></div>
      <div class="person-leg person-leg-r"></div>
      ${anchorsHtml}
    </div>
  `;
}
