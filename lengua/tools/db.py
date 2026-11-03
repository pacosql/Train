#!/usr/bin/env python3
"""Lengua — herramientas de base de datos para la rutina nocturna.

Usa la Management API de Supabase con $SUPABASE_ACCESS_TOKEN (nunca lo
escribas en un fichero). Todas las órdenes trabajan solo con tablas lengua_.

  python3 lengua/tools/db.py sql "select ..."          # consulta libre (JSON)
  python3 lengua/tools/db.py aplicar lengua/supabase/001_esquema.sql
  python3 lengua/tools/db.py contexto                   # informe para la rutina
  python3 lengua/tools/db.py cargar f.json [--origen noche-2026-11-04]
                                                         # inserta/actualiza preguntas (valida antes)
  python3 lengua/tools/db.py validar f.json [...]       # solo valida
  python3 lengua/tools/db.py retirar <id> "<motivo>"    # activa = false
  python3 lengua/tools/db.py reporte <id> atendido|descartado "<qué se hizo>"
  python3 lengua/tools/db.py siguiente_id <area>        # próximo id libre
  python3 lengua/tools/db.py log "<nota>" [datos.json]  # registra la rutina nocturna
  python3 lengua/tools/db.py preparar                   # ejecuta ya la rutina de 5 min
"""
import json, os, re, sys, urllib.request, urllib.error

REF = "dzlhsdpgyxnjwudmrnul"
AREAS = ["epoca", "autor", "generos", "metrica", "retorica", "morfologia",
         "sintaxis", "lexico", "texto", "norma", "historia", "aula"]


def sql(query):
    tok = os.environ.get("SUPABASE_ACCESS_TOKEN")
    if not tok:
        sys.exit("Falta $SUPABASE_ACCESS_TOKEN")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json",
                 "User-Agent": "train-lengua/1.0"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b"[]")
    except urllib.error.HTTPError as e:
        sys.exit(f"SQL error {e.code}: {e.read().decode()[:2000]}")


