#!/usr/bin/env python3
"""Herramienta de la rutina de Gastos (ver gastos/RUTINA.md).

Habla con Supabase por la Management API ($SUPABASE_ACCESS_TOKEN), que
salta RLS: la rutina ve los archivos de todas las contraseñas.

  db.py pendientes [--bajar DIR]   archivos por procesar (+ cuentas ya conocidas
                                   de ese mismo usuario); con --bajar los descarga
  db.py aplicar RESULTADO.json     guarda cuentas, periodos y movimientos de un archivo
  db.py huecos [--room R]          meses que faltan por cuenta (lo mismo que pinta la app)
  db.py aviso ROOM CUENTA_ID TEXTO nota para el usuario en la app (CUENTA_ID puede ser -)
  db.py limpiar-avisos ROOM        borra las notas anteriores de ese usuario
  db.py log N "resumen"            registra la pasada en gastos_rutinas
  db.py sql "select ..."           consulta libre (JSON)
"""
import calendar
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request

REF = "dzlhsdpgyxnjwudmrnul"
PUBLIC = f"https://{REF}.supabase.co/storage/v1/object/public/gastos/"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def sql(query):
    token = os.environ.get("SUPABASE_ACCESS_TOKEN")
    if not token:
        sys.exit("Falta $SUPABASE_ACCESS_TOKEN")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                 "User-Agent": "gastos-rutina"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b"[]")
    except urllib.error.HTTPError as e:
        sys.exit(f"SQL falló ({e.code}): {e.read().decode()[:1000]}")


def lit(v):
    """Literal SQL seguro para str/num/None/bool/date."""
    if v is None or v == "":
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def norm_num(n):
    return re.sub(r"[^0-9A-Za-z*]", "", str(n)).upper()


# ---------- pendientes ----------
def pendientes(bajar=None):
    rows = sql("""select a.id, a.room, a.nombre, a.path, a.mime, a.tamano, a.nota_usuario, a.created_at,
                  (select coalesce(json_agg(json_build_object('banco', c.banco, 'tipo', c.tipo, 'numero', c.numero,
                     'divisa', c.divisa, 'titular', c.titular, 'alias', c.alias)), '[]')
                   from gastos_cuentas c where c.room = a.room) as cuentas_conocidas
                  from gastos_archivos a where a.estado = 'pendiente' order by a.created_at""")
    for r in rows:
        r["url"] = PUBLIC + urllib.parse.quote(r["path"])
        if bajar:
            os.makedirs(os.path.join(bajar, r["id"]), exist_ok=True)
            dest = os.path.join(bajar, r["id"], os.path.basename(r["path"]))
            urllib.request.urlretrieve(r["url"], dest)
            r["local"] = dest
    print(json.dumps(rows, ensure_ascii=False, indent=1, default=str))


# ---------- aplicar ----------
def aplicar(path):
    res = json.load(open(path))
    aid = res["archivo_id"]
    a = sql(f"select id, room from gastos_archivos where id = {lit(aid)}")
    if not a:
        sys.exit(f"No existe el archivo {aid}")
    room = a[0]["room"]
    estado = res.get("estado", "procesado")
    # Reprocesar = empezar de cero con este archivo.
    sql(f"delete from gastos_periodos where archivo_id = {lit(aid)}; delete from gastos_movimientos where archivo_id = {lit(aid)};")
    total = 0
    for c in res.get("cuentas", []) if estado == "procesado" else []:
        num = norm_num(c["numero"])
        divisa = (c.get("divisa") or "EUR").upper()
        cid = sql(f"""insert into gastos_cuentas (room, banco, tipo, numero, numero_norm, divisa, titular)
            values ({lit(room)}, {lit(c['banco'])}, {lit(c.get('tipo', 'cuenta'))}, {lit(c['numero'])}, {lit(num)},
                    {lit(divisa)}, {lit(c.get('titular'))})
            on conflict (room, banco, numero_norm, divisa) do update set
              titular = coalesce(gastos_cuentas.titular, excluded.titular)
            returning id""")[0]["id"]
        movs = c.get("movimientos", [])
        sql(f"""insert into gastos_periodos (room, archivo_id, cuenta_id, desde, hasta, saldo_inicial, saldo_final, num_movimientos)
            values ({lit(room)}, {lit(aid)}, {lit(cid)}, {lit(c['desde'])}, {lit(c['hasta'])},
                    {lit(c.get('saldo_inicial'))}, {lit(c.get('saldo_final'))}, {len(movs)})""")
        for i in range(0, len(movs), 500):
            vals = ",".join(
                f"({lit(room)},{lit(aid)},{lit(cid)},{lit(m['fecha'])},{lit(m.get('fecha_valor'))},"
                f"{lit(m.get('concepto'))},{lit(float(m['importe']))},{lit((m.get('divisa') or divisa).upper())},"
                f"{lit(None if m.get('saldo') is None else float(m['saldo']))})"
                for m in movs[i:i + 500])
            sql("insert into gastos_movimientos (room, archivo_id, cuenta_id, fecha, fecha_valor, concepto, importe, divisa, saldo) values " + vals)
        total += len(movs)
    sql(f"""update gastos_archivos set estado = {lit(estado)}, tipo_doc = {lit(res.get('tipo_doc'))},
        resumen = {lit(res.get('resumen'))}, procesado_en = now() where id = {lit(aid)};
        delete from gastos_cuentas c where c.room = {lit(room)}
          and not exists (select 1 from gastos_periodos p where p.cuenta_id = c.id);""")
    print(f"{aid}: {estado}, {len(res.get('cuentas', []))} cuenta(s), {total} movimientos")


