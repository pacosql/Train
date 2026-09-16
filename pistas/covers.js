// Catálogo de portadas de la app. Cada portada define colores, tipografía,
// disposición y un fondo SVG. Todas muestran solo el nombre del club y el
// botón "Reservar pista". La elegida se guarda en Supabase (pistas_config,
// key "cover") y se aplica para todo el mundo.

(function () {
  const C = {
    blue: "#2f6fed",
    blueDeep: "#1b3fa8",
    navy: "#0b1a3a",
    clay: "#b5652d",
    clayDeep: "#7f3f17",
    grass: "#2f9e44",
    grassDeep: "#1b5e2a",
    padel: "#8b5cf6",
    padelDeep: "#4c1d95",
    ball: "#d9f24a",
    gold: "#d4b86a",
    night: "#0a120c",
    cream: "#f6f1e4",
    white: "#ffffff",
  };

  const W = 400;
  const H = 800;

  function svg(inner, defs = "") {
    return `<svg class="cover-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs ? `<defs>${defs}</defs>` : ""}${inner}</svg>`;
  }

  // Pista de tenis vertical (red horizontal) dentro del rectángulo dado.
  function tennisV(x, y, w, h, stroke, sw = 2, opacity = 1) {
    const sx = w * 0.125;
    const s1 = y + h * 0.23;
    const s2 = y + h * 0.77;
    return `<g fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" />
      <line x1="${x + sx}" y1="${y}" x2="${x + sx}" y2="${y + h}" />
      <line x1="${x + w - sx}" y1="${y}" x2="${x + w - sx}" y2="${y + h}" />
      <line x1="${x + sx}" y1="${s1}" x2="${x + w - sx}" y2="${s1}" />
      <line x1="${x + sx}" y1="${s2}" x2="${x + w - sx}" y2="${s2}" />
      <line x1="${x + w / 2}" y1="${s1}" x2="${x + w / 2}" y2="${s2}" />
      <line x1="${x - w * 0.05}" y1="${y + h / 2}" x2="${x + w * 1.05}" y2="${y + h / 2}" stroke-width="${sw * 1.7}" />
    </g>`;
  }

  // Pista de tenis horizontal (red vertical).
  function tennisH(x, y, w, h, stroke, sw = 2, opacity = 1) {
    const sy = h * 0.125;
    const s1 = x + w * 0.23;
    const s2 = x + w * 0.77;
    return `<g fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" />
      <line x1="${x}" y1="${y + sy}" x2="${x + w}" y2="${y + sy}" />
      <line x1="${x}" y1="${y + h - sy}" x2="${x + w}" y2="${y + h - sy}" />
      <line x1="${s1}" y1="${y + sy}" x2="${s1}" y2="${y + h - sy}" />
      <line x1="${s2}" y1="${y + sy}" x2="${s2}" y2="${y + h - sy}" />
      <line x1="${s1}" y1="${y + h / 2}" x2="${s2}" y2="${y + h / 2}" />
      <line x1="${x + w / 2}" y1="${y - h * 0.05}" x2="${x + w / 2}" y2="${y + h * 1.05}" stroke-width="${sw * 1.7}" />
    </g>`;
  }

  // Pista de pádel vertical con paredes de cristal.
  function padelV(x, y, w, h, stroke, glass, sw = 2, opacity = 1) {
    return `<g fill="none" stroke-linecap="round" opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${glass}" stroke-width="${sw * 3.5}" />
      <g stroke="${stroke}" stroke-width="${sw}">
        <line x1="${x}" y1="${y + h * 0.15}" x2="${x + w}" y2="${y + h * 0.15}" />
        <line x1="${x}" y1="${y + h * 0.85}" x2="${x + w}" y2="${y + h * 0.85}" />
        <line x1="${x + w / 2}" y1="${y + h * 0.15}" x2="${x + w / 2}" y2="${y + h * 0.85}" />
        <line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke-width="${sw * 1.7}" stroke-dasharray="5 4" />
      </g>
    </g>`;
  }

  function padelH(x, y, w, h, stroke, glass, sw = 2, opacity = 1) {
    return `<g fill="none" stroke-linecap="round" opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${glass}" stroke-width="${sw * 3.5}" />
      <g stroke="${stroke}" stroke-width="${sw}">
        <line x1="${x + w * 0.15}" y1="${y}" x2="${x + w * 0.15}" y2="${y + h}" />
        <line x1="${x + w * 0.85}" y1="${y}" x2="${x + w * 0.85}" y2="${y + h}" />
        <line x1="${x + w * 0.15}" y1="${y + h / 2}" x2="${x + w * 0.85}" y2="${y + h / 2}" />
        <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke-width="${sw * 1.7}" stroke-dasharray="5 4" />
      </g>
    </g>`;
  }

  // Mapa del club: 3 duras, 3 tierra, 2 hierba, 5 pádel (horizontal).
  function clubMap(ox, oy, opts = {}) {
    const fill = opts.fill !== false;
    const stroke = opts.stroke || C.white;
    const glass = opts.glass || "rgba(255,255,255,0.55)";
    const cw = 100, ch = 46, gap = 14;
    const pw = 56, ph = 28, pgap = 12;
    let out = "";
    const rows = [
      [C.blue, 3],
      [C.clay, 3],
      [C.grass, 2],
    ];
    let y = oy;
    for (const [color, n] of rows) {
      const totalW = n * cw + (n - 1) * gap;
      let x = ox + (328 - totalW) / 2;
      for (let i = 0; i < n; i++) {
        if (fill) out += `<rect x="${x - 6}" y="${y - 6}" width="${cw + 12}" height="${ch + 12}" rx="5" fill="${color}" />`;
        out += tennisH(x, y, cw, ch, stroke, 1.4);
        x += cw + gap;
      }
      y += ch + 12 + 16;
    }
    let x = ox;
    for (let i = 0; i < 5; i++) {
      if (fill) out += `<rect x="${x - 4}" y="${y - 4}" width="${pw + 8}" height="${ph + 8}" rx="4" fill="${C.padel}" />`;
      out += padelH(x, y, pw, ph, stroke, glass, 1.2);
      x += pw + pgap;
    }
    return `<g>${out}</g>`;
  }

  function ball(cx, cy, r, fill = C.ball, seam = C.white, sw = 6) {
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />
      <path d="M ${cx - r * 0.55} ${cy - r * 0.84} C ${cx + r * 0.75} ${cy - r * 0.35}, ${cx + r * 0.75} ${cy + r * 0.35}, ${cx - r * 0.55} ${cy + r * 0.84}" fill="none" stroke="${seam}" stroke-width="${sw}" stroke-linecap="round" />
      <path d="M ${cx + r * 0.55} ${cy - r * 0.84} C ${cx - r * 0.75} ${cy - r * 0.35}, ${cx - r * 0.75} ${cy + r * 0.35}, ${cx + r * 0.55} ${cy + r * 0.84}" fill="none" stroke="${seam}" stroke-width="${sw}" stroke-linecap="round" />
    </g>`;
  }

  function racket(cx, cy, scale, color, rot = -30) {
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})" fill="none" stroke="${color}" stroke-linecap="round">
      <ellipse cx="0" cy="-60" rx="62" ry="80" stroke-width="9" />
      <g stroke-width="1.6" opacity="0.7">
        ${[-40, -20, 0, 20, 40].map((x) => `<line x1="${x}" y1="${-60 - Math.sqrt(1 - (x * x) / 3844) * 80}" x2="${x}" y2="${-60 + Math.sqrt(1 - (x * x) / 3844) * 80}" />`).join("")}
        ${[-110, -85, -60, -35, -10].map((y) => `<line x1="${-Math.sqrt(1 - ((y + 60) * (y + 60)) / 6400) * 62}" y1="${y}" x2="${Math.sqrt(1 - ((y + 60) * (y + 60)) / 6400) * 62}" y2="${y}" />`).join("")}
      </g>
      <path d="M -14 14 L -8 60 L 8 60 L 14 14" stroke-width="7" />
      <rect x="-9" y="60" width="18" height="90" rx="6" stroke-width="7" />
    </g>`;
  }

  function paddle(cx, cy, scale, color, holeColor, rot = -25) {
    let holes = "";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = -40 + c * 20;
        const y = -120 + r * 22;
        if (Math.abs(x) + Math.abs(y + 76) < 110) holes += `<circle cx="${x}" cy="${y}" r="4.5" fill="${holeColor}" />`;
      }
    }
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})">
      <rect x="-62" y="-150" width="124" height="150" rx="56" fill="${color}" />
      ${holes}
      <rect x="-13" y="-2" width="26" height="80" rx="10" fill="${color}" />
    </g>`;
  }

  // Pista en perspectiva vista desde el fondo.
  function perspectiveCourt(stroke, sw = 3, opacity = 1) {
    const yFar = 380, yNear = 790;
    const xl = (y) => 150 + (10 - 150) * ((y - yFar) / (yNear - yFar));
    const xr = (y) => 250 + (390 - 250) * ((y - yFar) / (yNear - yFar));
    const ins = (y, f) => xl(y) + (xr(y) - xl(y)) * f;
    const yNet = 540, yS1 = 450, yS2 = 660;
    return `<g fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" opacity="${opacity}">
      <polygon points="${xl(yFar)},${yFar} ${xr(yFar)},${yFar} ${xr(yNear)},${yNear} ${xl(yNear)},${yNear}" />
      <line x1="${ins(yFar, 0.125)}" y1="${yFar}" x2="${ins(yNear, 0.125)}" y2="${yNear}" />
      <line x1="${ins(yFar, 0.875)}" y1="${yFar}" x2="${ins(yNear, 0.875)}" y2="${yNear}" />
      <line x1="${ins(yS1, 0.125)}" y1="${yS1}" x2="${ins(yS1, 0.875)}" y2="${yS1}" />
      <line x1="${ins(yS2, 0.125)}" y1="${yS2}" x2="${ins(yS2, 0.875)}" y2="${yS2}" />
      <line x1="200" y1="${yS1}" x2="200" y2="${yS2}" />
      <line x1="${xl(yNet) - 12}" y1="${yNet}" x2="${xr(yNet) + 12}" y2="${yNet}" stroke-width="${sw * 2}" />
      <line x1="${xl(yNet) - 12}" y1="${yNet}" x2="${xl(yNet) - 12}" y2="${yNet - 40}" stroke-width="${sw * 1.5}" />
      <line x1="${xr(yNet) + 12}" y1="${yNet}" x2="${xr(yNet) + 12}" y2="${yNet - 40}" stroke-width="${sw * 1.5}" />
    </g>`;
  }

  function dots(seed, n, color, area) {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let out = "";
    for (let i = 0; i < n; i++) {
      out += `<circle cx="${(rnd() * area[0]).toFixed(1)}" cy="${(rnd() * area[1]).toFixed(1)}" r="${(0.6 + rnd() * 1.8).toFixed(1)}" fill="${color}" opacity="${(0.15 + rnd() * 0.35).toFixed(2)}" />`;
    }
    return out;
  }

  const glowFilter = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>`;

  const COVERS = [
    {
      id: "clasica",
      name: "Clásica verde",
      vars: { bg: `radial-gradient(circle at 50% 30%, rgba(212,184,106,0.16), transparent 55%), linear-gradient(165deg, #0a120c, #102015 55%, #0a1610)`, text: "#f6f4ec", sub: C.gold, btn: C.grass, btnText: "#06231a" },
      font: "sans", layout: "center",
      art: () => svg(tennisV(60, 60, 280, 680, C.gold, 2, 0.12)),
    },
    {
      id: "noche-dura",
      name: "Noche en pista dura",
      vars: { bg: `linear-gradient(180deg, #050a18 0%, #0b1a3a 45%, #1b3fa8 100%)`, text: C.white, sub: C.ball, btn: C.ball, btnText: "#10230a" },
      font: "condensed", layout: "top-left",
      art: () => svg(`<ellipse cx="200" cy="-40" rx="320" ry="220" fill="url(#light)" />${perspectiveCourt("rgba(255,255,255,0.92)", 3)}`, `<radialGradient id="light"><stop offset="0" stop-color="#fff" stop-opacity="0.35" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>`),
    },
    {
      id: "tierra",
      name: "Tierra batida",
      vars: { bg: `linear-gradient(170deg, #c9773a, #b5652d 50%, #8a4a1f)`, text: "#fff6ea", sub: "#ffe3c4", btn: "#fff6ea", btnText: C.clayDeep },
      font: "italic", layout: "center",
      art: () => svg(`${dots(7, 260, "#3b1d08", [W, H])}${tennisV(70, 40, 260, 720, "rgba(255,255,255,0.85)", 3)}`),
    },
    {
      id: "hierba",
      name: "Hierba",
      vars: { bg: C.grassDeep, text: C.white, sub: "#d9f24a", btn: C.cream, btnText: C.grassDeep },
      font: "serif", layout: "center",
      art: () => svg(`${Array.from({ length: 16 }, (_, i) => `<rect x="0" y="${i * 50}" width="${W}" height="50" fill="${i % 2 ? "#2a8a3c" : "#2f9e44"}" />`).join("")}${tennisV(70, 40, 260, 720, "rgba(255,255,255,0.9)", 3)}`),
    },
    {
      id: "padel-cristal",
      name: "Pádel · cristal",
      vars: { bg: `linear-gradient(160deg, #2b1470, #5b21b6 50%, #8b5cf6)`, text: C.white, sub: C.ball, btn: C.ball, btnText: "#2b1470" },
      font: "sans", layout: "bottom-left",
      art: () => svg(`${padelV(100, 60, 200, 400, "rgba(255,255,255,0.9)", "rgba(255,255,255,0.5)", 3)}<rect x="0" y="0" width="${W}" height="${H}" fill="url(#fade)" />`, `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#2b1470" stop-opacity="0" /><stop offset="1" stop-color="#1a0c45" stop-opacity="0.85" /></linearGradient>`),
    },
    {
      id: "mapa-club",
      name: "Mapa del club",
      vars: { bg: `linear-gradient(180deg, #0e1512, #17211b)`, text: C.white, sub: C.gold, btn: C.grass, btnText: "#06231a" },
      font: "sans", layout: "top-left",
      art: () => svg(`<g opacity="0.95">${clubMap(36, 360)}</g>`),
    },
    {
      id: "plano",
      name: "Plano técnico",
      vars: { bg: "#0b3d91", text: C.white, sub: "#bcd4ff", btn: C.white, btnText: "#0b3d91" },
      font: "mono", layout: "top-left",
      art: () => svg(`<rect width="${W}" height="${H}" fill="url(#grid)" />${clubMap(36, 380, { fill: false, stroke: "rgba(255,255,255,0.9)", glass: "rgba(255,255,255,0.6)" })}`, `<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" /></pattern>`),
    },
    {
      id: "pelota",
      name: "Pelota gigante",
      vars: { bg: C.night, text: C.white, sub: C.ball, btn: C.ball, btnText: "#10230a" },
      font: "condensed", layout: "top-left",
      art: () => svg(ball(330, 720, 300, C.ball, "#f7ffd6", 9)),
    },
    {
      id: "raqueta",
      name: "Raqueta",
      vars: { bg: `linear-gradient(160deg, #0f2a1a, #163d24)`, text: C.white, sub: C.gold, btn: C.ball, btnText: "#10230a" },
      font: "serif", layout: "top-left",
      art: () => svg(`${racket(250, 520, 2.1, "rgba(255,255,255,0.85)", -28)}${ball(70, 700, 38, C.ball, "#fff", 4)}`),
    },
    {
      id: "pala",
      name: "Pala de pádel",
      vars: { bg: `linear-gradient(160deg, #1a0c45, #4c1d95)`, text: C.white, sub: "#c4b5fd", btn: C.ball, btnText: "#1a0c45" },
      font: "sans", layout: "top-left",
      art: () => svg(paddle(250, 560, 2.2, "rgba(255,255,255,0.92)", C.padelDeep, -22)),
    },
    {
      id: "mitad",
      name: "Tenis y pádel",
      vars: { bg: C.night, text: C.white, sub: C.ball, btn: C.white, btnText: C.night },
      font: "condensed", layout: "center",
      art: () => svg(`<polygon points="0,0 400,0 400,300 0,470" fill="${C.blue}" /><polygon points="0,470 400,300 400,800 0,800" fill="${C.padel}" />
        <g clip-path="url(#top)">${tennisH(-20, 80, 440, 200, "rgba(255,255,255,0.9)", 3)}</g>
        <g clip-path="url(#bot)">${padelH(-20, 520, 440, 220, "rgba(255,255,255,0.9)", "rgba(255,255,255,0.5)", 3)}</g>
        <rect x="0" y="300" width="400" height="200" fill="url(#band)" />`,
        `<clipPath id="top"><polygon points="0,0 400,0 400,300 0,470" /></clipPath><clipPath id="bot"><polygon points="0,470 400,300 400,800 0,800" /></clipPath><linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0" /><stop offset="0.5" stop-color="#000" stop-opacity="0.55" /><stop offset="1" stop-color="#000" stop-opacity="0" /></linearGradient>`),
    },
    {
      id: "atardecer",
      name: "Atardecer",
      vars: { bg: `linear-gradient(180deg, #1c0b3a 0%, #7a2b6b 35%, #f0793b 70%, #ffc35a 100%)`, text: C.white, sub: "#ffe9b3", btn: "#1c0b3a", btnText: "#ffe9b3" },
      font: "serif", layout: "top-left",
      art: () => svg(`<circle cx="200" cy="560" r="120" fill="#ffd56b" opacity="0.9" /><rect x="0" y="600" width="400" height="200" fill="#1c0b3a" />${tennisH(-30, 640, 460, 120, "rgba(255,213,107,0.55)", 2)}`),
    },
    {
      id: "monograma",
      name: "Monograma",
      vars: { bg: C.cream, text: "#12261a", sub: C.clayDeep, btn: "#12261a", btnText: C.cream },
      font: "serif", layout: "center", light: true,
      art: () => svg(`<text x="200" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="420" font-weight="700" fill="none" stroke="${C.gold}" stroke-width="2" opacity="0.8">EC</text>`),
    },
    {
      id: "rayas",
      name: "Rayas deportivas",
      vars: { bg: C.night, text: C.white, sub: C.ball, btn: C.white, btnText: C.night },
      font: "condensed", layout: "bottom-left",
      art: () => svg(`<g transform="rotate(-25 200 400)">${[C.blue, C.clay, C.grass, C.padel].map((c, i) => `<rect x="-200" y="${120 + i * 70}" width="800" height="48" fill="${c}" />`).join("")}</g>`),
    },
    {
      id: "red",
      name: "La red",
      vars: { bg: "#050806", text: C.white, sub: C.ball, btn: C.ball, btnText: "#10230a" },
      font: "sans", layout: "center",
      art: () => svg(`<rect width="${W}" height="${H}" fill="url(#net)" mask="url(#fadeM)" /><rect x="0" y="396" width="${W}" height="8" fill="rgba(255,255,255,0.9)" />`,
        `<pattern id="net" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.4" /></pattern><mask id="fadeM"><rect width="${W}" height="${H}" fill="url(#mg)" /></mask><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" /><stop offset="0.35" stop-color="#fff" /><stop offset="0.65" stop-color="#fff" /><stop offset="1" stop-color="#000" /></linearGradient>`),
    },
    {
      id: "malla",
      name: "Malla de colores",
      vars: { bg: `radial-gradient(circle at 15% 15%, ${C.blue} 0, transparent 40%), radial-gradient(circle at 85% 25%, ${C.clay} 0, transparent 40%), radial-gradient(circle at 20% 85%, ${C.grass} 0, transparent 45%), radial-gradient(circle at 85% 80%, ${C.padel} 0, transparent 45%), #0e1512`, text: C.white, sub: "rgba(255,255,255,0.85)", btn: C.white, btnText: "#0e1512" },
      font: "sans", layout: "center",
      art: () => svg(`<rect width="${W}" height="${H}" fill="rgba(0,0,0,0.25)" />`),
    },
    {
      id: "isometrico",
      name: "Club isométrico",
      vars: { bg: `linear-gradient(180deg, #0b2a2e, #0e3d40)`, text: C.white, sub: C.ball, btn: C.ball, btnText: "#0b2a2e" },
      font: "sans", layout: "top-left",
      art: () => svg(`<g transform="translate(200 400) matrix(0.866 0.5 -0.866 0.5 0 0) translate(-164 -150)">${clubMap(0, 0)}</g>`),
    },
    {
      id: "minimal",
      name: "Minimal blanco",
      vars: { bg: "#fbfbf8", text: "#12261a", sub: C.grassDeep, btn: C.grass, btnText: "#06231a" },
      font: "sans", layout: "center", light: true,
      art: () => svg(tennisV(60, 60, 280, 680, "#d9ddd5", 2)),
    },
    {
      id: "neon",
      name: "Neón",
      vars: { bg: "#050308", text: C.white, sub: "#7dfcff", btn: "#7dfcff", btnText: "#050308" },
      font: "condensed", layout: "center",
      art: () => svg(`<g filter="url(#glow)">${tennisV(70, 40, 260, 720, "#7dfcff", 2.5, 0.9)}${padelV(20, 120, 360, 560, "#ff5ed2", "rgba(255,94,210,0.35)", 2, 0.45)}</g>`, glowFilter),
    },
    {
      id: "cielo",
      name: "Cielo y pista",
      vars: { bg: `linear-gradient(180deg, #bfe3ff 0%, #6fb6ff 45%, ${C.blue} 46%, ${C.blueDeep} 100%)`, text: C.white, sub: "#ffffff", btn: C.ball, btnText: "#10230a" },
      font: "sans", layout: "top-left",
      art: () => svg(`${tennisH(-40, 420, 480, 240, "rgba(255,255,255,0.95)", 3)}<rect x="0" y="0" width="${W}" height="368" fill="url(#skyfade)" />`, `<linearGradient id="skyfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3fa8" stop-opacity="0.35" /><stop offset="1" stop-color="#1b3fa8" stop-opacity="0" /></linearGradient>`),
    },
    {
      id: "contornos",
      name: "Contornos",
      vars: { bg: `linear-gradient(165deg, #0a120c, #102015)`, text: C.white, sub: C.gold, btn: C.gold, btnText: "#0a120c" },
      font: "serif", layout: "center",
      art: () => svg([0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${200 - 40 - i * 34}" y="${400 - 80 - i * 68}" width="${80 + i * 68}" height="${160 + i * 136}" rx="${8 + i * 4}" fill="none" stroke="${C.gold}" stroke-width="1.5" opacity="${(0.55 - i * 0.07).toFixed(2)}" />`).join("")),
    },
    {
      id: "patron",
      name: "Patrón de pistas",
      vars: { bg: "#0f1b2d", text: C.white, sub: "#9fc0ff", btn: C.white, btnText: "#0f1b2d" },
      font: "sans", layout: "center",
      art: () => svg(`<rect width="${W}" height="${H}" fill="url(#pc)" opacity="0.5" />`, `<pattern id="pc" width="90" height="60" patternUnits="userSpaceOnUse">${tennisH(8, 10, 74, 36, "#5b8dff", 1.2)}</pattern>`),
    },
    {
      id: "foco",
      name: "Bajo los focos",
      vars: { bg: "#050806", text: C.white, sub: C.ball, btn: C.ball, btnText: "#10230a" },
      font: "condensed", layout: "center",
      art: () => svg(`<polygon points="200,-20 -120,820 520,820" fill="url(#cone)" />${perspectiveCourt("rgba(255,255,255,0.8)", 2.5, 0.9)}`, `<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35" /><stop offset="1" stop-color="#fff" stop-opacity="0.02" /></linearGradient>`),
    },
    {
      id: "editorial",
      name: "Editorial",
      vars: { bg: C.cream, text: "#12261a", sub: "#6b5a2e", btn: "#12261a", btnText: C.cream },
      font: "serif", layout: "top-left", light: true,
      art: () => svg(`<rect x="0" y="560" width="400" height="240" fill="${C.clay}" />${tennisH(30, 590, 340, 160, "rgba(255,255,255,0.9)", 2.5)}`),
    },
  ];

  window.PISTAS_COVERS = COVERS;
})();
