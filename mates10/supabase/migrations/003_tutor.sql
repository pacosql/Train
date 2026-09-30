-- Tutor (módulo 05): modelo del alumno (BKT), calendario (FSRS-4.5), cascada de decisión,
-- termostato, fin de sesión en acierto, prueba de nivel y registro de intentos.
-- Todo vive aquí; las pantallas solo llaman por RPC. Parámetros iniciales en DECISIONES (D-040…).

-- ------------------------------------------------------------------ parámetros
create or replace function public.mates10_param(p text) returns numeric language sql immutable as $$
  select case p
    when 'umbral_dominio' then 0.85      -- módulo 04 §5 / módulo 05 §4.3
    when 'bkt_p_init' then 0.10          -- Corbett y Anderson (1994): valores típicos
    when 'bkt_p_transit' then 0.15
    when 'bkt_p_guess' then 0.25         -- 4 opciones
    when 'bkt_p_slip' then 0.10
    when 'termo_bajo' then 0.70          -- módulo 05 §4.3 regla 9
    when 'termo_alto' then 0.90
    when 'retencion' then 0.90           -- FSRS: retención objetivo
    when 'max_preguntas' then 15         -- módulo 08: sesiones de 10–15 preguntas
    when 'no_repetir' then 40            -- no repetir un ejercicio visto en los últimos N intentos
  end $$;

-- FSRS-4.5, pesos por defecto publicados (open-spaced-repetition).
create or replace function public.mates10_fsrs_w(i int) returns numeric language sql immutable as $$
  select (array[0.4872,1.4003,3.7145,13.8206,5.1618,1.2298,0.8975,0.031,1.6474,0.1367,1.0461,2.1072,0.0793,0.3246,1.587,0.2272,2.8755])[i + 1] $$;

-- Recuperabilidad R(t, S) = (1 + 19/81 · t/S)^(−0,5)
create or replace function public.mates10_fsrs_r(t_dias numeric, s numeric) returns numeric language sql immutable as $$
  select case when s <= 0 then 0 else power(1 + (19.0/81.0) * t_dias / s, -0.5) end $$;

-- Actualiza (S, D) tras una revisión con nota g (1 fallo, 2 difícil, 3 bien, 4 fácil).
create or replace function public.mates10_fsrs(p_s numeric, p_d numeric, p_t_dias numeric, g int, out s numeric, out d numeric)
language plpgsql immutable as $$
declare w0 numeric; r numeric; d0_3 numeric;
begin
  if p_s is null or p_s <= 0 then                       -- primera revisión
    s := mates10_fsrs_w(g - 1);
    d := least(10, greatest(1, mates10_fsrs_w(4) - (g - 3) * mates10_fsrs_w(5)));
    return;
  end if;
  r := mates10_fsrs_r(p_t_dias, p_s);
  d0_3 := mates10_fsrs_w(4);
  d := p_d - mates10_fsrs_w(6) * (g - 3);
  d := mates10_fsrs_w(7) * d0_3 + (1 - mates10_fsrs_w(7)) * d;   -- reversión a la media
  d := least(10, greatest(1, d));
  if g = 1 then
    s := mates10_fsrs_w(11) * power(p_d, -mates10_fsrs_w(12)) * (power(p_s + 1, mates10_fsrs_w(13)) - 1) * exp(mates10_fsrs_w(14) * (1 - r));
    s := least(s, p_s);
  else
    s := p_s * (exp(mates10_fsrs_w(8)) * (11 - p_d) * power(p_s, -mates10_fsrs_w(9)) * (exp(mates10_fsrs_w(10) * (1 - r)) - 1)
               * case when g = 2 then mates10_fsrs_w(15) else 1 end * case when g = 4 then mates10_fsrs_w(16) else 1 end + 1);
  end if;
  s := greatest(s, 0.1);
end $$;

-- BKT: posterior tras observar un intento, y transición de aprendizaje.
create or replace function public.mates10_bkt(p numeric, correcto boolean, peso numeric default 1) returns numeric
language sql immutable as $$
  with k as (select mates10_param('bkt_p_guess') g, mates10_param('bkt_p_slip') sl, mates10_param('bkt_p_transit') t),
  post as (
    select case when correcto then p * (1 - k.sl) / nullif(p * (1 - k.sl) + (1 - p) * k.g, 0)
                else p * k.sl / nullif(p * k.sl + (1 - p) * (1 - k.g), 0) end as pp, k.t
    from k)
  select least(0.999, greatest(0.001, p + peso * ((pp + (1 - pp) * t) - p))) from post
$$;

-- ------------------------------------------------------------------ alumnos
create or replace function public.mates10_crear_alumno(p_nombre text, p_sistema text default 'ES-MC', p_curso text default null,
  p_fecha_nacimiento date default null) returns uuid language plpgsql as $$
declare v_id uuid; v_sis uuid; v_curso uuid; v_edad int;
begin
  select id into v_sis from mates10_sistema_educativo where codigo = coalesce(p_sistema, 'ES-MC');
  if p_curso is not null then select id into v_curso from mates10_curso where sistema_id = v_sis and codigo = p_curso; end if;
  v_edad := case when p_fecha_nacimiento is not null then extract(year from age(p_fecha_nacimiento))::int end;
  insert into mates10_alumno (nombre, sistema_id, curso_id, fecha_nacimiento, sesion_seg)
  values (trim(p_nombre), v_sis, v_curso, p_fecha_nacimiento,
          -- sesión inicial por edad (módulo 05): 5 min a los 6 años … 15 a los 12; sin edad, 5 min (equivocarse por abajo es barato)
          case when v_edad is null then 300 else least(900, greatest(300, 300 + (v_edad - 6) * 100)) end)
  returning id into v_id;
  insert into mates10_alumno_enganche (alumno_id) values (v_id);
  return v_id;
end $$;

-- ------------------------------------------------------------------ selección de ejercicio
-- Habilidades permitidas del alumno materializadas en una tabla temporal (se usa varias veces por decisión).
create or replace function public.mates10__perm(p_alumno uuid) returns void language plpgsql as $$
begin
  drop table if exists pg_temp.m10_perm;
  create temp table m10_perm on commit drop as select * from mates10_permitidas_alumno(p_alumno);
  create index on m10_perm (habilidad_id);
end $$;

