// Intérprete de frases dichas (o escritas) en español:
//   "hoy he aplicado a Microsoft, he ido 1 hora al gimnasio y he comido bien"
// → [{titulo:"Aplicado a Microsoft", minutos:null, tipo:"logro"},
//    {titulo:"Gimnasio", minutos:60, ...}, {titulo:"Comido bien", ...}]
// Además detecta "ayer" / "anteayer" / "el lunes" para la fecha.
// Sin dependencias; se usa en el navegador (window.LogrosParse) y en node
// (tests).
(function (root) {
  const NUM = {
    un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
    ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14,
    quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18,
    diecinueve: 19, veinte: 20, veinticinco: 25, treinta: 30, cuarenta: 40,
    cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
    cien: 100, ciento: 100, "ciento veinte": 120, "cuarenta y cinco": 45,
    "treinta y cinco": 35, "cincuenta y cinco": 55, "veinte y cinco": 25,
  };
  const NUM_WORDS = Object.keys(NUM).sort((a, b) => b.length - a.length).join("|");
  const N = `(\\d+(?:[.,]\\d+)?|${NUM_WORDS})`;
  const toNum = (s) => {
    s = s.toLowerCase();
    if (s in NUM) return NUM[s];
    return parseFloat(s.replace(",", "."));
  };

  // Cada patrón devuelve minutos. El orden importa: los más largos primero.
  const DUR = [
    [new RegExp(`\\b${N}\\s*(?:horas?|h)\\s*(?:y\\s*)?${N}\\s*(?:minutos?|mins?|m)\\b`, "i"), (m) => toNum(m[1]) * 60 + toNum(m[2])],
    [new RegExp(`\\b${N}\\s*(?:horas?|h)\\s+y\\s+media\\b`, "i"), (m) => toNum(m[1]) * 60 + 30],
    [new RegExp(`\\b${N}\\s*(?:horas?|h)\\s+y\\s+(?:un\\s+)?cuarto\\b`, "i"), (m) => toNum(m[1]) * 60 + 15],
    [new RegExp(`\\b${N}\\s*(?:horas?|h)\\s+(?:y\\s+)?tres\\s+cuartos\\b`, "i"), (m) => toNum(m[1]) * 60 + 45],
    [/\bhora\s+y\s+media\b/i, () => 90],
    [/\bhora\s+y\s+(?:un\s+)?cuarto\b/i, () => 75],
    [/\bmedia\s+hora\b/i, () => 30],
    [/\btres\s+cuartos\s+de\s+hora\b/i, () => 45],
    [/\b(?:un\s+)?cuarto\s+de\s+hora\b/i, () => 15],
    [/\b(\d+)h(\d{1,2})\b/i, (m) => +m[1] * 60 + +m[2]],
    [/\b(\d{1,2}):(\d{2})\s*(?:horas?|h)?\b/i, (m) => +m[1] * 60 + +m[2]],
    [new RegExp(`\\b${N}\\s*(?:horas?|h)\\b`, "i"), (m) => toNum(m[1]) * 60],
    [new RegExp(`\\b${N}\\s*(?:minutos?|mins?|m)\\b`, "i"), (m) => toNum(m[1])],
    [/\b(?:una\s+)?hora\b/i, () => 60],
  ];

  // Busca una duración en el texto y la quita (junto con "durante", "unos"…).
  function takeDuration(text) {
    for (const [re, f] of DUR) {
      const m = text.match(re);
      if (!m) continue;
      const min = Math.round(f(m));
      if (!(min > 0) || min > 1440) continue;
      let start = m.index, end = m.index + m[0].length;
      const before = text.slice(0, start);
      const pre = before.match(/\b(?:durante|por|unos|unas|como|casi|más de|menos de|alrededor de)(?:\s+(?:unos|unas))?\s*$/i);
      if (pre) start = pre.index;
      const rest = (text.slice(0, start) + " " + text.slice(end)).replace(/\s+/g, " ").trim();
      return { minutos: min, rest };
    }
    return { minutos: null, rest: text };
  }

  // Duración suelta escrita en un campo ("1h30", "90", "1,5 h", "45 min").
  function parseMinutes(s) {
    s = String(s || "").trim().toLowerCase();
    if (!s) return null;
    if (/^\d+$/.test(s)) return +s;
    if (/^\d+[.,]\d+$/.test(s)) return Math.round(parseFloat(s.replace(",", ".")) * 60);
    const { minutos } = takeDuration(s);
    return minutos;
  }

  function fmtMinutes(m) {
    if (m == null || m === "") return "";
    m = +m;
    const h = Math.floor(m / 60), r = m % 60;
    if (!h) return `${r} min`;
    if (!r) return `${h} h`;
    return `${h} h ${r} min`;
  }

  const FAIL = /\b(?:no\s+(?:he|me\s+he|pude|conseguí|logré|fui|hice)|fracaso|he\s+fallado|fallé|me\s+he\s+saltado|me\s+salté|he\s+suspendido|suspendí|me\s+han\s+rechazado|rechazad[oa])\b/i;

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // De "me he empezado a preparar para la entrevista de Canonical" a un
  // título corto: "Preparar entrevista de Canonical".
  function toTitle(frag) {
    let t = " " + frag.trim() + " ";
    t = t.replace(/[.!¡¿?]+/g, " ");
    const strip = [
      /^\s*(?:y|e|pues|bueno|vale|entonces|además|también|luego|después|hoy|ayer|anteayer|esta\s+mañana|esta\s+tarde|esta\s+noche|por\s+la\s+(?:mañana|tarde|noche))\b/i,
      /^\s*(?:el|este)\s+(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i,
      /^\s*(?:yo\s+)?(?:me\s+he|he|me|se\s+me\s+ha|se\s+me\s+han)\b/i,
      /^\s*(?:ido|estado)\s+(?=a\b|al\b|en\b)/i,
      /^\s*(?:estuve|estado|estaba)\s+(?=\S+(?:ando|iendo)\b)/i,
    ];
    let changed = true;
    while (changed) {
      changed = false;
      for (const re of strip) {
        const n = t.replace(re, " ");
        if (n !== t) { t = n; changed = true; }
      }
    }
    t = t
      .replace(/^\s*(?:empezado|comenzado|puesto)\s+a\s+(?:preparar(?:me)?|estudiar)\s+(?:para\s+)?(?:la|el|las|los)?\s*/i, "Preparar ")
      .replace(/^\s*(?:preparado|preparándome|preparandome)\s+(?:para\s+)?(?:la|el|las|los)?\s*/i, "Preparar ")
      .replace(/^\s*(?:a|al|en)\s+(?:el\s+|la\s+)?/i, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!t) return "";
    return cap(t);
  }

  const DAYS = { domingo: 0, lunes: 1, martes: 2, "miércoles": 3, miercoles: 3, jueves: 4, viernes: 5, "sábado": 6, sabado: 6 };

  function detectDate(text, today) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (/\banteayer\b|\bantes\s+de\s+ayer\b/i.test(text)) { d.setDate(d.getDate() - 2); return d; }
    if (/\bayer\b/i.test(text)) { d.setDate(d.getDate() - 1); return d; }
    const m = text.match(/\b(?:el|este)\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i);
    if (m) {
      const want = DAYS[m[1].toLowerCase()];
      let diff = (d.getDay() - want + 7) % 7;
      d.setDate(d.getDate() - diff);
      return d;
    }
    return null;
  }

  // Trocea el discurso en frases: comas, puntos, "y" seguido de un verbo
  // nuevo ("y he comido bien"), "también", "luego"… Nunca rompe "1,5" ni
  // "hora y media".
  function split(text) {
    return text
      .replace(/(\d),(\d)/g, "$1\u0001$2")
      .split(/[.;\n]+|,|\s+(?:y|e)\s+(?=(?:hoy|ayer|también|además|luego|después|he|me|no|fui|estuve|hice|tuve|terminé|acabé|empecé|aplicé|comí|dormí|leí|estudié|entrené|corrí|salí)\b)|\s+(?:y\s+)?(?:también|además|luego|después)\s+(?=\S)/i)
      .map((s) => s.replace(/\u0001/g, ",").trim())
      .filter((s) => s.replace(/[^\p{L}\d]/gu, "").length > 1);
  }

  function parse(text, today) {
    today = today || new Date();
    const fecha = detectDate(text, today);
    const items = [];
    for (const frag of split(text)) {
      const { minutos, rest } = takeDuration(frag);
      const tipo = FAIL.test(frag) ? "fracaso" : "logro";
      const titulo = toTitle(rest);
      if (!titulo) {
        // Solo una duración suelta ("durante dos horas"): va a la frase anterior.
        if (minutos && items.length && items[items.length - 1].minutos == null) items[items.length - 1].minutos = minutos;
        continue;
      }
      items.push({ titulo, minutos, tipo, descripcion: cap(frag.trim()) });
    }
    return { fecha, items };
  }

  const api = { parse, parseMinutes, fmtMinutes, toTitle, split, takeDuration };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LogrosParse = api;
})(typeof window !== "undefined" ? window : globalThis);