def lit(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def norm(s):
    s = s.lower()
    for a, b in zip("áéíóúü", "aeiouu"):
        s = s.replace(a, b)
    return re.sub(r"[^a-zñ0-9 ]", "", s).strip()


def firma(p):
    o = p.get("o") if isinstance(p.get("o"), list) else []
    return norm(p["q"] + "|" + (p.get("txt") or "")) + "|" + "|".join(sorted(x.strip().lower() for x in o))


def validar(qs, existentes=None):
    """Devuelve lista de errores (vacía si todo bien)."""
    errs, ids, firmas = [], set(), {}
    for e in (existentes or []):
        firmas[firma(e)] = e["id"]
    for i, p in enumerate(qs):
        w = f"[{p.get('id', i)}]"
        for k in ("id", "area", "nivel", "q", "o", "a", "why"):
            if k not in p:
                errs.append(f"{w} falta {k}")
        if errs and errs[-1].startswith(w):
            continue
        if p["area"] not in AREAS:
            errs.append(f"{w} área desconocida {p['area']}")
        if not re.fullmatch(rf"{p['area']}-\d{{3,4}}", p["id"]):
            errs.append(f"{w} id debe ser <area>-<nnn>")
        if p["id"] in ids:
            errs.append(f"{w} id repetido en el fichero")
        ids.add(p["id"])
        if p["nivel"] not in (1, 2, 3):
            errs.append(f"{w} nivel debe ser 1, 2 o 3")
        o = p["o"]
        if not isinstance(o, list) or len(o) != 4 or any(not isinstance(x, str) or not x.strip() for x in o):
            errs.append(f"{w} 'o' deben ser 4 textos")
        elif len({x.strip() for x in o}) != 4:
            errs.append(f"{w} opciones repetidas")
        if p["a"] not in (0, 1, 2, 3):
            errs.append(f"{w} 'a' debe ser 0-3")
        if len(p["q"]) > 140:
            errs.append(f"{w} pregunta demasiado larga ({len(p['q'])} > 140)")
        if p.get("txt") and len(p["txt"]) > 320:
            errs.append(f"{w} txt demasiado largo ({len(p['txt'])} > 320)")
        if isinstance(o, list) and any(len(x) > 90 for x in o):
            errs.append(f"{w} alguna opción > 90 caracteres")
        if len(p["why"]) > 400:
            errs.append(f"{w} explicación demasiado larga ({len(p['why'])} > 400)")
        if any(re.search(r"todas las anteriores|ninguna de las anteriores", x, re.I) for x in (o if isinstance(o, list) else [])):
            errs.append(f"{w} no uses 'todas/ninguna de las anteriores'")
        f = firma(p)
        if f in firmas and firmas[f] != p["id"]:
            errs.append(f"{w} duplicada de {firmas[f]}")
        firmas.setdefault(f, p["id"])
    return errs


def cargar(path, origen):
    qs = json.load(open(path))
    ex = sql("select id, q, txt, o from lengua_pregunta")
    errs = validar(qs, ex)
    if errs:
        print("\n".join(errs))
        sys.exit(f"{len(errs)} errores: no se carga nada")
    existentes = {e["id"] for e in ex}
    for k in range(0, len(qs), 100):
        vals = ",\n".join(
            f"({lit(p['id'])},{lit(p['area'])},{p['nivel']},{lit(p['q'])},{lit(p.get('txt'))},{lit(p['o'])},{p['a']},{lit(p['why'])},{lit(origen)})"
            for p in qs[k:k + 100])
        sql(f"""insert into lengua_pregunta (id, area, nivel, q, txt, o, a, why, origen) values {vals}
          on conflict (id) do update set area=excluded.area, nivel=excluded.nivel, q=excluded.q, txt=excluded.txt,
            o=excluded.o, a=excluded.a, why=excluded.why, activa=true,
            version=lengua_pregunta.version+1, updated_at=now()""")
    nuevas = sum(1 for p in qs if p["id"] not in existentes)
    print(f"Cargadas {len(qs)} ({nuevas} nuevas, {len(qs) - nuevas} actualizadas)")


def contexto():
    out = {}
    out["banco"] = sql("""select area, nivel, count(*) filter (where activa) activas, count(*) total
        from lengua_pregunta group by 1,2 order by 1,2""")
    out["alumnos"] = sql("""select a.id, a.nombre, a.objetivo, count(r.id) respuestas,
        count(r.id) filter (where r.created_at > now() - interval '1 day') ult_24h,
        round(avg(case when r.correcta then 1 else 0 end) filter (where r.created_at > now() - interval '7 days'), 3) acierto_7d
        from lengua_alumno a left join lengua_respuesta r on r.alumno_id = a.id group by a.id order by respuestas desc""")
    out["nivel_por_area"] = sql("""select a.nombre, l.area, l.n, l.rec_n, l.acc, l.score, l.nivel_obj
        from lengua_nivel l join lengua_alumno a on a.id = l.alumno_id order by a.nombre, l.score""")
    out["sin_ver_por_area_y_nivel"] = sql("""select a.nombre, p.area, p.nivel, count(*) sin_ver
        from lengua_alumno a cross join lengua_pregunta p
        where p.activa and not exists (select 1 from lengua_respuesta r where r.alumno_id = a.id and r.pregunta_id = p.id)
        group by 1,2,3 order by 1,4,2,3""")
    out["reportes_pendientes"] = sql("""select r.id, r.quien, r.texto, r.created_at, p.id pregunta_id, p.q, p.txt, p.o, p.a, p.why
        from lengua_reporte r join lengua_pregunta p on p.id = r.pregunta_id where r.estado = 'pendiente' order by r.id""")
    out["mas_falladas"] = sql("""select p.id, p.area, p.nivel, p.q, p.txt, p.o, p.a, p.why, count(*) n,
        round(avg(case when r.correcta then 0 else 1 end), 2) fallo
        from lengua_respuesta r join lengua_pregunta p on p.id = r.pregunta_id
        group by p.id having count(*) >= 2 and avg(case when r.correcta then 0 else 1 end) >= 0.5
        order by fallo desc, n desc limit 40""")
    # Distractor más elegido por pregunta fallada (para mejorar explicaciones).
    out["distractores"] = sql("""select pregunta_id, elegida, count(*) veces from lengua_respuesta
        where not correcta group by 1,2 having count(*) >= 2 order by 3 desc limit 40""")
    out["muy_lentas"] = sql("""select pregunta_id, round(avg(ms)/1000.0,1) seg, count(*) n from lengua_respuesta
        where ms is not null group by 1 having count(*) >= 2 and avg(ms) > 40000 order by 2 desc limit 20""")
    out["revision_experta"] = sql("""select revisor, veredicto, count(*) n,
        count(*) filter (where coincide) coincide from lengua_revision group by 1,2 order by 1,2""")
    out["ultimas_rutinas"] = sql("select tipo, nota, created_at from lengua_rutina_log where tipo = 'noche' order by id desc limit 5")
    out["ids_max"] = sql("""select area, max(substring(id from '\\d+$')::int) ultimo from lengua_pregunta group by 1 order by 1""")
    print(json.dumps(out, ensure_ascii=False, indent=1, default=str))


def main(a):
    if not a or a[0] in ("-h", "--help"):
        print(__doc__); return
    cmd = a[0]
    if cmd == "sql":
        print(json.dumps(sql(a[1]), ensure_ascii=False, indent=1, default=str))
    elif cmd == "aplicar":
        print(json.dumps(sql(open(a[1]).read()), ensure_ascii=False, default=str)[:2000])
    elif cmd == "contexto":
        contexto()
    elif cmd == "validar":
        allq = [p for f in a[1:] for p in json.load(open(f))]
        errs = validar(allq)
        print("\n".join(errs) or f"OK: {len(allq)} preguntas válidas")
        sys.exit(1 if errs else 0)
    elif cmd == "cargar":
        origen = a[a.index("--origen") + 1] if "--origen" in a else "semilla"
        cargar(a[1], origen)
    elif cmd == "retirar":
        sql(f"update lengua_pregunta set activa=false, updated_at=now() where id={lit(a[1])}")
        sql(f"insert into lengua_rutina_log (tipo, nota) values ('noche', {lit('Retirada ' + a[1] + ': ' + (a[2] if len(a) > 2 else ''))})")
        print("retirada", a[1])
    elif cmd == "reporte":
        sql(f"update lengua_reporte set estado={lit(a[2])}, respuesta={lit(a[3] if len(a) > 3 else '')}, atendido_at=now() where id={int(a[1])}")
        print("ok")
    elif cmd == "siguiente_id":
        r = sql(f"select coalesce(max(substring(id from '\\d+$')::int),0)+1 n from lengua_pregunta where area={lit(a[1])}")
        print(f"{a[1]}-{r[0]['n']:03d}")
    elif cmd == "log":
        datos = json.load(open(a[2])) if len(a) > 2 else None
        sql(f"insert into lengua_rutina_log (tipo, nota, datos) values ('noche', {lit(a[1])}, {lit(datos)})")
        print("ok")
    elif cmd == "preparar":
        print(sql("select public.lengua_preparar_todos() n"))
    else:
        sys.exit("orden desconocida: " + cmd)


if __name__ == "__main__":
    main(sys.argv[1:])
