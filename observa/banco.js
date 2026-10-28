// Observa — banco de conceptos y preguntas (contenido en inglés: la
// entrevista es en inglés; la interfaz va en español).
//
// Cada concepto: id estable (se guarda en observa_answer.concept_id, no lo
// cambies), tema, título, mini-lección de 2-3 frases, una frase de
// entrevista ("line") opcional, conceptos relacionados y 2+ preguntas.
// Pregunta: q = enunciado, o = 4 opciones (o[a] es la correcta; el orden
// se baraja al mostrarlas), why = explicación corta. Ids de pregunta:
// <concepto>.<n> — tampoco se renumeran.
window.OBSERVA_TOPICS = [
  { id: "fund", name: "Fundamentos", emoji: "🧭" },
  { id: "splunk", name: "Plataforma Splunk", emoji: "🗄️" },
  { id: "o11y", name: "Splunk Observability Cloud", emoji: "📡" },
  { id: "otel", name: "OpenTelemetry", emoji: "🔭" },
  { id: "debate", name: "Debates y SRE", emoji: "⚖️" },
  { id: "k8s", name: "Kubernetes", emoji: "☸️" },
  { id: "k8so", name: "Observar Kubernetes", emoji: "🩺" },
  { id: "bridge", name: "Tu experiencia: OpenSearch y Dynatrace", emoji: "🌉" },
];

