# Catálogo de generadores por código (mates10/tools/gen/)

Generado desde el código. Cada generador es `gen(rng, d, **kw)`; `d` es la dificultad 1–3. Las claves de error
que devuelve cada generador se enlazan en la spec con los sufijos de error_tipico de la habilidad (`"errores": {clave: "E01"}`).
Una clave sin enlace deja el distractor sin fila en ejercicio_error (sigue siendo un distractor válido).

Para ver ejemplos: `python3 mates10/tools/generar.py --seco CODIGO` (con la spec ya escrita).

## aritmetica.py

```
Generadores de suma, resta, multiplicación, división y cálculo mental (primaria).

Claves de error (se enlazan con error_tipico.codigo en la spec de cada habilidad):
  suma:  sin_llevada, escribe_todo, cuenta_incluyendo, resta_en_vez, desalinea, mas_uno
  resta: menor_del_mayor, olvida_devolver, suma_en_vez, uno_de_mas, resta_invertida
  mult:  tabla_vecina, suma_en_vez, tabla_mas_a, sin_llevada, olvida_llevada, sin_desplazar, solo_unidades, ceros_mal
  div:   cociente_vecino, olvida_cero, multiplica, resto_mayor, resto_cambiado, divisor_dividendo
```

### `suma`(cifras=(1, 1), llevada=None, max_resultado=None, min_resultado=0, sumandos=None, horizontal=True, contexto=False, completar_diez=False)
- claves de error que produce: cuenta_incluyendo, desalinea, escribe_todo, mas_uno, resta_en_vez, sin_llevada

### `resta`(cifras=(1, 1), prestamo=None, min_resultado=0, max_minuendo=None, ceros=False, contexto=False)
- claves de error que produce: menor_del_mayor, olvida_devolver, suma_en_vez, uno_de_mas

### `tabla`(tablas=(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), factores=(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10), sentido_suma=False)
- claves de error que produce: suma_en_vez, tabla_mas_a, tabla_vecina

### `mult`(cifras=(2, 1), llevada=None, por_potencia10=False)
- claves de error que produce: ceros_mal, olvida_llevada, sin_desplazar, sin_llevada, solo_unidades, suma_en_vez

### `div`(cifras_dividendo=2, cifras_divisor=1, exacta=True, con_resto_en_respuesta=False, cero_en_cociente=False, desde_tabla=False)
- claves de error que produce: cociente_vecino, multiplica, olvida_cero, resto_cambiado, resto_mayor

### `calcmental`(estrategia='dobles')
- valores de tipo/estrategia: casi_dobles, centenas, complemento10, complemento100, decenas, dobles, mas9, menos9, por11, por5
- claves de error que produce: casi_doble, centenas, cifra_suelta, compensacion_invertida, compensacion_olvidada, decena_de_mas, decena_de_menos, decena_mal, llevada_mal, menos9, resta_en_vez, sin_mitad, sin_por10, sin_sumar, suma_en_vez, suma_uno, uno_de_mas, uno_de_menos

## numeracion.py

```
Generadores de numeración: conteo, lectura/escritura, comparar/ordenar, valor posicional,
redondeo, ordinales, pares/impares, romanos.

Claves de error:
  conteo: cuenta_de_mas, cuenta_de_menos, salta_numero
  lectura: cifra_cero_omitida, orden_invertido, clase_confundida, y_de_mas
  comparar: por_cifras_sueltas, por_longitud_ignorada, signo_invertido, decimal_por_longitud
  posicional: valor_de_la_cifra, posicion_contada_mal, cifra_por_valor
  redondeo: trunca, redondea_mal_5, a_otra_unidad
  romanos: suma_resta_mal, repite_cuatro, orden_invertido
```

### `contar`(maximo=10, paso=1, hacia_atras=False, iconos=True)
- claves de error que produce: cuenta_de_mas, cuenta_de_menos, salta_numero

### `leer_numero`(cifras=2, sentido='letras_a_cifras')
- claves de error que produce: —

### `comparar`(cifras=2, decimales=0, enteros_negativos=False, fracciones=False, tipo='mayor')
- valores de tipo/estrategia: mayor
- claves de error que produce: —

### `orden_ordinal`(maximo=10)
- claves de error que produce: cardinal_por_ordinal, vecino

### `paridad`(maximo=20)
- claves de error que produce: mira_otra_cifra

### `valor_posicional`(cifras=2, tipo='valor')
- valores de tipo/estrategia: descomponer, valor
- claves de error que produce: cifra_por_valor, posicion_contada_mal, valor_de_la_cifra

### `redondeo`(a=10, cifras=3, decimales=0)
- claves de error que produce: a_otra_unidad, redondea_mal_5, trunca