-- Candidato: un ejercicio publicado de la habilidad, con todas sus habilidades permitidas, dificultad
-- admitida por el estado del mapa, no visto recientemente. Prefiere la dificultad objetivo.
create or replace function public.mates10__elegir_ejercicio(p_alumno uuid, p_hab uuid, p_dif int, p_filtro jsonb default null,
  p_error uuid default null) returns uuid language plpgsql as $$
declare v_id uuid; v_estado text; v_maxdif int;
begin
  select estado into v_estado from pg_temp.m10_perm where habilidad_id = p_hab;
  v_maxdif := case when v_estado = 'introduce' then 1 else 3 end;       -- regla 2 / frontera regla 5
  select e.id into v_id
  from mates10_ejercicio e
  join mates10_ejercicio_habilidad eh on eh.ejercicio_id = e.id and eh.habilidad_id = p_hab and eh.rol = 'principal'
  where e.publicado and e.dificultad <= v_maxdif
    and not exists (select 1 from mates10_ejercicio_habilidad s where s.ejercicio_id = e.id
                    and not exists (select 1 from pg_temp.m10_perm p where p.habilidad_id = s.habilidad_id))
    and not exists (select 1 from (select ejercicio_id from mates10_intento where alumno_id = p_alumno
                    order by fecha desc limit mates10_param('no_repetir')::int) r where r.ejercicio_id = e.id)
    and (p_filtro is null or e.parametros @> p_filtro)
    and (p_error is null or exists (select 1 from mates10_ejercicio_error ee where ee.ejercicio_id = e.id and ee.error_tipico_id = p_error))
  order by abs(e.dificultad - least(p_dif, v_maxdif)), random()
  limit 1;
  if v_id is null and p_filtro is null and p_error is null then
    -- todo visto: permitir repetir lo más antiguo
    select e.id into v_id from mates10_ejercicio e
    join mates10_ejercicio_habilidad eh on eh.ejercicio_id = e.id and eh.habilidad_id = p_hab and eh.rol = 'principal'
    where e.publicado and e.dificultad <= v_maxdif
      and not exists (select 1 from mates10_ejercicio_habilidad s where s.ejercicio_id = e.id
                      and not exists (select 1 from pg_temp.m10_perm p where p.habilidad_id = s.habilidad_id))
    order by abs(e.dificultad - least(p_dif, v_maxdif)), random() limit 1;
  end if;
  return v_id;
end $$;

create or replace function public.mates10__tiene_ejercicios(p_hab uuid) returns boolean language sql stable as $$
  select exists (select 1 from mates10_ejercicio e join mates10_ejercicio_habilidad eh on eh.ejercicio_id = e.id
                 where eh.habilidad_id = p_hab and eh.rol = 'principal' and e.publicado) $$;

-- Presenta un ejercicio al cliente: opciones barajadas, datos, habilidad y decisión del tutor.
create or replace function public.mates10__presentar(p_ej uuid, p_regla text, p_tecnica text, p_extra jsonb default '{}')
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'fin', false,
    'ejercicio_id', e.id, 'enunciado', e.enunciado, 'datos', e.datos, 'dificultad', e.dificultad, 'formato', e.formato,
    'opciones', (select jsonb_agg(o order by random()) from jsonb_array_elements(e.respuesta || coalesce(e.distractores, '[]')) o),
    'habilidad', jsonb_build_object('id', h.id, 'codigo', h.codigo, 'nombre', h.nombre, 'nombre_padres', h.nombre_padres, 'familia', h.familia),
    'regla', p_regla, 'tecnica', p_tecnica, 'mecanica', 'OPCIONES') || p_extra
  from mates10_ejercicio e
  join mates10_ejercicio_habilidad eh on eh.ejercicio_id = e.id and eh.rol = 'principal'
  join mates10_habilidad h on h.id = eh.habilidad_id
  where e.id = p_ej
$$;

-- Dificultad objetivo: por dominio de la habilidad y termostato de la sesión (regla 9).
create or replace function public.mates10__dificultad(p_alumno uuid, p_sesion uuid, p_hab uuid) returns int language plpgsql as $$
declare v_p numeric; v_tasa numeric; v_n int; v_d int; v_seg int;
begin
  select p_dominio, aciertos_seguidos into v_p, v_seg from mates10_alumno_habilidad where alumno_id = p_alumno and habilidad_id = p_hab;
  v_d := case when v_p is null or v_p < 0.4 then 1 when v_p < 0.7 then 2 else 3 end;
  if coalesce(v_seg, 0) >= 3 then v_d := v_d + 1; end if;                    -- SUBIR_DIFICULTAD
  select count(*), avg(correcto::int) into v_n, v_tasa from mates10_intento where sesion_id = p_sesion;
  if v_n >= 4 then
    if v_tasa < mates10_param('termo_bajo') then v_d := v_d - 1;
    elsif v_tasa > mates10_param('termo_alto') then v_d := v_d + 1; end if;
  end if;
  return least(3, greatest(1, v_d));
end $$;

-- Siguiente ejercicio de una sesión de práctica: cascada del módulo 05 §4.3.
create or replace function public.mates10_siguiente(p_alumno uuid, p_sesion uuid) returns jsonb language plpgsql as $$
declare
  v_ses mates10_sesion; v_alu mates10_alumno; v_last mates10_intento; v_n int; v_seg numeric;
  v_hab uuid; v_regla text; v_tec text; v_ej uuid; v_dif int; v_ah mates10_alumno_habilidad;
  v_fatiga int := 0; v_filtro jsonb; v_err uuid; v_prev3 uuid[]; v_ultima_carga int;