window.OBSERVA_CONCEPTS = [
  // ------------------------------------------------------------ Fundamentos
  {
    id: "mon-vs-obs", topic: "fund", title: "Monitoring vs observability",
    lesson: "Monitoring answers questions you knew you'd ask (known unknowns: thresholds, health checks, fixed dashboards). Observability lets you investigate failures you never anticipated (unknown unknowns) from the telemetry the system already emits — without shipping new code to debug.",
    line: "Monitoring tells you that something is wrong; observability tells you why, even when the why is new.",
    related: ["kalman", "melt", "correlation"],
    qs: [
      { q: "Which situation needs observability rather than monitoring?", o: ["Debugging a failure mode nobody has seen before", "Alerting when CPU passes 80%", "A health check on the database", "A fixed dashboard for disk usage"], a: 0, why: "Thresholds and health checks are known unknowns. A never-seen failure is an unknown unknown." },
      { q: "Monitoring is best described as…", o: ["Answering questions you anticipated in advance", "Inferring any internal state from outputs", "Storing traces without sampling", "Profiling CPU at line level"], a: 0, why: "Monitoring = predefined checks for predictable failures." },
    ],
  },
  {
    id: "kalman", topic: "fund", title: "Where the term comes from",
    lesson: "Observability comes from control theory: Rudolf Kálmán (1960s) — a system is observable if you can infer its internal state from its external outputs. In software: rich telemetry lets you infer what happened inside.",
    related: ["mon-vs-obs"],
    qs: [
      { q: "In control theory, a system is 'observable' if…", o: ["Its internal state can be inferred from its external outputs", "It has a dashboard for every component", "It never needs to be restarted", "Every log line is indexed"], a: 0, why: "Kálmán's definition: internal state inferred from outputs." },
      { q: "Why do microservices make observability more necessary than with a monolith?", o: ["Failures emerge from interactions across many services", "Microservices emit fewer logs", "Monoliths cannot be monitored", "Containers have no CPU metrics"], a: 0, why: "One request may cross 20 services; the failure lives in the interaction, not one box." },
    ],
  },
  {
    id: "melt", topic: "fund", title: "MELT: the telemetry signals",
    lesson: "Metrics (cheap aggregated numbers, great for alerting/trends, lose detail), Events (discrete changes: deploys, config changes, failovers — answer 'what changed?'), Logs (rich context for forensics, expensive), Traces (request end to end → causality). Plus a 5th rising signal: profiles.",
    line: "Metrics for alerting and trends, traces for causality, logs for forensics, events for what changed, profiles for the line of code.",
    related: ["traces-spans", "profiles", "correlation"],
    qs: [
      { q: "During an incident, 'what changed?' is usually answered by which signal?", o: ["Events", "Metrics", "Profiles", "Traces"], a: 0, why: "Deploys, config changes, failovers and autoscaling are events — gold for correlation." },
      { q: "The main weakness of metrics is…", o: ["Aggregation throws away per-request detail", "They are expensive to store", "They are slow to query", "They cannot be used for alerting"], a: 0, why: "p99 went up — but which request and why? Metrics can't tell." },
      { q: "Which signal gives you causality across services?", o: ["Traces", "Metrics", "Logs", "Events"], a: 0, why: "A trace shows checkout was slow BECAUSE inventory waited 2.5 s on one SQL query." },
    ],
  },
  {
    id: "traces-spans", topic: "fund", title: "Traces and spans",
    lesson: "A trace follows one request across services. It's made of spans: units of work with a name, start time, duration, attributes and the parent span ID. All spans of a request share the trace ID.",
    related: ["context-prop", "melt"],
    qs: [
      { q: "What links all the spans of one request together?", o: ["A shared trace ID", "The same host name", "The same log index", "A shared metric name"], a: 0, why: "Every span carries the trace ID; parent span IDs build the tree." },
      { q: "Which field is NOT a typical part of a span?", o: ["The index replication factor", "Start time and duration", "Parent span ID", "Attributes"], a: 0, why: "Spans have name, start, duration, attributes, parent ID. Replication factor is Splunk indexer stuff." },
    ],
  },
  {
    id: "profiles", topic: "fund", title: "Profiles (continuous profiling)",
    lesson: "Continuous profiling tells you which function or line burns CPU or memory. Splunk calls it AlwaysOn Profiling and links it to traces; OpenTelemetry is adding profiles as a first-class signal.",
    related: ["melt", "apm-extras"],
    qs: [
      { q: "Which signal tells you which function is burning CPU?", o: ["Profiles", "Events", "Traces alone", "Synthetic tests"], a: 0, why: "Profiles go down to function/line. Traces tell you which span is slow; profiles say why in code." },
      { q: "Splunk's profiling feature linked to spans is called…", o: ["AlwaysOn Profiling", "Tag Spotlight", "SmartStore", "Log Observer"], a: 0, why: "AlwaysOn Profiling ties CPU/memory profiles to spans." },
    ],
  },
  {
    id: "correlation", topic: "fund", title: "Correlation beats pillars",
    lesson: "The three pillars are a way to store data, not the goal. Value is pivoting with shared context: chart spike → slow traces of that minute → the exact log lines of a span (trace ID injected in logs). In Splunk Observability Cloud this is called Related Content.",
    line: "Three tools that don't talk to each other give you three pillars, not observability.",
    related: ["melt", "wide-events"],
    qs: [
      { q: "What makes jumping from a trace to its exact log lines possible?", o: ["The trace ID injected into the logs", "Storing logs as metrics", "Using the same retention for both", "Head sampling at 100%"], a: 0, why: "Shared context (trace ID in the log) is the bridge between signals." },
      { q: "In Splunk Observability Cloud, the feature that links metrics, traces and logs is…", o: ["Related Content", "SmartStore", "HEC", "Deployment server"], a: 0, why: "Related Content gives one-click pivots across signals." },
    ],
  },
  {
    id: "cardinality", topic: "fund", title: "Cardinality",
    lesson: "Number of time series = product of distinct values of each dimension. 50 services × 20 endpoints × 5 status × 4 regions = 20,000 series. Add user_id (1M users) → ×1,000,000: a cardinality explosion. Cost and performance of metric systems are driven by active series.",
    line: "High cardinality is exactly what you need to debug and exactly what you can't afford in metrics.",
    related: ["mts", "mpm", "k8s-card"],
    qs: [
      { q: "A metric has dimensions service (10) × region (3) × status (5). How many time series at most?", o: ["150", "18", "30", "15"], a: 0, why: "Multiply: 10 × 3 × 5 = 150." },
      { q: "Where does user_id belong?", o: ["As a trace attribute or log field", "As a metric dimension", "As the index name", "As a Kubernetes label on every node"], a: 0, why: "Traces and logs are individual events; cardinality doesn't explode the same way there." },
    ],
  },
  {
    id: "mts", topic: "fund", title: "MTS — metric time series",
    lesson: "In Splunk, an MTS is the unique combination of a metric name plus its dimension values. Active MTS count drives cost and performance in Splunk Infrastructure Monitoring (and in nearly every metrics product).",
    related: ["cardinality", "mpm"],
    qs: [
      { q: "An MTS in Splunk is…", o: ["A unique metric name + dimension combination", "A bucket of raw events", "A span with no parent", "A saved SPL search"], a: 0, why: "Metric time series = metric + unique dimension set." },
      { q: "What mostly drives the cost of a metrics backend?", o: ["The number of active MTS", "The number of dashboards", "The length of metric names", "The number of users logged in"], a: 0, why: "Active time series = memory, storage, compute." },
    ],
  },

  // ------------------------------------------------------------ Plataforma Splunk
  {
    id: "schema-read", topic: "splunk", title: "Schema on read vs schema on write",
    lesson: "OpenSearch is schema on write: a mapping defines field types at ingest → fast aggregations, but format changes hurt and dynamic mapping can explode (default 1,000-field limit). Splunk is schema on read: stores the raw event + an inverted index of terms; most fields are extracted at search time (rex, spath, props/transforms).",
    line: "Splunk: time is the backbone. OpenSearch: the mapping is the backbone.",
    related: ["index-fields", "tstats", "os-mapping"],
    qs: [
      { q: "Splunk extracts most fields…", o: ["At search time", "At index time via a mapping", "In the forwarder only", "Never — it only stores metrics"], a: 0, why: "Schema on read: raw event stored; fields extracted when you search." },
      { q: "A downside of schema on read is…", o: ["Search-time extraction costs more CPU", "You must design a mapping before ingesting", "Format changes force reindexing", "You can't ingest unstructured logs"], a: 0, why: "Flexibility at ingest is paid with CPU at search." },
      { q: "OpenSearch 'mapping explosion' happens because…", o: ["Dynamic mapping adds a field entry for every new key", "Buckets roll to frozen too fast", "Search factor is too low", "Traces are sampled at the head"], a: 0, why: "Every new JSON key becomes a mapped field; there's a default 1,000-field limit per index." },
    ],
  },
  {
    id: "index-fields", topic: "splunk", title: "Index-time default fields",
    lesson: "Only a handful of fields are fixed at index time in Splunk: _time (the most important), host, source, sourcetype and index. Everything else is extracted at search time.",
    related: ["schema-read", "buckets"],
    qs: [
      { q: "Which is NOT one of Splunk's default index-time fields?", o: ["user_id", "sourcetype", "host", "_time"], a: 0, why: "Defaults: _time, host, source, sourcetype, index." },
      { q: "The most important index-time field in Splunk is…", o: ["The timestamp (_time)", "The host", "The sourcetype", "The index name"], a: 0, why: "Buckets are organized by time; time range is the #1 filter." },
    ],
  },
  {
    id: "tstats", topic: "splunk", title: "tstats and accelerated data models",
    lesson: "It's not black and white: Splunk has index-time fields, tstats (queries the tsidx index files directly — dramatically faster) and accelerated data models. OpenSearch has runtime fields. The two worlds converge.",
    related: ["schema-read", "buckets"],
    qs: [
      { q: "Why is tstats much faster than a normal search?", o: ["It reads the tsidx index files instead of raw events", "It only runs on the search head", "It skips the time range", "It samples 1% of events"], a: 0, why: "tstats works on indexed metadata (tsidx), not on the raw journal." },
      { q: "OpenSearch's closest answer to search-time fields is…", o: ["Runtime fields", "UltraWarm", "ISM", "Data Prepper"], a: 0, why: "Runtime fields compute values at query time — schema on read inside a schema-on-write engine." },
    ],
  },
  {
    id: "forwarders", topic: "splunk", title: "Universal vs Heavy Forwarder",
    lesson: "Universal Forwarder: lightweight agent on the host; tails files, reads Windows events, forwards — almost no parsing. Heavy Forwarder: a full Splunk instance that parses, filters, masks and routes.",
    related: ["hec", "indexer"],
    qs: [
      { q: "You must mask credit-card numbers before data leaves the site. Which forwarder?", o: ["Heavy Forwarder", "Universal Forwarder", "Deployment server", "License manager"], a: 0, why: "Only the HF parses, so it can filter/mask/route. (Edge Processor is the modern option too.)" },
      { q: "The Universal Forwarder mainly…", o: ["Collects and forwards with almost no parsing", "Runs SPL searches", "Stores tsidx files", "Manages the cluster"], a: 0, why: "Lightweight agent: collect and ship." },
    ],
  },
  {
    id: "hec", topic: "splunk", title: "HTTP Event Collector (HEC)",
    lesson: "HEC is an HTTP endpoint secured with tokens, port 8088 by default. Natural path for applications, cloud sources and the OpenTelemetry Collector sending logs to the Splunk Platform.",
    related: ["forwarders", "helm-chart"],
    qs: [
      { q: "HEC's default port is…", o: ["8088", "9997", "4317", "443"], a: 0, why: "HEC: 8088. (9997 is forwarder→indexer; 4317 is OTLP gRPC.)" },
      { q: "How does the OTel Collector usually send logs to Splunk Enterprise/Cloud?", o: ["Through HEC with a token", "By writing tsidx files directly", "Via the deployment server", "Over SNMP"], a: 0, why: "The Splunk OTel distribution exports logs to the platform via HEC." },
    ],
  },
  {
    id: "indexer", topic: "splunk", title: "Indexer and search head (map/reduce)",
    lesson: "Indexers parse (line breaking, timestamp, index-time transforms) and write to disk — and do most of the search work. The search head distributes SPL to indexers (search peers): they run the map phase locally; the search head merges (reduce). Streaming commands (where, eval, fields) run on indexers; transforming ones (stats) finish on the search head.",
    line: "Filter as early as possible and always bound the time range.",
    related: ["buckets", "rf-sf"],
    qs: [
      { q: "In a distributed search, where does 'stats' finish?", o: ["On the search head", "On the universal forwarder", "On the deployment server", "In the browser"], a: 0, why: "Transforming commands do the reduce phase on the search head." },
      { q: "Why put 'where' and 'fields' early in an SPL query?", o: ["They run on indexers and cut data before it travels", "They are required syntax", "They disable bloom filters", "They force schema on write"], a: 0, why: "Distributable streaming commands shrink data at the map phase." },
    ],
  },
  {
    id: "buckets", topic: "splunk", title: "Buckets: hot → warm → cold → frozen",
    lesson: "An index is split into buckets (directories) by time. Each has the raw data journal + tsidx files + a bloom filter. Hot (being written, read-write) → warm (read-only, fast disk) → cold (cheaper disk, still searchable) → frozen (out of retention: DELETED by default, unless you archive) → thawed (restored, searchable again).",
    line: "Frozen means deleted by default — archiving must be configured.",
    related: ["retention", "smartstore", "os-ism"],
    qs: [
      { q: "By default, what happens to a frozen bucket?", o: ["It is deleted", "It moves to S3 automatically", "It stays searchable on cold disk", "It becomes hot again"], a: 0, why: "Trick question: frozen = deleted unless you configure an archive dir/script." },
      { q: "Which bucket state is read-write?", o: ["Hot", "Warm", "Cold", "Thawed"], a: 0, why: "Only hot buckets are open for writing." },
      { q: "How can Splunk skip a bucket quickly for a term it doesn't contain?", o: ["Bloom filter", "Search factor", "HEC token", "Deployment server"], a: 0, why: "Bloom filters rule out buckets; time bounds rule out more." },
    ],
  },
  {
    id: "retention", topic: "splunk", title: "Retention levers",
    lesson: "Two levers: time (frozenTimePeriodInSecs, default ≈ 6 years) and size (maxTotalDataSizeMB, default 500 GB per index). Whichever is hit first wins. Restored archived buckets come back as thawed.",
    related: ["buckets"],
    qs: [
      { q: "An index hits its 500 GB size limit after 3 months, retention is 1 year. What happens?", o: ["Oldest buckets freeze now — the first limit hit wins", "Nothing until the year ends", "Ingestion stops", "Data moves to hot"], a: 0, why: "Time OR size, whichever comes first." },
      { q: "frozenTimePeriodInSecs controls…", o: ["Time-based retention", "Hot bucket size", "Search factor", "HEC port"], a: 0, why: "Age at which buckets roll to frozen." },
    ],
  },
  {
    id: "rf-sf", topic: "splunk", title: "Replication factor vs search factor",
    lesson: "In an indexer cluster: replication factor = copies of raw data; search factor = how many of those copies are searchable (also carry tsidx files). Typical RF 3, SF 2. The cluster manager (formerly master node) coordinates recovery. Search head clusters: ≥3 members, a captain, and a deployer.",
    related: ["indexer", "os-shards"],
    qs: [
      { q: "RF=3, SF=2 means…", o: ["3 copies of data, 2 of them searchable", "3 search heads, 2 indexers", "3 hot buckets, 2 warm", "3 sites, 2 regions"], a: 0, why: "SF copies include tsidx, the expensive part to rebuild." },
      { q: "The OpenSearch difference vs Splunk search factor:", o: ["In OpenSearch every replica is searchable", "OpenSearch has no replicas", "OpenSearch replicas are never searchable", "OpenSearch uses buckets too"], a: 0, why: "Splunk can keep cheaper non-searchable copies; OpenSearch replicas always serve queries." },
      { q: "Minimum members for a Splunk search head cluster?", o: ["3", "1", "2", "5"], a: 0, why: "3 members, one elected captain, plus a deployer pushing apps." },
    ],
  },
  {
    id: "smartstore", topic: "splunk", title: "SmartStore",
    lesson: "Decouples compute from storage: warm buckets live in an object store (S3); indexers keep a local cache. Hot stays local. Cold largely disappears, you scale indexers without moving data, durability comes from S3. Trade-off: uncached historical searches pay download latency → cache sizing is the key decision.",
    line: "SmartStore is the same idea as UltraWarm and searchable snapshots in OpenSearch.",
    related: ["buckets", "os-ism"],
    qs: [
      { q: "With SmartStore, where is the master copy of warm buckets?", o: ["The remote object store (S3)", "The search head", "The universal forwarder", "Each indexer's hot path"], a: 0, why: "Once warm, the bucket is uploaded; S3 becomes the master copy." },
      { q: "The main design decision in SmartStore is…", o: ["Sizing the local cache", "Choosing the shard count", "Setting the HEC port", "Number of bloom filters"], a: 0, why: "Searches over uncached history pay S3 latency." },
    ],
  },

  // ------------------------------------------------------------ Splunk Observability Cloud
  {
    id: "history", topic: "o11y", title: "Where Splunk Observability comes from",
    lesson: "Splunk bought SignalFx (2019, streaming metrics) and Omnition (tracing), then Plumbr (profiling), Rigor (synthetics), Flowmill (eBPF network); VictorOps became Splunk On-Call. Cisco closed the Splunk acquisition in March 2024 (~$28B), bringing AppDynamics and ThousandEyes into the portfolio.",
    related: ["two-worlds", "cisco"],
    qs: [
      { q: "Splunk Infrastructure Monitoring's streaming engine comes from…", o: ["SignalFx", "Rigor", "VictorOps", "Plumbr"], a: 0, why: "SignalFx = streaming metrics. Rigor = synthetics, VictorOps = on-call, Plumbr = profiling." },
      { q: "Which company acquired Splunk in 2024?", o: ["Cisco", "Microsoft", "Datadog", "Dynatrace"], a: 0, why: "Cisco, ~$28B, closed March 2024." },
    ],
  },
  {
    id: "two-worlds", topic: "o11y", title: "Two worlds + Log Observer Connect",
    lesson: "Splunk Platform (Enterprise/Cloud, logs, SPL) and Splunk Observability Cloud (SaaS for metrics and traces on SignalFx). Log Observer Connect lets Observability Cloud query logs already in the platform without ingesting them twice.",
    related: ["history", "correlation"],
    qs: [
      { q: "Log Observer Connect lets you…", o: ["Query platform logs from Observability Cloud without re-ingesting", "Convert logs to traces", "Replace the Universal Forwarder", "Store metrics in buckets"], a: 0, why: "One console, no duplicated data." },
      { q: "Splunk Observability Cloud is natively built for…", o: ["Real-time metrics and traces", "Only raw log storage", "Only security events", "Only synthetic tests"], a: 0, why: "SignalFx heritage: streaming metrics + APM traces." },
    ],
  },
  {
    id: "streaming", topic: "o11y", title: "Streaming analytics and SignalFlow",
    lesson: "Traditional: write metrics to a TSDB, query periodically to evaluate alerts. SignalFx: computations run on the stream as data arrives → detectors in seconds. SignalFlow is the Python-like language behind charts and detectors. Metric types: gauge, counter, cumulative counter, histogram.",
    related: ["detectors", "mts"],
    qs: [
      { q: "'Streaming' metrics analytics means…", o: ["Alerts are evaluated on data as it arrives", "Metrics are queried every 5 minutes from disk", "Metrics are converted to logs", "Only dashboards update live"], a: 0, why: "No wait for persist-then-query → alerts in seconds." },
      { q: "SignalFlow is…", o: ["The language behind Splunk O11y charts and detectors", "Splunk's log query language", "A Kubernetes operator", "An OTel exporter"], a: 0, why: "Python-like flows: filter, aggregate, percentile, compare to last week." },
    ],
  },
  {
    id: "detectors", topic: "o11y", title: "Detector strategies",
    lesson: "Static threshold; Sudden change (recent window vs preceding); Historical anomaly (vs same time previous weeks — understands seasonality); Outlier (one member differs from its peers, e.g. 1 pod of 50); Resource running out (projects exhaustion, e.g. disk).",
    related: ["streaming", "alert-fatigue"],
    qs: [
      { q: "Traffic is always high on Monday 9am. Which detector avoids false alarms then?", o: ["Historical anomaly", "Static threshold", "Resource running out", "Outlier"], a: 0, why: "It compares with the same time in previous weeks: seasonality." },
      { q: "One pod out of 50 is much slower than the rest. Which detector?", o: ["Outlier", "Sudden change", "Static threshold", "Historical anomaly"], a: 0, why: "Outlier compares a member against its peer group." },
      { q: "'Disk will be full in 6 hours' comes from…", o: ["Resource running out", "Sudden change", "Outlier", "Static threshold"], a: 0, why: "It projects the trend to exhaustion." },
    ],
  },
  {
    id: "mpm", topic: "o11y", title: "Metrics Pipeline Management",
    lesson: "MPM lets you, at ingest, aggregate metrics by dropping dimensions you don't need, or discard metrics entirely. It's the direct weapon against cardinality explosions.",
    line: "Controlling cardinality at ingest is cheaper than paying for it and regretting it later.",
    related: ["cardinality", "cost-levers"],
    qs: [
      { q: "A team added pod_uid as a dimension and MTS exploded. Quickest Splunk fix?", o: ["Metrics Pipeline Management: aggregate away the dimension at ingest", "Increase the search factor", "Move data to frozen", "Add more search heads"], a: 0, why: "MPM drops/aggregates dimensions before they cost you." },
      { q: "MPM acts…", o: ["At ingest time", "Only at query time", "In the browser", "Only on logs"], a: 0, why: "Controls metrics before storage." },
    ],
  },
  {
    id: "nosample", topic: "o11y", title: "NoSample / full-fidelity APM",
    lesson: "Many tools keep 1–10% of traces. Splunk APM ingests every trace (NoSample). Argument: the problems that hurt are rare by definition — p99.9, one customer, an intermittent failure. Random head sampling probably threw that trace away.",
    line: "With full fidelity, the trace of the customer who's complaining is always there.",
    related: ["sampling", "metricsets"],
    qs: [
      { q: "Strongest argument for not sampling traces?", o: ["The painful problems are rare and random sampling likely drops them", "Sampling is illegal in some countries", "Traces are cheaper than metrics", "Sampling breaks the service map"], a: 0, why: "Rare = exactly what random sampling misses." },
      { q: "'Full fidelity' in Splunk APM means…", o: ["Every trace is ingested", "Every log is converted to a metric", "Every pod has a sidecar", "Every metric has user_id"], a: 0, why: "NoSample: 100% of traces." },
    ],
  },
  {
    id: "tag-spotlight", topic: "o11y", title: "Service map and Tag Spotlight",
    lesson: "Service map: auto-generated from traces, dependencies with latency/error rate per edge. Tag Spotlight: breaks errors and latency down by every span attribute (version, region, endpoint, tier, node) — e.g. all errors come from v2.3 in one AZ. Trace Analyzer: search individual traces.",
    related: ["nosample", "metricsets", "incident"],
    qs: [
      { q: "You want to see in one click that all errors come from version 2.3 in one AZ. Tool?", o: ["Tag Spotlight", "Service map", "Synthetics", "Deployment server"], a: 0, why: "Tag Spotlight = high-cardinality breakdown by span tag." },
      { q: "The APM service map is built from…", o: ["Traces", "Kubernetes YAML", "DNS records", "License usage"], a: 0, why: "Spans reveal who calls whom." },
    ],
  },
  {
    id: "metricsets", topic: "o11y", title: "MetricSets (TMS / MMS)",
    lesson: "Splunk computes metrics from spans. Troubleshooting MetricSets (TMS): high cardinality, power Tag Spotlight and the service map. Monitoring MetricSets (MMS): power long-term charts and detectors. Path forward: histogram MMS, which aggregate percentiles correctly.",
    related: ["tag-spotlight", "spanmetrics"],
    qs: [
      { q: "Which MetricSet powers interactive troubleshooting like Tag Spotlight?", o: ["Troubleshooting MetricSets (TMS)", "Monitoring MetricSets (MMS)", "Bloom filters", "tsidx files"], a: 0, why: "TMS = high cardinality, interactive. MMS = charts and detectors." },
      { q: "Why are histograms preferred for MMS?", o: ["They let you compute percentiles correctly when aggregating", "They use less license", "They are required by HEC", "They replace traces"], a: 0, why: "You can't average p99s; you can merge histograms." },
    ],
  },
  {
    id: "apm-extras", topic: "o11y", title: "Profiling, DB queries, business transactions",
    lesson: "AlwaysOn Profiling ties CPU/memory profiles to spans. Database Query Performance shows slow queries from the app's view. Business transactions (from AppDynamics) group traces by business operation like checkout or login. Secure Application detects runtime vulnerabilities with the same OTel instrumentation.",
    related: ["profiles", "cisco"],
    qs: [
      { q: "Grouping traces by 'checkout' or 'login' instead of endpoint is called…", o: ["Business transactions", "Tag Spotlight", "Outlier detection", "Baggage"], a: 0, why: "Core AppDynamics concept, now in Splunk APM." },
      { q: "Secure Application in Splunk APM uses…", o: ["The existing OpenTelemetry instrumentation", "A separate security agent per host", "Synthetic browser tests", "SmartStore"], a: 0, why: "No extra agents: reuses APM instrumentation." },
    ],
  },
  {
    id: "rum-synth", topic: "o11y", title: "RUM, Core Web Vitals and Synthetics",
    lesson: "RUM instruments real users' browsers/apps: page loads, JS errors, Core Web Vitals — LCP (main element render time), INP (responsiveness), CLS (layout stability) — plus session replay, linked to backend traces. Synthetics (Rigor heritage): scheduled uptime, API and browser tests from global locations.",
    line: "RUM tells you what users experienced; synthetics tells you what they would experience, even at 4 am.",
    related: ["correlation"],
    qs: [
      { q: "Which Core Web Vital measures visual stability?", o: ["CLS", "LCP", "INP", "TTFB"], a: 0, why: "CLS = cumulative layout shift. LCP = main render, INP = responsiveness." },
      { q: "You want to know checkout works at 4 am when nobody is shopping. Use…", o: ["Synthetic browser tests", "RUM", "Profiling", "Tag Spotlight"], a: 0, why: "Synthetics simulate users on a schedule; RUM needs real users." },
    ],
  },

  // ------------------------------------------------------------ OpenTelemetry
  {
    id: "otel-what", topic: "otel", title: "What OpenTelemetry is (and isn't)",
    lesson: "CNCF project born in 2019 from merging OpenTracing and OpenCensus; second most active CNCF project after Kubernetes. Open standard to generate, collect and export traces, metrics, logs (and profiles). It is NOT a backend: it doesn't store or visualize.",
    line: "Instrument once, send anywhere: OTel commoditizes instrumentation; vendors compete on what they do with the data.",
    related: ["otel-parts", "collector", "os-otel"],
    qs: [
      { q: "OpenTelemetry was born from merging…", o: ["OpenTracing and OpenCensus", "Prometheus and Jaeger", "Zipkin and Fluentd", "SignalFx and Omnition"], a: 0, why: "2019 merger of OpenTracing + OpenCensus." },
      { q: "Which is NOT something OpenTelemetry does?", o: ["Store and visualize telemetry", "Define semantic conventions", "Export via OTLP", "Provide SDKs per language"], a: 0, why: "OTel is not a backend; Splunk, OpenSearch, Dynatrace are." },
    ],
  },
  {
    id: "otel-parts", topic: "otel", title: "API, SDK and zero-code instrumentation",
    lesson: "The API is what your code calls to create spans and metrics; the SDK implements it (sampling, processing, export). Zero-code instrumentation (auto-instrumentation): e.g. a Java agent attached at JVM start captures HTTP, DB and queue calls without code changes. In Kubernetes, the OTel Operator injects it with one pod annotation.",
    related: ["otel-what", "operator"],
    qs: [
      { q: "Where are sampling and export decided?", o: ["In the SDK", "In the API", "In the semantic conventions", "In the traceparent header only"], a: 0, why: "API = interface for your code; SDK = implementation choices." },
      { q: "Java zero-code instrumentation works by…", o: ["Attaching an agent when the JVM starts", "Recompiling the app with a plugin", "Reading the app's logs", "Polling JMX only"], a: 0, why: "The -javaagent captures HTTP/DB/queue calls automatically." },
    ],
  },
  {
    id: "semconv", topic: "otel", title: "Semantic conventions",
    lesson: "Standard attribute names (service.name, http.request.method, db.system) so backends build views automatically. Resource attributes describe WHO emits (service, version, host, pod); span attributes describe the operation. In Splunk APM, service.name and deployment.environment organize everything.",
    related: ["otel-what", "k8sattr"],
    qs: [
      { q: "Which is a resource attribute (describes who emits)?", o: ["service.name", "http.request.method", "db.statement", "http.response.status_code"], a: 0, why: "Resource = service, version, host, pod. The others describe one operation." },
      { q: "Splunk APM organizes its whole experience by service.name and…", o: ["deployment.environment", "user.id", "trace.flags", "host.ip"], a: 0, why: "Environment + service drive APM views." },
    ],
  },
  {
    id: "context-prop", topic: "otel", title: "Context propagation",
    lesson: "For a trace to cross services, context travels in headers. The standard is W3C Trace Context: the traceparent header carries trace ID, parent span ID and sampling flags. Baggage propagates business key-value pairs across the whole request.",
    related: ["traces-spans", "sampling"],
    qs: [
      { q: "Which header carries trace ID and parent span ID in W3C Trace Context?", o: ["traceparent", "baggage", "x-request-id", "authorization"], a: 0, why: "traceparent: version-traceid-parentid-flags." },
      { q: "You want customer_tier available in every downstream service. Use…", o: ["Baggage", "A metric dimension", "A new index", "A DaemonSet"], a: 0, why: "Baggage carries business key-values along the request." },
    ],
  },
  {
    id: "otlp", topic: "otel", title: "OTLP ports",
    lesson: "OTLP, the OpenTelemetry Protocol: gRPC on port 4317, HTTP on port 4318.",
    related: ["collector"],
    qs: [
      { q: "OTLP over gRPC uses port…", o: ["4317", "4318", "8088", "9997"], a: 0, why: "4317 gRPC, 4318 HTTP." },
      { q: "OTLP over HTTP uses port…", o: ["4318", "4317", "8088", "9200"], a: 0, why: "4318 HTTP. 9200 is OpenSearch's REST port." },
    ],
  },
  {
    id: "collector", topic: "otel", title: "The Collector: receivers, processors, exporters",
    lesson: "Pipelines per signal chain receivers (OTLP, Prometheus, filelog, hostmetrics, k8s…), processors (transform) and exporters (one or many destinations — e.g. Splunk and another backend in parallel). Connectors join pipelines; extensions add things like health_check.",
    related: ["processors", "spanmetrics", "agent-gateway"],
    qs: [
      { q: "Send the same traces to Splunk and to OpenSearch at once. You add…", o: ["A second exporter to the pipeline", "A second receiver", "A memory_limiter", "A new trace ID"], a: 0, why: "Pipelines can fan out to several exporters." },
      { q: "A Collector pipeline order is…", o: ["Receivers → processors → exporters", "Exporters → processors → receivers", "Processors → receivers → exporters", "Connectors → extensions → receivers"], a: 0, why: "In, transform, out." },
    ],
  },
  {
    id: "processors", topic: "otel", title: "Essential processors",
    lesson: "memory_limiter (protects from OOM — always FIRST), batch (groups for efficient sending), resourcedetection (cloud/host metadata), k8sattributes (pod, namespace, deployment), filter and attributes (drop/modify, e.g. strip PII before it leaves your network).",
    related: ["collector", "k8sattr"],
    qs: [
      { q: "Which processor should always go first?", o: ["memory_limiter", "batch", "k8sattributes", "filter"], a: 0, why: "Protect the collector before anything else consumes memory." },
      { q: "Strip emails from spans before they leave the network. Use…", o: ["attributes / filter processor", "batch processor", "OTLP receiver", "health_check extension"], a: 0, why: "Modify or drop attributes in the pipeline." },
    ],
  },
  {
    id: "spanmetrics", topic: "otel", title: "Connectors: span metrics → RED",
    lesson: "A connector joins pipelines: it's an exporter for one and a receiver for another. Classic example: the spanmetrics connector reads traces and generates RED metrics (rate, errors, duration). Compute them BEFORE sampling, or they're skewed.",
    related: ["collector", "red-use", "sampling"],
    qs: [
      { q: "The spanmetrics connector produces…", o: ["RED metrics from traces", "Logs from metrics", "Profiles from logs", "Traces from metrics"], a: 0, why: "Rate, errors, duration per service/operation." },
      { q: "Why compute trace-derived metrics before sampling?", o: ["On a sample, rates and error ratios come out skewed", "Sampling deletes metric names", "Connectors can't run after processors", "OTLP forbids it"], a: 0, why: "Metrics must see 100% of spans to be right." },
    ],
  },
  {
    id: "agent-gateway", topic: "otel", title: "Agent vs gateway",
    lesson: "Agent: a collector per host (or a DaemonSet per node) collects host metrics, enriches with local metadata, forwards. Gateway: a central pool behind a load balancer that centralizes credentials, filtering, routing and tail sampling.",
    related: ["tail-lb", "daemonset", "k8s-collect"],
    qs: [
      { q: "Where do you usually centralize credentials and tail sampling?", o: ["Gateway collectors", "Agent on every host", "Inside the app SDK", "On the search head"], a: 0, why: "Gateway = heavy lifting in one place." },
      { q: "In Kubernetes, the agent collector is deployed as…", o: ["A DaemonSet", "A StatefulSet", "A CronJob", "A single Pod"], a: 0, why: "One per node, to read local data." },
    ],
  },
  {
    id: "tail-lb", topic: "otel", title: "Tail sampling needs trace-ID routing",
    lesson: "Tail sampling decides after the trace completes, so ALL spans of a trace must land on the same collector. Put a first tier with the loadbalancing exporter routing by trace ID in front of the sampling gateways; otherwise each collector sees fragments and decides wrong.",
    related: ["sampling", "agent-gateway"],
    qs: [
      { q: "Tail sampling across 3 gateway collectors makes bad decisions. Likely cause?", o: ["Spans of one trace land on different collectors", "memory_limiter is first", "OTLP uses port 4317", "batch processor is enabled"], a: 0, why: "Route by trace ID with the loadbalancing exporter." },
      { q: "The component that routes spans by trace ID is…", o: ["loadbalancing exporter", "k8sattributes processor", "filelog receiver", "health_check extension"], a: 0, why: "First tier → consistent hashing on trace ID." },
    ],
  },
  {
    id: "splunk-otel", topic: "otel", title: "Splunk Distribution of the OTel Collector",
    lesson: "The standard collector plus components Splunk supports, with a Helm chart for Kubernetes. One deployment sends metrics to Infrastructure Monitoring, traces to APM, and logs to the Splunk Platform via HEC. Splunk is a top OTel contributor and uses it as its native collection method instead of proprietary agents.",
    related: ["helm-chart", "hec"],
    qs: [
      { q: "Splunk's native collection method for Observability Cloud is…", o: ["Its distribution of the OpenTelemetry Collector", "A proprietary closed agent", "SNMP polling", "The deployment server"], a: 0, why: "Splunk bet on OTel rather than proprietary agents." },
      { q: "With the Splunk OTel Collector, logs go to the Splunk Platform via…", o: ["HEC", "OTLP to the search head", "Bloom filters", "kube-proxy"], a: 0, why: "Metrics → IM, traces → APM, logs → platform via HEC." },
    ],
  },

  // ------------------------------------------------------------ Debates y SRE
  {
    id: "sampling", topic: "debate", title: "Head vs tail sampling",
    lesson: "Head: decided at request start (random %), propagated in traceparent — cheap but blind. Tail: decided after the trace completes — keep 100% errors and slow ones + a few normal ones; costs memory and needs trace-ID routing. Or no sampling (Splunk NoSample).",
    line: "Sampling is a decision about which questions you need to be able to answer.",
    related: ["tail-lb", "nosample", "spanmetrics"],
    qs: [
      { q: "Keep 100% of error traces and 5% of normal ones. Which sampling?", o: ["Tail sampling", "Head sampling", "No sampling", "Log sampling"], a: 0, why: "Only after seeing the whole trace do you know it had an error." },
      { q: "Main weakness of head sampling?", o: ["It decides before knowing if the trace is interesting", "It needs trace-ID routing", "It uses lots of collector memory", "It breaks traceparent"], a: 0, why: "Cheap and simple, but blind." },
    ],
  },
  {
    id: "cost-levers", topic: "debate", title: "Cost: four levers",
    lesson: "1) Filter/reduce before indexing: Edge Processor (customer side) and Ingest Processor (Splunk Cloud), both with SPL2. 2) Logs → metrics when you only count things. 3) Tiering: Federated Search for Amazon S3 queries data in place. 4) Metric cardinality control with MPM. Licensing: ingest-based (GB/day) or workload-based (compute).",
    line: "The problem isn't what it costs to keep data, it's keeping data nobody will ever query.",
    related: ["mpm", "os-dt-cost", "k8s-cost"],
    qs: [
      { q: "A log line is only ever used to count occurrences. Cheapest move?", o: ["Convert it to a metric at ingest", "Raise retention", "Add a search head", "Switch to head sampling"], a: 0, why: "Metrics are orders of magnitude cheaper than storing every line." },
      { q: "Splunk component that filters/masks data with SPL2 in the customer's own infrastructure?", o: ["Edge Processor", "Ingest Processor", "Deployment server", "License manager"], a: 0, why: "Edge = customer side; Ingest Processor = runs as a service in Splunk Cloud." },
      { q: "Query compliance data sitting in S3 without ingesting it:", o: ["Federated Search for Amazon S3", "SmartStore cache", "HEC", "Tag Spotlight"], a: 0, why: "Query in place, only when needed." },
    ],
  },
  {
    id: "wide-events", topic: "debate", title: "Three pillars vs observability 2.0",
    lesson: "Charity Majors (Honeycomb) argues the pillars store the same fact 3 times; proposes wide events: one structured, high-cardinality event per unit of work, deriving metrics/traces/logs from it. Counter: each signal has different cost profiles, and enterprises have huge existing investments. Balanced view: get there through correlation, not replacement.",
    related: ["correlation"],
    qs: [
      { q: "'Wide events' means…", o: ["One rich structured event per unit of work with many attributes", "Logs wider than 80 characters", "Metrics with fewer dimensions", "Events kept only one hour"], a: 0, why: "Single source of truth from which other views derive." },
      { q: "A balanced position on wide events:", o: ["Right direction, but most will get there via correlation, not replacement", "Metrics should be banned", "Logs are obsolete", "Traces must always be sampled"], a: 0, why: "Shared context across signals, without throwing away investments." },
    ],
  },
  {
    id: "slo", topic: "debate", title: "SLI, SLO, SLA and error budget",
    lesson: "SLI: the measurement (% requests OK under 300 ms). SLO: internal target (99.9% over 30 days). SLA: contractual, with penalties, looser than the SLO. Error budget: what's left — 99.9% over 30 days ≈ 43 minutes. Budget left → ship fast; burned → freeze and stabilize.",
    related: ["burn-rate", "red-use"],
    qs: [
      { q: "99.9% availability over 30 days allows roughly…", o: ["43 minutes of downtime", "4 minutes", "7 hours", "1 day"], a: 0, why: "30 × 24 × 60 × 0.001 ≈ 43 min." },
      { q: "Which should be stricter?", o: ["The SLO (internal) is stricter than the SLA", "The SLA is stricter than the SLO", "They must be equal", "The SLI is stricter than both"], a: 0, why: "You want to break your internal target before the contract." },
    ],
  },
  {
    id: "burn-rate", topic: "debate", title: "Burn-rate alerting",
    lesson: "Burn rate = how fast you spend the error budget. 1 = exactly used up at the end of the period; 14 ≈ gone in ~2 days (of 30). Google's SRE Workbook: multi-window alerts — short window + high burn rate pages; long window + low burn rate opens a ticket.",
    related: ["slo", "alert-fatigue"],
    qs: [
      { q: "Burn rate of 1 means…", o: ["The budget runs out exactly at the end of the window", "The service is down", "1% errors", "One alert per hour"], a: 0, why: "Spending at exactly the sustainable pace." },
      { q: "Why multi-window burn-rate alerts?", o: ["Catch fast disasters and slow degradations without paging for 1-minute blips", "To reduce license cost", "Because SLAs require it", "To sample traces"], a: 0, why: "Fast window pages, slow window tickets." },
    ],
  },
  {
    id: "red-use", topic: "debate", title: "Golden signals, RED and USE",
    lesson: "Google's four golden signals: latency, traffic, errors, saturation. RED (Tom Wilkie): rate, errors, duration — for services. USE (Brendan Gregg): utilization, saturation, errors — for resources (CPU, disk, network).",
    line: "RED for what the user feels, USE for the machine underneath.",
    related: ["slo", "spanmetrics"],
    qs: [
      { q: "USE method is designed for…", o: ["Resources like CPU, disk, network", "User-facing services", "Business KPIs", "Log retention"], a: 0, why: "Utilization, saturation, errors — Brendan Gregg." },
      { q: "Which is NOT one of the four golden signals?", o: ["Cardinality", "Latency", "Saturation", "Traffic"], a: 0, why: "Latency, traffic, errors, saturation." },
      { q: "RED stands for…", o: ["Rate, errors, duration", "Requests, events, data", "Replicas, errors, deployments", "Retention, eviction, disk"], a: 0, why: "Tom Wilkie's method for services." },
    ],
  },
  {
    id: "alert-fatigue", topic: "debate", title: "Alert fatigue: symptoms, not causes",
    lesson: "Alert on symptoms the user feels (checkout is slow), not causes (CPU at 90%) — causes go on dashboards. Splunk tools: dynamic/seasonal detectors, and ITSI (IT Service Intelligence) which models services with KPIs and health scores and groups related alerts into episodes (50 alerts → 1).",
    related: ["detectors", "burn-rate", "dt-davis"],
    qs: [
      { q: "Which is the better page-worthy alert?", o: ["Checkout p99 latency breaches its SLO", "A node's CPU is at 90%", "Disk at 70%", "One pod restarted once"], a: 0, why: "Symptoms on the pager; causes on dashboards." },
      { q: "Splunk ITSI groups related alerts into…", o: ["Episodes", "Buckets", "Spans", "MetricSets"], a: 0, why: "Fifty alerts from one incident → one episode." },
    ],
  },
  {
    id: "ai", topic: "debate", title: "AI for observability / observability for AI",
    lesson: "AI FOR observability: Splunk's AI troubleshooting agent (root cause for APM and K8s alerts + remediation plan), AI Assistant, and an MCP server to query data from IDEs/chatbots — must show its evidence. Observability FOR AI: LLM apps are non-deterministic; monitor tokens, cost, latency, quality; OTel has gen_ai semantic conventions.",
    line: "An AI agent is a non-deterministic distributed system; without traces you can't debug it.",
    related: ["semconv"],
    qs: [
      { q: "OTel attributes for model name and input/output tokens live under…", o: ["gen_ai.* semantic conventions", "k8s.* attributes", "http.* attributes", "db.* attributes"], a: 0, why: "Generative AI semantic conventions standardize LLM telemetry." },
      { q: "Biggest trust issue with an AI root-cause agent?", o: ["It must show the evidence (traces, metrics) it relied on", "It is too fast", "It can't read metrics", "It needs a Heavy Forwarder"], a: 0, why: "Engineers won't act on a black-box guess." },
    ],
  },
  {
    id: "cisco", topic: "debate", title: "Cisco full-stack observability",
    lesson: "Cisco's thesis: Splunk (logs, security, observability) + AppDynamics (business transactions) + ThousandEyes (network and internet visibility, including networks you don't own: cloud, CDN, ISPs). Many 'app problems' are network problems, and vice versa.",
    line: "Observability and security read the same data and ask different questions — no need to pay twice.",
    related: ["history", "apm-extras"],
    qs: [
      { q: "ThousandEyes adds visibility into…", o: ["Networks you don't own: ISPs, CDNs, cloud", "JVM garbage collection", "Splunk buckets", "Kubernetes etcd"], a: 0, why: "Internet and network path visibility." },
      { q: "AppDynamics' signature concept now in Splunk APM:", o: ["Business transactions", "Bloom filters", "SmartStore", "HEC tokens"], a: 0, why: "Group traces by business operation." },
    ],
  },
  {
    id: "multitenant", topic: "debate", title: "Multi-tenancy at scale",
    lesson: "Platform: per-customer indexes + roles restricting index access, or separate stacks. Observability Cloud: parent/child organizations, ingest tokens with limits per team/customer, centralized RBAC and audit. OTel: a gateway per customer or a tenant resource attribute to route, tag and meter before the backend.",
    related: ["agent-gateway", "dt-segments"],
    qs: [
      { q: "Isolating customers in the Splunk Platform is typically done with…", o: ["Per-customer indexes and roles limiting index access", "One bucket per customer", "Different HEC ports", "Separate bloom filters"], a: 0, why: "Index + role-based access, or separate stacks." },
      { q: "Cap one team's ingestion in Observability Cloud:", o: ["Ingest access tokens with limits", "Raise the search factor", "Use thawed buckets", "Disable Tag Spotlight"], a: 0, why: "Tokens can carry limits per team/customer." },
    ],
  },
  {
    id: "ebpf", topic: "debate", title: "eBPF",
    lesson: "eBPF runs safe sandboxed programs in the Linux kernel: see network calls, latencies, dependencies without touching the app — even uninstrumentable binaries. Limits: no business context, harder with encrypted traffic. Complementary to OTel instrumentation (OTel has an eBPF project started from a Grafana donation).",
    line: "eBPF gives you the full map; instrumentation gives you the meaning.",
    related: ["otel-parts"],
    qs: [
      { q: "Main limitation of eBPF-based observability?", o: ["It lacks business context inside the application", "It requires code changes", "It only works on Windows", "It can't see network calls"], a: 0, why: "Sees syscalls and traffic, not what the request means." },
      { q: "eBPF programs run…", o: ["Sandboxed inside the Linux kernel", "In the browser", "On the Splunk search head", "In etcd"], a: 0, why: "Kernel-level, safe, no app changes." },
    ],
  },

  // ------------------------------------------------------------ Kubernetes
  {
    id: "containers", topic: "k8s", title: "Containers and why Kubernetes exists",
    lesson: "A container packages app + runtime + libraries + config into an image stored in a registry. Unlike a VM it shares the host kernel → starts in seconds, weighs MBs. Thousands of containers need orchestration: placement, restarts, scaling, discovery. Kubernetes (K8s) came from Google's Borg, open-sourced 2014, first CNCF project.",
    line: "Containers solved packaging; Kubernetes solved operating thousands of them.",
    related: ["desired-state"],
    qs: [
      { q: "Key difference between a container and a VM?", o: ["A container shares the host kernel", "A container includes a full OS", "VMs start faster", "Containers can't use networking"], a: 0, why: "Shared kernel → lightweight and fast." },
      { q: "Kubernetes was inspired by Google's internal system called…", o: ["Borg", "Spanner", "Bigtable", "Dremel"], a: 0, why: "Borg → Kubernetes, 2014, first CNCF project." },
    ],
  },
  {
    id: "desired-state", topic: "k8s", title: "Desired state and reconciliation",
    lesson: "You declare how the system should look in a YAML manifest (3 replicas, this image, this memory limit). Controllers run a reconciliation loop comparing desired vs actual and close the gap — a crashed replica is recreated, a dead node's pods are rescheduled. Observability twist: self-healing hides problems.",
    line: "Kubernetes is very good at hiding symptoms; observability has to be very good at finding them.",
    related: ["k8s-layers", "control-plane"],
    qs: [
      { q: "A container crashes every 10 minutes but the service still answers. Why might nobody notice?", o: ["Kubernetes keeps restarting it (self-healing hides it)", "Kubernetes deletes the logs instantly", "The API server is down", "The pod has no IP"], a: 0, why: "Watch restarts, or you'll find out at the incident." },
      { q: "The reconciliation loop…", o: ["Continuously compares desired vs actual state and acts", "Runs once at deploy time", "Is a monitoring dashboard", "Is a type of probe"], a: 0, why: "Declarative: you say what, controllers do how." },
    ],
  },
  {
    id: "control-plane", topic: "k8s", title: "Control plane",
    lesson: "API server: front door to everything (if slow, the cluster is slow). etcd: key-value store with all cluster state, the source of truth (sensitive to disk latency). Scheduler: picks a node for each new pod. Controller manager: runs the reconciliation controllers. In EKS/AKS/GKE the provider runs it; you get its metrics in a limited way.",
    related: ["node-parts", "k8s-layers"],
    qs: [
      { q: "Where is the whole cluster state stored?", o: ["etcd", "kubelet", "kube-proxy", "The container registry"], a: 0, why: "etcd is the source of truth." },
      { q: "Which component decides on which node a new pod runs?", o: ["Scheduler", "kubelet", "etcd", "kube-proxy"], a: 0, why: "Scheduler uses requests and placement rules." },
    ],
  },
  {
    id: "node-parts", topic: "k8s", title: "Node components",
    lesson: "kubelet: the K8s agent on each node — starts pods via the runtime, watches health, reports status, and exposes CPU/memory/network/disk usage per pod/container (key telemetry source). Container runtime: containerd or CRI-O. kube-proxy: network rules so traffic reaches pods.",
    related: ["control-plane", "telemetry-sources"],
    qs: [
      { q: "Which node component exposes per-container CPU and memory usage?", o: ["kubelet", "kube-proxy", "etcd", "scheduler"], a: 0, why: "kubelet (via cAdvisor) = usage telemetry." },
      { q: "Today's usual container runtimes are…", o: ["containerd or CRI-O", "etcd or Raft", "Helm or Kustomize", "Fluent Bit or Data Prepper"], a: 0, why: "Runtime actually runs the containers." },
    ],
  },
  {
    id: "pods", topic: "k8s", title: "Pods are ephemeral",
    lesson: "The pod is the smallest unit: one or more containers sharing network and storage on one node (sometimes a sidecar). Pods are born, die, get replaced — new random-suffix name and new IP each time. Two observability problems: logs vanish if not collected, and pod names as metric dimensions explode cardinality.",
    related: ["k8s-card", "k8s-collect"],
    qs: [
      { q: "Smallest unit Kubernetes manages?", o: ["Pod", "Container", "Node", "Namespace"], a: 0, why: "K8s manages pods, not individual containers." },
      { q: "Why is pod name a bad alerting dimension?", o: ["It changes on every deployment → new time series", "It's always empty", "It can't be read by OTel", "It's encrypted"], a: 0, why: "Aggregate at workload/service level for alerts." },
    ],
  },
  {
    id: "workloads", topic: "k8s", title: "Deployment, StatefulSet, Job",
    lesson: "Deployment: stateless apps; rolling updates and rollback, uses a ReplicaSet underneath — each rollout is a deploy event worth correlating. StatefulSet: databases, Kafka, OpenSearch — stable names, ordering, own storage. Jobs/CronJobs: run and finish; watch success and duration.",
    related: ["daemonset", "k8s-layers"],
    qs: [
      { q: "Where would you run OpenSearch data nodes?", o: ["StatefulSet", "Deployment", "DaemonSet", "CronJob"], a: 0, why: "Stable identity + persistent storage per pod." },
      { q: "Object a Deployment uses underneath to keep the replica count:", o: ["ReplicaSet", "DaemonSet", "ConfigMap", "Ingress"], a: 0, why: "Deployment → ReplicaSet → Pods." },
    ],
  },
  {
    id: "daemonset", topic: "k8s", title: "DaemonSet",
    lesson: "Guarantees exactly one pod on every node; new node → new pod automatically. It's where agents live: log collection, node metrics, the OTel Collector in agent mode, Fluent Bit.",
    related: ["agent-gateway", "k8s-collect"],
    qs: [
      { q: "Exactly one log collector per node, including new nodes. Use a…", o: ["DaemonSet", "Deployment with 3 replicas", "StatefulSet", "Job"], a: 0, why: "One pod per node by design." },
      { q: "Which is typically a DaemonSet?", o: ["OTel Collector in agent mode", "A web API", "A PostgreSQL database", "A nightly backup"], a: 0, why: "Agents read node-local data." },
    ],
  },
  {
    id: "networking", topic: "k8s", title: "Service, Ingress, namespace, labels",
    lesson: "Service: stable name/IP load-balancing to pods selected by label (ClusterIP, NodePort, LoadBalancer). Ingress or Gateway API exposes HTTP externally; internal DNS by service name. Namespace: logical partition (teams, envs, tenants) — key filter dimension. Labels (app=payments, version=2.3): copy them into telemetry and you can group everything. ConfigMaps/Secrets inject config and tokens.",
    line: "Good labels are half your observability done.",
    related: ["k8sattr", "pods"],
    qs: [
      { q: "How does a Service find its pods?", o: ["By label selector", "By pod name", "By node IP", "By namespace only"], a: 0, why: "Labels are how K8s links objects." },
      { q: "Where should a Splunk ingest token live in Kubernetes?", o: ["A Secret", "A ConfigMap", "A label", "The container image"], a: 0, why: "Secrets for credentials, never baked into images." },
    ],
  },
  {
    id: "limits", topic: "k8s", title: "Requests, limits, throttling, OOMKilled",
    lesson: "Request: reserved, used by the scheduler. Limit: maximum. Over the CPU limit → throttled (slow, no error). Over the memory limit → the kernel kills it: OOMKilled, exit code 137, then restarted.",
    line: "The CPU limit makes you slow; the memory limit kills you — both without a single error line.",
    related: ["k8s-layers", "incident"],
    qs: [
      { q: "A container exceeds its memory limit. What happens?", o: ["OOMKilled (exit code 137) and restarted", "It's throttled and slows down", "It moves to another node", "Nothing"], a: 0, why: "Memory isn't compressible: the kernel kills it." },
      { q: "Latency rises, no errors in logs, CPU usage flat at the limit. Suspect…", o: ["CPU throttling", "OOMKilled", "ImagePullBackOff", "etcd corruption"], a: 0, why: "Throttling slows silently." },
      { q: "The scheduler places pods based on…", o: ["Requests", "Limits", "Labels only", "Current logs"], a: 0, why: "Requests are the reservation the scheduler uses." },
    ],
  },
  {
    id: "probes", topic: "k8s", title: "Liveness, readiness, startup probes",
    lesson: "Liveness: are you alive? Fail → restart. Readiness: ready for traffic? Fail → removed from the Service, not restarted. Startup: gives slow apps time to boot. Bad probes → cascading restarts or pods that never get traffic.",
    related: ["states"],
    qs: [
      { q: "A failing readiness probe causes…", o: ["The pod is removed from the Service endpoints", "The container is restarted", "The node is drained", "The image is re-pulled"], a: 0, why: "Liveness restarts; readiness only pulls traffic." },
      { q: "A slow-booting Java app keeps getting killed during startup. Add a…", o: ["Startup probe", "Readiness probe only", "HPA", "DaemonSet"], a: 0, why: "Startup probe holds off liveness until boot finishes." },
    ],
  },
  {
    id: "states", topic: "k8s", title: "Error states and events",
    lesson: "CrashLoopBackOff: starts, fails, restarts with growing waits — a symptom; cause is in the previous container's logs. ImagePullBackOff: wrong image or registry creds. Pending: no node fits its requests. Evicted: node out of memory/disk. Node NotReady: kubelet stopped reporting. Kubernetes events live ~1 hour in the API server — collect them or lose them.",
    related: ["probes", "k8s-collect"],
    qs: [
      { q: "A pod is stuck in Pending. Most likely cause?", o: ["No node has enough resources for its requests", "Wrong image name", "Liveness probe failing", "Memory limit exceeded"], a: 0, why: "Pending = can't be scheduled." },
      { q: "Where do you find the cause of a CrashLoopBackOff?", o: ["Logs of the previous container (kubectl logs --previous)", "The Service definition", "The Ingress", "etcd backups"], a: 0, why: "CrashLoopBackOff is the symptom." },
      { q: "By default, how long do Kubernetes events stay in the API server?", o: ["About one hour", "30 days", "Forever", "One minute"], a: 0, why: "Short-lived: collect them as the 'E' in MELT." },
    ],
  },
  {
    id: "scaling-tools", topic: "k8s", title: "Autoscaling, kubectl, Helm, operators",
    lesson: "HPA adds/removes replicas by a metric; VPA adjusts requests/limits; Cluster Autoscaler or Karpenter adds nodes. kubectl get / describe (shows events) / logs. Helm: package manager — charts of templated manifests + a values file. Operators encode app-specific ops knowledge (e.g. the OTel Operator). OpenShift: Red Hat's enterprise distribution.",
    related: ["helm-chart", "operator"],
    qs: [
      { q: "Which autoscaler adds pod replicas based on CPU?", o: ["HPA", "VPA", "Cluster Autoscaler", "kube-proxy"], a: 0, why: "Horizontal Pod Autoscaler = replicas." },
      { q: "A Helm chart is…", o: ["Templated manifests + a values file", "A Grafana dashboard", "A container runtime", "A Kubernetes event"], a: 0, why: "helm install with your values." },
    ],
  },

  // ------------------------------------------------------------ Observar Kubernetes
  {
    id: "k8s-hard", topic: "k8so", title: "Why Kubernetes is hard to observe",
    lesson: "Four reasons: ephemeral (names/IPs change), many layers (app, container, pod, node, cluster, cloud — symptoms cross layers), self-healing hides failures, and cardinality (every pod a new series).",
    line: "In Kubernetes you're observing a system that constantly changes shape; context is the key.",
    related: ["k8s-layers", "k8s-card"],
    qs: [
      { q: "Which is NOT one of the reasons K8s is hard to observe?", o: ["Pods have fixed names", "Self-healing hides failures", "Many layers", "Cardinality from pod churn"], a: 0, why: "Pod names change constantly — that's the problem." },
      { q: "A node low on memory shows up as API latency. This illustrates…", o: ["Symptoms crossing layers", "Head sampling", "Schema on read", "A bloom filter"], a: 0, why: "Problem in one layer, symptom in another." },
    ],
  },
  {
    id: "k8s-layers", topic: "k8so", title: "What to measure, layer by layer",
    lesson: "Control plane: API server latency/errors, etcd health, pending pods. Node: CPU/mem/disk/net + conditions Ready, MemoryPressure, DiskPressure, PIDPressure. Workload: desired vs available replicas (king metric). Container: restarts (most useful alert), OOMKilled, memory working set vs limit, CPU throttling. App: RED with traces.",
    related: ["limits", "baseline-detectors"],
    qs: [
      { q: "The 'king metric' at workload level is…", o: ["Desired vs available replicas", "Number of namespaces", "Image size", "etcd version"], a: 0, why: "Asked for 5, have 3 → trouble even if it answers." },
      { q: "For OOM risk, which memory metric matters?", o: ["Working set", "Total memory used including cache", "Swap", "Image size"], a: 0, why: "The kernel decides OOM kills based on working set." },
      { q: "Probably the single most useful K8s alerting signal:", o: ["Container restarts", "Number of labels", "Pod name length", "Helm chart version"], a: 0, why: "Restarts reveal what self-healing hides." },
    ],
  },
  {
    id: "telemetry-sources", topic: "k8so", title: "Where the telemetry comes from",
    lesson: "Usage (CPU, memory, network) → kubelet/cAdvisor on each node. Object state (replicas, pod phase, restarts, node conditions) → API server (kube-state-metrics in Prometheus world). metrics-server feeds HPA and kubectl top — NOT a monitoring solution. Logs → /var/log/pods on the node. Events → API server. App metrics → /metrics in Prometheus format.",
    related: ["k8s-collect", "node-parts"],
    qs: [
      { q: "Desired vs available replicas come from…", o: ["The API server (kube-state-metrics)", "kubelet/cAdvisor", "metrics-server", "/var/log/pods"], a: 0, why: "Object state = API server. Usage = kubelet." },
      { q: "metrics-server exists to…", o: ["Feed the autoscaler and kubectl top", "Be the long-term monitoring backend", "Store logs", "Collect events"], a: 0, why: "Classic trap: it's not monitoring." },
      { q: "Container stdout logs end up…", o: ["In files under /var/log/pods on the node", "In etcd", "In the container registry", "In the API server for 1 hour"], a: 0, why: "Read them from the node with a DaemonSet." },
    ],
  },
  {
    id: "k8s-collect", topic: "k8so", title: "OTel receivers for Kubernetes",
    lesson: "kubeletstats (node/pod/container usage from the local kubelet), k8s_cluster (object state from the API server, ≈ kube-state-metrics), k8sobjects / k8s_events (events), filelog (container log files), hostmetrics (node OS), prometheus (scrape /metrics).",
    related: ["telemetry-sources", "k8sattr", "cluster-receiver"],
    qs: [
      { q: "Which receiver reads container log files on the node?", o: ["filelog", "kubeletstats", "k8s_cluster", "otlp"], a: 0, why: "filelog tails /var/log/pods." },
      { q: "The OTel equivalent of kube-state-metrics is…", o: ["k8s_cluster receiver", "kubeletstats receiver", "hostmetrics receiver", "batch processor"], a: 0, why: "Object state from the API server." },
    ],
  },
  {
    id: "k8sattr", topic: "k8so", title: "The k8sattributes processor",
    lesson: "When a span or log arrives from a pod, k8sattributes asks the API server and attaches pod name, namespace, deployment, node and chosen labels. Without it you have telemetry from an IP that no longer exists; with it you can jump trace → pod → node.",
    related: ["k8s-collect", "semconv", "networking"],
    qs: [
      { q: "Spans arrive tagged only with a pod IP that's gone. What's missing?", o: ["k8sattributes processor", "memory_limiter", "OTLP HTTP", "A readiness probe"], a: 0, why: "It enriches with pod, namespace, deployment, node." },
      { q: "k8sattributes gets its metadata from…", o: ["The Kubernetes API server", "The container image", "DNS only", "The Splunk search head"], a: 0, why: "It watches the API for pod metadata." },
    ],
  },
  {
    id: "cluster-receiver", topic: "k8so", title: "DaemonSet + cluster receiver (+ gateway)",
    lesson: "Node-local data (kubelet, logs, host) → DaemonSet agent. Cluster-wide data (object state, events) → ONE collector as a single-replica Deployment (Splunk chart: the 'cluster receiver'); otherwise you'd duplicate data per node and hammer the API server. Optional gateway for centralized processing and tail sampling.",
    line: "Local data per node with a DaemonSet; cluster data once with a cluster receiver.",
    related: ["agent-gateway", "helm-chart"],
    qs: [
      { q: "Why not collect events from every DaemonSet agent?", o: ["Duplicated data per node and API server overload", "Agents can't read events", "Events are only in etcd backups", "It breaks OTLP"], a: 0, why: "Cluster-wide data is collected once." },
      { q: "In the Splunk chart, the single-replica collector for cluster data is the…", o: ["Cluster receiver", "Gateway", "Heavy Forwarder", "Sidecar"], a: 0, why: "One replica Deployment." },
    ],
  },
  {
    id: "helm-chart", topic: "k8so", title: "Splunk OTel Collector Helm chart",
    lesson: "Values: clusterName (dimension on everything — vital with many clusters), realm + access token (Observability Cloud), HEC endpoint + token + index (Splunk Platform). One helm install → agent DaemonSet, cluster receiver, metrics to O11y, logs and events to the platform via HEC, and a trace receiver on each node.",
    related: ["splunk-otel", "cluster-receiver", "operator"],
    qs: [
      { q: "In the Splunk chart, the Observability Cloud region is set with…", o: ["realm", "zone", "index", "sourcetype"], a: 0, why: "realm + access token for O11y; HEC endpoint + token + index for logs." },
      { q: "Why is clusterName so important?", o: ["It becomes a dimension on all telemetry across many clusters", "It sets the HEC port", "It names the bucket", "It's the image tag"], a: 0, why: "Multi-cluster needs it to tell data apart." },
    ],
  },
  {
    id: "operator", topic: "k8so", title: "Auto-instrumentation with the OTel Operator",
    lesson: "The chart can deploy the OpenTelemetry Operator; an annotation on the deployment (e.g. inject Java) makes the operator add the agent when the pod starts. No code changes, no image rebuild — huge for hundreds of services.",
    related: ["otel-parts", "helm-chart", "dt-oneagent"],
    qs: [
      { q: "How do you enable auto-instrumentation for a Java deployment with the OTel Operator?", o: ["Add an annotation to the deployment", "Rebuild the image with the SDK", "Edit etcd", "Add a readiness probe"], a: 0, why: "Annotation → operator injects agent at pod start." },
      { q: "Main benefit of operator injection?", o: ["No code changes and no image rebuild", "It removes the need for a backend", "It samples logs", "It replaces kubelet"], a: 0, why: "Scales instrumentation to hundreds of services." },
    ],
  },
  {
    id: "baseline-detectors", topic: "k8so", title: "Baseline K8s detectors",
    lesson: "CrashLoopBackOff / frequent restarts; available < desired replicas; nodes NotReady or under memory/disk pressure; memory close to limit; sustained CPU throttling; pods Pending too long; persistent volumes nearly full. Splunk's new entity-based Kubernetes experience (replacing the navigator) navigates cluster → node → workload → pod → container.",
    related: ["k8s-layers", "states"],
    qs: [
      { q: "Which is NOT a standard baseline K8s detector?", o: ["Number of labels per pod", "Pods in CrashLoopBackOff", "Available < desired replicas", "Node under DiskPressure"], a: 0, why: "Label count isn't a health signal." },
      { q: "Warn about OOMKills BEFORE they happen with…", o: ["Memory working set close to the limit", "Restart count", "Pending pods", "Image pull errors"], a: 0, why: "Approaching the limit predicts the kill." },
    ],
  },
  {
    id: "incident", topic: "k8so", title: "An incident end to end",
    lesson: "Checkout p99 200 ms → 2 s, no errors. Tag Spotlight: only pods on one node. Infra view: MemoryPressure + checkout heavily CPU-throttled (last deploy lowered CPU limit). Events: rolling update + other pods OOMKilled on that node. Logs by trace ID: timeouts to inventory. Fix: restore limit/rollback, add a throttling detector.",
    line: "No single signal solved it: the metric alerted, the trace isolated, infra showed throttling, the event showed what changed, the log confirmed.",
    related: ["tag-spotlight", "limits", "correlation"],
    qs: [
      { q: "Latency up, zero errors, right after a deploy. First K8s suspect?", o: ["A lowered CPU limit causing throttling", "ImagePullBackOff", "A wrong DNS name", "Frozen buckets"], a: 0, why: "Throttling = slow without errors." },
      { q: "In that story, which signal showed WHAT CHANGED?", o: ["Kubernetes events (the rolling update)", "The p99 metric", "The trace", "The profile"], a: 0, why: "Events answer 'what changed?'." },
    ],
  },
  {
    id: "k8s-card", topic: "k8so", title: "Cost and cardinality in Kubernetes",
    lesson: "Pod names and container IDs change on every deploy: aggregate at workload/deployment/service for alerting; keep pod detail for investigation. Use MPM. Beware unfiltered Prometheus scraping across a whole cluster — fastest way to multiply series. Logs: exclude noisy/system namespaces, drop debug in the collector, route by value.",
    related: ["cardinality", "mpm", "k8s-cost"],
    qs: [
      { q: "Fastest way to multiply your time series in a cluster?", o: ["Unfiltered Prometheus scraping everywhere", "Adding a namespace", "Using a DaemonSet", "Using readiness probes"], a: 0, why: "Every endpoint, every series, every pod." },
      { q: "For alerting, aggregate container metrics at…", o: ["Workload / service level", "Pod name level", "Container ID level", "Trace ID level"], a: 0, why: "Stable dimensions for alerts; pod detail for drill-down." },
    ],
  },
  {
    id: "k8s-cost", topic: "k8so", title: "DaemonSet vs sidecar, Prometheus vs OTel",
    lesson: "Sidecar collector per pod: isolation but multiplies resources and complexity; reserved for special cases (serverless containers where you don't control the node). DaemonSet is the standard. Prometheus vs OTel: they coexist — the OTel Collector can scrape Prometheus endpoints and ship alongside traces and logs. Multi-cluster: cluster name + environment mandatory.",
    related: ["daemonset", "k8s-card"],
    qs: [
      { q: "When is a sidecar collector justified?", o: ["Serverless containers where you don't control the node", "Always, it's the standard", "To reduce resource usage", "To read node logs"], a: 0, why: "DaemonSet is the default; sidecars for special cases." },
      { q: "Prometheus vs OpenTelemetry in Kubernetes:", o: ["They coexist: OTel can scrape Prometheus endpoints", "OTel can't read Prometheus metrics", "Prometheus replaces traces", "You must pick one and delete the other"], a: 0, why: "One pipeline for Prometheus metrics + traces + logs." },
    ],
  },

  // ------------------------------------------------------------ Tu experiencia: OpenSearch y Dynatrace
  {
    id: "os-mapping", topic: "bridge", title: "OpenSearch: mappings and field explosion",
    lesson: "In OpenSearch you design the schema: explicit mappings (keyword vs text vs date), index templates, and you guard against dynamic mapping explosion (index.mapping.total_fields.limit, default 1,000; flat_object for unknown JSON). Splunk equivalent: none needed — schema on read.",
    line: "In OpenSearch, index design is your problem; in Splunk, the real question is which data is worth indexing at all.",
    related: ["schema-read", "os-shards"],
    qs: [
      { q: "'How did you handle new fields in OpenSearch?' — best concise answer:", o: ["Index templates with explicit mappings, dynamic mapping limited, flat_object for unknown JSON", "We let dynamic mapping add every field", "We stored everything as metrics", "We used Splunk buckets"], a: 0, why: "Shows you've lived mapping explosions." },
      { q: "In OpenSearch, a field you'll aggregate on (e.g. status) should be mapped as…", o: ["keyword", "text (analyzed)", "binary", "nested always"], a: 0, why: "keyword = exact values, aggregatable; text = full-text search." },
    ],
  },
  {
    id: "os-shards", topic: "bridge", title: "OpenSearch: shards and replicas",
    lesson: "You choose primary shard count (fixed at creation, unless split/shrink) and replicas. Rule of thumb: shards of ~10–50 GB; too many small shards waste heap. Every replica is searchable. Cluster manager node ≈ Splunk cluster manager. Splunk instead buckets automatically by time.",
    related: ["rf-sf", "os-mapping"],
    qs: [
      { q: "Splunk RF/SF maps to OpenSearch as…", o: ["Replicas — but every OpenSearch replica is searchable", "Primary shards only", "ISM states", "Data Prepper pipelines"], a: 0, why: "No 'non-searchable' copy concept in OpenSearch." },
      { q: "A classic OpenSearch performance mistake:", o: ["Too many tiny shards (oversharding)", "Using keyword fields", "Using index templates", "Having a cluster manager node"], a: 0, why: "Each shard costs heap; aim for ~10–50 GB shards." },
    ],
  },
  {
    id: "os-ism", topic: "bridge", title: "OpenSearch: ISM, UltraWarm, snapshots",
    lesson: "Index State Management policies: hot → warm → cold → delete, rollover by size/age (often with data streams). Amazon OpenSearch Service adds UltraWarm (S3-backed) and cold storage; searchable snapshots query data in object storage. Splunk equivalents: bucket lifecycle and SmartStore.",
    related: ["buckets", "smartstore"],
    qs: [
      { q: "'How do you manage retention in OpenSearch?' — best answer:", o: ["ISM policies: rollover by size/age, hot→warm/UltraWarm→cold→delete", "Manually deleting documents with delete_by_query", "Setting frozenTimePeriodInSecs", "Lowering search factor"], a: 0, why: "ISM + rollover is the idiomatic way." },
      { q: "Splunk SmartStore's closest OpenSearch equivalent:", o: ["UltraWarm / searchable snapshots", "Dynamic mapping", "Data Prepper", "PPL"], a: 0, why: "Both put older data on object storage with a local cache." },
    ],
  },
  {
    id: "os-otel", topic: "bridge", title: "OpenSearch observability stack",
    lesson: "Logs on Kubernetes: Fluent Bit DaemonSet → OpenSearch (same pattern as the OTel agent). Traces/logs via OTel: Data Prepper as the ingestion pipeline; Observability plugin with Trace Analytics, service map and PPL queries; Alerting plugin (monitors) and Anomaly Detection (Random Cut Forest). Message: OTel is the common ground — migrating = change the exporter, not re-instrument.",
    line: "Migration stops being a re-instrumentation project and becomes a pipeline reconfiguration.",
    related: ["otel-what", "daemonset", "collector"],
    qs: [
      { q: "In the OpenSearch world, the OTel ingestion pipeline component is…", o: ["Data Prepper", "Heavy Forwarder", "SignalFlow", "ActiveGate"], a: 0, why: "Data Prepper receives OTel traces/logs for OpenSearch." },
      { q: "A customer moves from OpenSearch to Splunk and already uses OTel. What changes?", o: ["Mostly the Collector exporters/pipeline config", "All application code", "Kubernetes version", "Nothing can be reused"], a: 0, why: "Instrumentation stays; backend changes." },
      { q: "OpenSearch's built-in ML for anomalies uses…", o: ["Random Cut Forest", "SignalFlow", "Davis AI", "Bloom filters"], a: 0, why: "The Anomaly Detection plugin is based on RCF." },
    ],
  },
  {
    id: "dt-oneagent", topic: "bridge", title: "Dynatrace: OneAgent and the Operator",
    lesson: "Dynatrace OneAgent: one agent per host that auto-discovers processes and injects code modules (Java, .NET, Node…) — zero-touch full-stack. In Kubernetes: Dynatrace Operator with a DynaKube custom resource (cloud-native full-stack or application-only). ActiveGate routes/proxies traffic and does API-based monitoring. Splunk equivalent: OTel Collector + zero-code agents + OTel Operator annotation.",
    related: ["operator", "otel-parts"],
    qs: [
      { q: "'How do you instrument in Dynatrace?' maps in Splunk to…", o: ["OTel Collector + zero-code instrumentation (Operator annotation in K8s)", "Heavy Forwarders on each app", "Synthetic tests only", "SmartStore"], a: 0, why: "OneAgent auto-injection ≈ OTel auto-instrumentation." },
      { q: "In Dynatrace, the K8s custom resource configured by the Operator is…", o: ["DynaKube", "HelmRelease", "ServiceMonitor", "SignalFlow"], a: 0, why: "DynaKube defines how OneAgent/ActiveGate are deployed." },
    ],
  },
  {
    id: "dt-smartscape", topic: "bridge", title: "Dynatrace: Smartscape and PurePath",
    lesson: "Smartscape: real-time topology map, vertical (data center → host → process → service → application) and horizontal (dependencies). PurePath: Dynatrace's distributed traces with code-level detail. Splunk equivalents: APM service map + Kubernetes/infra navigation; traces in APM (NoSample), plus AlwaysOn Profiling for code level.",
    related: ["tag-spotlight", "traces-spans"],
    qs: [
      { q: "Dynatrace PurePath ≈ which Splunk concept?", o: ["APM traces (full fidelity)", "Splunk buckets", "HEC", "ITSI episodes"], a: 0, why: "Both are end-to-end distributed traces." },
      { q: "Dynatrace Smartscape ≈ in Splunk…", o: ["Service map + infra/K8s entity navigation", "SPL2", "Federated Search", "Bloom filters"], a: 0, why: "Topology view of dependencies and stack." },
    ],
  },
  {
    id: "dt-davis", topic: "bridge", title: "Dynatrace: Davis AI and Problems",
    lesson: "Davis: causal AI that walks the Smartscape topology to find root cause, with automatic baselining; it groups correlated events into one 'Problem'. Splunk equivalents: detectors with historical anomaly/seasonality, ITSI episodes for grouping, and the AI troubleshooting agent for root cause.",
    line: "Davis relies on topology; the Splunk answer is the same idea: context from OTel resource attributes plus correlation.",
    related: ["alert-fatigue", "ai", "detectors"],
    qs: [
      { q: "Dynatrace 'Problems' grouping many events ≈ in Splunk…", o: ["ITSI episodes", "Hot buckets", "MetricSets", "HEC tokens"], a: 0, why: "Both collapse many alerts into one incident." },
      { q: "Why is Davis' root cause analysis effective?", o: ["It uses the real-time topology (Smartscape) for causality", "It samples 1% of traces", "It reads only logs", "It uses static thresholds only"], a: 0, why: "Causal AI over topology, not just correlation of timings." },
    ],
  },
  {
    id: "dt-grail", topic: "bridge", title: "Dynatrace: Grail, DQL, OpenPipeline",
    lesson: "Grail: Dynatrace's data lakehouse — schema on read, like Splunk. DQL: pipe-based query language (fetch logs | filter … | summarize …), conceptually close to SPL. OpenPipeline: ingest processing to filter, mask, extract metrics and route — like Splunk Edge/Ingest Processor.",
    related: ["schema-read", "cost-levers"],
    qs: [
      { q: "Dynatrace OpenPipeline ≈ in Splunk…", o: ["Edge Processor / Ingest Processor", "Search head clustering", "Tag Spotlight", "Thawed buckets"], a: 0, why: "Process, mask, extract metrics, route at ingest." },
      { q: "Grail is closer to Splunk than to OpenSearch because…", o: ["It is schema on read", "It needs a mapping", "It stores only metrics", "It uses shards you size manually"], a: 0, why: "Ingest raw, parse at query time." },
      { q: "DQL is conceptually closest to…", o: ["SPL (pipe-based)", "SQL DDL", "YAML manifests", "PromQL only"], a: 0, why: "fetch | filter | summarize ≈ search | where | stats." },
    ],
  },
  {
    id: "dt-segments", topic: "bridge", title: "Dynatrace: management zones and multi-tenancy",
    lesson: "Dynatrace segments access with management zones (now also IAM policies/segments) and environments per tenant. Splunk equivalents: indexes + roles in the platform, parent/child orgs and token limits in Observability Cloud, plus OTel tenant attributes.",
    related: ["multitenant"],
    qs: [
      { q: "Dynatrace management zones ≈ in the Splunk Platform…", o: ["Indexes + roles restricting access", "Bloom filters", "Hot buckets", "SignalFlow"], a: 0, why: "Both scope what each team sees." },
      { q: "Dynatrace 'one environment per customer' ≈ Splunk Observability Cloud…", o: ["Child organizations under a parent", "One bucket per customer", "One HEC port per customer", "One detector per customer"], a: 0, why: "Parent/child orgs isolate tenants." },
    ],
  },
  {
    id: "os-dt-cost", topic: "bridge", title: "Telling your story: cost and judgment",
    lesson: "When asked 'how do you do X in OpenSearch/Dynatrace?', answer in 3 beats: (1) the concept (vendor-neutral), (2) how you did it in your tool, (3) the Splunk equivalent. E.g. cost: OpenSearch → ISM tiers + dropping debug in Fluent Bit; Dynatrace → OpenPipeline + DDU/licensing awareness; Splunk → Edge/Ingest Processor, logs→metrics, MPM, Federated Search.",
    line: "OpenSearch gives you the bricks; Splunk gives you the building — and OTel is the common ground.",
    related: ["cost-levers", "os-ism", "dt-grail"],
    qs: [
      { q: "Best structure when asked 'how do you do this in OpenSearch?'", o: ["Concept → how I did it → Splunk equivalent", "Only list OpenSearch APIs", "Say you don't know Splunk", "Talk only about price"], a: 0, why: "Shows understanding, experience and the bridge." },
      { q: "Balanced Splunk vs OpenSearch statement:", o: ["Depends whether your advantage is building the platform or using it", "OpenSearch is always cheaper overall", "Splunk can't ingest OTel", "OpenSearch can't do traces"], a: 0, why: "TCO includes people, index design, upgrades and MTTR." },
    ],
  },
];
