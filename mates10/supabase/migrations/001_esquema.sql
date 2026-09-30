-- Mates10 — esquema inicial (módulos 01, 02, 03, 04, 05, 06, 07 y 08).
--
-- Convención del hosting Train: todas las tablas, funciones y tipos de esta
-- app llevan el prefijo "mates10_" porque el proyecto de Supabase es
-- compartido con otras apps. Detrás del prefijo, los nombres de tabla y de
-- columna son los del documento unificado. Las columnas añadidas respecto
-- al documento van marcadas con "-- (+)" y están en DECISIONES.md.
--
-- Los "enum" del documento se implementan como text + CHECK, no como tipos
-- de Postgres: así ampliarlos es un ALTER de una restricción y no chocan
-- con tipos de otras apps. fuente.tipo es un enum abierto (sin CHECK).

create extension if not exists pgcrypto;

-- ============================================================ 07 Fuentes
create table if not exists public.mates10_fuente (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,                                  -- (+) slug estable para scripts: "BOE-RD-157-2022"
  tipo text not null,                                  -- enum abierto (módulo 07, sección 3)
  titulo text not null,
  editorial text,
  isbn text,
  curso_id uuid,                                       -- FK añadida tras crear mates10_curso
  sistema_id uuid,                                     -- FK añadida tras crear mates10_sistema_educativo
  anio integer,
  origen text not null check (origen in ('foto_usuario','busqueda_web','descarga_oficial','aportado_equipo','aportado_profesor','generado_modelo')),
  url_original text,
  capturado_en timestamptz not null default now(),
  capturado_por text not null,
  confianza text not null check (confianza in ('alta','media','baja')),
  modulos text[] not null default '{}',                -- (+) módulos que la usan, para fuentes/index.md y el Excel
  notas text
);

create table if not exists public.mates10_fuente_archivo (
  id uuid primary key default gen_random_uuid(),
  fuente_id uuid not null references public.mates10_fuente(id) on delete cascade,
  ruta text not null,
  tipo_archivo text not null check (tipo_archivo in ('foto','pdf','html','captura_pantalla','texto_extraido','json','csv','xlsx','otro')),
  pagina_o_seccion text,
  hash_sha256 text not null,
  tamano_bytes bigint not null,
  derivado_de uuid references public.mates10_fuente_archivo(id),
  orden smallint not null default 0
);
create index if not exists mates10_fuente_archivo_fuente on public.mates10_fuente_archivo(fuente_id);

-- ============================================================ 01 Contenido
create table if not exists public.mates10_sistema_educativo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  pais text not null,
  region text,
  nombre text not null,
  idioma text not null,
  fuente_id uuid references public.mates10_fuente(id)   -- (+) regla "nada sin fuente"
);

create table if not exists public.mates10_curso (
  id uuid primary key default gen_random_uuid(),
  sistema_id uuid not null references public.mates10_sistema_educativo(id) on delete cascade,
  codigo text not null,
  nombre_local text not null,
  orden smallint not null,
  edad_tipica smallint not null,
  etapa text not null,
  fuente_id uuid references public.mates10_fuente(id),  -- (+)
  unique (sistema_id, codigo)
);

alter table public.mates10_fuente
  drop constraint if exists mates10_fuente_curso_fk,
  add constraint mates10_fuente_curso_fk foreign key (curso_id) references public.mates10_curso(id),
  drop constraint if exists mates10_fuente_sistema_fk,
  add constraint mates10_fuente_sistema_fk foreign key (sistema_id) references public.mates10_sistema_educativo(id);

create table if not exists public.mates10_bloque (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  nombre_padres text not null,
  sentido_lomloe text not null check (sentido_lomloe in ('numerico','medida','espacial','algebraico','estocastico','transversal')),
  orden smallint not null,
  activo boolean not null default true
);

create table if not exists public.mates10_habilidad (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  bloque_id uuid not null references public.mates10_bloque(id),
  nombre text not null,
  nombre_padres text not null,
  definicion text not null,
  parametros jsonb,
  ejemplo_frontera text,
  ejemplo_fuera text,
  nivel_kumon text,
  importancia smallint not null check (importancia between 1 and 5),
  carga_alumno smallint not null check (carga_alumno between 1 and 5),
  familia text,
  nivel_familia smallint,
  curso_ref text,                                      -- (+) curso donde se introduce según la fuente estatal (PRI1…BAC2); ayuda a cobertura
  generador text,                                      -- (+) clave del generador por código de ejercicios (02), null si va por IA
  fuente_id uuid not null references public.mates10_fuente(id),
  fuente_ref text,
  estado_revision text not null default 'pendiente' check (estado_revision in ('pendiente','aprobada','comentada')),  -- (+) revisión de habilidades (08)
  activo boolean not null default true
);
create index if not exists mates10_habilidad_familia on public.mates10_habilidad(familia, nivel_familia);