begin
  select * into v_ses from mates10_sesion where id = p_sesion;
  select * into v_alu from mates10_alumno where id = p_alumno;
  perform mates10__perm(p_alumno);
  select * into v_last from mates10_intento where sesion_id = p_sesion order by fecha desc limit 1;
  select count(*) into v_n from mates10_intento where sesion_id = p_sesion and reintento_de is null;
  v_seg := extract(epoch from now() - v_ses.inicio);
  select array_agg(habilidad_id) into v_prev3 from (select habilidad_id from mates10_intento where sesion_id = p_sesion order by fecha desc limit 3) x;

  -- Señales de fatiga: fallos en cadena y tiempos que se disparan (módulo 05 §5).
  if (select count(*) filter (where not correcto) from (select correcto from mates10_intento where sesion_id = p_sesion order by fecha desc limit 3) x) = 3 then
    v_fatiga := v_fatiga + 1; end if;
  if (select avg(tiempo_ms) from (select tiempo_ms from mates10_intento where sesion_id = p_sesion order by fecha desc limit 2) a)
     > 2 * coalesce((select percentile_cont(0.5) within group (order by tiempo_ms) from mates10_intento where sesion_id = p_sesion), 1e9) then
    v_fatiga := v_fatiga + 1; end if;

  -- 10. Fin de sesión: al llegar al tiempo, al máximo de preguntas o con dos señales de fatiga, cerrar en acierto.
  if v_seg >= v_alu.sesion_seg or v_n >= mates10_param('max_preguntas') or v_fatiga >= 2 then
    if v_last.id is not null and v_last.correcto then
      update mates10_sesion set fin = now(), motivo_fin = case when v_fatiga >= 2 then 'fatiga' when v_seg >= v_alu.sesion_seg then 'tiempo' else 'completada' end,
             termino_en_acierto = true where id = p_sesion;
      return jsonb_build_object('fin', true, 'motivo', case when v_fatiga >= 2 then 'fatiga' else 'completada' end);
    end if;
    -- algo dominado y fácil para terminar en acierto
    select ah.habilidad_id into v_hab from mates10_alumno_habilidad ah join pg_temp.m10_perm p using (habilidad_id)
      where ah.alumno_id = p_alumno and ah.p_dominio >= mates10_param('umbral_dominio') and mates10__tiene_ejercicios(ah.habilidad_id)
      order by ah.p_dominio desc, random() limit 1;
    if v_hab is null then
      select ah.habilidad_id into v_hab from mates10_alumno_habilidad ah join pg_temp.m10_perm p using (habilidad_id)
        where ah.alumno_id = p_alumno and mates10__tiene_ejercicios(ah.habilidad_id) order by ah.p_dominio desc limit 1;
    end if;
    if v_hab is not null then
      v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 1);
      if v_ej is not null then return mates10__presentar(v_ej, 'fin_en_acierto', 'FIN_EN_ACIERTO'); end if;
    end if;
    update mates10_sesion set fin = now(), motivo_fin = 'completada', termino_en_acierto = coalesce(v_last.correcto, false) where id = p_sesion;
    return jsonb_build_object('fin', true, 'motivo', 'completada');
  end if;

  -- Reintento tras explicación (regla 6 de la compacta): misma habilidad, a poder ser el mismo error.
  if v_last.id is not null and not v_last.correcto and v_last.reintento_de is null then
    v_hab := v_last.habilidad_id;
    select * into v_ah from mates10_alumno_habilidad where alumno_id = p_alumno and habilidad_id = v_hab;
    -- 5. Técnica tras fallo
    if v_ah.errores_seguidos >= 3 then
      -- BAJAR_PRERREQUISITO: el imprescindible con menor dominio
      select hp.prerrequisito_id into v_hab from mates10_habilidad_prerrequisito hp
        join pg_temp.m10_perm p on p.habilidad_id = hp.prerrequisito_id
        left join mates10_alumno_habilidad a on a.alumno_id = p_alumno and a.habilidad_id = hp.prerrequisito_id
        where hp.habilidad_id = v_last.habilidad_id and hp.peso = 'imprescindible' and mates10__tiene_ejercicios(hp.prerrequisito_id)
        order by coalesce(a.p_dominio, 0) limit 1;
      if v_hab is not null then
        v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 1);
        if v_ej is not null then return mates10__presentar(v_ej, 'tecnica', 'BAJAR_PRERREQUISITO', jsonb_build_object('reintento_de', v_last.id)); end if;
      end if;
      v_hab := v_last.habilidad_id;
    end if;
    if v_last.error_tipico_id is not null then
      v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 1, null, v_last.error_tipico_id);   -- MISMO_ERROR
      v_tec := 'MISMO_ERROR';
    end if;
    if v_ej is null then
      select e.parametros into v_filtro from mates10_ejercicio e where e.id = v_last.ejercicio_id;
      if v_filtro ? 'a' and v_filtro ? 'b' and (v_filtro->>'op') in ('mult', 'suma') then
        v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 1, jsonb_build_object('a', v_filtro->'b', 'b', v_filtro->'a'));   -- CONMUTATIVA
        v_tec := 'CONMUTATIVA';
        if v_ej is null then
          v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 1, jsonb_build_object('a', v_filtro->'a', 'b', ((v_filtro->>'b')::int + 1)));  -- VECINO
          v_tec := 'VECINO';
        end if;
      end if;
    end if;
    if v_ej is null then v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 1); v_tec := 'EJEMPLO_RESUELTO'; end if;
    if v_ej is not null then return mates10__presentar(v_ej, 'reintento', v_tec, jsonb_build_object('reintento_de', v_last.id)); end if;
  end if;

  select h.carga_alumno into v_ultima_carga from mates10_habilidad h where h.id = v_last.habilidad_id;

  -- 1. Repaso vencido
  select ah.habilidad_id into v_hab from mates10_alumno_habilidad ah join pg_temp.m10_perm p using (habilidad_id)
    join mates10_habilidad h on h.id = ah.habilidad_id
    where ah.alumno_id = p_alumno and ah.proximo_repaso <= current_date and ah.origen = 'practica'
      and not (ah.habilidad_id = any(coalesce(v_prev3, '{}'))) and mates10__tiene_ejercicios(ah.habilidad_id)
      and not (h.carga_alumno = 5 and coalesce(v_ultima_carga, 0) = 5)
    order by h.importancia desc, ah.estabilidad_dias asc limit 1;
  v_regla := 'repaso_vencido'; v_tec := 'ESPACIAR';

  -- 2. Preparación: prerrequisitos de lo que viene (objetivo del padre o mapa del mes siguiente)
  if v_hab is null then
    select pl.prerrequisito_id into v_hab from mates10_proxima_leccion(p_alumno) pl
      join pg_temp.m10_perm p on p.habilidad_id = pl.prerrequisito_id
      left join mates10_alumno_habilidad ah on ah.alumno_id = p_alumno and ah.habilidad_id = pl.prerrequisito_id
      where coalesce(ah.p_dominio, 0) < mates10_param('umbral_dominio') and mates10__tiene_ejercicios(pl.prerrequisito_id)
        and not (pl.prerrequisito_id = any(coalesce(v_prev3, '{}')))
      order by coalesce(ah.p_dominio, 0) limit 1;
    v_regla := 'preparacion'; v_tec := null;
  end if;

  -- 3. Práctica: en curso, por debajo del umbral, mayor importancia (INTERCALAR: máx. 3 seguidas)
  if v_hab is null then
    select ah.habilidad_id into v_hab from mates10_alumno_habilidad ah join pg_temp.m10_perm p using (habilidad_id)
      join mates10_habilidad h on h.id = ah.habilidad_id
      where ah.alumno_id = p_alumno and ah.estado in ('en_curso', 'olvidada') and ah.p_dominio < mates10_param('umbral_dominio')
        and mates10__tiene_ejercicios(ah.habilidad_id)
        and not (coalesce(array_length(v_prev3, 1), 0) = 3 and v_prev3[1] = ah.habilidad_id and v_prev3[2] = ah.habilidad_id and v_prev3[3] = ah.habilidad_id)
        and not (h.carga_alumno = 5 and coalesce(v_ultima_carga, 0) = 5)
      order by (ah.habilidad_id = any(coalesce(v_prev3, '{}')))::int, h.importancia desc, random() limit 1;
    v_regla := 'practica'; v_tec := 'INTERCALAR';
  end if;

  -- 4. Avance: siguiente del mapa no vista con prerrequisitos imprescindibles dominados
  if v_hab is null then
    select p.habilidad_id into v_hab from pg_temp.m10_perm p join mates10_habilidad h on h.id = p.habilidad_id
      left join mates10_alumno_habilidad ah on ah.alumno_id = p_alumno and ah.habilidad_id = p.habilidad_id
      where (ah.habilidad_id is null or ah.estado = 'no_vista') and mates10__tiene_ejercicios(p.habilidad_id)
        and not exists (select 1 from mates10_habilidad_prerrequisito hp
                        left join mates10_alumno_habilidad a2 on a2.alumno_id = p_alumno and a2.habilidad_id = hp.prerrequisito_id
                        where hp.habilidad_id = p.habilidad_id and hp.peso = 'imprescindible'
                          and hp.prerrequisito_id in (select habilidad_id from pg_temp.m10_perm)
                          and coalesce(a2.p_dominio, 0) < mates10_param('umbral_dominio'))
        and not (h.carga_alumno = 5 and coalesce(v_ultima_carga, 0) = 5)
      order by (p.capa = 'curso_anterior')::int desc, h.curso_ref, p.orden, h.nivel_familia limit 1;
    v_regla := 'avance'; v_tec := null;
  end if;

  -- Respaldo: cualquier permitida con ejercicios, la de menor dominio
  if v_hab is null then
    select p.habilidad_id into v_hab from pg_temp.m10_perm p
      left join mates10_alumno_habilidad ah on ah.alumno_id = p_alumno and ah.habilidad_id = p.habilidad_id
      where mates10__tiene_ejercicios(p.habilidad_id) order by coalesce(ah.p_dominio, 0), random() limit 1;
    v_regla := 'respaldo'; v_tec := 'INTERCALAR';
  end if;
  if v_hab is null then
    return jsonb_build_object('fin', true, 'motivo', 'sin_ejercicios');
  end if;

  -- 5–6. Técnica tras acierto y elección del ejercicio
  select * into v_ah from mates10_alumno_habilidad where alumno_id = p_alumno and habilidad_id = v_hab;
  v_dif := mates10__dificultad(p_alumno, p_sesion, v_hab);
  if coalesce(v_ah.aciertos_seguidos, 0) >= 3 then v_tec := 'SUBIR_DIFICULTAD'; end if;
  v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, v_dif);
  if v_ej is null then return jsonb_build_object('fin', true, 'motivo', 'sin_ejercicios'); end if;
  return mates10__presentar(v_ej, v_regla, v_tec);
