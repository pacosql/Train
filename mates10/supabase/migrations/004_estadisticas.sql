-- Estadísticas para la app del revisor (módulo 08 §5) y vistas resumen que usan el Excel y Explorar.

create or replace function public.mates10_estadisticas_revision() returns jsonb language sql stable as $$
  with ej as (
    select e.id, e.publicado, e.revisado_por, e.rechazado, e.validado_automatico, h.curso_ref, h.bloque_id, h.id habilidad_id
    from mates10_ejercicio e join mates10_ejercicio_habilidad eh on eh.ejercicio_id = e.id and eh.rol = 'principal'
    join mates10_habilidad h on h.id = eh.habilidad_id)
  select jsonb_build_object(
    'totales', jsonb_build_object(
      'habilidades', (select count(*) from mates10_habilidad),
      'ejercicios', (select count(*) from ej),
      'publicados', (select count(*) from ej where publicado),
      'pendientes', (select count(*) from ej where validado_automatico and revisado_por is null and not rechazado),
      'revisados', (select count(*) from ej where revisado_por is not null and not rechazado),
      'rechazados', (select count(*) from ej where rechazado)),
    'por_curso', (select jsonb_agg(x order by x->>'curso') from (
      select jsonb_build_object('curso', h.curso_ref, 'habilidades', count(distinct h.id),
        'con_ejercicios', count(distinct ej.habilidad_id), 'ejercicios', count(ej.id),
        'publicados', count(ej.id) filter (where ej.publicado), 'revisados', count(ej.id) filter (where ej.revisado_por is not null)) x
      from mates10_habilidad h left join ej on ej.habilidad_id = h.id group by h.curso_ref) t),
    'por_bloque', (select jsonb_agg(jsonb_build_object('bloque', b.nombre, 'habilidades', (select count(*) from mates10_habilidad where bloque_id = b.id),
        'ejercicios', (select count(*) from ej where ej.bloque_id = b.id), 'publicados', (select count(*) from ej where ej.bloque_id = b.id and ej.publicado)) order by b.orden)
      from mates10_bloque b),
    'por_lote', (select jsonb_agg(jsonb_build_object('lote', l.lote, 'aceptados', l.ok, 'rechazados', l.ko,
        'pct', round(100.0 * l.ok / nullif(l.ok + l.ko, 0), 1)) order by l.lote)
      from (select lote, sum(ok) ok, sum(ko) ko from (
              select split_part(e.generado_por, ' ', 1) || ' · ' || h.curso_ref as lote, 1 ok, 0 ko from ej
              join mates10_ejercicio e on e.id = ej.id join mates10_habilidad h on h.id = ej.habilidad_id
              union all
              select r.lote, 0, 1 from mates10_rechazo_validador r) u group by lote) l),
    'rechazos', (select jsonb_agg(jsonb_build_object('etapa', etapa, 'motivo', m, 'n', n) order by n desc) from (
      select etapa, regexp_replace(motivo, '[:(«].*$', '') m, count(*) n from mates10_rechazo_validador group by 1, 2 order by 3 desc limit 40) r),
    'revisiones', (select jsonb_agg(jsonb_build_object('objeto_tipo', objeto_tipo, 'decision', decision, 'motivo', motivo, 'n', n)) from (
      select objeto_tipo, decision, motivo, count(*) n from mates10_revision group by 1, 2, 3) r))
$$;
grant execute on function public.mates10_estadisticas_revision() to anon, authenticated;
