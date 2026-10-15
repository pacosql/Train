"""Comprueba el .com de cada autor / personaje y lo carga en autor_ideas.

Uso, desde la raíz del repo:

    python3 autor/tools/cargar.py autor/tools/tandas/tandaN.txt --tanda N [--solo-probar]

Formato del fichero (ver tandas/tanda1.txt): líneas
`Base|tipo|de quién / obra|época|nivel 0-3|ficha|relación con la ortografía`
bajo cabeceras `# grupo: …`.

Regla de Paco para presentar cada nombre:
 1. Si base.com está libre → se presenta tal cual («Quevedo»).
 2. Si no, «Proyecto Base» si proyectobase.com está libre.
 3. Si no, «Estudio Base» si estudiobase.com está libre.
 4. Si los tres están ocupados no se carga (queda en autor_comprobados).

El orden de la cola pone primero lo que más tiene que ver con la ortografía
(nivel 3) y, dentro de cada nivel, en el orden del fichero.
"""
import argparse, json, re, sys, time, unicodedata, urllib.request, urllib.error
import concurrent.futures as cf
from datetime import datetime, timezone

URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM"
H = {"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": "application/json"}
FORMAS = [("tal_cual", ""), ("proyecto", "Proyecto "), ("estudio", "Estudio ")]


def sb(path, method="GET", body=None, prefer=None):
    h = dict(H)
    if prefer: h["Prefer"] = prefer
    req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(body).encode() if body is not None else None, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            t = r.read()
            return json.loads(t) if t else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Supabase {method} {path} → {e.code}: {e.read().decode('utf8', 'replace')[:500]}")


def sb_all(path):
    out = []
    for off in range(0, 100000, 1000):
        p = sb(f"{path}&limit=1000&offset={off}")
        out += p
        if len(p) < 1000: break
    return out


def slug(n):
    s = unicodedata.normalize("NFD", n.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def rdap_com(s):
    """True = libre (404), False = ocupado (200), None = sin respuesta."""
    for i in range(4):
        try:
            req = urllib.request.Request(f"https://rdap.verisign.com/com/v1/domain/{s}.com", headers={"Accept": "application/rdap+json"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return False if r.status == 200 else None
        except urllib.error.HTTPError as e:
            if e.code == 404: return True
            if e.code == 429: time.sleep(3 * (i + 1)); continue
            return None
        except Exception:
            time.sleep(2 * (i + 1))
    return None


def leer(fichero):
    filas = []
    for l in open(fichero, encoding="utf8"):
        l = l.strip()
        if not l or l.startswith("#"): continue
        p = l.split("|")
        if len(p) != 7: raise SystemExit(f"Línea mal formada ({len(p)} campos): {l}")
        base, tipo, de, epoca, nivel, ficha, orto = [x.strip() for x in p]
        filas.append(dict(base=base, tipo=tipo, de_quien=de, epoca=epoca, orto_nivel=int(nivel), ficha=ficha, ortografia=orto))
    return filas


def presentar(base):
    """Devuelve (forma, nombre, dominio, estados) con la primera forma libre, o forma=None."""
    estados = {}
    for forma, pre in FORMAS:
        nombre = pre + base
        dom = slug(nombre) + ".com"
        v = rdap_com(slug(nombre))
        estados[dom] = v
        if v: return forma, nombre, dom, estados
        if v is None: return "error", nombre, dom, estados
    return None, None, None, estados


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fichero")
    ap.add_argument("--tanda", type=int, required=True)
    ap.add_argument("--solo-probar", action="store_true")
    a = ap.parse_args()

    filas = leer(a.fichero)
    existentes = sb_all("autor_ideas?select=id,base,tipo,status")
    ya = {slug(r["base"]) for r in existentes}
    # Los que Paco añadió desde el buscador (tipo «pedido») se completan con su ficha.
    pedidos = {slug(r["base"]): r for r in existentes if r["tipo"] == "pedido"}
    nuevas, vistas = [], set()
    for f in filas:
        s = slug(f["base"])
        if s in pedidos and s not in vistas: vistas.add(s); nuevas.append({**f, "_pedido": pedidos[s]}); continue
        if s in ya or s in vistas: print("ya estaba:", f["base"]); continue
        vistas.add(s); nuevas.append(f)
    print(f"{len(nuevas)} bases nuevas de {len(filas)}")

    with cf.ThreadPoolExecutor(6) as ex:
        res = list(ex.map(lambda f: (f, presentar(f["base"])), nuevas))

    now = datetime.now(timezone.utc).isoformat()
    comprobados, cargar, sin = [], [], []
    for i, (f, (forma, nombre, dom, estados)) in enumerate(res):
        comprobados += [{"dominio": d, "com_libre": v, "checked_at": now} for d, v in estados.items() if v is not None]
        base_dom = slug(f["base"]) + ".com"
        pedido = f.pop("_pedido", None)
        if forma in (None, "error"):
            sin.append((f["base"], forma or "ocupados", estados))
            if pedido and forma is None and not a.solo_probar:
                sb(f"autor_ideas?id=eq.{pedido['id']}", "PATCH", {**f, "status": "vetado", "com_libre": False,
                   "veto_motivo": "los tres .com (tal cual, Proyecto, Estudio) están ocupados"}, "return=minimal")
            continue
        otros = " · ".join(f"{d} {'libre' if v else 'ocupado'}" for d, v in estados.items() if d != dom)
        fila = {**f, "nombre": nombre, "forma": forma, "dominio": dom, "com_libre": True,
                       "base_com_libre": estados.get(base_dom), "otros_dominios": otros or None,
                       "dominio_comprobado_at": now, "status": "pendiente", "tanda": a.tanda,
                       "orden": -f["orto_nivel"] * 100000 + a.tanda * 1000 + i}
        if pedido:
            fila.update(status=pedido["status"], orden=-1000000)  # lo pidió Paco: sigue el primero
            if not a.solo_probar: sb(f"autor_ideas?id=eq.{pedido['id']}", "PATCH", fila, "return=minimal")
        else:
            cargar.append(fila)
        print(f"{'✓':2} {nombre:28} {dom:32} nivel {f['orto_nivel']}  ({otros})")
    for b, why, est in sin:
        print(f"✗  {b:28} {why}: {est}")

    print(f"\n{len(cargar)} con dominio libre ({sum(c['forma']=='tal_cual' for c in cargar)} tal cual, "
          f"{sum(c['forma']=='proyecto' for c in cargar)} Proyecto, {sum(c['forma']=='estudio' for c in cargar)} Estudio), {len(sin)} sin cargar")
    if a.solo_probar: return
    if comprobados:
        sb("autor_comprobados?on_conflict=dominio", "POST", comprobados, "resolution=merge-duplicates,return=minimal")
    for i in range(0, len(cargar), 100):
        sb("autor_ideas?on_conflict=nombre", "POST", cargar[i:i + 100], "resolution=ignore-duplicates,return=minimal")
    pend = sb("autor_ideas?status=eq.pendiente&select=id")
    print(f"cargados. Pendientes ahora: {len(pend)}")


if __name__ == "__main__":
    main()