end $$;

-- ------------------------------------------------------------------ registrar intento
-- Método de explicación (módulo 02 §5.9b): escuela del colegio → escuela declarada → principal.
-- Si el error se repite, el método de rol 'remedio' (o un alternativo) en vez del mismo (regla 6).
create or replace function public.mates10__explicacion(p_alumno uuid, p_ej uuid, p_hab uuid, p_repetido boolean) returns jsonb language plpgsql stable as $$
declare v_esc text; v_out jsonb;
begin
  select coalesce(c.escuela_metodo, a.escuela_metodo) into v_esc from mates10_alumno a left join mates10_colegio c on c.id = a.colegio_id where a.id = p_alumno;
  select jsonb_build_object('metodo_id', m.id, 'metodo', m.nombre, 'escuela', m.escuela, 'nino', x.explicacion_nino, 'adulto', x.explicacion_adulto, 'pasos', x.explicacion_pasos)
    into v_out
  from mates10_ejercicio_explicacion x join mates10_metodo m on m.id = x.metodo_id
  left join mates10_habilidad_metodo hm on hm.habilidad_id = p_hab and hm.metodo_id = m.id
  where x.ejercicio_id = p_ej
  order by case
    when p_repetido and hm.rol in ('remedio', 'alternativo') then 0
    when v_esc is not null and m.escuela = v_esc then 1
    when hm.rol = 'principal' and m.escuela in ('generico', 'tradicional') then 2
    else 3 end
  limit 1;
  return v_out;
end $$;

create or replace function public.mates10_registrar_intento(
  p_alumno uuid, p_sesion uuid, p_ejercicio uuid, p_respuesta text, p_tiempo_ms int default null,
  p_regla text default null, p_tecnica text default null, p_cambios int default 0, p_primera_ms int default null,
  p_reintento_de uuid default null, p_uso_pista boolean default false)
returns jsonb language plpgsql as $$
declare
  v_ej mates10_ejercicio; v_hab uuid; v_ok boolean; v_err uuid; v_ah mates10_alumno_habilidad; v_p numeric;
  v_mec uuid; v_tec uuid; v_int uuid; v_t numeric; v_g int; v_fs record; v_repetido boolean; v_expl jsonb; v_errinfo jsonb;
  v_estado text; v_prueba boolean; v_primer_hoy boolean;
