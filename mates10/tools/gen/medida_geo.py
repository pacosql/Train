"""Medida (conversiones, tiempo, dinero, ángulos) y geometría calculable (perímetros, áreas,
volúmenes, Pitágoras, ángulos de polígonos).

Claves de error:
  conversión: sentido_contrario, un_paso_de_menos, un_paso_de_mas, factor_lineal_en_superficie
  tiempo: hora_decimal, no_pasa_la_hora, cien_minutos
  dinero: resta_mal_centimos, suma_en_vez
  geometría: area_por_perimetro, perimetro_por_area, olvida_mitad, usa_diametro, suma_sin_raiz, suma_catetos,
             angulos_360, formula_longitud
"""
import math
from .nucleo import Ejercicio, generador, fmt, genericos_num, NOMBRES
from .fracdec import fd

ESCALAS = {
    "longitud": ["km", "hm", "dam", "m", "dm", "cm", "mm"],
    "masa": ["kg", "hg", "dag", "g", "dg", "cg", "mg"],
    "capacidad": ["kl", "hl", "dal", "l", "dl", "cl", "ml"],
    "superficie": ["km²", "hm²", "dam²", "m²", "dm²", "cm²", "mm²"],
    "volumen": ["km³", "hm³", "dam³", "m³", "dm³", "cm³", "mm³"],
}
FACTOR = {"longitud": 10, "masa": 10, "capacidad": 10, "superficie": 100, "volumen": 1000}


def variantes(resp, ks=(1, 2, -1, 10, -2)):
    """Variantes numéricas de una respuesta con unidad ("12 cm²", "70°", "3,5 kg")."""
    import re
    m = re.match(r"^([\d\u202f]+(?:,\d+)?)(.*)$", resp)
    if not m:
        return []
    v = float(m.group(1).replace("\u202f", "").replace(",", "."))
    return [fd(round(v + k, 4)) + m.group(2) for k in ks if v + k > 0]


@generador("convertir")
def gen_convertir(rng, d, magnitud="longitud", unidades=None, decimales=False, pasos_max=3):
    esc = ESCALAS[magnitud]
    uds = [u for u in esc if not unidades or u in unidades]
    for _ in range(100):
        u1, u2 = rng.sample(uds, 2)
        k = esc.index(u2) - esc.index(u1)
        if 0 < abs(k) <= pasos_max:
            break
    f = FACTOR[magnitud] ** abs(k)
    if k > 0:  # a unidad menor: multiplicar
        v = rng.randint(2, 99) if not decimales else round(rng.randint(11, 999) / 10, 1)
        r = v * f
    else:
        r = rng.randint(2, 99) if not decimales else round(rng.randint(11, 999) / 10, 1)
        v = r * f
    fl = FACTOR[magnitud]
    v, r = round(v, 6), round(r, 6)
    ej = Ejercicio(enunciado=f"¿Cuántos {u2} son {fd(v)} {u1}?", respuesta=f"{fd(r)} {u2}", parametros={"op": "convertir", "v": v, "de": u1, "a": u2, "mag": magnitud})
    otra = v / f if k > 0 else v * f
    dist = [(f"{fd(otra)} {u2}", "sentido_contrario"), (f"{fd(r / fl if k > 0 else r * fl)} {u2}", "un_paso_de_menos"),
            (f"{fd(r * fl if k > 0 else r / fl)} {u2}", "un_paso_de_mas")]
    if fl > 10:
        dist.insert(0, (f"{fd(v * 10 ** abs(k) if k > 0 else v / 10 ** abs(k))} {u2}", "factor_lineal_en_superficie"))
    ej.distractores = dist
    ej.genericos = [f"{fd(r * 2)} {u2}", f"{fd(r + 1)} {u2}"]
    sentido = "multiplico" if k > 0 else "divido"
    ej.pasos = [{"paso": 1, "operacion": f"{u1} → {u2}", "resultado": f"{abs(k)} escalones", "texto": f"De {u1} a {u2} hay {abs(k)} escalón{'es' if abs(k) > 1 else ''} hacia {'abajo' if k > 0 else 'arriba'}; cada escalón vale {fl}."},
                {"paso": 2, "operacion": f"{fd(v)} {'×' if k > 0 else ':'} {fmt(f)}", "resultado": fd(r), "texto": f"Como paso a una unidad {'más pequeña' if k > 0 else 'más grande'}, {sentido} por {fmt(f)}: {fd(r)} {u2}."}]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = ("A una unidad más pequeña salen más (multiplicar); a una más grande, menos (dividir). "
                             + ("En superficie cada escalón vale 100 y en volumen 1000, no 10." if fl > 10 else "Contar los escalones en la escalera de unidades ayuda."))
    return ej


