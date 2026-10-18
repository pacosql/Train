"""Lo que la rutina necesita saber antes de generar otra tanda de Nombre Autor.

    python3 autor/tools/contexto.py [--atender]

Enseña: pendientes, decisiones por estado, qué gusta por tipo / obra / nivel
de ortografía, los comentarios sin atender (con --atender se marcan como
atendidos al final), los pedidos del buscador y todas las bases ya probadas
para no repetirlas (también las de autor_comprobados que no entraron).
"""
import sys, collections, re
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from cargar import sb, sb_all, slug

rows = sb_all("autor_ideas?select=id,nombre,base,tipo,de_quien,orto_nivel,status,nota,tanda,decidido_at&order=id.asc")
est = collections.Counter(r["status"] for r in rows)
pend = est["pendiente"]
print(f"Pendientes: {pend}  ·  {dict(est)}")
print(f"Tanda máxima: {max((r['tanda'] or 0) for r in rows) if rows else 0}")
print("¿Hace falta tanda? " + ("SÍ (< 200 pendientes)" if pend < 200 else "no (≥ 200 pendientes)"))

POS = {"favorito": 3, "me_gusta": 1.5, "me_gusta_descartado": 1, "no_me_gusta": -0.3, "nada": -1.2}
def tabla(clave, titulo):
    c = collections.defaultdict(lambda: [0, 0, 0.0])
    for r in rows:
        if r["status"] not in POS: continue
        k = clave(r); c[k][0] += 1; c[k][1] += r["status"] in ("favorito", "me_gusta", "me_gusta_descartado"); c[k][2] += POS[r["status"]]
    if not c: return
    print(f"\n{titulo} (decididos · gustan · peso):")
    for k, (n, g, p) in sorted(c.items(), key=lambda x: -x[1][2])[:25]:
        print(f"  {p:+6.1f}  {g:3}/{n:<3}  {k}")
tabla(lambda r: r["tipo"], "Por tipo")
tabla(lambda r: f"nivel {r['orto_nivel']}", "Por nivel de ortografía")
tabla(lambda r: re.sub(r"^.*\((.*)\)$", r"\1", r["de_quien"] or "?"), "Por autor / obra")
tabla(lambda r: "Proyecto…" if r["nombre"].startswith("Proyecto ") else "Estudio…" if r["nombre"].startswith("Estudio ") else "tal cual", "Por forma")

for s, t in (("favorito", "⭐"), ("me_gusta", "👍"), ("me_gusta_descartado", "💚"), ("nada", "🙅")):
    l = [r["nombre"] for r in rows if r["status"] == s]
    if l: print(f"\n{t} ({len(l)}): " + ", ".join(l))
notas = [r for r in rows if r["nota"]]
if notas:
    print("\nComentarios por nombre:")
    for r in notas: print(f"  [{r['status']}] {r['nombre']}: {r['nota']}")
ped = [r["nombre"] for r in rows if r["tipo"] == "pedido"]
if ped: print("\n🔍 Pedidos desde el buscador SIN ficha (escríbeles línea en la tanda): " + ", ".join(ped))

sug = sb("autor_sugerencias?atendida=eq.false&order=created_at.asc&select=*")
print(f"\nComentarios generales sin atender ({len(sug)}):")
for s in sug: print(f"  ● {s['created_at'][:16]}  {s['texto']}")

comp = sb_all("autor_comprobados?select=dominio,com_libre")
bases = sorted({r["base"] for r in rows})
print(f"\nBases ya probadas ({len(bases)}), NO repetir: " + ", ".join(bases))
ocup = sorted({c["dominio"][:-4] for c in comp if not c["com_libre"] and not c["dominio"].startswith(("proyecto", "estudio"))})
print(f"\n.com tal cual ocupados ({len(ocup)}): " + ", ".join(ocup))

if "--atender" in sys.argv and sug:
    sb("autor_sugerencias?id=in.(" + ",".join(str(s["id"]) for s in sug) + ")", "PATCH", {"atendida": True}, "return=minimal")
    print(f"\n{len(sug)} comentarios marcados como atendidos.")
