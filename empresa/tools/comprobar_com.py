"""Vuelve a comprobar el .com de todo lo que Paco ve o ha guardado (⭐, 👍, pendientes).

Regla de Paco (14/10): no va a comprar nada sin el .com, así que ningún nombre
con el .com ocupado puede estar en ⭐, 👍 ni en la cola. Los que salgan ocupados
pasan a `vetado` con el motivo y el estado que tenían.

    python3 empresa/tools/comprobar_com.py          # comprueba y veta los ocupados
    python3 empresa/tools/comprobar_com.py --ver    # solo enseña, no toca nada
"""
import sys, concurrent.futures as cf
from datetime import datetime, timezone
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from cribar import sb, sb_all, rdap, slug

def main():
    ver = "--ver" in sys.argv
    rows = sb_all("empresa_ideas?select=id,nombre,status&status=in.(favorito,me_gusta,pendiente)")
    now = datetime.now(timezone.utc).isoformat()
    hoy = datetime.now().strftime("%d/%m")
    def chk(r):
        for _ in range(3):
            v = rdap(slug(r["nombre"]), "com")
            if v is not None: return r, v
        return r, None
    libres = ocupados = errores = 0
    with cf.ThreadPoolExecutor(8) as ex:
        for r, v in ex.map(chk, rows):
            if v is None: errores += 1; print("SIN RESPUESTA", r["nombre"]); continue
            if v: libres += 1
            else: ocupados += 1; print("OCUPADO", r["status"], r["nombre"])
            if ver: continue
            body = {"com_libre": v, "dominio_comprobado_at": now}
            if not v: body.update(status="vetado", veto_motivo=f".com ocupado (comprobado {hoy}; antes estaba en {r['status']})")
            sb(f"empresa_ideas?id=eq.{r['id']}", "PATCH", body, "return=minimal")
    print(f"{len(rows)} comprobados: {libres} libres, {ocupados} ocupados{' (vetados)' if ocupados and not ver else ''}, {errores} sin respuesta")

if __name__ == "__main__":
    main()
