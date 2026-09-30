-- Reglas de frontera (módulo 01, sección 6) como funciones SQL.
-- La frontera vive aquí y solo aquí: la app y el tutor la llaman por RPC.

-- Mes del año → posición en el curso escolar español (sep = 1 … jun = 10;
-- jul/ago = 11/12, es decir, curso terminado).
create or replace function public.mates10_mes_escolar(p_mes int) returns int
language sql immutable as $$ select case when p_mes >= 9 then p_mes - 8 else p_mes + 4 end $$;

create or replace function public.mates10_trimestre_de_mes(p_mes int) returns int
language sql immutable as $$
  select case when p_mes between 9 and 12 then 1 when p_mes between 1 and 3 then 2 else 3 end $$;

-- ¿La fila del mapa (trimestre, mes, orden) está en o antes de la posición actual?
create or replace function public.mates10_ya_dada(f_trim int, f_mes int, f_orden int, p_mes int, p_orden int)
returns boolean language sql immutable as $$
  select f_trim < mates10_trimestre_de_mes(p_mes)
      or (f_trim = mates10_trimestre_de_mes(p_mes) and (
            f_mes is null
         or mates10_mes_escolar(f_mes) < mates10_mes_escolar(p_mes)
         or (f_mes = p_mes and (p_orden is null or f_orden <= p_orden))))
      or (mates10_mes_escolar(p_mes) >= 11)   -- verano: todo el curso está dado
$$;

-- Conjunto permitido (reglas 1–3 y 5).
--   capa: 'colegio' > 'editorial' > 'sistema'. Si una capa más específica tiene
--   filas para una habilidad (en cualquier momento del curso), sustituye a las
--   de las capas menos específicas para esa habilidad (regla 2).
--   estado: el de la última fila ya dada. 'introduce' solo vale el mes (o
--   trimestre, si la fila no tiene mes) en que se introduce; pasado ese
--   periodo sin fila nueva, cuenta como 'consolida'.
--   Lo de cursos anteriores del mismo sistema entra como 'repasa' (DECISIONES).
create or replace function public.mates10_permitidas(
  p_sistema uuid, p_curso uuid, p_mes int default null, p_orden int default null,
  p_colegio uuid default null, p_editorial text default null)
returns table (habilidad_id uuid, estado text, capa text, orden int)
language sql stable as $$
  with pos as (
    select coalesce(p_mes, extract(month from now())::int) as mes
  ),
  filas as (
    select m.*, case when m.colegio_id is not null then 3 when m.editorial is not null then 2 else 1 end as nivel
    from mates10_mapa_curricular m
    where m.sistema_id = p_sistema and m.curso_id = p_curso
      and (m.colegio_id is null or m.colegio_id = p_colegio)
      and (m.editorial is null or (m.colegio_id is null and m.editorial = p_editorial))
  ),
  capa_hab as (   -- capa más específica con filas para cada habilidad
    select f.habilidad_id, max(f.nivel) as nivel from filas f group by f.habilidad_id
  ),
  dadas as (
    select f.*, row_number() over (partition by f.habilidad_id
             order by f.trimestre desc, mates10_mes_escolar(coalesce(f.mes, 9)) desc, f.orden desc) as rn
    from filas f join capa_hab c on c.habilidad_id = f.habilidad_id and c.nivel = f.nivel, pos
    where mates10_ya_dada(f.trimestre, f.mes, f.orden, pos.mes, p_orden)
  ),
  este_curso as (
    select d.habilidad_id,
           case when d.estado = 'introduce'
                 and not ((d.mes = pos.mes) or (d.mes is null and d.trimestre = mates10_trimestre_de_mes(pos.mes)))
                then 'consolida' else d.estado end as estado,
           case d.nivel when 3 then 'colegio' when 2 then 'editorial' else 'sistema' end as capa,
           d.orden
    from dadas d, pos where d.rn = 1
  ),
  anteriores as (
    select distinct m.habilidad_id
    from mates10_mapa_curricular m
    join mates10_curso c on c.id = m.curso_id
    where m.sistema_id = p_sistema and m.colegio_id is null and m.editorial is null
      and c.orden < (select orden from mates10_curso where id = p_curso)
  )
  select * from este_curso
  union all
  select a.habilidad_id, 'repasa', 'curso_anterior', 0 from anteriores a
  where not exists (select 1 from este_curso e where e.habilidad_id = a.habilidad_id)
$$;