create table if not exists public.mates10_habilidad_prerrequisito (
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  prerrequisito_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  peso text not null check (peso in ('imprescindible','recomendable')),
  fuente_id uuid references public.mates10_fuente(id),
  primary key (habilidad_id, prerrequisito_id),
  check (habilidad_id <> prerrequisito_id)
);

create table if not exists public.mates10_error_tipico (
  id uuid primary key default gen_random_uuid(),
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  codigo text unique not null,
  nombre text not null,
  descripcion text not null,
  explicacion_nino text not null,
  indicacion_padres text not null,
  funcion text,                                        -- (+) clave de la función que aplica el error a unos parámetros (generador por código)
  fuente_id uuid references public.mates10_fuente(id),
  fuente_ref text
);

create table if not exists public.mates10_habilidad_fuente (
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  fuente_id uuid not null references public.mates10_fuente(id),
  fuente_ref text,
  rol text not null check (rol in ('define','situa','afina','contradice')),
  nota text,
  primary key (habilidad_id, fuente_id, rol),
  check (rol <> 'contradice' or nota is not null)
);

create table if not exists public.mates10_colegio (
  id uuid primary key default gen_random_uuid(),
  sistema_id uuid not null references public.mates10_sistema_educativo(id),
  codigo_oficial text,                                 -- (+) código del Registro de Centros
  nombre text not null,
  municipio text,
  tipo text not null check (tipo in ('publico','concertado','privado')),
  ensenanzas text[],                                   -- (+) primaria, eso, bachillerato
  editorial_mates text,
  escuela_metodo text check (escuela_metodo in ('tradicional','abn','singapur','montessori')),
  fuente_id uuid references public.mates10_fuente(id),  -- (+)
  unique (sistema_id, codigo_oficial)
);

create table if not exists public.mates10_mapa_curricular (
  id uuid primary key default gen_random_uuid(),
  sistema_id uuid not null references public.mates10_sistema_educativo(id),
  colegio_id uuid references public.mates10_colegio(id),
  editorial text,                                      -- (+) filas del mapa por editorial (sin colegio concreto)
  curso_id uuid not null references public.mates10_curso(id),
  trimestre smallint not null check (trimestre between 1 and 4),
  mes smallint check (mes between 1 and 12),
  orden integer not null default 0,
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  estado text not null check (estado in ('introduce','consolida','repasa')),
  confianza text not null default 'media' check (confianza in ('alta','media','baja')),  -- (+)
  fuente_id uuid not null references public.mates10_fuente(id),
  fuente_ref text,
  nota text
);
create index if not exists mates10_mapa_lookup on public.mates10_mapa_curricular(sistema_id, curso_id, trimestre, mes, orden);
create index if not exists mates10_mapa_hab on public.mates10_mapa_curricular(habilidad_id);

-- ============================================================ 04 Didáctica
create table if not exists public.mates10_metodo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  escuela text not null check (escuela in ('tradicional','abn','singapur','montessori','generico')),
  representacion text not null check (representacion in ('manipulativa','pictorica','simbolica')),
  descripcion text not null,
  cuando_usar text,
  edad_desde smallint,
  familia text,                                        -- (+) familia de habilidades a la que se aplica
  fuente_id uuid not null references public.mates10_fuente(id),
  activo boolean not null default true
);

create table if not exists public.mates10_tecnica_practica (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text not null,
  disparador text not null check (disparador in ('tras_fallo','tras_acierto','error_repetido','repaso_vencido','introduccion','siempre')),
  regla jsonb not null,
  ambito text not null check (ambito in ('habilidad','universal')),
  fuente_id uuid not null references public.mates10_fuente(id)
);

create table if not exists public.mates10_habilidad_tecnica (
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  tecnica_id uuid not null references public.mates10_tecnica_practica(id) on delete cascade,
  prioridad smallint not null check (prioridad between 1 and 5),
  parametros jsonb,
  nota text,
  primary key (habilidad_id, tecnica_id)
);

