"""Prueba de humo del tutor: crea un alumno, hace la prueba de nivel y una sesión, e imprime la traza."""
import json, random, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from db import q, lit
curso = sys.argv[1] if len(sys.argv) > 1 else "PRI2"
acierto = float(sys.argv[2]) if len(sys.argv) > 2 else 0.7
a = q(f"select mates10_crear_alumno('E2E-{curso}','ES-MC',{lit(curso)}) id")[0]['id']
def responde(r):
    x = q(f"select respuesta->>0 c from mates10_ejercicio where id={lit(r['ejercicio_id'])}")[0]['c']
    return x if random.random() < acierto else random.choice([o for o in r['opciones'] if o != x] or [x])
s = q(f"select mates10_iniciar_sesion({lit(a)},'prueba_nivel') id")[0]['id']
for i in range(30):
    r = q(f"select mates10_prueba_siguiente({lit(a)},{lit(s)}) r")[0]['r']
    if r.get('fin'): print('PRUEBA FIN', r); break
    resp = responde(r)
    x = q(f"select mates10_registrar_intento({lit(a)},{lit(s)},{lit(r['ejercicio_id'])},{lit(resp)},3000,{lit(r['regla'])},null) x")[0]['x']
    print('  prueba', r['habilidad']['codigo'], '|', r['enunciado'].replace('\n', ' / ')[:60], '|', resp, x['correcto'])
s = q(f"select mates10_iniciar_sesion({lit(a)}) id")[0]['id']
for i in range(25):
    r = q(f"select mates10_siguiente({lit(a)},{lit(s)}) r")[0]['r']
    if r.get('fin'): print('FIN', r); break
    resp = responde(r)
    x = q(f"select mates10_registrar_intento({lit(a)},{lit(s)},{lit(r['ejercicio_id'])},{lit(resp)},3000,{lit(r['regla'])},{lit(r['tecnica'])},0,null,{lit(r.get('reintento_de'))}) x")[0]['x']
    print(f"  {i:2} {r['regla']:14} {str(r['tecnica']):18} {r['habilidad']['codigo']:16} d{r['dificultad']} | {r['enunciado'].replace(chr(10), ' / ')[:45]:45} | {resp} {'✓' if x['correcto'] else '✗'} {(x.get('error') or {}).get('codigo') or ''} p={float(x['p_dominio']):.2f}")
inf = q(f"select mates10_informe({lit(a)}) i")[0]['i']
print(json.dumps({k: inf[k] for k in ('alumno', 'bloques', 'frase_semana', 'actividad')}, ensure_ascii=False)[:1200])
if '--borrar' in sys.argv: q(f"delete from mates10_alumno where id={lit(a)}")