@generador("tiempo")
def gen_tiempo(rng, d, tipo="sumar_minutos"):
    if tipo == "sumar_minutos":
        h, m = rng.randint(1, 11), rng.choice(range(0, 60, 5 if d < 3 else 1))
        add = rng.choice([15, 20, 25, 30, 40, 45, 50] if d < 3 else range(5, 125, 5))
        tot = h * 60 + m + add
        hh, mm = (tot // 60 - 1) % 12 + 1, tot % 60
        resp = f"{hh}:{mm:02d}"
        ej = Ejercicio(enunciado=f"Son las {h}:{m:02d}. ¿Qué hora será dentro de {add} minutos?", respuesta=resp, parametros={"op": "tiempo_sumar", "h": h, "m": m, "add": add})
        mal = m + add
        ej.distractores = [(f"{h}:{mal:02d}" if mal >= 60 and mal < 100 else f"{h + 1}:{(m + add + 40) % 100:02d}", "hora_decimal"),
                           (f"{h}:{mm:02d}", "no_pasa_la_hora"), (f"{hh}:{(mm + 40) % 60:02d}", "cien_minutos")]
        ej.genericos = [f"{hh}:{(mm + 5) % 60:02d}", f"{(hh % 12) + 1}:{mm:02d}", f"{hh}:{(mm + 55) % 60:02d}"]
        ej.pasos = [{"paso": 1, "operacion": f"{m} + {add}", "resultado": str(m + add), "texto": f"Sumo los minutos: {m} + {add} = {m + add}."},
                    {"paso": 2, "operacion": "60 minutos = 1 hora", "resultado": resp, "texto": (f"Como pasa de 60, cuento 1 hora más y me quedan {(m + add) % 60} minutos: {resp}." if m + add >= 60 else f"No llega a 60: son las {resp}.")}]
        ej.explicacion_adulto = "Una hora tiene 60 minutos, no 100: el error típico es sumar como si fueran decimales (3:50 + 20 min = 3:70)."
    elif tipo == "convertir":
        h = rng.randint(1, 5)
        q = rng.choice([0, 15, 30, 45])
        tot = h * 60 + q
        extra = {0: "", 15: " y cuarto", 30: " y media", 45: " y tres cuartos"}[q]
        ej = Ejercicio(enunciado=f"¿Cuántos minutos son {h} hora{'s' if h > 1 else ''}{extra}?", respuesta=f"{tot} minutos", parametros={"op": "tiempo_conv", "h": h, "q": q})
        ej.distractores = [(f"{h * 100 + q} minutos", "cien_minutos"), (f"{h * 60 + (25 if q == 15 else 50 if q == 30 else 75 if q == 45 else 10)} minutos", "hora_decimal"), (f"{h + q} minutos", "no_pasa_la_hora")]
        ej.genericos = [f"{tot + 15} minutos", f"{max(tot - 15, 5)} minutos"]
        ej.pasos = [{"paso": 1, "operacion": f"{h} × 60 + {q}", "resultado": str(tot), "texto": f"Cada hora son 60 minutos: {h} × 60 = {h * 60}" + (f", más {q} = {tot} minutos." if q else " minutos.")}]
        ej.explicacion_adulto = "Un cuarto de hora son 15 minutos y media hora, 30."
    else:
        return None
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej


@generador("dinero")
def gen_dinero(rng, d, tipo="vuelta", centimos=True):
    precio = rng.randint(1, 18) + (rng.choice([0, 0.5, 0.25, 0.75, 0.2, 0.9, 0.35]) if centimos else 0)
    if tipo == "vuelta":
        billete = next(b for b in (5, 10, 20, 50) if b > precio)
        r = round(billete - precio, 2)
        euros = lambda x: (fd(x) if x != int(x) else fmt(int(x))) + " €" if x == int(x) else f"{x:.2f}".replace(".", ",") + " €"
        ej = Ejercicio(enunciado=f"{rng.choice(NOMBRES)} paga con un billete de {billete} € algo que cuesta {euros(precio)}. ¿Cuánto le devuelven?", respuesta=euros(r),
                       parametros={"op": "vuelta", "billete": billete, "precio": precio})
        ej.distractores = [(euros(round(billete + precio, 2)), "suma_en_vez"), (euros(round(r + 1, 2)) if precio != int(precio) else euros(round(r - 1, 2)), "resta_mal_centimos"),
                           (euros(round(billete - int(precio), 2)), "ignora_centimos") if precio != int(precio) else (euros(r + 10), None)]
        ej.genericos = [euros(round(r + 0.5, 2)), euros(round(abs(r - 0.5), 2) or 0.1)]
        ej.pasos = [{"paso": 1, "operacion": f"{billete} − {euros(precio)}", "resultado": euros(r), "texto": f"La vuelta es lo que pagas menos lo que cuesta: {billete} € − {euros(precio)} = {euros(r)}. Compruébalo sumando: {euros(precio)} + {euros(r)} = {billete} €."}]
        ej.explicacion_adulto = "Contar hacia arriba desde el precio hasta el billete (como hacen en las tiendas) es la estrategia más segura."
    else:
        return None
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej


@generador("geometria_calc")
def gen_geo(rng, d, tipo="perimetro_rect", decimales=False):
    n = lambda lo=2, hi=20: rng.randint(lo, hi if d > 1 else min(hi, 12))
    if tipo == "perimetro_rect":
        a, b = n(), n()
        while a == b:
            b = n()
        r = 2 * (a + b)
        ej = Ejercicio(enunciado=f"Un rectángulo mide {a} cm de largo y {b} cm de ancho. ¿Cuál es su perímetro?", respuesta=f"{r} cm",
                       parametros={"op": "perim_rect", "a": a, "b": b})
        ej.distractores = [(f"{a * b} cm", "area_por_perimetro"), (f"{a + b} cm", "suma_dos_lados"), (f"{2 * a + b} cm", "olvida_un_lado")]
        ej.pasos = [{"paso": 1, "operacion": f"{a} + {b} + {a} + {b}", "resultado": str(r), "texto": f"El perímetro es lo que mide el borde: sumo los cuatro lados, {a} + {b} + {a} + {b} = {r} cm."}]
        ej.explicacion_adulto = "Perímetro = el borde (se mide en cm); área = lo de dentro (cm²). Confundirlos es el error más común."
    elif tipo == "perimetro_poligono":
        lados = rng.choice([(3, "triángulo equilátero"), (4, "cuadrado"), (5, "pentágono regular"), (6, "hexágono regular"), (8, "octógono regular")])
        a = n()
        r = lados[0] * a
        ej = Ejercicio(enunciado=f"Un {lados[1]} tiene lados de {a} cm. ¿Cuál es su perímetro?", respuesta=f"{r} cm", parametros={"op": "perim_pol", "n": lados[0], "a": a})
        ej.distractores = [(f"{(lados[0] - 1) * a} cm", "un_lado_de_menos"), (f"{a * a} cm", "area_por_perimetro"), (f"{(lados[0] + 1) * a} cm", "un_lado_de_mas")]
        ej.pasos = [{"paso": 1, "operacion": f"{lados[0]} × {a}", "resultado": str(r), "texto": f"Tiene {lados[0]} lados iguales de {a} cm: {lados[0]} × {a} = {r} cm."}]
        ej.explicacion_adulto = "En un polígono regular basta multiplicar el número de lados por lo que mide uno."
    elif tipo == "area_rect":
        a, b = n(), n()
        r = a * b
        ej = Ejercicio(enunciado=f"¿Cuál es el área de un rectángulo de {a} m de largo y {b} m de ancho?", respuesta=f"{r} m²", parametros={"op": "area_rect", "a": a, "b": b})
        ej.distractores = [(f"{2 * (a + b)} m²", "perimetro_por_area"), (f"{a + b} m²", "suma_en_vez"), (f"{r // 2 if r % 2 == 0 else r + a} m²", None)]
        ej.pasos = [{"paso": 1, "operacion": f"{a} × {b}", "resultado": str(r), "texto": f"Área del rectángulo = largo × ancho = {a} × {b} = {r} m²."}]
        ej.explicacion_adulto = "El área cuenta cuadraditos de 1 m × 1 m que caben dentro: filas por columnas."
    elif tipo == "area_triang":
        b, h = n() * 2, n()
        r = b * h // 2
        ej = Ejercicio(enunciado=f"Un triángulo tiene {b} cm de base y {h} cm de altura. ¿Cuál es su área?", respuesta=f"{r} cm²", parametros={"op": "area_tri", "b": b, "h": h})
        ej.distractores = [(f"{b * h} cm²", "olvida_mitad"), (f"{b + h} cm²", "suma_en_vez"), (f"{(b + h) // 2 if (b + h) % 2 == 0 else b * h // 4 if b * h % 4 == 0 else b * h + 1} cm²", None)]
        ej.pasos = [{"paso": 1, "operacion": f"{b} × {h} : 2", "resultado": str(r), "texto": f"Área del triángulo = base × altura : 2 = {b} × {h} : 2 = {r} cm². Es la mitad del rectángulo que lo rodea."}]
        ej.explicacion_adulto = "El triángulo es medio rectángulo: por eso se divide entre 2. Olvidar la mitad es el error típico."
    elif tipo in ("area_circulo", "longitud_circ"):
        rad = n(1, 10)
        usa_d = rng.random() < 0.4
        dato = f"diámetro {2 * rad} cm" if usa_d else f"radio {rad} cm"
        if tipo == "area_circulo":
            r = round(3.14 * rad * rad, 2)
            ej = Ejercicio(enunciado=f"Calcula el área de un círculo de {dato} (usa π = 3,14).", respuesta=f"{fd(r)} cm²", parametros={"op": "area_circ", "r": rad, "da_diametro": usa_d})
            ej.distractores = [(f"{fd(round(2 * 3.14 * rad, 2))} cm²", "formula_longitud"), (f"{fd(round(3.14 * (2 * rad) ** 2, 2))} cm²", "usa_diametro"), (f"{fd(round(3.14 * rad * 2, 2))} cm²", "radio_por_dos")]
            ej.pasos = [{"paso": 1, "operacion": f"π · {rad}²", "resultado": fd(r), "texto": (f"El radio es la mitad del diámetro: {rad} cm. " if usa_d else "") + f"Área = π · r² = 3,14 · {rad} · {rad} = {fd(r)} cm²."}]
        else:
            r = round(2 * 3.14 * rad, 2)
            ej = Ejercicio(enunciado=f"Calcula la longitud de una circunferencia de {dato} (usa π = 3,14).", respuesta=f"{fd(r)} cm", parametros={"op": "long_circ", "r": rad, "da_diametro": usa_d})
            ej.distractores = [(f"{fd(round(3.14 * rad * rad, 2))} cm", "formula_area"), (f"{fd(round(2 * 3.14 * 2 * rad, 2))} cm", "usa_diametro"), (f"{fd(round(3.14 * rad, 2))} cm", "olvida_dos")]
            ej.pasos = [{"paso": 1, "operacion": f"2 · π · {rad}", "resultado": fd(r), "texto": (f"El radio es la mitad del diámetro: {rad} cm. " if usa_d else "") + f"Longitud = 2 · π · r = 2 · 3,14 · {rad} = {fd(r)} cm."}]
        ej.explicacion_adulto = "Longitud = 2πr (el borde); área = πr² (lo de dentro). Si el dato es el diámetro, primero hay que partirlo por la mitad."
    elif tipo == "pitagoras":
        a, b, c = rng.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13), (8, 15, 17), (9, 12, 15), (7, 24, 25), (12, 16, 20), (20, 21, 29)])
        if rng.random() < 0.5:
            ej = Ejercicio(enunciado=f"Los catetos de un triángulo rectángulo miden {a} cm y {b} cm. ¿Cuánto mide la hipotenusa?", respuesta=f"{c} cm", parametros={"op": "pitag_h", "a": a, "b": b})
            ej.distractores = [(f"{a + b} cm", "suma_catetos"), (f"{a * a + b * b} cm", "suma_sin_raiz"), (f"{round(math.sqrt(abs(b * b - a * a)), 2) if int(math.sqrt(abs(b * b - a * a))) ** 2 != abs(b * b - a * a) else int(math.sqrt(abs(b * b - a * a)))} cm".replace(".", ","), "resta_cuadrados")]
            ej.pasos = [{"paso": 1, "operacion": f"{a}² + {b}²", "resultado": str(a * a + b * b), "texto": f"h² = {a}² + {b}² = {a * a} + {b * b} = {a * a + b * b}."},
                        {"paso": 2, "operacion": f"√{a * a + b * b}", "resultado": str(c), "texto": f"h = √{a * a + b * b} = {c} cm."}]
        else:
            ej = Ejercicio(enunciado=f"En un triángulo rectángulo la hipotenusa mide {c} cm y un cateto {a} cm. ¿Cuánto mide el otro cateto?", respuesta=f"{b} cm", parametros={"op": "pitag_c", "c": c, "a": a})
            ej.distractores = [(f"{c - a} cm", "resta_lados"), (f"{c * c - a * a} cm", "suma_sin_raiz"), (fd(round(math.sqrt(c * c + a * a), 2)) + " cm", "suma_en_vez_de_resta")]
            ej.pasos = [{"paso": 1, "operacion": f"{c}² − {a}²", "resultado": str(c * c - a * a), "texto": f"c² = {c}² − {a}² = {c * c} − {a * a} = {c * c - a * a}."},
                        {"paso": 2, "operacion": f"√{c * c - a * a}", "resultado": str(b), "texto": f"c = √{c * c - a * a} = {b} cm."}]
        ej.explicacion_adulto = "Pitágoras: hipotenusa² = cateto² + cateto². Los errores típicos son olvidar la raíz final o sumar los lados sin elevar."
    elif tipo == "angulo_triang":
        a, b = rng.randint(20, 90), rng.randint(20, 80)
        while a + b >= 170:
            b = rng.randint(20, 60)
        r = 180 - a - b
        ej = Ejercicio(enunciado=f"Dos ángulos de un triángulo miden {a}° y {b}°. ¿Cuánto mide el tercero?", respuesta=f"{r}°", parametros={"op": "ang_tri", "a": a, "b": b})
        ej.distractores = [(f"{360 - a - b}°", "angulos_360"), (f"{a + b}°", "suma_en_vez"), (f"{90 - a + b if 90 - a + b > 0 else abs(a - b)}°", None)]
        ej.pasos = [{"paso": 1, "operacion": f"180 − {a} − {b}", "resultado": str(r), "texto": f"Los tres ángulos de un triángulo suman 180°: 180 − {a} − {b} = {r}°."}]
        ej.explicacion_adulto = "Triángulo: 180°. Cuadrilátero: 360°. Mezclarlos es el error típico."
    elif tipo == "volumen_prisma":
        a, b, c = n(1, 10), n(1, 10), n(1, 10)
        r = a * b * c
        ej = Ejercicio(enunciado=f"Una caja con forma de prisma rectangular mide {a} cm × {b} cm × {c} cm. ¿Cuál es su volumen?", respuesta=f"{r} cm³", parametros={"op": "vol_prisma", "a": a, "b": b, "c": c})
        ej.distractores = [(f"{a + b + c} cm³", "suma_en_vez"), (f"{2 * (a * b + a * c + b * c)} cm³", "area_por_volumen"), (f"{a * b} cm³", "olvida_altura")]
        ej.pasos = [{"paso": 1, "operacion": f"{a} × {b} × {c}", "resultado": str(r), "texto": f"Volumen = largo × ancho × alto = {a} × {b} × {c} = {r} cm³."}]
        ej.explicacion_adulto = "Volumen = cuántos cubitos de 1 cm³ caben. Se multiplican las tres medidas."
    else:
        return None
    ej.genericos = variantes(ej.respuesta)
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej
