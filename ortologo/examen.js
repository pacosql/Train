// Las 10 preguntas de la guía (guia.html) y cómo se pinta el examen de un
// diseño. Lo usan la app (index.html) y el ranking (ranking.html).
//
// En la base de datos, `ortologo_disenos.examen` es:
//   { p: [10 notas: 1 aprueba · 0.5 a medias · 0 suspende], t: suma,
//     o: orden de desempate (1 = mejor), v: veredicto en una frase,
//     n: { "<nº de pregunta 1-10>": "nota propia que sustituye a la genérica" } }
window.ORTOLOGO_EXAMEN = (() => {
  const QS = [
    ["¿Se entiende en un segundo?", "Una sola idea: se entiende de un vistazo.", "Hay que mirarlo un momento para entenderlo.", "Demasiados elementos: no se entiende en un segundo."],
    ["¿Lo dibujarías de memoria?", "Se puede dibujar de memoria con un boli.", "Se recuerda la idea, pero no los detalles.", "No se podría reproducir sin mirarlo."],
    ["¿Se reconoce a 16 píxeles?", "Se reconoce en la pestaña del navegador y en una notificación.", "En pequeño se intuye, pero pierde detalle.", "A 16 px es una mancha: necesita una versión simplificada."],
    ["¿Funciona a una sola tinta?", "Funciona igual en negro sobre blanco.", "A una tinta se mantiene el dibujo, pero se pierde parte de la idea.", "Depende de sus colores: a una tinta no se entiende."],
    ["¿Se distingue entre treinta apps?", "Destaca en la pantalla de inicio.", "Correcto, pero no es de los que primero se ven.", "Se pierde entre los demás iconos."],
    ["¿Tiene que ver con lo que eres?", "Habla de ortografía: la tilde, la letra bien puesta o el nombre.", "Habla de español más que de ortografía.", "No se relaciona con lo que hace la app."],
    ["¿Aguantará veinte años?", "Formas simples y letra neutra: no caduca.", "Lleva algún recurso de moda que puede envejecer.", "Muy de ahora: en unos años se verá antiguo."],
    ["¿Vale para todo?", "Cabe en el icono, el avatar redondo, la pegatina y el Reel.", "Funciona en grande; en formatos pequeños o redondos sufre.", "Solo funciona en un formato."],
    ["¿Da familia?", "Deja sitio para Mates10 con las mismas reglas.", "El hermano de Mates10 habría que inventarlo aparte.", "No da pie a una serie."],
    ["¿Es tuyo?", "Es difícil confundirlo con otro y se puede registrar.", "Una letra sola es difícil de registrar: mejor siempre junto al nombre.", "Se parece a símbolos que ya usan otros."],
  ];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ok = (ex) => ex && Array.isArray(ex.p) && ex.p.length === 10;
  const nota = (ex) => (ok(ex) ? ex.p.reduce((a, b) => a + (+b || 0), 0) : null);
  const fmt = (n) => String(n).replace(".", ",");
  const clase = (v) => (v >= 1 ? "si" : v > 0 ? "medio" : "no");
  const signo = (v) => (v >= 1 ? "✓" : v > 0 ? "~" : "✗");
  // «para toda la vida»: 8 o más y sin suspender ninguna de las cuatro primeras
  const paraSiempre = (ex) => ok(ex) && nota(ex) >= 8 && ex.p.slice(0, 4).every((v) => v > 0);
  const etiqueta = (ex) => { const n = nota(ex); return paraSiempre(ex) ? "Para toda la vida" : n >= 8 ? "Bueno, con un pero importante" : n >= 6.5 ? "Buen logotipo, flojo como icono" : "Bonito, pero no es un logo"; };
  const puntos = (ex) => (ok(ex) ? `<span class="ex-dots">${ex.p.map((v, i) => `<i class="${clase(v)}" title="${i + 1}. ${esc(QS[i][0])}"></i>`).join("")}</span>` : "");
  function html(ex) {
    if (!ok(ex)) return "";
    return `<div class="examen"><div class="ex-head"><b class="ex-nota">${fmt(nota(ex))}<small> / 10</small></b><div><b>${etiqueta(ex)}</b>${ex.v ? `<p>${esc(ex.v)}</p>` : ""}</div></div>
      <ol class="ex-list">${ex.p.map((v, i) => `<li class="${clase(v)}"><span class="ex-s">${signo(v)}</span><div><b>${esc(QS[i][0])}</b><br>${esc((ex.n && ex.n[i + 1]) || QS[i][v >= 1 ? 1 : v > 0 ? 2 : 3])}</div></li>`).join("")}</ol>
      <p class="ex-pie">Valoración de Claude con las 10 preguntas de la <a href="guia.html#preguntas">guía</a>. Es una opinión razonada, no una medida: la última palabra es tuya.</p></div>`;
  }
  const CSS = `
    .examen { border: 2px solid #141413; border-radius: 16px; padding: 14px 16px; margin: 14px 0 0; }
    .ex-head { display: flex; gap: 14px; align-items: center; }
    .ex-head p { margin: 2px 0 0; font-size: 0.86rem; color: #3b3a37; }
    .ex-nota { font-size: 2.2rem; font-weight: 800; line-height: 1; white-space: nowrap; }
    .ex-nota small { font-size: 0.9rem; font-weight: 500; color: #6b6a66; }
    .ex-list { list-style: none; margin: 12px 0 0; padding: 0; }
    .ex-list li { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid #e6e4dd; font-size: 0.84rem; line-height: 1.4; }
    .ex-s { width: 24px; height: 24px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: #fff; }
    .ex-list li.si .ex-s { background: #1f9d55; } .ex-list li.medio .ex-s { background: #c98a12; } .ex-list li.no .ex-s { background: #d6453d; }
    .ex-pie { font-size: 0.74rem; color: #6b6a66; margin: 10px 0 0; }
    .ex-dots { display: inline-flex; gap: 3px; vertical-align: middle; }
    .ex-dots i { width: 9px; height: 9px; border-radius: 50%; display: block; }
    .ex-dots i.si { background: #1f9d55; } .ex-dots i.medio { background: #e0a526; } .ex-dots i.no { background: #d6453d; }`;
  return { QS, ok, nota, fmt, clase, etiqueta, paraSiempre, puntos, html, CSS };
})();