### `romanos`(maximo=50, sentido='a_decimal')
- claves de error que produce: orden_invertido, repite_cuatro, suma_resta_mal

## jerarquia.py

```
Jerarquía de operaciones (OPER.JERARQ.*), potencias, raíces y enteros.

Expresión = lista de tokens alternando operando/operador. Operando: int | ("grupo", lista, "()"|"[]") |
("pot", base, exp) | ("raiz", n). Los errores típicos del anexo se implementan como evaluadores
alternativos (claves e01…e05, igual que JERARQ.02.E01…E05):
  e01 izquierda_a_derecha, e02 suma_antes_que_producto, e03 multiplica_antes_de_dividir,
  e04 parentesis_factor_olvidado, e05 distribuye_solo_al_primero, e06 potencia_como_producto
```

### `jerarquia`(nivel=1, signo_mult='×')
- claves de error que produce: e06

### `potencia`(tipo='calcular', base_max=10, exp_max=4, base_negativa=False)
- valores de tipo/estrategia: calcular, propiedades
- claves de error que produce: base_exponente_cambiados, divide_bases, divide_exponentes, eleva_base, eleva_exponente, multiplica_bases, multiplica_exponentes, multiplica_todo, potencia_como_producto, signo_mal, suma_exponentes, un_factor_de_menos

### `raiz`(tipo='exacta', maximo=400)
- valores de tipo/estrategia: exacta
- claves de error que produce: divide_entre_dos, raiz_por_exceso, resto_mal, tabla_vecina

### `enteros`(op='suma', maximo=20)
- valores de op: mult, resta, suma
- claves de error que produce: ignora_signos, multiplica, no_cambia_signo, regla_signos, resta_en_vez, signo_mal, suma_en_vez, suma_valores_absolutos

## fracdec.py

```
Fracciones, decimales, porcentajes, proporcionalidad y divisibilidad.

Claves de error:
  fracción: invierte, pintadas_no_pintadas, solo_numerador, suma_numeradores_y_denominadores,
            suma_denominadores, multiplica_cruzado, invierte_la_primera, no_simplifica, simplifica_solo_uno,
            suma_mismo_numero
  decimal:  coma_mal_colocada, alinea_por_la_derecha, coma_sentido_contrario, cero_omitido, lee_como_entero
  porcentaje: divide_por_porcentaje, porcentaje_como_cantidad, suma_en_vez
  proporción: razonamiento_aditivo, inversa_por_directa, directa_por_inversa
  divisibilidad: confunde_mcm_mcd, producto_en_vez_de_mcm, uno_como_primo, divisor_por_multiplo, olvida_divisor
```

### `fraccion`(tipo='dibujo', den_max=10)
- valores de tipo/estrategia: comparar, de_numero, dibujo, equivalente, simplificar
- claves de error que produce: complemento, cuenta_las_blancas, iguala, invierte, no_simplifica, pintadas_no_pintadas, por_cifras_sueltas, simplifica_solo_uno, solo_denominador, solo_numerador, suma_mismo_numero

### `frac_operar`(op='suma', mismo_den=False, mixtos=False)
- valores de op: mult, resta, suma
- claves de error que produce: invierte_la_primera, multiplica_cruzado, no_invierte, no_simplifica, resta, solo_numerador, suma_denominadores, suma_numeradores_y_denominadores

### `decimal`(tipo='leer', nd=2)
- valores de tipo/estrategia: div, fraccion_a_decimal, leer, mult, por_potencia10, resta, suma
- claves de error que produce: alinea_por_la_derecha, cero_omitido, coma_mal_colocada, coma_sentido_contrario, cuenta_ceros_mal, invierte, lee_como_entero, olvida_la_coma, resta

### `porcentaje`(tipo='de_cantidad')
- valores de tipo/estrategia: aumento, de_cantidad
- claves de error que produce: complemento, divide_por_porcentaje, porcentaje_como_cantidad, sentido_contrario, solo_el_porcentaje, suma_en_vez

### `proporcion`(tipo='directa', contexto=True)
- valores de tipo/estrategia: directa
- claves de error que produce: galletas, km, razonamiento_aditivo

### `divisibilidad`(tipo='multiplo')
- valores de tipo/estrategia: divisores, factorizar, mcm, multiplo, primo
- claves de error que produce: confunde_mcm_mcd, divisor_por_multiplo, el_menor, factor_no_primo, impar_es_primo, mcd, olvida_divisor, olvida_factor, producto_en_vez_de_mcm, sin_exponentes, uno_como_primo

## medida_geo.py