-- ============================================================ 03 Mecánicas
create table if not exists public.mates10_mecanica (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  tipo text not null check (tipo in ('generica','especifica')),
  descripcion text not null,
  formatos_admitidos text[] not null,
  tiempo text not null check (tiempo in ('sin_tiempo','con_tiempo','ritmo_creciente')),
  respuestas_correctas text not null check (respuestas_correctas in ('una','varias','ordenar')),
  mide text not null check (mide in ('reconocimiento','produccion','fluidez')),
  edad_minima smallint,
  duracion_tipica_seg smallint,
  carga_cognitiva text check (carga_cognitiva in ('baja','media','alta')),
  jugabilidad smallint check (jugabilidad between 1 and 5),
  relevancia_pedagogica smallint check (relevancia_pedagogica between 1 and 5),
  momento_explicacion text not null check (momento_explicacion in ('al_fallar','al_terminar','nunca')),
  forma_explicacion text[] not null default '{}',
  reintento boolean not null default true,
  fuente_id uuid references public.mates10_fuente(id),
  estado text not null check (estado in ('idea','prototipo','en_app','descartada'))
);

create table if not exists public.mates10_habilidad_mecanica (
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  mecanica_id uuid not null references public.mates10_mecanica(id) on delete cascade,
  idoneidad smallint not null check (idoneidad between 1 and 5),
  estado_minimo text not null check (estado_minimo in ('introduce','consolida','repasa')),
  motivo text,
  origen text not null check (origen in ('criterio','datos')),
  primary key (habilidad_id, mecanica_id)
);

create table if not exists public.mates10_habilidad_metodo (
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  metodo_id uuid not null references public.mates10_metodo(id) on delete cascade,
  rol text not null check (rol in ('principal','alternativo','remedio')),
  orden_presentacion smallint not null default 1,
  error_tipico_id uuid references public.mates10_error_tipico(id),
  mecanica_id uuid references public.mates10_mecanica(id),
  nota text,
  primary key (habilidad_id, metodo_id, rol)
);

-- ============================================================ 02 Ejercicios
create table if not exists public.mates10_plantilla (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,                                  -- (+) "NUM.SUMA.02.P01"
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  formato text not null,
  dificultad smallint not null check (dificultad between 1 and 3),
  enunciado_plantilla text not null,
  restricciones jsonb,
  solucion_plantilla text,
  explicacion_plantilla text,
  generador text not null check (generador in ('codigo','ia','manual')),
  idioma text not null default 'es-ES',
  revisado_por text,
  revisado_en timestamptz,
  estado text not null default 'borrador' check (estado in ('borrador','aprobada','retirada'))
);

create table if not exists public.mates10_ejercicio (
  id uuid primary key default gen_random_uuid(),
  plantilla_id uuid references public.mates10_plantilla(id) on delete set null,
  formato text not null check (formato in ('numerico','opcion_multiple','verdadero_falso','ordenar','recta_numerica','emparejar','texto_corto','abierto','reparto','balanza')),
  dificultad smallint not null check (dificultad between 1 and 3),
  enunciado text not null,
  datos jsonb,
  parametros jsonb,
  respuesta jsonb not null,
  distractores jsonb,
  ciclo_registro text not null check (ciclo_registro in ('ciclo1','ciclo2','ciclo3','secundaria')),
  grupo_id uuid,
  idioma text not null default 'es-ES',
  imprimible boolean not null default true,
  generado_por text not null,
  fuente_id uuid references public.mates10_fuente(id),
  fuente_ref text,
  huella text,                                         -- (+) hash del enunciado normalizado, para detectar duplicados
  validado_automatico boolean not null default false,
  revisado_por text,
  revisado_en timestamptz,
  revision_tipo text check (revision_tipo in ('directa','heredada','provisional')),  -- (+) 'provisional' (ver DECISIONES)
  rechazado boolean not null default false,            -- (+) rechazado por el revisor
  publicado boolean not null default false,
  version integer not null default 1,
  creado_en timestamptz not null default now(),        -- (+)
  check (not publicado or (validado_automatico and not rechazado and (revisado_por is not null or revision_tipo = 'provisional')))
);
create index if not exists mates10_ejercicio_plantilla on public.mates10_ejercicio(plantilla_id);
create index if not exists mates10_ejercicio_pub on public.mates10_ejercicio(publicado) where publicado;
create index if not exists mates10_ejercicio_huella on public.mates10_ejercicio(huella);

