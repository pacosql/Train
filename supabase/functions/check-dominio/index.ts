// Supabase Edge Function: check-dominio
//
// Comprueba <nombre>.com en vivo via RDAP (Verisign) — funciona: se ha
// verificado en real. Para <nombre>.es se intenta whois crudo (puerto
// 43) como último recurso, pero está confirmado (probado en real desde
// esta misma función) que .es no expone ningun RDAP HTTP publico y que
// el puerto 43 esta bloqueado de salida desde aqui, asi que lo normal
// es que "es.libre" vuelva null con un detalle explicando por que, y la
// app debe mostrar el enlace manual a whois.nic.es en ese caso.
//
// Guarda el resultado en nombra_ideas via REST directo (PostgREST) con
// la service role key, que Supabase inyecta automaticamente como
// variable de entorno en toda funcion — nunca esta expuesta al cliente.

function slugify(raw) {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

async function checkCom(slug) {
  try {
    const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${slug}.com`, {
      headers: { Accept: "application/rdap+json" },
    });
    if (res.status === 404) return { libre: true, detalle: "no encontrado en RDAP (libre)" };
    if (res.status === 200) return { libre: false, detalle: "registrado (RDAP)" };
    return { libre: null, detalle: `RDAP respondio ${res.status}` };
  } catch (err) {
    return { libre: null, detalle: `error consultando RDAP: ${String(err)}` };
  }
}

async function whoisRaw(host, query, port = 43) {
  const conn = await Deno.connect({ hostname: host, port });
  try {
    await conn.write(new TextEncoder().encode(query + "\r\n"));
    const chunks = [];
    const buf = new Uint8Array(4096);
    let total = 0;
    while (true) {
      const n = await conn.read(buf);
      if (n === null) break;
      chunks.push(buf.slice(0, n));
      total += n;
      if (chunks.length > 200 || total > 200000) break;
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    return new TextDecoder().decode(merged);
  } finally {
    conn.close();
  }
}

function withTimeout(promise, ms, onTimeout) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(onTimeout), ms)),
  ]);
}

async function checkEs(slug) {
  const domain = `${slug}.es`;
  try {
    // El whois de whois.nic.es puede tardar minuto y medio en dar
    // timeout de verdad (confirmado en real) — con IP no autorizada por
    // Red.es casi nunca hay datos útiles, así que se corta pronto en
    // vez de bloquear comprobaciones en lote.
    const text = await withTimeout(whoisRaw("whois.nic.es", domain), 4000, null);
    if (text === null) {
      return {
        libre: null,
        detalle: "whois.nic.es no respondió a tiempo (puede tardar >1min sin IP autorizada por Red.es). Usa el enlace manual.",
      };
    }
    const lower = text.toLowerCase();
    const accesoRestringido =
      lower.includes("conditions of use") ||
      (lower.includes("ip address") && lower.includes("authoris"));
    if (accesoRestringido) {
      return {
        libre: null,
        detalle:
          "whois.nic.es exige una IP autorizada por Red.es para el puerto 43; " +
          "esta IP no lo está, así que no da datos reales del dominio. Usa el enlace manual.",
      };
    }
    const noEncontrado =
      lower.includes("no coincidencias") ||
      lower.includes("no data found") ||
      lower.includes("not found") ||
      lower.includes("no existe") ||
      text.trim().length < 20;
    if (noEncontrado) return { libre: true, detalle: text.trim().slice(0, 300) || "sin datos (probable libre)" };
    return { libre: false, detalle: text.trim().slice(0, 300) };
  } catch (err) {
    return {
      libre: null,
      detalle:
        ".es no tiene RDAP publico y el whois por puerto 43 no es accesible desde aqui " +
        `(comprobado: ${String(err)}). Usa el enlace manual a whois.nic.es.`,
    };
  }
}

async function guardarResultado(env, slug, com, es) {
  const url = env.get("SUPABASE_URL");
  const key = env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { ok: false, error: "faltan SUPABASE_URL/SERVICE_ROLE_KEY" };
  try {
    const res = await fetch(`${url}/rest/v1/nombra_ideas?nombre=ilike.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        com_libre: com.libre,
        es_libre: es.libre,
        es_detalle: es.detalle,
        dominio_comprobado_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) return { ok: false, error: `PATCH ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Esta funcion la llama directamente el navegador (fetch desde
// nombra/app.js), no solo curl/servidores: sin cabeceras CORS, Chrome
// bloquea la respuesta a la preflight OPTIONS y el fetch nunca llega a
// resolverse. Confirmado en real con un navegador de verdad.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "usa POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  let nombre = "";
  try {
    const body = await req.json();
    nombre = String(body.nombre ?? "");
  } catch {
    return new Response(JSON.stringify({ error: "body JSON invalido, se espera {nombre}" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const slug = slugify(nombre);
  if (!slug) {
    return new Response(JSON.stringify({ error: "nombre vacio tras normalizar" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const [com, es] = await Promise.all([checkCom(slug), checkEs(slug)]);
  const guardado = await guardarResultado(Deno.env, slug, com, es);

  return new Response(JSON.stringify({ nombre: slug, com, es, guardado }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