begin
  select * into v_ej from mates10_ejercicio where id = p_ejercicio;
  select habilidad_id into v_hab from mates10_ejercicio_habilidad where ejercicio_id = p_ejercicio and rol = 'principal';
  v_ok := trim(p_respuesta) = trim(v_ej.respuesta->>0);
  if not v_ok then
    select error_tipico_id into v_err from mates10_ejercicio_error where ejercicio_id = p_ejercicio and respuesta_erronea = trim(p_respuesta) limit 1;
  end if;
  select id into v_mec from mates10_mecanica where codigo = 'OPCIONES';
  select id into v_tec from mates10_tecnica_practica where codigo = p_tecnica;
  select tipo = 'prueba_nivel' into v_prueba from mates10_sesion where id = p_sesion;

  -- estado previo
  insert into mates10_alumno_habilidad (alumno_id, habilidad_id, p_dominio) values (p_alumno, v_hab, mates10_param('bkt_p_init'))
    on conflict do nothing;
  select * into v_ah from mates10_alumno_habilidad where alumno_id = p_alumno and habilidad_id = v_hab;
  v_repetido := not v_ok and v_err is not null and v_ah.ultimo_error_tipico_id = v_err;

  -- BKT (el acierto en reintento pesa la mitad: vio la explicación justo antes)
  v_p := mates10_bkt(v_ah.p_dominio, v_ok, case when p_reintento_de is not null then 0.5 else 1 end);

  -- FSRS: una revisión por habilidad y día (el primer intento del día cuenta como revisión)
  v_primer_hoy := v_ah.ultimo_intento is null or v_ah.ultimo_intento::date < current_date;
  v_t := case when v_ah.ultimo_intento is null then 0 else extract(epoch from now() - v_ah.ultimo_intento) / 86400.0 end;
  v_g := case when not v_ok then 1 when p_reintento_de is not null or p_cambios > 1 then 2
              when p_tiempo_ms is not null and p_tiempo_ms < 4000 and v_ah.aciertos_seguidos >= 2 then 4 else 3 end;

  insert into mates10_intento (alumno_id, sesion_id, ejercicio_id, habilidad_id, mecanica_id, tecnica_id, metodo_id, regla_cascada, dificultad,
    respuesta, correcto, error_tipico_id, tiempo_ms, tiempo_primera_interaccion_ms, cambios_respuesta, uso_pista, vio_explicacion, reintento_de)
  values (p_alumno, p_sesion, p_ejercicio, v_hab, v_mec, v_tec, null, p_regla, v_ej.dificultad, p_respuesta, v_ok, v_err, p_tiempo_ms,
    p_primera_ms, coalesce(p_cambios, 0), coalesce(p_uso_pista, false), false, p_reintento_de)
  returning id into v_int;

  if v_prueba then
    -- En la prueba de nivel solo se registra: el dominio lo fija el cierre de la prueba.
    update mates10_alumno_habilidad set intentos = intentos + 1, aciertos = aciertos + v_ok::int, ultimo_intento = now(),
      actualizado_en = now() where alumno_id = p_alumno and habilidad_id = v_hab;
  else
    if v_primer_hoy then
      select * into v_fs from mates10_fsrs(case when v_ah.estabilidad_dias > 0 then v_ah.estabilidad_dias end, v_ah.dificultad_fsrs, v_t, v_g);
    else
      v_fs := row(v_ah.estabilidad_dias, v_ah.dificultad_fsrs);
    end if;
    v_estado := case when v_p >= mates10_param('umbral_dominio') then 'dominada'
                     when v_ah.estado = 'dominada' and not v_ok then 'olvidada'
                     else 'en_curso' end;
    update mates10_alumno_habilidad set
      p_dominio = v_p,
      estabilidad_dias = coalesce(v_fs.s, estabilidad_dias),
      dificultad_fsrs = coalesce(v_fs.d, dificultad_fsrs),
      -- intervalo para la retención objetivo 0,9: I = S (FSRS-4.5); mínimo 1 día; sin dominar, repaso mañana
      proximo_repaso = case when v_p >= mates10_param('umbral_dominio') then current_date + greatest(1, round(coalesce(v_fs.s, 1)))::int
                            else current_date + 1 end,
      intentos = intentos + 1, aciertos = aciertos + v_ok::int,
      aciertos_seguidos = case when v_ok then aciertos_seguidos + 1 else 0 end,
      errores_seguidos = case when v_ok then 0 else errores_seguidos + 1 end,
      ultimo_error_tipico_id = coalesce(v_err, case when v_ok then ultimo_error_tipico_id end),
      ultimo_intento = now(), estado = v_estado, origen = 'practica', actualizado_en = now()
    where alumno_id = p_alumno and habilidad_id = v_hab;
    insert into mates10_alumno_habilidad_hist (alumno_id, habilidad_id, fecha, p_dominio) values (p_alumno, v_hab, current_date, v_p)
      on conflict (alumno_id, habilidad_id, fecha) do update set p_dominio = excluded.p_dominio;
  end if;

  update mates10_sesion set intentos = intentos + 1, aciertos = aciertos + v_ok::int,
    mecanicas = case when 'OPCIONES' = any(mecanicas) then mecanicas else mecanicas || array['OPCIONES'] end where id = p_sesion;

  -- racha (enganche: solo como dato; en esta entrega no se muestra)
  update mates10_alumno_enganche set racha_dias = case when ultimo_dia = current_date then racha_dias
                                                       when ultimo_dia = current_date - 1 then racha_dias + 1 else 1 end,
                                     ultimo_dia = current_date where alumno_id = p_alumno;

  if not v_ok then
    v_expl := mates10__explicacion(p_alumno, p_ejercicio, v_hab, v_repetido);
    select jsonb_build_object('codigo', codigo, 'nombre', nombre, 'explicacion_nino', explicacion_nino) into v_errinfo from mates10_error_tipico where id = v_err;
    update mates10_intento set metodo_id = (v_expl->>'metodo_id')::uuid where id = v_int;
  end if;
  return jsonb_build_object('intento_id', v_int, 'correcto', v_ok, 'respuesta_correcta', v_ej.respuesta->>0,
    'error', v_errinfo, 'explicacion', v_expl, 'p_dominio', round(v_p, 3), 'repetido', v_repetido);
end $$;

-- El cliente marca si vio la explicación y si la vio entera.
create or replace function public.mates10_marcar_explicacion(p_intento uuid, p_entera boolean) returns void language sql as $$
  update mates10_intento set vio_explicacion = true, explicacion_entera = p_entera where id = p_intento;
  update mates10_sesion set explicaciones = explicaciones + 1 where id = (select sesion_id from mates10_intento where id = p_intento);
$$;