create table if not exists public.mates10_ejercicio_habilidad (
  ejercicio_id uuid not null references public.mates10_ejercicio(id) on delete cascade,
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  rol text not null check (rol in ('principal','secundaria')),
  primary key (ejercicio_id, habilidad_id)
);
create unique index if not exists mates10_ejercicio_una_principal on public.mates10_ejercicio_habilidad(ejercicio_id) where rol = 'principal';
create index if not exists mates10_ejhab_hab on public.mates10_ejercicio_habilidad(habilidad_id, rol);

create table if not exists public.mates10_ejercicio_error (
  ejercicio_id uuid not null references public.mates10_ejercicio(id) on delete cascade,
  error_tipico_id uuid not null references public.mates10_error_tipico(id) on delete cascade,
  respuesta_erronea text not null,
  primary key (ejercicio_id, error_tipico_id, respuesta_erronea)
);

create table if not exists public.mates10_ejercicio_explicacion (
  ejercicio_id uuid not null references public.mates10_ejercicio(id) on delete cascade,
  metodo_id uuid not null references public.mates10_metodo(id),
  explicacion_nino text not null,
  explicacion_adulto text,
  explicacion_pasos jsonb,
  generado_por text not null,
  revisado_por text,
  primary key (ejercicio_id, metodo_id)
);

-- Rechazos del validador automático, con motivo (datos de mejora de las skills).
create table if not exists public.mates10_rechazo_validador (       -- (+)
  id uuid primary key default gen_random_uuid(),
  lote text not null,
  habilidad_codigo text,
  etapa text not null check (etapa in ('esquema','correccion','copia','duplicado','frontera','calidad')),
  motivo text not null,
  ejercicio jsonb not null,
  creado_en timestamptz not null default now()
);

-- ============================================================ 08 Revisión
create table if not exists public.mates10_revisor (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null
);

create table if not exists public.mates10_revision (
  id uuid primary key default gen_random_uuid(),
  objeto_tipo text not null check (objeto_tipo in ('plantilla','ejercicio','habilidad','explicacion')),
  objeto_id uuid not null,
  revisor text not null,
  decision text not null check (decision in ('aprobado','rechazado','editado','comentado')),
  motivo text check (motivo in ('fuera_de_frontera','respuesta_incorrecta','distractor_ambiguo','explicacion_incorrecta','registro_inadecuado','copia','otro')),
  texto text,
  fecha timestamptz not null default now()
);
create index if not exists mates10_revision_obj on public.mates10_revision(objeto_tipo, objeto_id);

-- ============================================================ 05 Alumno
create table if not exists public.mates10_alumno (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,                                -- (+) módulo 08: el alumno entra con su nombre
  fecha_nacimiento date,
  edad_estimada smallint,
  curso_inferido uuid references public.mates10_curso(id),
  confianza_inferencia numeric,
  sistema_id uuid not null references public.mates10_sistema_educativo(id),
  curso_id uuid references public.mates10_curso(id),
  colegio_id uuid references public.mates10_colegio(id),
  escuela_metodo text check (escuela_metodo in ('tradicional','abn','singapur','montessori')),
  editorial_mates text,
  posicion_mes smallint,                               -- null = mes actual
  posicion_orden integer,
  posicion_fuente text not null default 'calendario' check (posicion_fuente in ('calendario','foto_libro','cuaderno','examen','declarado')),
  objetivo jsonb,
  sesion_seg smallint not null default 420,
  refuerzo_cada smallint not null default 3,
  tolerancia smallint not null default 3 check (tolerancia between 1 and 5),
  idioma text not null default 'es-ES',
  prueba_nivel_hecha boolean not null default false,   -- (+)
  creado_en timestamptz not null default now()         -- (+)
);

create table if not exists public.mates10_alumno_habilidad (
  alumno_id uuid not null references public.mates10_alumno(id) on delete cascade,
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  p_dominio numeric not null default 0.1,
  estabilidad_dias numeric not null default 0,
  dificultad_fsrs numeric not null default 5,          -- (+) parámetro D de FSRS
  proximo_repaso date,
  intentos integer not null default 0,
  aciertos integer not null default 0,
  aciertos_produccion integer not null default 0,
  aciertos_seguidos smallint not null default 0,       -- (+) para SUBIR_DIFICULTAD
  ultimo_error_tipico_id uuid references public.mates10_error_tipico(id),
  errores_seguidos smallint not null default 0,
  ultimo_intento timestamptz,                          -- (+)
  estado text not null default 'no_vista' check (estado in ('no_vista','en_curso','dominada','olvidada')),
  origen text not null default 'practica' check (origen in ('practica','prueba_nivel')),  -- (+)
  actualizado_en timestamptz not null default now(),
  primary key (alumno_id, habilidad_id)
);

