"""Turno de la minería: evita que dos sesiones minen a la vez.

La rutina se dispara cada hora; la que encuentra el turno libre lo toma y
trabaja, las demás salen sin hacer nada. Así siempre hay alguien minando
sin pisarse.
Cuándo se mina (Paco, 12/10): la cola tiene como mucho COLA_MAX (150).
  · A la 1 de la madrugada (hora de Madrid) se rellena hasta COLA_MAX.
  · El resto de horas solo si quedan menos de COLA_POCOS (30, tres lotes).
Uso: python3 nombremates/tools/turno.py tomar [quien]   → exit 0 si lo toma (dice cuántos cargar),
                                                          3 si está ocupado, 4 si no hace falta minar
     python3 nombremates/tools/turno.py hueco            → cuántos caben ahora en la cola
     python3 nombremates/tools/turno.py renovar          → alarga el turno 60 min
     python3 nombremates/tools/turno.py soltar [nota]    → lo deja libre
"""
import datetime, json, os, sys, urllib.request, zoneinfo

def sql(q):
    r = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
        data=json.dumps({"query": q}).encode(), method="POST",
        headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=60))
def lit(s): return "'" + (s or "").replace("'", "''") + "'"

COLA_MAX, COLA_POCOS, HORA_RELLENO = 150, 30, 1
def pendientes(): return int(sql("select count(*) n from public.nombremates_ideas where status = 'pendiente'")[0]["n"])
accion = sys.argv[1] if len(sys.argv) > 1 else ""
extra = sys.argv[2] if len(sys.argv) > 2 else ""
if accion == "hueco":
    print(max(0, COLA_MAX - pendientes())); sys.exit(0)
if accion == "tomar":
    pend = pendientes()
    hora = datetime.datetime.now(zoneinfo.ZoneInfo("Europe/Madrid")).hour
    if pend >= COLA_MAX or (hora != HORA_RELLENO and pend >= COLA_POCOS):
        print(f"NO HACE FALTA MINAR: {pend} por decidir (son las {hora} h en Madrid; se rellena a la 1 h, "
              f"o a cualquier hora si quedan menos de {COLA_POCOS}) → termina"); sys.exit(4)
    print(f"cola: {pend} por decidir → a minar; caben {COLA_MAX - pend} (máximo {COLA_MAX})")
    r = sql("update public.nombremates_turno set ocupado_hasta = now() + interval '60 minutes', quien = " + lit(extra)
            + ", updated_at = now() where id = 'mineria' and ocupado_hasta < now() returning ocupado_hasta")
    if r: print("TURNO TOMADO hasta", r[0]["ocupado_hasta"]); sys.exit(0)
    r = sql("select ocupado_hasta, quien from public.nombremates_turno where id = 'mineria'")
    print("OCUPADO por", r[0]["quien"], "hasta", r[0]["ocupado_hasta"], "→ no hagas nada y termina"); sys.exit(3)
elif accion == "renovar":
    sql("update public.nombremates_turno set ocupado_hasta = now() + interval '60 minutes', updated_at = now() where id = 'mineria'")
    print("turno renovado 60 min")
elif accion == "soltar":
    sql("update public.nombremates_turno set ocupado_hasta = now(), nota = " + lit(extra) + ", updated_at = now() where id = 'mineria'")
    print("turno libre")
else:
    print(__doc__); sys.exit(2)
