-- Lengua — rutina de cada 5 minutos (pg_cron dentro de Supabase).
--
-- lengua_preparar(alumno) recalcula el nivel por área del alumno a partir de
-- sus respuestas y le deja preparadas en lengua_cola las 60 siguientes
-- preguntas:
--   · repaso   — preguntas cuya última respuesta fue fallo (hace > 2 h)
--   · refuerzo — falladas alguna vez, acertadas después, sin ver hace > 3 días
--   · nueva    — no vistas, repartidas por área según lo floja que está
--                (más peso a las áreas débiles y a las poco exploradas) y a la
--                dificultad que le toca en cada área (nivel_obj)
--   · relleno  — si se acaba el banco, las acertadas hace más tiempo
-- La app también la llama (RPC) si al entrar encuentra la cola vacía, así
-- que nunca depende de que el cron haya pasado.

alter table public.lengua_nivel add column if not exists acc numeric not null default 0;

create or replace function public.lengua_preparar(p_alumno uuid, p_tam int default 60)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_w numeric;
  v_n int;
begin
  -- 1) Nivel por área (todas las áreas activas del banco).
  delete from lengua_nivel where alumno_id = p_alumno;
  insert into lengua_nivel (alumno_id, area, n, aciertos, rec_n, rec_ok, acc, score, nivel_obj, updated_at)
  select p_alumno, ar.area,
         coalesce(t.n, 0), coalesce(t.ok, 0), coalesce(r.n, 0), coalesce(r.ok, 0),
         round((coalesce(r.ok, 0) + 1)::numeric / (coalesce(r.n, 0) + 2), 3),
         -- dominio: aciertos ponderados por dificultad (un acierto de nivel 3
         -- vale 1, de nivel 1 vale 1/3), suavizado.
         round((coalesce(r.pts, 0) + 0.5) / (coalesce(r.n, 0) + 1.5), 3),
         case when coalesce(r.n, 0) < 4 then 2
              when (r.ok + 1)::numeric / (r.n + 2) < 0.55 then 1
              when (r.ok + 1)::numeric / (r.n + 2) < 0.8 then 2
              else 3 end,
         now()
  from (select distinct area from lengua_pregunta where activa) ar
  left join (
    select area, count(*) n, count(*) filter (where correcta) ok
    from lengua_respuesta where alumno_id = p_alumno group by area
  ) t on t.area = ar.area
  left join (
    select area, count(*) n, count(*) filter (where correcta) ok,
           sum(case when correcta then nivel / 3.0 else 0 end) pts
    from (
      select area, correcta, nivel,
             row_number() over (partition by area order by created_at desc) rn
      from lengua_respuesta where alumno_id = p_alumno
    ) x where rn <= 15 group by area
  ) r on r.area = ar.area;

  -- 2) Lote nuevo.
  delete from lengua_cola where alumno_id = p_alumno;

  create temp table if not exists _lp (pregunta_id text, motivo text, ord numeric) on commit drop;
  truncate _lp;

  -- Última respuesta de cada pregunta vista.
  create temp table if not exists _ult (pregunta_id text primary key, correcta boolean, at timestamptz, fallos int) on commit drop;
  truncate _ult;
  insert into _ult
  select distinct on (pregunta_id) pregunta_id, correcta, created_at,
         count(*) filter (where not correcta) over (partition by pregunta_id)
  from lengua_respuesta where alumno_id = p_alumno
  order by pregunta_id, created_at desc;

  -- repaso: último intento fallado, hace más de 2 h (en la misma sesión ya
  -- la repite la app). Las más antiguas primero. Hasta un 25 % del lote.
  insert into _lp
  select u.pregunta_id, 'repaso', row_number() over (order by u.at) * 3.0 + 0.5
  from _ult u join lengua_pregunta p on p.id = u.pregunta_id and p.activa
  where not u.correcta and u.at < now() - interval '2 hours'
  order by u.at limit (p_tam / 4);

  -- refuerzo: falladas alguna vez, ya acertadas, sin ver hace > 3 días.
  insert into _lp
  select u.pregunta_id, 'refuerzo', row_number() over (order by u.at) * 6.0 + 1.5
  from _ult u join lengua_pregunta p on p.id = u.pregunta_id and p.activa
  where u.correcta and u.fallos > 0 and u.at < now() - interval '3 days'
  order by u.at limit (p_tam / 10);

  select count(*) into v_n from _lp;

  -- nuevas: cuota por área ∝ peso = (1 − dominio) + 0.15, +0.3 si apenas
  -- se ha explorado (< 10 respuestas). Dentro de cada área, primero las del
  -- nivel que le toca, luego las vecinas.
  select sum((1 - score) + 0.15 + case when n < 10 then 0.3 else 0 end) into v_total_w
  from lengua_nivel where alumno_id = p_alumno;

  insert into _lp
  select pregunta_id, 'nueva', rn + random() * 0.9
  from (
    select p.id pregunta_id, p.area,
           row_number() over (partition by p.area order by abs(p.nivel - l.nivel_obj), random()) rn,
           ceil((p_tam - v_n) * ((1 - l.score) + 0.15 + case when l.n < 10 then 0.3 else 0 end) / nullif(v_total_w, 0)) cuota
    from lengua_pregunta p
    join lengua_nivel l on l.alumno_id = p_alumno and l.area = p.area
    where p.activa and not exists (select 1 from _ult u where u.pregunta_id = p.id)
  ) z where rn <= cuota;

  -- relleno: si el banco sin ver se acaba, las acertadas hace más tiempo.
  select count(*) into v_n from _lp;
  if v_n < p_tam then
    insert into _lp
    select u.pregunta_id, 'relleno', 1000 + row_number() over (order by u.at)
    from _ult u join lengua_pregunta p on p.id = u.pregunta_id and p.activa
    where u.correcta and u.at < now() - interval '1 day'
      and not exists (select 1 from _lp x where x.pregunta_id = u.pregunta_id)
    order by u.at limit (p_tam - v_n);
  end if;

  insert into lengua_cola (alumno_id, pos, pregunta_id, motivo)
  select p_alumno, row_number() over (order by ord), pregunta_id, motivo
  from (select distinct on (pregunta_id) * from _lp order by pregunta_id, ord) d
  order by ord limit p_tam;

  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- Pasada de cron: alumnos con actividad en 30 días o con cola corta.
create or replace function public.lengua_preparar_todos()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r record; v int := 0; v_det jsonb := '[]'::jsonb; v_c int;
begin
  for r in
    select a.id, a.nombre from lengua_alumno a
    where exists (select 1 from lengua_respuesta x where x.alumno_id = a.id and x.created_at > now() - interval '30 days')
       or (select count(*) from lengua_cola c where c.alumno_id = a.id) < 20
  loop
    v_c := lengua_preparar(r.id);
    v := v + 1;
    v_det := v_det || jsonb_build_object('alumno', r.nombre, 'cola', v_c);
  end loop;
  -- Registro de cada pasada (se guardan 2 días) para ver que la rutina va.
  insert into lengua_rutina_log (tipo, nota, datos) values ('5min', v || ' alumnos preparados', v_det);
  delete from lengua_rutina_log where tipo = '5min' and created_at < now() - interval '2 days';
  return v;
end $$;

grant execute on function public.lengua_preparar(uuid, int) to anon;
revoke execute on function public.lengua_preparar_todos() from anon, public;

-- Programación cada 5 minutos.
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'lengua_preparar';
select cron.schedule('lengua_preparar', '*/5 * * * *', 'select public.lengua_preparar_todos()');