```
Medida (conversiones, tiempo, dinero, ángulos) y geometría calculable (perímetros, áreas,
volúmenes, Pitágoras, ángulos de polígonos).

Claves de error:
  conversión: sentido_contrario, un_paso_de_menos, un_paso_de_mas, factor_lineal_en_superficie
  tiempo: hora_decimal, no_pasa_la_hora, cien_minutos
  dinero: resta_mal_centimos, suma_en_vez
  geometría: area_por_perimetro, perimetro_por_area, olvida_mitad, usa_diametro, suma_sin_raiz, suma_catetos,
             angulos_360, formula_longitud
```

### `convertir`(magnitud='longitud', unidades=None, decimales=False, pasos_max=3)
- claves de error que produce: factor_lineal_en_superficie, sentido_contrario, un_paso_de_mas, un_paso_de_menos

### `tiempo`(tipo='sumar_minutos')
- valores de tipo/estrategia: convertir, sumar_minutos
- claves de error que produce: cien_minutos, hora_decimal, no_pasa_la_hora

### `dinero`(tipo='vuelta', centimos=True)
- valores de tipo/estrategia: vuelta
- claves de error que produce: ignora_centimos, resta_mal_centimos, suma_en_vez

### `geometria_calc`(tipo='perimetro_rect', decimales=False)
- valores de tipo/estrategia: angulo_triang, area_circulo, area_rect, area_triang, perimetro_poligono, perimetro_rect, pitagoras, volumen_prisma
- claves de error que produce: angulos_360, area_por_perimetro, area_por_volumen, cuadrado, formula_area, formula_longitud, longitud_circ, olvida_altura, olvida_dos, olvida_mitad, olvida_un_lado, perimetro_por_area, radio_por_dos, resta_cuadrados, resta_lados, suma_catetos, suma_dos_lados, suma_en_vez, suma_en_vez_de_resta, suma_sin_raiz, un_lado_de_mas, un_lado_de_menos, usa_diametro

## algebra.py

```
Álgebra, funciones, análisis, estadística y probabilidad (calculables).

Claves de error:
  ecuaciones: transpone_sin_cambiar_signo, divide_mal, resta_en_vez_de_dividir, signos_raices, una_sola_solucion
  polinomios: suma_exponentes_al_sumar, cuadrado_sin_doble_producto, signo_mal, olvida_termino
  funciones: pendiente_invertida, pendiente_signo, ordenada_por_pendiente
  derivadas: no_baja_exponente, no_resta_uno, deriva_constante
  integrales: no_divide, olvida_constante, deriva_en_vez
  estadística: mediana_sin_ordenar, media_sin_dividir, moda_por_mayor, rango_mal
  probabilidad: favorables_entre_desfavorables, cuenta_casos_mal, suma_en_vez_de_multiplicar
  combinatoria: permuta_en_vez_de_combinar, suma_en_vez
```

### `ecuacion1`(tipo='ax+b=c')
- valores de tipo/estrategia: ambos_lados
- claves de error que produce: divide_mal, resta_en_vez_de_dividir, signo_mal, transpone_sin_cambiar_signo

### `ecuacion2`(completa=True)
- claves de error que produce: signos_raices, una_sola_solucion

### `sistema`()
- claves de error que produce: intercambia, signo_mal

### `polinomio`(tipo='valor')
- valores de tipo/estrategia: identidad, valor
- claves de error que produce: confunde_identidades, cuadrado_negativo, cuadrado_sin_doble_producto, doble_producto_sin_2, olvida_termino, potencia_como_producto, signo_mal, suma_exponentes_al_sumar

### `funcion_lineal`(tipo='pendiente')
- valores de tipo/estrategia: pendiente
- claves de error que produce: olvida_termino, ordenada_por_pendiente, pendiente_invertida, pendiente_signo, signo_mal

### `derivada`(tipo='polinomio')
- claves de error que produce: deriva_constante, no_baja_exponente, no_resta_uno

### `integral`()
- claves de error que produce: deriva_en_vez, no_divide, olvida_constante

### `estadistica`(tipo='media', n=None)
- valores de tipo/estrategia: media, mediana, moda
- claves de error que produce: divide_mal, frecuencia_por_dato, media_por_mediana, media_sin_dividir, mediana_por_media, mediana_por_moda, mediana_sin_ordenar, moda_por_mayor, rango_mal, suma_en_vez

### `probabilidad`(tipo='laplace')
- valores de tipo/estrategia: cualitativa, dados, laplace
- claves de error que produce: complementario, confunde_posible_seguro, cuenta_casos_mal, favorables_entre_desfavorables, imposible, no_simplifica

### `combinatoria`(tipo=None)
- valores de tipo/estrategia: permutaciones, variaciones
- claves de error que produce: combina_en_vez_de_variar, con_repeticion, multiplica_n_k, permuta_en_vez_de_combinar, potencia_en_vez, suma_en_vez, uno_de_menos
