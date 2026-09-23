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

1. Leer las URLs y empresas ya guardadas, y las decisiones tomadas:
   `bash empleo/tools/sb.sh GET 'empleo_ofertas?select=empresa,puesto,url,decision,nota'`.
   Las 👍 y 👎 (y sus notas) orientan qué buscar más y qué evitar.
2. Buscar ofertas nuevas en los portales oficiales (Microsoft, Google
   Cloud, AWS, Oracle, IBM, SAP, Salesforce, NVIDIA, Anthropic, OpenAI,
   Mistral, Cohere, Hugging Face, ElevenLabs, Databricks, Snowflake,
   Confluent, MongoDB, Elastic, Dataiku, Informatica, Qlik, Fivetran,
   dbt Labs, Collibra, Denodo, Stratio, Palantir, Datadog, Celonis…) y en
   agregadores (LinkedIn, Indeed, Glassdoor, InfoJobs, Welcome to the
   Jungle, Builtin…). Nunca inventar URLs: solo ofertas vistas de verdad.
3. Insertar solo las que no existan (por `url`), con
   `encontrado_en` = hoy y `decision` = `pendiente`:
   `bash empleo/tools/sb.sh POST empleo_ofertas /tmp/oferta.json`
   (acepta un array JSON).
4. Si una oferta ya guardada ha cerrado, marcarla `activa=false` con PATCH.
5. Registrar la ejecución: `POST empleo_rutinas` con `{"nuevas": N, "nota": "…"}`.