# ---------- huecos (misma lógica que coverage() en index.html) ----------
def ym(d):
    return d.year * 12 + d.month - 1


def ym_str(k):
    return f"{k // 12:04d}-{k % 12 + 1:02d}"


def ym_nombre(k):
    return f"{MESES[k % 12]} {k // 12}"


def eur(v, divisa):
    if v is None:
        return "?"
    s = f"{float(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{s} {divisa}"


def huecos(room=None):
    where = f"where c.room = {lit(room)}" if room else ""
    cuentas = sql(f"""select c.*, coalesce((select json_agg(json_build_object('desde', p.desde, 'hasta', p.hasta,
            'si', p.saldo_inicial, 'sf', p.saldo_final) order by p.desde) from gastos_periodos p where p.cuenta_id = c.id), '[]') as periodos
            from gastos_cuentas c {where} order by c.room, c.banco""")
    hoy = dt.date.today()
    out = []
    for c in cuentas:
        per = [(dt.date.fromisoformat(p["desde"]), dt.date.fromisoformat(p["hasta"]), p["si"], p["sf"]) for p in c["periodos"]]
        if not per:
            continue
        ini = dt.date.fromisoformat(c["esperado_desde"]) if c["esperado_desde"] else min(p[0] for p in per)
        fin = dt.date.fromisoformat(c["cerrada_en"]) if c["cerrada_en"] else hoy
        ignor = set(c["meses_ignorados"] or [])
        faltan, parciales = [], []
        last = ym(fin) if c["cerrada_en"] else ym(hoy) - 1  # el mes en curso no cuenta
        for k in range(ym(ini), last + 1):
            y, m = k // 12, k % 12 + 1
            d0, d1 = dt.date(y, m, 1), dt.date(y, m, calendar.monthrange(y, m)[1])
            days = set()
            for a, b, _, _ in per:
                lo, hi = max(a, d0), min(b, d1)
                for i in range((hi - lo).days + 1):
                    days.add(lo + dt.timedelta(i))
            frac = len(days) / ((d1 - d0).days + 1)
            if ym_str(k) in ignor:
                continue
            if frac == 0:
                faltan.append(k)
            elif frac < 0.9:
                parciales.append(k)
        # Agrupar meses seguidos y dar la pista del saldo.
        grupos = []
        for k in faltan:
            if grupos and grupos[-1][-1] == k - 1:
                grupos[-1].append(k)
            else:
                grupos.append([k])
        for g in grupos:
            d0 = dt.date(g[0] // 12, g[0] % 12 + 1, 1)
            antes = [p for p in per if p[1] < d0]
            despues = [p for p in per if p[0] > d0]
            pista = ""
            if antes and despues and antes[-1][3] is not None and despues[0][2] is not None:
                sf, si = float(antes[-1][3]), float(despues[0][2])
                pista = f" — el saldo pasa de {eur(sf, c['divisa'])} a {eur(si, c['divisa'])} ({eur(si - sf, c['divisa'])} sin extracto que lo explique)"
            nombre = ym_nombre(g[0]) if len(g) == 1 else f"de {ym_nombre(g[0])} a {ym_nombre(g[-1])} ({len(g)} meses)"
            out.append({"room": c["room"], "cuenta_id": c["id"], "cuenta": f"{c['banco']} {c['tipo']} {c['numero']}",
                        "meses": [ym_str(k) for k in g], "texto": f"Falta {nombre}{pista}"})
        for k in parciales:
            out.append({"room": c["room"], "cuenta_id": c["id"], "cuenta": f"{c['banco']} {c['tipo']} {c['numero']}",
                        "meses": [ym_str(k)], "texto": f"{ym_nombre(k).capitalize()} solo está cubierto en parte"})
        # Saldos que no encajan entre extractos seguidos.
        for p, q in zip(per, per[1:]):
            if p[3] is not None and q[2] is not None and abs(float(p[3]) - float(q[2])) > 0.01 and (q[0] - p[1]).days <= 1:
                out.append({"room": c["room"], "cuenta_id": c["id"], "cuenta": f"{c['banco']} {c['tipo']} {c['numero']}",
                            "meses": [ym_str(ym(q[0]))],
                            "texto": f"El saldo final del {p[1]:%d/%m/%Y} ({eur(p[3], c['divisa'])}) no coincide con el inicial del {q[0]:%d/%m/%Y} ({eur(q[2], c['divisa'])})"})
    print(json.dumps(out, ensure_ascii=False, indent=1))


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd = argv[1]
    if cmd == "pendientes":
        pendientes(argv[argv.index("--bajar") + 1] if "--bajar" in argv else None)
    elif cmd == "aplicar":
        for p in argv[2:]:
            aplicar(p)
    elif cmd == "huecos":
        huecos(argv[argv.index("--room") + 1] if "--room" in argv else None)
    elif cmd == "aviso":
        room, cid, texto = argv[2], argv[3], argv[4]
        sql(f"insert into gastos_avisos (room, cuenta_id, texto) values ({lit(room)}, {lit(None if cid == '-' else cid)}, {lit(texto)})")
        print("ok")
    elif cmd == "limpiar-avisos":
        sql(f"delete from gastos_avisos where room = {lit(argv[2])}")
        print("ok")
    elif cmd == "log":
        sql(f"insert into gastos_rutinas (procesados, resumen) values ({int(argv[2])}, {lit(argv[3])})")
        print("ok")
    elif cmd == "sql":
        print(json.dumps(sql(argv[2]), ensure_ascii=False, indent=1, default=str))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