create or replace function public.mates10_iniciar_sesion(p_alumno uuid, p_tipo text default 'practica', p_iniciada_por text default 'nino') returns uuid
language plpgsql as $$
declare v_id uuid;
begin
  -- cierra sesiones abiertas de más de 2 horas como abandono
  update mates10_sesion set fin = coalesce(fin, now()), motivo_fin = coalesce(motivo_fin, 'abandono')
    where alumno_id = p_alumno and fin is null;
  insert into mates10_sesion (alumno_id, tipo, objetivo_seg, iniciada_por)
    values (p_alumno, p_tipo, (select sesion_seg from mates10_alumno where id = p_alumno), p_iniciada_por) returning id into v_id;
  return v_id;
end $$;

create or replace function public.mates10_terminar_sesion(p_sesion uuid, p_motivo text default 'abandono') returns void language sql as $$
  update mates10_sesion set fin = coalesce(fin, now()), motivo_fin = coalesce(motivo_fin, p_motivo),
    termino_en_acierto = coalesce(termino_en_acierto, (select correcto from mates10_intento where sesion_id = p_sesion order by fecha desc limit 1))
  where id = p_sesion $$;

-- ------------------------------------------------------------------ prueba de nivel (módulo 05 §3)
-- Estado en sesion.estado: {"familias": [{"familia", "niveles": [..], "lo", "hi", "actual", "n"}], "i": 0}
create or replace function public.mates10_prueba_siguiente(p_alumno uuid, p_sesion uuid) returns jsonb language plpgsql as $$
declare
  v_ses mates10_sesion; v_alu mates10_alumno; v_est jsonb; v_fams jsonb; v_f jsonb; v_i int; v_last mates10_intento;
  v_nivel int; v_hab uuid; v_ej uuid; v_curso_ref text; v_max_items int; v_items int; v_k int; v_lo int; v_hi int; v_n int; v_mid int;
  v_orden_ref int;
begin
  select * into v_ses from mates10_sesion where id = p_sesion;
  select * into v_alu from mates10_alumno where id = p_alumno;
  v_est := v_ses.estado;
  -- orden de curso de referencia: el anterior al declarado; sin curso, el punto neutro (2º–3º de primaria)
  select coalesce((select c.orden - 1 from mates10_curso c where c.id = v_alu.curso_id), 3) into v_orden_ref;
  v_max_items := case when v_alu.fecha_nacimiento is not null and extract(year from age(v_alu.fecha_nacimiento)) < 8 then 12 else 20 end;

  if v_est = '{}'::jsonb or v_est->'familias' is null then
    -- Familias prioritarias con ejercicios publicados: las de mayor importancia que tienen niveles alrededor del punto de partida.
    select jsonb_agg(f order by imp desc, fam) into v_fams from (
      select h.familia fam, max(h.importancia) imp,
        jsonb_build_object('familia', h.familia,
          'niveles', jsonb_agg(h.nivel_familia order by h.nivel_familia),
          'lo', 0, 'hi', count(*), 'n', 0,
          -- índice (1..k) del último nivel que el mapa espera dominado en el curso de referencia
          'actual', greatest(1, count(*) filter (where c.orden <= v_orden_ref))) f
      from mates10_habilidad h
      join lateral (select min(cc.orden) orden from mates10_curso cc where cc.codigo = h.curso_ref) c on true
      where h.activo and h.familia is not null and mates10__tiene_ejercicios(h.id)
        and h.bloque_id in (select id from mates10_bloque where codigo in ('NUM', 'OPER', 'MED', 'PROB', 'GEO', 'EST', 'ALG'))
      group by h.familia
      having count(*) >= 2 and min(c.orden) <= greatest(v_orden_ref + 2, 3)
      order by max(h.importancia) desc limit 8) x;
    v_est := jsonb_build_object('familias', coalesce(v_fams, '[]'::jsonb), 'i', 0);
  end if;

  -- procesar el último intento: búsqueda binaria sobre el índice de nivel
  select * into v_last from mates10_intento where sesion_id = p_sesion order by fecha desc limit 1;
  if v_last.id is not null and v_est ? 'pendiente' then
    v_i := (v_est->'pendiente'->>'f')::int;
    v_f := v_est->'familias'->v_i;
    v_k := (v_est->'pendiente'->>'k')::int;
    v_lo := (v_f->>'lo')::int; v_hi := (v_f->>'hi')::int;
    if v_last.correcto then v_lo := greatest(v_lo, v_k); else v_hi := least(v_hi, v_k - 1); end if;
    v_f := v_f || jsonb_build_object('lo', v_lo, 'hi', v_hi, 'n', (v_f->>'n')::int + 1);
    v_est := jsonb_set(v_est, array['familias', v_i::text], v_f) - 'pendiente';
  end if;

  select count(*) into v_items from mates10_intento where sesion_id = p_sesion;
  -- siguiente familia sin situar (máx. 3 ítems por familia, o lo = hi)
  v_i := null;
  for v_n in 0 .. coalesce(jsonb_array_length(v_est->'familias'), 0) - 1 loop
    v_f := v_est->'familias'->v_n;
    if (v_f->>'n')::int < 3 and (v_f->>'lo')::int < (v_f->>'hi')::int then v_i := v_n; exit; end if;
  end loop;

  if v_i is null or v_items >= v_max_items or extract(epoch from now() - v_ses.inicio) > 900 then
    update mates10_sesion set estado = v_est where id = p_sesion;
    return mates10_prueba_cerrar(p_alumno, p_sesion);
  end if;

  v_lo := (v_f->>'lo')::int; v_hi := (v_f->>'hi')::int;
  v_k := case when (v_f->>'n')::int = 0 then least(greatest((v_f->>'actual')::int, 1), v_hi) else ceil((v_lo + v_hi) / 2.0)::int end;
  v_k := greatest(v_k, v_lo + 1);
  v_nivel := (v_f->'niveles'->>(v_k - 1))::int;
  select id into v_hab from mates10_habilidad where familia = v_f->>'familia' and nivel_familia = v_nivel;
  -- la prueba no usa la frontera cuando no hay curso declarado (D-018): se materializa todo lo del nivel
  drop table if exists pg_temp.m10_perm;
  create temp table m10_perm on commit drop as select id habilidad_id, 'consolida'::text estado, 'prueba'::text capa, 0 orden from mates10_habilidad;
  v_ej := mates10__elegir_ejercicio(p_alumno, v_hab, 2);
  if v_ej is null then
    -- sin ejercicio en ese nivel: se da la familia por situada ahí
    v_f := v_f || jsonb_build_object('n', 3);
    v_est := jsonb_set(v_est, array['familias', v_i::text], v_f);
    update mates10_sesion set estado = v_est where id = p_sesion;
    return mates10_prueba_siguiente(p_alumno, p_sesion);
  end if;
  v_est := v_est || jsonb_build_object('pendiente', jsonb_build_object('f', v_i, 'k', v_k));
  update mates10_sesion set estado = v_est where id = p_sesion;
  return mates10__presentar(v_ej, 'prueba_nivel', null, jsonb_build_object('progreso', round(100.0 * v_items / v_max_items),
         'lectura', true));