-- Techo de un alumno: resuelve curso (declarado, o inferido con un curso de
-- margen), mes, orden, colegio y editorial, y aplica el modo examen (regla 8).
create or replace function public.mates10_permitidas_alumno(p_alumno uuid, p_con_objetivo boolean default true)
returns table (habilidad_id uuid, estado text, capa text, orden int)
language plpgsql stable as $$
declare a record; v_curso uuid; v_mes int; v_orden int; v_hab uuid[];
begin
  select * into a from mates10_alumno where id = p_alumno;
  if not found then return; end if;
  v_mes := coalesce(a.posicion_mes, extract(month from now())::int);
  v_orden := a.posicion_orden;
  if a.curso_id is not null then
    v_curso := a.curso_id;
  elsif a.curso_inferido is not null then
    -- Sin curso declarado: techo = un curso por encima del inferido, curso completo.
    select c2.id into v_curso from mates10_curso c1 join mates10_curso c2
      on c2.sistema_id = c1.sistema_id and c2.orden = least(c1.orden + 1, 12)
      where c1.id = a.curso_inferido;
    v_mes := 7; v_orden := null;
  else
    -- Arranque a ciegas: techo provisional 3º de primaria (punto neutro del módulo 05).
    select id into v_curso from mates10_curso where sistema_id = a.sistema_id and codigo = 'PRI3';
    v_mes := 7; v_orden := null;
  end if;

  if p_con_objetivo and a.objetivo is not null and a.objetivo->>'tipo' = 'examen'
     and jsonb_array_length(coalesce(a.objetivo->'habilidades', '[]')) > 0 then
    select array_agg(value::uuid) into v_hab from jsonb_array_elements_text(a.objetivo->'habilidades');
    return query select p.* from mates10_permitidas(a.sistema_id, v_curso, v_mes, v_orden, a.colegio_id, a.editorial_mates) p
                 where p.habilidad_id = any(v_hab);
  else
    return query select * from mates10_permitidas(a.sistema_id, v_curso, v_mes, v_orden, a.colegio_id, a.editorial_mates);
  end if;
end $$;

-- Regla 4 y 5: ¿puede un alumno ver este ejercicio? Todas sus habilidades
-- permitidas y, si la principal está en 'introduce', solo dificultad 1.
create or replace function public.mates10_ejercicio_permitido(p_alumno uuid, p_ejercicio uuid)
returns boolean language sql stable as $$
  with perm as (select * from mates10_permitidas_alumno(p_alumno)),
  hab as (select eh.habilidad_id, eh.rol from mates10_ejercicio_habilidad eh where eh.ejercicio_id = p_ejercicio)
  select exists (select 1 from hab)
     and not exists (select 1 from hab h where not exists (select 1 from perm p where p.habilidad_id = h.habilidad_id))
     and not exists (select 1 from hab h join perm p on p.habilidad_id = h.habilidad_id
                     join mates10_ejercicio e on e.id = p_ejercicio
                     where h.rol = 'principal' and p.estado = 'introduce' and e.dificultad > 1)
$$;

-- Regla 6: preparar la próxima lección. Habilidades que el mapa introduce el
-- mes siguiente y sus prerrequisitos imprescindibles (ya permitidos).
create or replace function public.mates10_proxima_leccion(p_alumno uuid)
returns table (habilidad_id uuid, prerrequisito_id uuid, mes int)
language plpgsql stable as $$
declare a record; v_curso uuid; v_mes int; v_sig int;
begin
  select * into a from mates10_alumno where id = p_alumno;
  v_curso := coalesce(a.curso_id, a.curso_inferido);
  if v_curso is null then return; end if;
  v_mes := coalesce(a.posicion_mes, extract(month from now())::int);
  v_sig := case when v_mes = 12 then 1 when v_mes in (6,7) then 9 else v_mes + 1 end;
  return query
    select m.habilidad_id, hp.prerrequisito_id, v_sig
    from mates10_mapa_curricular m
    join mates10_habilidad_prerrequisito hp on hp.habilidad_id = m.habilidad_id and hp.peso = 'imprescindible'
    where m.sistema_id = a.sistema_id and m.curso_id = v_curso and m.estado = 'introduce'
      and m.colegio_id is null and m.editorial is null
      and (m.mes = v_sig or (m.mes is null and m.trimestre = mates10_trimestre_de_mes(v_sig) and mates10_trimestre_de_mes(v_sig) <> mates10_trimestre_de_mes(v_mes)));
end $$;

grant execute on function public.mates10_permitidas(uuid,uuid,int,int,uuid,text) to anon, authenticated;
grant execute on function public.mates10_permitidas_alumno(uuid,boolean) to anon, authenticated;
grant execute on function public.mates10_ejercicio_permitido(uuid,uuid) to anon, authenticated;
grant execute on function public.mates10_proxima_leccion(uuid) to anon, authenticated;
