"""Vuelve a comprobar el .com de lo que Paco ve o ha guardado (⭐, 👍, pendientes).

Si el dominio con el que se presenta un nombre se ha ocupado, pasa a la
siguiente forma libre (tal cual → Proyecto → Estudio); si no queda ninguna,
pasa a `vetado` con el motivo.

    python3 autor/tools/comprobar_com.py          # comprueba y corrige
    python3 autor/tools/comprobar_com.py --ver    # solo enseña
"""
import sys, concurrent.futures as cf
from datetime import datetime, timezone
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from cargar import sb, sb_all, rdap_com, presentar


def main():
    ver = "--ver" in sys.argv
    rows = sb_all("autor_ideas?select=id,nombre,base,dominio,status,tipo&status=in.(favorito,me_gusta,pendiente)&com_libre=eq.true")
    now = datetime.now(timezone.utc).isoformat()
    hoy = datetime.now().strftime("%d/%m")
    with cf.ThreadPoolExecutor(8) as ex:
        res = list(ex.map(lambda r: (r, rdap_com(r["dominio"][:-4])), rows))
    libres = cambiados = vetados = errores = 0
    for r, v in res:
        if v is None: errores += 1; print("SIN RESPUESTA", r["dominio"]); continue
        if v:
            libres += 1
            if not ver: sb(f"autor_ideas?id=eq.{r['id']}", "PATCH", {"dominio_comprobado_at": now}, "return=minimal")
            continue
        forma, nombre, dom, est = presentar(r["base"])
        if forma not in (None, "error"):
            cambiados += 1; print(f"OCUPADO {r['dominio']} → {nombre} ({dom})")
            if not ver: sb(f"autor_ideas?id=eq.{r['id']}", "PATCH", {"nombre": nombre, "forma": forma, "dominio": dom,
                           "dominio_comprobado_at": now, "nota": f"{r['dominio']} se ocupó ({hoy})"}, "return=minimal")
        else:
            vetados += 1; print(f"OCUPADO {r['dominio']} y sin alternativa → vetado")
            if not ver: sb(f"autor_ideas?id=eq.{r['id']}", "PATCH", {"status": "vetado", "com_libre": False, "dominio_comprobado_at": now,
                           "veto_motivo": f"{r['dominio']} se ocupó ({hoy}; estaba en {r['status']}) y no queda forma libre"}, "return=minimal")
    print(f"{len(rows)} comprobados: {libres} libres, {cambiados} cambiados de forma, {vetados} vetados, {errores} sin respuesta")


if __name__ == "__main__":
    main()