end $$;

-- Cierre: dominio inicial por familia (alto por debajo del nivel situado, bajo por encima), curso inferido
-- (el más alto cuyas habilidades domina en más de la mitad de las familias) y edad estimada.
create or replace function public.mates10_prueba_cerrar(p_alumno uuid, p_sesion uuid) returns jsonb language plpgsql as $$
declare v_est jsonb; v_f jsonb; v_n int; v_lo int; v_curso_orden int; v_curso uuid; v_conf numeric; v_nf int; v_alu mates10_alumno;
begin
  select estado into v_est from mates10_sesion where id = p_sesion;
  select * into v_alu from mates10_alumno where id = p_alumno;
  drop table if exists pg_temp.m10_sit;
  create temp table m10_sit (familia text, lo int, niveles jsonb) on commit drop;
  for v_n in 0 .. coalesce(jsonb_array_length(v_est->'familias'), 0) - 1 loop
    v_f := v_est->'familias'->v_n;
    if (v_f->>'n')::int = 0 then continue; end if;
    v_lo := (v_f->>'lo')::int;
    insert into m10_sit values (v_f->>'familia', v_lo, v_f->'niveles');
    insert into mates10_alumno_habilidad (alumno_id, habilidad_id, p_dominio, estado, origen, proximo_repaso, estabilidad_dias)
    select p_alumno, h.id,
           case when h.nivel_familia <= coalesce((v_f->'niveles'->>(v_lo - 1))::int, -1) then 0.9 else 0.2 end,
           case when h.nivel_familia <= coalesce((v_f->'niveles'->>(v_lo - 1))::int, -1) then 'dominada' else 'no_vista' end,
           'prueba_nivel', current_date + 7, 7
    from mates10_habilidad h where h.familia = v_f->>'familia'
    on conflict (alumno_id, habilidad_id) do update set p_dominio = excluded.p_dominio, estado = excluded.estado, origen = 'prueba_nivel',
      proximo_repaso = excluded.proximo_repaso, estabilidad_dias = excluded.estabilidad_dias, actualizado_en = now();
  end loop;
  select count(*) into v_nf from m10_sit;
  -- curso inferido: mayor orden c tal que en más de la mitad de las familias el nivel situado cubre lo introducido hasta c
  select max(c.orden) into v_curso_orden from generate_series(1, 12) c(orden)
  where v_nf > 0 and (select count(*) from m10_sit s where not exists (
          select 1 from mates10_habilidad h join mates10_curso cc on cc.codigo = h.curso_ref and cc.sistema_id = v_alu.sistema_id
          where h.familia = s.familia and cc.orden <= c.orden
            and h.nivel_familia > coalesce((s.niveles->>(s.lo - 1))::int, -1))) * 2 > v_nf;
  v_curso_orden := coalesce(v_curso_orden, 1);
  select id into v_curso from mates10_curso where sistema_id = v_alu.sistema_id and orden = v_curso_orden;
  v_conf := round(least(0.9, 0.3 + 0.08 * v_nf), 2);
  update mates10_alumno set prueba_nivel_hecha = true, curso_inferido = v_curso, confianza_inferencia = v_conf,
    edad_estimada = coalesce(edad_estimada, (select edad_tipica from mates10_curso where id = v_curso))
    where id = p_alumno;
  update mates10_sesion set fin = now(), motivo_fin = 'prueba_terminada',
    termino_en_acierto = (select correcto from mates10_intento where sesion_id = p_sesion order by fecha desc limit 1)
    where id = p_sesion;
  return jsonb_build_object('fin', true, 'motivo', 'prueba_terminada', 'curso_inferido',
    (select nombre_local from mates10_curso where id = v_curso), 'confianza', v_conf, 'familias', v_nf);
end $$;

