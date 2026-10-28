// "¿Ya he aplicado a esta empresa?" — común a las dos interfaces.
// Junta las ofertas marcadas como aplicadas (empleo_ofertas.aplicada_en) y las
// candidaturas sueltas por empresa (empleo_candidaturas: p. ej. leídas de los
// correos de "Thank you for applying" cuando no se sabe a qué oferta exacta).
(function () {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  function mismaEmpresa(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return false;
    if (a === b) return true;
    const [c, l] = a.length < b.length ? [a, b] : [b, a];
    return c.length >= 4 && l.startsWith(c);
  }
  // Lista (la más reciente primero) de candidaturas a la empresa de la oferta `o`.
  function aplicaciones(o, ofertas, candidaturas) {
    const ahora = Date.now();
    const dias = (f) => (ahora - new Date(f.length === 10 ? f + "T12:00:00" : f).getTime()) / 864e5;
    const out = ofertas
      .filter((x) => x.id !== o.id && x.aplicada_en && mismaEmpresa(x.empresa, o.empresa))
      .map((x) => ({ d: dias(x.aplicada_en), fecha: x.aplicada_en.slice(0, 10), puesto: x.puesto, cerrada: x.activa === false }));
    const fechas = new Set(out.map((x) => x.fecha));
    for (const c of candidaturas || []) {
      if (!mismaEmpresa(c.empresa, o.empresa) || fechas.has(c.fecha)) continue;
      if (o.aplicada_en && o.aplicada_en.slice(0, 10) === c.fecha) continue;
      out.push({ d: dias(c.fecha), fecha: c.fecha, puesto: c.puesto || "puesto sin identificar", cerrada: false });
    }
    return out.sort((a, b) => a.d - b.d);
  }
  function hace(d) {
    const n = Math.max(0, Math.floor(d));
    return n < 1 ? "hoy" : n === 1 ? "hace 1 día" : n < 30 ? `hace ${n} días` : n < 60 ? "hace 1 mes" : `hace ${Math.round(n / 30)} meses`;
  }
  // Supabase devuelve como mucho 1000 filas por consulta: pide páginas hasta tenerlas todas.
  // `consulta(desde, hasta)` debe devolver la query ya con .range(desde, hasta) y un orden estable.
  async function todas(consulta) {
    let out = [];
    for (let i = 0; ; i += 1000) {
      const { data, error } = await consulta(i, i + 999);
      if (error) return { data: out.length ? out : null, error };
      out = out.concat(data || []);
      if (!data || data.length < 1000) return { data: out, error: null };
    }
  }
  window.EmpleoCand = { aplicaciones, hace, mismaEmpresa, todas };
})();