-- Histórico diario de dominio: el informe al padre muestra la evolución de dos semanas.
create table if not exists public.mates10_alumno_habilidad_hist (  -- (+)
  alumno_id uuid not null references public.mates10_alumno(id) on delete cascade,
  habilidad_id uuid not null references public.mates10_habilidad(id) on delete cascade,
  fecha date not null,
  p_dominio numeric not null,
  primary key (alumno_id, habilidad_id, fecha)
);

create table if not exists public.mates10_sesion (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.mates10_alumno(id) on delete cascade,
  tipo text not null default 'practica' check (tipo in ('practica','prueba_nivel')),
  inicio timestamptz not null default now(),
  fin timestamptz,
  objetivo_seg smallint,
  mecanicas text[] not null default '{}',
  motivo_fin text check (motivo_fin in ('tiempo','fatiga','abandono','completada','prueba_terminada')),
  intentos integer not null default 0,
  aciertos integer not null default 0,
  explicaciones integer not null default 0,
  termino_en_acierto boolean,
  iniciada_por text not null default 'nino' check (iniciada_por in ('nino','padre')),
  estado jsonb not null default '{}'                   -- estado interno del tutor en la sesión (prueba de nivel, cola)
);

create table if not exists public.mates10_intento (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.mates10_alumno(id) on delete cascade,
  sesion_id uuid references public.mates10_sesion(id) on delete cascade,
  ejercicio_id uuid not null references public.mates10_ejercicio(id),
  habilidad_id uuid not null references public.mates10_habilidad(id),
  mecanica_id uuid not null references public.mates10_mecanica(id),
  tecnica_id uuid references public.mates10_tecnica_practica(id),
  metodo_id uuid references public.mates10_metodo(id),
  regla_cascada text,                                  -- (+) qué paso de la cascada eligió este ejercicio
  dificultad smallint,                                 -- (+)
  respuesta text,
  correcto boolean not null,
  error_tipico_id uuid references public.mates10_error_tipico(id),
  tiempo_ms integer,
  tiempo_primera_interaccion_ms integer,               -- (+) módulo 05 sección 5
  cambios_respuesta smallint not null default 0,       -- (+)
  uso_pista boolean not null default false,            -- (+)
  vio_explicacion boolean not null default false,
  explicacion_entera boolean,                          -- (+)
  reintento_de uuid references public.mates10_intento(id),
  fecha timestamptz not null default now()
);
create index if not exists mates10_intento_alumno on public.mates10_intento(alumno_id, fecha desc);
create index if not exists mates10_intento_sesion on public.mates10_intento(sesion_id);

-- ============================================================ 06 Enganche
create table if not exists public.mates10_mecanismo_enganche (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text not null,
  origen text not null,
  fuente_id uuid not null references public.mates10_fuente(id),
  evidencia text not null check (evidencia in ('fuerte','media','debil','negativa')),
  riesgo_menores text not null check (riesgo_menores in ('ninguno','bajo','medio','alto')),
  implementable boolean generated always as (riesgo_menores <> 'alto') stored,  -- (+)
  uso_en_mates10 text,                                 -- (+) columna "uso en Mates10" del módulo 06
  parametros jsonb,
  edad_desde smallint,
  edad_hasta smallint,
  estado text not null check (estado in ('idea','en_prueba','activo','retirado'))
);

create table if not exists public.mates10_alumno_enganche (
  alumno_id uuid primary key references public.mates10_alumno(id) on delete cascade,
  racha_dias integer not null default 0,
  ultimo_dia date,                                     -- (+)
  escudos smallint not null default 1,
  hora_habitual time,
  notificaciones_permitidas boolean not null default false,
  mecanismos_activos uuid[] not null default '{}',
  coleccion jsonb not null default '[]'
);

create table if not exists public.mates10_evento_enganche (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.mates10_alumno(id) on delete cascade,
  mecanismo_id uuid not null references public.mates10_mecanismo_enganche(id),
  fecha timestamptz not null default now(),
  resultado jsonb
);

-- ============================================================ RLS
-- Prototipo sin autenticación (módulo 08): la anon key lee y escribe con
-- políticas permisivas. Deuda anotada en DECISIONES.md. El archivo de
-- fuentes (ficheros) vive en un bucket privado; aquí solo hay metadatos.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'mates10\_%' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "mates10 anon all" on public.%I', t);
    execute format('create policy "mates10 anon all" on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
