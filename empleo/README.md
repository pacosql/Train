# 💼 Empleo

Buscador personal de ofertas de **Partner Program / Partner Management**
(Partner Manager, Partner Development, Alliances, Channel, Ecosystem,
Partner Enablement…) en **empresas de Data & AI**, en **España**, en
modalidad **remota o híbrida**. Cada oferta se marca como 👍 me gusta o
👎 no me gusta y se filtra por remoto claro / remoto / híbrido / nuevas.

URL: `https://pacosql.github.io/Train/empleo/`

## Tablas (Supabase, prefijo `empleo_`)

- `empleo_ofertas`: una fila por oferta. `url` es única (evita
  duplicados). Campos clave: `empresa`, `puesto`, `ubicacion`,
  `modalidad` (`remoto|hibrido|presencial|desconocido`), `remoto_claro`
  (true solo si la oferta dice explícitamente remoto para España),
  `encontrado_en` (fecha en que se encontró), `fecha_publicacion`,
  `fuente`, `sector`, `area`, `seniority`, `resumen`, `etiquetas`,
  `decision` (`pendiente|gusta|no_gusta`), `nota`, `activa`.
- `empleo_rutinas`: log de cada ejecución de la rutina (`nuevas`, `nota`).

## Rutina de búsqueda (qué debe hacer cada ejecución)

Regla de oro: **cada enlace debe ser la oferta real en el portal del
empleador y estar abierta** (nada de agregadores ni ofertas caducadas).

1. Leer lo ya guardado y las decisiones tomadas:
   `bash empleo/tools/sb.sh GET 'empleo_ofertas?select=id,empresa,puesto,url,decision,nota,activa'`.
   Las 👍 y 👎 (y sus notas) orientan qué buscar más y qué evitar.
2. Revalidar las activas: `curl -sL -A Mozilla/5.0 <url>`. Si da 404/410,
   redirige a un listado o a una página de error, o ya no muestra el
   puesto, marcarla `{"activa": false}`. Si sigue viva, actualizar
   `verificada_en` a hoy.
3. Buscar nuevas en los portales oficiales vía API:
   `python3 empleo/tools/buscar.py > /tmp/candidatas.json` (Greenhouse,
   Ashby, Lever, Workday, Microsoft y AWS de ~70 empresas de Data & AI). Leer
   cada descripción y quedarse solo con roles de partners, alianzas,
   canal o programa de partners en España o remotos que admitan España.
4. Completar con búsqueda web para empresas sin API (Google Cloud, SAP,
   Oracle, IBM, Mistral, Denodo, Nutanix, Cisco, Hitachi, consultoras de
   datos…) y agregadores (LinkedIn, InfoJobs), pero guardar siempre la
   URL del portal oficial tras abrirla y comprobarla.
5. Insertar las nuevas (la `url` es única) con `encontrado_en` y
   `verificada_en` = hoy, `decision` = `pendiente`, `remoto_claro` = true
   solo si la oferta dice explícitamente remoto en España:
   `bash empleo/tools/sb.sh POST empleo_ofertas /tmp/nuevas.json`.
6. Registrar la ejecución: `POST empleo_rutinas` con `{"nuevas": N, "nota": "…"}`.
