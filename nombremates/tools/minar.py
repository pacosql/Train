"""Minería de nombres: de una lista de fichas candidatas a nombres cargados.

Entrada: un JSON con fichas como las de tools/fichas.json
  [{"nombre","tipo","por_que","medidas":{medida:[nota, porqué]}}, …]
Pasos:
  1. Calcula el total previsto (tools/medidas.py) y descarta los que no
     llegan a --umbral y los ya probados (ideas o .com ocupado).
  2. Comprueba el .com por RDAP en paralelo y apunta los ocupados en
     nombremates_comprobados.
  3. Pasa los libres por cribar.py (marcas, apps y canales parecidos) en
     una tanda nueva.
  4. A los que quedan cargados les añade su ficha (fichas.json + fichas.py)
     y la cola se ordena por nota.
Salida: resumen con cuántos nuevos ≥ 80 se han cargado.
Uso: python3 nombremates/tools/minar.py candidatos.json [--umbral 78]
"""
import argparse, json, os, re, subprocess, sys, unicodedata, urllib.request, urllib.error
import concurrent.futures as cf
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from medidas import MEDIDAS, total

def slug(s): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())
def sql(q):
    r = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
        data=json.dumps({"query": q}).encode(), method="POST",
        headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=120))
def com_libre(s):
    try:
        urllib.request.urlopen(urllib.request.Request(f"https://rdap.verisign.com/com/v1/domain/{s}.com", headers={"Accept": "application/rdap+json"}), timeout=20)
        return s, False
    except urllib.error.HTTPError as e:
        return s, e.code == 404
    except Exception:
        return s, None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("candidatos"); ap.add_argument("--umbral", type=int, default=78)
    a = ap.parse_args()
    cands = json.load(open(a.candidatos, encoding="utf-8"))
    for c in cands: c["_total"] = total({k: c["medidas"][k][0] for k in MEDIDAS})
    probados = {r["n"] for r in sql("select lower(regexp_replace(nombre,'[^a-zA-Z0-9]','','g')) n from public.nombremates_ideas union select nombre from public.nombremates_comprobados where com_libre = false")}
    vistos, sel = set(), []
    for c in sorted(cands, key=lambda c: -c["_total"]):
        s = slug(c["nombre"])
        if c["_total"] < a.umbral or s in probados or s in vistos: continue
        vistos.add(s); sel.append(c)
    print(f"candidatos: {len(cands)} · ≥ {a.umbral} y sin probar: {len(sel)}")
    with cf.ThreadPoolExecutor(8) as ex: res = dict(ex.map(com_libre, [slug(c["nombre"]) for c in sel]))
    ocupados = [s for s, ok in res.items() if ok is False]
    if ocupados:
        vals = ",".join(f"('{s}', false)" for s in ocupados)
        sql(f"insert into public.nombremates_comprobados (nombre, com_libre) values {vals} on conflict (nombre) do update set com_libre = false")
    libres = [c for c in sel if res.get(slug(c["nombre"]))]
    print(f".com libre: {len(libres)} · ocupado: {len(ocupados)}")
    if not libres: print("RESULTADO: 0 nuevos ≥ 80"); return
    tanda = (sql("select coalesce(max(tanda),0) m from public.nombremates_ideas")[0]["m"] or 0) + 1
    fich = os.path.join(AQUI, "out", f"minar_{tanda}.txt")
    os.makedirs(os.path.dirname(fich), exist_ok=True)
    with open(fich, "w", encoding="utf-8") as f:
        for tipo in sorted({c["tipo"] for c in libres}):
            f.write(f"# familia: {tipo}\n")
            for c in libres:
                if c["tipo"] == tipo: f.write(f"{c['nombre']}|{c['por_que']}\n")
    subprocess.run([sys.executable, os.path.join(AQUI, "cribar.py"), fich, "--tanda", str(tanda), "--max", "500", "--modelo", "claude-opus-5-5"], check=True)
    filas = sql(f"select nombre, status, veto_motivo from public.nombremates_ideas where tanda = {tanda}")
    cargados = {slug(r["nombre"]) for r in filas if r["status"] == "pendiente"}
    for r in filas:
        if r["status"] == "vetado": print(f"  vetado {r['nombre']}: {(r['veto_motivo'] or '')[:110]}")
    fj = os.path.join(AQUI, "fichas.json")
    fichas = json.load(open(fj, encoding="utf-8"))
    ya = {slug(f["nombre"]) for f in fichas}
    nuevos = [c for c in libres if slug(c["nombre"]) in cargados and slug(c["nombre"]) not in ya]
    fichas += [{k: v for k, v in c.items() if not k.startswith("_")} for c in nuevos]
    json.dump(fichas, open(fj, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    subprocess.run([sys.executable, os.path.join(AQUI, "fichas.py")], check=True, stdout=subprocess.DEVNULL)
    buenos = sorted((c for c in nuevos if c["_total"] >= 80), key=lambda c: -c["_total"])
    print(f"RESULTADO: tanda {tanda} · cargados {len(nuevos)} · nuevos ≥ 80: {len(buenos)} → " + ", ".join(f"{c['nombre']} {c['_total']}" for c in buenos))

if __name__ == "__main__":
    main()