-- ------------------------------------------------------------------ informe al padre (módulo 08 §4)
create or replace function public.mates10_informe(p_alumno uuid) returns jsonb language plpgsql as $$
declare v jsonb; v_frase text; v_err record; v_debil record;
begin
  perform mates10__perm(p_alumno);
  -- frase de la semana: el error que más repite o la habilidad importante más floja
  select e.nombre, e.indicacion_padres, count(*) n into v_err from mates10_intento i join mates10_error_tipico e on e.id = i.error_tipico_id
    where i.alumno_id = p_alumno and i.fecha > now() - interval '14 days' group by e.id having count(*) >= 2 order by count(*) desc limit 1;
  select h.nombre_padres, ah.p_dominio into v_debil from mates10_alumno_habilidad ah join mates10_habilidad h on h.id = ah.habilidad_id
    join pg_temp.m10_perm p on p.habilidad_id = ah.habilidad_id
    where ah.alumno_id = p_alumno and ah.estado in ('en_curso', 'olvidada') order by h.importancia desc, ah.p_dominio limit 1;
  v_frase := case when v_err.nombre is not null then v_err.indicacion_padres
                  when v_debil.nombre_padres is not null then 'Esta semana practicad juntos «' || v_debil.nombre_padres || '»: cinco minutos al día, en el coche o en la cena, pidiéndole que te explique cómo lo hace.'
                  else 'Pídele que te enseñe en la app lo que ya sabe hacer: explicarlo en voz alta afianza lo aprendido.' end;
  select jsonb_build_object(
    'alumno', (select jsonb_build_object('nombre', a.nombre, 'curso', coalesce(c1.nombre_local, c2.nombre_local), 'curso_declarado', a.curso_id is not null,
                 'confianza', a.confianza_inferencia, 'edad', coalesce(extract(year from age(a.fecha_nacimiento))::int, a.edad_estimada),
                 'prueba_nivel_hecha', a.prueba_nivel_hecha)
               from mates10_alumno a left join mates10_curso c1 on c1.id = a.curso_id left join mates10_curso c2 on c2.id = a.curso_inferido where a.id = p_alumno),
    'bloques', (select jsonb_agg(jsonb_build_object('codigo', b.codigo, 'nombre', b.nombre_padres, 'dominio', round(x.dom, 2), 'dominio_hace_2_semanas', round(x.dom14, 2), 'habilidades', x.n) order by b.orden)
               from mates10_bloque b join (
                 select h.bloque_id, avg(ah.p_dominio) dom, count(*) n,
                   avg(coalesce((select hh.p_dominio from mates10_alumno_habilidad_hist hh where hh.alumno_id = ah.alumno_id and hh.habilidad_id = ah.habilidad_id
                                 and hh.fecha <= current_date - 14 order by hh.fecha desc limit 1), case when ah.origen = 'prueba_nivel' then ah.p_dominio else 0.1 end)) dom14
                 from mates10_alumno_habilidad ah join mates10_habilidad h on h.id = ah.habilidad_id
                 where ah.alumno_id = p_alumno and ah.estado <> 'no_vista' group by h.bloque_id) x on x.bloque_id = b.id),
    'familias', (select jsonb_agg(jsonb_build_object('familia', f.familia, 'nombre', f.nombre, 'nivel', f.nivel, 'de', f.total, 'dominio', round(f.dom, 2)) order by f.dom desc)
               from (select h.familia, min(h.nombre_padres) filter (where h.nivel_familia = 1) nombre,
                       coalesce(max(h.nivel_familia) filter (where ah.p_dominio >= mates10_param('umbral_dominio')), 0) nivel,
                       (select count(*) from mates10_habilidad h2 where h2.familia = h.familia) total, avg(ah.p_dominio) dom
                     from mates10_alumno_habilidad ah join mates10_habilidad h on h.id = ah.habilidad_id
                     where ah.alumno_id = p_alumno and ah.estado <> 'no_vista' group by h.familia) f),
    'errores', (select jsonb_agg(jsonb_build_object('nombre', e.nombre, 'veces', x.n, 'habilidad', h.nombre_padres, 'que_hacer', e.indicacion_padres) order by x.n desc)
               from (select error_tipico_id, count(*) n from mates10_intento where alumno_id = p_alumno and error_tipico_id is not null
                     and fecha > now() - interval '30 days' group by 1 having count(*) >= 2) x
               join mates10_error_tipico e on e.id = x.error_tipico_id join mates10_habilidad h on h.id = e.habilidad_id),
    'repasos', (select jsonb_agg(jsonb_build_object('habilidad', h.nombre_padres, 'fecha', ah.proximo_repaso) order by ah.proximo_repaso)
               from (select * from mates10_alumno_habilidad where alumno_id = p_alumno and estado = 'dominada' and origen = 'practica'
                     and proximo_repaso is not null order by proximo_repaso limit 8) ah join mates10_habilidad h on h.id = ah.habilidad_id),
    'proxima_leccion', (select jsonb_agg(distinct jsonb_build_object('viene', h1.nombre_padres, 'necesita', h2.nombre_padres,
                          'dominio', round(coalesce(ah.p_dominio, 0), 2)))
               from mates10_proxima_leccion(p_alumno) pl join mates10_habilidad h1 on h1.id = pl.habilidad_id join mates10_habilidad h2 on h2.id = pl.prerrequisito_id
               left join mates10_alumno_habilidad ah on ah.alumno_id = p_alumno and ah.habilidad_id = pl.prerrequisito_id),
    'actividad', (select jsonb_build_object('sesiones_7d', count(*) filter (where inicio > now() - interval '7 days'),
                    'minutos_7d', round(coalesce(sum(extract(epoch from coalesce(fin, inicio) - inicio)) filter (where inicio > now() - interval '7 days'), 0) / 60),
                    'aciertos_7d', sum(aciertos) filter (where inicio > now() - interval '7 days'), 'intentos_7d', sum(intentos) filter (where inicio > now() - interval '7 days'),
                    'terminaron_en_acierto', count(*) filter (where termino_en_acierto))
                  from mates10_sesion where alumno_id = p_alumno and tipo = 'practica'),
    'frase_semana', v_frase) into v;
  return v;
end $$;

-- ------------------------------------------------------------------ revisión (módulo 08 §5)
create or replace function public.mates10_revisar(p_tipo text, p_id uuid, p_revisor text, p_decision text, p_motivo text default null,
  p_texto text default null) returns void language plpgsql as $$
begin
  insert into mates10_revisor (nombre) values (p_revisor) on conflict do nothing;
  insert into mates10_revision (objeto_tipo, objeto_id, revisor, decision, motivo, texto) values (p_tipo, p_id, p_revisor, p_decision, p_motivo, p_texto);
  if p_tipo = 'ejercicio' then
    if p_decision in ('aprobado', 'editado') then
      update mates10_ejercicio set revisado_por = p_revisor, revisado_en = now(), revision_tipo = 'directa', rechazado = false,
        publicado = validado_automatico where id = p_id;
      update mates10_ejercicio_explicacion set revisado_por = p_revisor where ejercicio_id = p_id;
    elsif p_decision = 'rechazado' then
      update mates10_ejercicio set rechazado = true, publicado = false, revisado_por = p_revisor, revisado_en = now() where id = p_id;
    end if;
  elsif p_tipo = 'plantilla' then
    if p_decision = 'aprobado' then
      update mates10_plantilla set estado = 'aprobada', revisado_por = p_revisor, revisado_en = now() where id = p_id;
      -- Revisión heredada: las instancias por código de una plantilla aprobada heredan el revisor (módulo 02).
      update mates10_ejercicio e set revisado_por = p_revisor, revisado_en = now(), revision_tipo = 'heredada', publicado = e.validado_automatico
        from mates10_plantilla p where p.id = p_id and e.plantilla_id = p.id and p.generador = 'codigo' and not e.rechazado
          and coalesce(e.revision_tipo, 'provisional') in ('provisional', 'heredada');
    elsif p_decision = 'rechazado' then
      update mates10_plantilla set estado = 'retirada', revisado_por = p_revisor, revisado_en = now() where id = p_id;
      update mates10_ejercicio set publicado = false where plantilla_id = p_id and coalesce(revision_tipo, '') <> 'directa';
    end if;
  elsif p_tipo = 'habilidad' then
    update mates10_habilidad set estado_revision = case when p_decision = 'aprobado' then 'aprobada' else 'comentada' end where id = p_id;
  end if;
end $$;

-- ------------------------------------------------------------------ permisos RPC
do $$
declare f record;
begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'mates10\_%' loop
    execute format('grant execute on function %s to anon, authenticated', f.sig);
  end loop;
end $$;
