# Math Games 🧠

PWA (sin build, HTML/CSS/JS puro) con **171 ejercicios de matemáticas**,
cada uno numerado (#1-#171) para poder referirse a ellos sin ambigüedad.
Cálculo mental, geometría, álgebra, estadística, fracciones, dinero,
probabilidad, coordenadas, tiempo y más. Nace como banco de pruebas
rápido para sacar ideas de mecánicas (tipo Duolingo Math, Synthesis,
DreamBox o SplashLearn) de cara a otra app de matemáticas más grande.
Cada ejercicio se puede marcar con 👍/👎/🔧 desde su propia pantalla, y
el menú los organiza en cuatro pestañas para llevar el control de qué
mecánicas convencen.

Vive en `football/` y usa el prefijo `football_` en Supabase — nombres
heredados de un prototipo anterior de esta misma carpeta, se han
mantenido tal cual en vez de renombrar. Forma parte del hosting
multi-app de este repo — ver el [README de la raíz](../README.md).

**El número de cada ejercicio es fijo** (definido por su posición en
`js/app.js`, array `GAMES`): los ejercicios nuevos siempre se añaden al
final, nunca se insertan en medio, así que "#17" siempre es el mismo
juego de una sesión a otra.

## Ejercicios #1-#20 (primera tanda) — mecánica propia, sin A/B/C/D

| # | Juego | Tema | Mecánica |
|---|---|---|---|
| 1 | 🎈 Globos de multiplicar | Multiplicación | Pincha el globo con el resultado correcto antes de que se escape (mide velocidad de respuesta) |
| 2 | 🫧 Parejas que suman | Cálculo mental | Toca 2 burbujas cuya suma sea el número objetivo |
| 3 | 📶 Ordena los números | Orden numérico | Toca los chips en el orden correcto; el número de chips sube con la racha |
| 4 | 📍 Recta numérica | Sentido numérico | Arrastra un marcador hasta el punto exacto de la recta |
| 5 | 🕐 Pon en hora el reloj | Tiempo | Arrastra las agujas de un reloj analógico hasta la hora pedida |
| 6 | 🏋️ Equilibra la balanza | Igualdad y pesos | Toca pesas para igualar el peso objetivo; la barra se inclina en vivo, el rango sube con la racha |
| 7 | 🃏 Memoria matemática | Memoria y cálculo | Voltea cartas para encontrar la pareja operación ↔ resultado |
| 8 | 🎯 Atrapa los múltiplos | Múltiplos y reglas | Flujo continuo de números — toca solo los que cumplen la regla vigente |
| 9 | 🧱 Construye el número | Valor posicional | Toca columnas de centenas/decenas/unidades hasta formar el número |
| 10 | 📐 Ajusta el ángulo | Geometría | Arrastra una flecha sobre un transportador hasta el ángulo pedido |
| 11 | ✏️ Une los puntos | Conteo salteado | Toca los puntos en orden (de 2 en 2, de 5 en 5…) y traza el camino |
| 12 | ⚖️ Mayor o menor | Comparación | Contrarreloj (30s), compara dos números |
| 13 | 🧮 Cálculo veloz | Cálculo mental | Contrarreloj (30s), suma/resta/multiplicación |
| 14 | 🔺 Formas | Geometría | Nombre y número de lados de una figura |
| 15 | 🧩 Encuentra la x | Álgebra | Resuelve una ecuación lineal sencilla |
| 16 | 📊 Media y moda | Estadística | Calcula media, mediana o moda de una lista |
| 17 | 📏 Distancias | Medidas | Convierte entre mm/cm/m/km |
| 18 | 🐘 Pesos | Medidas | Convierte entre g/kg/t |
| 19 | 🍕 La tarta | Fracciones | Identifica la fracción sombreada de un círculo |
| 20 | 🔢 Secuencias | Patrones | Encuentra el siguiente número de la serie |

## Ejercicios #21-#29 (segunda tanda) — pregunta + opciones, temas nuevos

| # | Juego | Tema | Mecánica |
|---|---|---|---|
| 21 | 📖 Problemas de palabras | Problemas | Enunciados cortos (reparto, compras…) con 4 opciones |
| 22 | 🏛️ Números romanos | Numeración | Traduce entre número arábigo y romano |
| 23 | 🔘 Redondea | Redondeo | Redondea a la decena o centena más cercana |
| 24 | 🏷️ ¿Qué es más barato? | Dinero | Compara el precio por unidad de dos paquetes |
| 25 | 📈 Lee el gráfico | Datos | Lee valores de un gráfico de barras generado al vuelo |
| 26 | 🌳 Árbol de factores | Divisibilidad | Identifica un factor real de un número |
| 27 | ⏳ Tiempo transcurrido | Tiempo | Calcula la duración entre una hora de salida y de llegada |
| 28 | 🌡️ Temperaturas | Negativos | Sube/baja una temperatura, con resultados negativos |
| 29 | 🧵 Completa el patrón | Patrones visuales | Sigue un patrón de formas/colores (no numérico) |

## Ejercicios #30-#40 (tercera tanda) — mecánica propia, temas nuevos

| # | Juego | Tema | Mecánica |
|---|---|---|---|
| 30 | 🎡 Ruleta de probabilidad | Probabilidad | Adivina el color más probable y gira la ruleta de verdad |
| 31 | 🧺 Clasifica los números | Clasificación | Toca un número y su cesta (par/impar, primo, múltiplo…) |
| 32 | 🎚️ Estima el resultado | Estimación | Arrastra a una aproximación — no hace falta el valor exacto |
| 33 | ⌨️ Teclado numérico | Cálculo mental | Escribe la respuesta con un teclado, en vez de elegir |
| 34 | 🍫 Compara fracciones | Fracciones | Dos barras rellenas — toca cuál es mayor |
| 35 | 💰 Cuenta las monedas | Dinero | Toca monedas/billetes hasta juntar el importe exacto |
| 36 | 🗺️ Plano cartesiano | Coordenadas | Toca la celda (x, y) pedida en una cuadrícula |
| 37 | 🪞 Simetría | Geometría | Completa una figura simétrica tocando la única celda que falta |
| 38 | 🔗 Amigos del 10 | Cálculo mental | Diagrama de enlace — toca el número que falta (10/20/100) |
| 39 | 🔲 Área y perímetro | Geometría | Cuenta cuadrados para el área, o calcula el perímetro |
| 40 | 🌀 Laberinto numérico | Múltiplos y reglas | Recorre una cuadrícula pisando solo casillas que cumplen la regla |

## Ejercicios #41-#65 (tercera tanda) — 25 mecánicas propias más

| # | Juego | Tema | Mecánica |
|---|---|---|---|
| 41 | 🎣 Pesca de números | Multiplicación | Peces cruzan el estanque en horizontal; pesca el del resultado correcto |
| 42 | 🪜 Escalera de rachas | Cálculo mental | Aciertas y subes un peldaño, fallas y bajas; llega arriba |
| 43 | 🎰 Tragaperras de operaciones | Operaciones | Elige el operador que hace verdadera la ecuación de los rodillos |
| 44 | 🎲 Dados | Sumas rápidas | Dados con puntos reales; suma o resta el resultado al vuelo |
| 45 | 🏁 Carrera de cálculo | Cálculo mental | Corre contra la CPU: cada acierto te adelanta un tramo |
| 46 | 🪀 Ábaco | Valor posicional | Mueve las cuentas de centenas/decenas/unidades |
| 47 | 📦 Reparte en cajas | División | Reparte las galletas a partes iguales entre las cajas |
| 48 | 💧 Llena el vaso | Capacidad | Añade medidas (100/250/500 ml) hasta el volumen exacto |
| 49 | 🏗️ Construye la torre | Comparación | Iguala, dobla o supera la torre de referencia |
| 50 | 🖍️ Mide con la regla | Medidas | Lee dónde acaba el objeto sobre la regla (con desplazamientos) |
| 51 | 🔍 Encuentra el error | Razonamiento | Detecta el paso equivocado de un cálculo desarrollado |
| 52 | 🚦 Verdadero o falso | Cálculo mental | Contrarreloj 30s: ✅/❌ a ecuaciones a toda velocidad |
| 53 | 🪢 Une con líneas | Emparejar | Une operación y resultado trazando líneas entre columnas |
| 54 | 🎨 Colorea por resultado | Cálculo mental | Colorea todas las casillas cuyo resultado coincide |
| 55 | 🪄 Puzle numérico | Álgebra | Coloca piezas en los huecos de la ecuación |
| 56 | 🗓️ Calendario | Tiempo | Mes real: días entre fechas y "el tercer martes" |
| 57 | 🛒 La compra | Dinero | Llena el carro gastando el presupuesto exacto |
| 58 | ⚗️ Mezclas y proporciones | Proporcionalidad | Escala una receta manteniendo la razón |
| 59 | ♨️ Termómetro | Negativos | Arrastra el mercurio (vertical) hasta la temperatura pedida |
| 60 | 🧭 Giros y direcciones | Ángulos | Gira 45/90/135°… sobre la rosa de los vientos |
| 61 | 📉 Continúa la gráfica | Datos | Toca el punto que continúa la tendencia |
| 62 | 🍰 Reparte la tarta | Fracciones | Arrastra el corte para separar la fracción pedida |
| 63 | 🎵 Compás musical | Fracciones | Completa un compás de 4/4 con redondas, blancas y negras |
| 64 | 💡 Bombillas binarias | Valor posicional | Enciende bombillas 16/8/4/2/1 para formar el número |
| 65 | 🧊 Cuenta los cubos | Volumen | Cuenta los cubos de un bloque 3D al que le falta un trozo |

Los juegos "contrarreloj" (#12, #13, #52) terminan a los 30 segundos;
el resto termina a las 3 vidas o al completar el objetivo. Todos
guardan la puntuación final en Supabase y el menú principal muestra las
últimas partidas jugadas.

## Ejercicios #66-#90 (cuarta tanda) — 🔧 revisados aparte, 25 mecánicas nuevas

La columna **de dónde sale** dice si la mecánica viene de una fuente
concreta de ahí fuera o es inventada, y con qué proceso (la terna de
combinación forzada, la inversión o la restricción).

### Tramo «Puzzles de lápiz y papel» — [`css/pack-g.css`](./css/pack-g.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 66 | 🟧 Pentominós | Área y teselado | Encaja las piezas en el rectángulo sin huecos ni solapes; el área total es fija, así que sobra o falta hueco | Manipulativos de aula / pentominós de Golomb (familia 7) |
| 67 | 🔼 Mayor que | Orden y lógica | Futoshiki 4×4: cada toque cicla la casilla, respetando los signos < > entre vecinas | Puzzles de lápiz y papel (familia 4) |
| 68 | ➕ Kakuro | Sumas con restricción | Rellena con 1-9 sin repetir para que cada bloque sume lo indicado (17 en dos casillas solo puede ser 8+9) | Puzzles de lápiz y papel (familia 4) |
| 69 | ⬛ Shikaku | Multiplicación y área | Arrastras para dibujar cada rectángulo y se lee en vivo «3 × 2 = 6»: la multiplicación no se calcula, se dibuja | Puzzles de lápiz y papel (familia 4) |
| 70 | 🔯 Cuadrado mágico | Sumas | Coloca las fichas que faltan; cada hueco está atado a fila + columna (+ diagonal), así que es un sistema de sumas | Gardner / puzzles clásicos (familia 3) |


### Tramo «Números, descomposición y estrategia» — [`css/pack-h.css`](./css/pack-h.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 71 | 🔟 Cifras | Operaciones | Combinas dos fichas con + − × ÷ y el resultado **pasa a ser una ficha nueva**, gastando los dos operandos | Concurso *Cifras y Letras* (familia 10) + *Digits* del NYT (familia 2) |
| 72 | 🔀 Todas las formas | Descomposición | Inversión: dado el resultado, encuentra **todas** las parejas que lo forman; «3 de 5 encontradas» | Inventado: inversión 4.3 |
| 73 | 🪛 Inventa la regla | Patrones | Inversión de «¿qué número sigue?»: te dan la serie y construyes la regla que la genera | Inventado: inversión 4.3 |
| 74 | 🧹 Criba de primos | Primos | Tachas los múltiplos de 2, 3, 5, 7 fase a fase y al final quedan los primos: el algoritmo ES el gesto | Clásico: criba de Eratóstenes (familia 3) |
| 75 | 🎋 Nim de palillos | Paridad y restos | Quitas 1, 2 o 3 palillos y pierde quien coge el último; no se gana sin la aritmética modular | Gardner / juegos de patio (familias 3 y 10) |


### Tramo «Manipulativos y proporción» — [`css/pack-i.css`](./css/pack-i.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 76 | 🥖 La misma cantidad | Fracciones equivalentes | Dos barras del mismo largo partidas en distinto número de trozos: marcas el punto equivalente, así que 2/3 = 4/6 se ve como longitud | Manipulativos de aula / barras de fracciones (familia 7) |
| 77 | 🥐 Dobleces de masa | Potencias de 2 | Cada doblez duplica las capas y la pila duplica su altura; se ven los dobleces pero **no** las capas | Inventado: terna *potencias + doblar + panadería* |
| 78 | 🧪 Mezcla las probetas | Media ponderada | Viertes arrastrando y el color del matraz sale interpolado: verter ES promediar | Inventado: terna *media + verter + laboratorio* |
| 79 | 🔬 La lupa decimal | Decimales | Tocas el trozo de recta y se amplía ×10: cada zoom parte el anterior en 10, que es lo que significa la cifra siguiente | Inventado: terna *decimales + deslizar + laboratorio* |
| 80 | 💸 Rebajas | Porcentajes | Inversión: estiras una barra sobre el precio hasta dar con el descuento que cuadra; la parte sombreada es a la vez el % y el dinero | Inventado: terna *porcentajes + estirar + mercado* |


### Tramo «Mundo real y deducción» — [`css/pack-j.css`](./css/pack-j.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 81 | ✈️ Escalas | Tiempo y horarios | Encadenas vuelos comprobando que la conexión da; las tarjetas solo dan salida + duración, así que hay que sumar la llegada | Inventado: terna *tiempo + sincronizar + aeropuerto* |
| 82 | 👕 Cuántos conjuntos | Combinatoria | Inversión: construyes **todas** las combinaciones distintas y al cerrarlas aparece la rejilla «2 × 3 = 6» | Inventado: terna *combinatoria + construir + sastrería* |
| 83 | 🚢 Hundir la flota | Coordenadas y deducción | Tablero 6×6 con contadores por fila y columna: se deduce, no se adivina | Juegos populares / puzzles de deducción (familia 10) |
| 84 | 🪣 El pintor | Área | Mides la pared (rectángulos pegados) y compras los botes justos; el área **no** se dice | Inventado: terna *área + pintar + obra* |
| 85 | ⚙️ Engranajes | Mínimo común múltiplo | Haces rodar la rueda y paras cuando las marcas vuelven a coincidir: eso pasa a las vueltas del m.c.m. | Inventado: terna *múltiplos + rodar + taller* |


### Tramo «Riesgo, visual y sin palabras» — [`css/pack-k.css`](./css/pack-k.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 86 | ✖️ Tachones | Probabilidad y orden | Tiras dos dados y tachas solo hacia delante: lo que saltas lo pierdes. Al decidir se ven cuántas de las 36 combinaciones caen a cada lado | Juego de mesa *Qwixx* / valor esperado (familia 5) |
| 87 | ♠️ Sin pasarse | Cálculo y riesgo | Cada carta trae una operación que se aplica a tu total y decides cuándo pararte, sin pasarte del objetivo | Blackjack matemático de aula + *El Precio Justo* (familia 10) |
| 88 | 🐧 El puente | Complementos sin palabras | **Ni una palabra ni una cifra en pantalla**: tocas la pieza que encaja en el hueco y al fallar la animación muestra al pingüino cayendo | Diseño de puzles de **ST Math** (familia 1) + restricción 4.4 |
| 89 | 🌈 Colorea el mapa | Lógica y grafos | Coloreas sin que dos vecinas compartan color y con el mínimo de colores posible | Divulgación de **Clara Grima**: grafos y los cuatro colores (familia 2) |
| 90 | 🤿 Buceo | Enteros | Llevas al buzo a la cota exacta con saltos de un solo uso: enteros con signo como desplazamiento vertical real | Inventado: terna *negativos + apilar + fondo del mar* |

## Ejercicios #91-#96 (quinta tanda) — tramo 1: deducción y valor posicional

Primer tramo de la tanda del 17-09-2026 (tarde). Media tanda sale de
investigar apps edtech, prensa/blogs de divulgación y retos de aula que
no se habían tocado en las últimas rondas; la otra mitad, del proceso de
combinación forzada (4.1) y de inversión (4.3). Backlog fusionado en
Supabase (`idea_log`) antes de construir nada.

### Tramo «Deducción y valor posicional» — [`css/pack-l.css`](./css/pack-l.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 91 | 🔑 Rompe el código | Valor posicional | Mastermind numérico de 3 cifras sin repetir: cada intento da cifras en su sitio y cifras descolocadas, con el historial completo siempre visible para razonar | Number Mastermind (familia 6) |
| 92 | 🎴 Trío | Lógica y atributos | 9 cartas con 3 atributos; toca 3 donde cada atributo sea TODO igual o TODO distinto — nunca "dos y una" | Juego de mesa *Set* (familia 5) |
| 93 | 📦 ¿Qué cubo sale? | Geometría espacial | Un desarrollo plano en cruz y 3 cubos ya plegados en pseudo-3D real (`rotateX/rotateY`); solo uno es coherente con qué caras quedan opuestas | *Net or Not* / vídeojuegos de plegado (familia 6) |
| 94 | 🧲 Caen diez | Sumas | Grid tipo caída: toca dos fichas adyacentes (nunca en diagonal) que sumen exactamente 10 y caen las de arriba a rellenar | *Sum10* / Toy Theater (familia 1) |
| 95 | 🫙 Las jarras | Capacidad y lógica | El puzle clásico de trasvases (Gardner / *Die Hard 3*): llenar, vaciar y verter entre dos jarras hasta dejar exactamente el objetivo | Martin Gardner (familia 3) |
| 96 | 👁️ Golpe de vista | Número sense (subitización) | Flashea un patrón de puntos menos de un segundo; hay que teclear cuántos había sin tiempo para contarlos uno a uno | Apps de subitización (familia 12, investigación educativa) |

Verificación de calidad antes de publicar: cada generador con
aleatoriedad se simuló miles de rondas en Node (`compareGuess` de #91:
20.000 pares código/intento; `hasTrio` de #92: 2.000 repartos, 100% con
trío tras la guarda; `esValido` de #93: 5.000 desarrollos, siempre
exactamente 1 cubo válido de 3; `hayJugada` de #94: 5.000 cuadrículas,
99,68% ya jugables sin forzar nada; `generateRound`+BFS `solve` de #95:
5.000 rondas siempre alcanzables y siempre resueltas; colocación de
puntos de #96: 2.000 rondas sin solapes). Después, los 96 ejercicios del
catálogo (también los 90 viejos) se cargaron en Chromium a 390px sin
ningún error de consola, y los 6 nuevos se jugaron de verdad calculando
la jugada correcta (lectura del tablero, no fuerza bruta) hasta confirmar
que el marcador sube en cada uno.

## Ejercicios #97-#102 (quinta tanda) — tramo 2: ángulos, simetría y proporción

### Tramo «Ángulos, simetría y proporción» — [`css/pack-m.css`](./css/pack-m.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 97 | 🕰️ El ángulo de las agujas | Ángulos | Arrastra un único marcador giratorio hasta cubrir exactamente el ángulo real entre las agujas a una hora dada | Actividad clásica de aula (ángulo horario/minutero) |
| 98 | 🧣 Dobla la tela | Simetría | Un estampado en cuadrícula y varias líneas de doblez candidatas; solo una hace que el patrón case consigo mismo | Inventado: terna *simetría + doblar + sastrería* |
| 99 | 🐑 La valla del huerto | Perímetro y área | Perímetro FIJO de cuerda: estirar un lado encoge el otro; hay que alcanzar el área pedida | Inventado: terna *perímetro + estirar + jardín* |
| 100 | 🎱 Tiro con rebote | Ángulos | Billar con una banda: toca el punto exacto donde incidencia = reflexión, con lanzador y portería a **alturas distintas** | Inventado: terna *ángulos + disparar + fútbol* |
| 101 | 🗾 La escala del mapa | Proporción | Cuenta las marcas de una misma cuadrícula en la barra de escala y en el mapa para deducir la distancia real | Mapas y planos (vida real) |
| 102 | 🕶️ La sombra | Proporcionalidad | Estira la altura del árbol hasta que cuadre con la proporción sombra/altura de un poste de referencia (triángulos semejantes) | Medida indirecta de Exploratorium |

**Vuelta de revisión sobre la marcha (#100):** al terminarlo, el propio
proceso de verificación (jugarlo de verdad, no solo leer el código)
encontró que la primera versión ponía el lanzador y la portería a la
**misma altura** — con eso, por geometría, el punto de rebote es SIEMPRE
el punto medio exacto entre los dos, sin que haga falta calcular nada
(la altura de la banda se cancela en la fórmula). Es decir: la mecánica
NO era la matemática, era "toca el centro a ojo" disfrazado de billar.
Arreglado dándole a cada uno un pedestal de altura distinta, así el
rebote depende de verdad de la proporción entre las dos distancias a la
banda — se verificó con una simulación de 20.000 rondas que la desviación
respecto al punto medio ingenuo llega hasta 17 unidades (ya no es un
empate con la trivialidad) y que ángulo de incidencia = ángulo de
reflexión se cumple exacto en todos los casos.

Verificación antes de publicar: `computeClockAngle` de #97 sobre 2.400
combinaciones hora/minuto (nunca 0°, siempre en [0°,180°]); `esEjeValido`
de #98 sobre 5.000 patrones (exactamente 1 candidato válido siempre);
generación de #99 sobre 20.000 combinaciones P/ancho (área objetivo
siempre entera y alcanzable); `puntoRebote` de #100 sobre 20.000 rondas
tras el arreglo (0 fuera de rango, ángulos iguales verificados con
arcotangente); `distanciaReal` de #101 sobre 5.300 combinaciones (siempre
un resultado limpio de máximo 2 decimales); generación de #102 sobre
3.000 combinaciones (altura siempre exacta). Los 102 ejercicios cargan
sin error de consola, y los 6 nuevos se jugaron de verdad (arrastrando al
punto/ángulo/altura calculados a mano) confirmando que el marcador sube.

## Ejercicios #103-#108 (quinta tanda) — tramo 3: mundo real, estimación y deducción

### Tramo «Mundo real, estimación y deducción» — [`css/pack-n.css`](./css/pack-n.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 103 | 🐔 Hueveras | División con resto | Reparte huevos en hueveras de 6 y 12; como cualquier combinación deja el mismo resto (12=2×6), se pide el resto único, no una combinación arbitraria | Inventado: terna *divisibilidad + repartir + granja* |
| 104 | 🧾 El ticket incompleto | Resta e incógnita | Un ticket de la compra con un precio tapado; deduce cuánto costaba a partir del total y los demás precios | Vida real (la compra) |
| 105 | 🔭 ¿De qué orden? | Estimación | Problemas de Fermi: no hay que acertar el número exacto, solo el orden de magnitud (potencia de 10) | Problemas de Fermi |
| 106 | 💌 Reparte la paga | Porcentajes | Reparte una cantidad en 3 sobres arrastrando hasta el importe exacto que corresponde a cada porcentaje | Presupuesto en sobres (vida real) |
| 107 | 🚂 ¿Dónde se cruzan? | Velocidad | Dos trenes salen a la vez a distinta velocidad; toca el punto exacto de la vía donde se cruzan (e = v·t) | Vida real |
| 108 | 🕵️ El intruso | Propiedades de los números | De 4 números, tres comparten una propiedad (par, primo, múltiplo, cifra concreta...) y uno no — tócalo | Which One Doesn't Belong (wodb.ca) |

**Nota sobre #108:** para que la respuesta sea siempre inequívoca, el
generador no solo comprueba que la propiedad elegida rompe en
exactamente 1 de los 4 números: también recorre TODO el banco de ~50
propiedades comprobando que NINGUNA OTRA aislaría a un número distinto
como "el raro". La simulación (5.000 rondas) registró 70.028 intentos
totales, de los cuales 65.028 (93%) se descartaron por ambigüedad
detectada — la verificación cruzada actúa de verdad, no es cosmética.

Verificación antes de publicar: `restoHuevos` de #103 sobre 1.000+
valores de N (siempre en [0,5]); generación de #104 sobre 20.000
iteraciones trabajando en céntimos enteros (0 desvíos de redondeo);
banco de 15 preguntas de #105 revisado a mano con su orden de magnitud
documentado; `importes` de #106 sobre 2.000 rondas (siempre enteros,
suman el total exacto); generación de #107 sobre 5.000 combinaciones
D/Va/Vb (cruce siempre en [10%,90%] de la vía); generación de #108 sobre
5.000 rondas con el chequeo cruzado de ambigüedad descrito arriba. Los
108 ejercicios cargan sin error de consola, y los 6 nuevos se jugaron de
verdad calculando la respuesta correcta (lectura del ticket, cálculo de
la proporción, deducción de la propiedad compartida) confirmando que el
marcador sube.

## Ejercicios #109-#113 (quinta tanda) — tramo 4 (último): inventados e investigados

### Tramo final — [`css/pack-o.css`](./css/pack-o.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 109 | 🫐 Blobs de suma | Sumas | Toca varias fichas de un grupo que sumen exactamente el objetivo, dejando aparte las que sobran | Beast Academy "Sum Blobs" (familia 1) |
| 110 | 🤔 ¿Qué prefieres? | Comparación y sentido numérico | Dos escenarios (precio por unidad, velocidad media, reparto); toca el que de verdad conviene más tras calcular | Would You Rather Math, John Stevens (familia 8) |
| 111 | 🚀 Cohete exponencial | Potencias | Ajusta base y exponente con dos mandos para que el empuje (base^exponente) alcance justo la órbita objetivo | Inventado: terna *potencias y raíces + disparar + espacio* |
| 112 | 🔩 Pares de tuercas | Paridad | Empareja tuerca+tornillo cuya suma sea par, hasta el máximo de parejas posible | Inventado: terna *paridad + emparejar + taller* |
| 113 | 🤹 Malabares | Múltiplos comunes (m.c.m.) | Tres pelotas de periodos distintos; por turnos (no por reflejos), elige en qué tic exacto vuelven a coincidir las tres | Inventado: terna *múltiplos + sincronizar + circo* |

Con este tramo se cierran los 23 ejercicios nuevos de la tanda. Quedan
en el backlog de `idea_log` (Supabase), aparcados a propósito para una
tanda futura: **Pesas de Bachet** (mismo aspecto visual de balanza que
la #6 recién rehecha esta misma tanda — se monta más adelante, lejos de
esa vuelta, para no repetir el golpe de vista) y **La rueda cuadrada**
de MoMath (necesita un motor de curvas paramétricas que no compensaba
meter deprisa).

Verificación antes de publicar: `sumasPosibles` de #109 sobre 5.000
rondas (objetivo siempre alcanzable, 0 rondas triviales); los 3
generadores de #110 sobre 3.000 rondas con comparación por productos
cruzados (0 empates exactos, nunca división de floats); `combinacionesValidas`
de #111 sobre 5.000 objetivos (siempre ≥1 combinación real); `maxEmparejamientos`
de #112 sobre 2.500 combinaciones contrastadas con fuerza bruta (0
discrepancias); `mcm3` de #113 sobre 1.260 ternas de periodos (siempre
divisible exacto por los tres). Los 113 ejercicios cargan sin error de
consola, y los 5 nuevos se jugaron de verdad calculando la jugada
correcta (subconjunto que suma, producto cruzado, combinación de
potencia, emparejamiento por paridad, m.c.m.) confirmando que el
marcador sube.

## Ejercicios #114-#118 (sexta tanda) — tramo 1

### Tramo 1 — [`css/pack-p.css`](./css/pack-p.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 114 | 🔷 KenKen mini | Operaciones y lógica | Rejilla 4×4 sin repetir 1-4 por fila/columna, con "jaulas" que exigen que sus celdas combinen con +, ×, - o ÷ para dar un objetivo | KenKen, Tetsuya Miyamoto |
| 115 | ⚫ Hitori | Lógica de eliminación | Sombrea celdas de una rejilla 5×5 para que ningún número quede repetido sin sombrear en su fila/columna, sin negras pegadas y con las blancas siempre conectadas | Hitori (Nikoli) |
| 116 | 🔐 La clave secreta | Criptaritmos | Criptaritmo tipo AB+CD=EFG: cada letra es una cifra fija, letras distintas son cifras distintas, ninguna cifra inicial puede ser 0 | SEND+MORE=MONEY, Martin Gardner |
| 117 | 💵 Sin pasarse de precio | Estimación y comparación | Adivina el precio exacto de un producto en máximo 6 intentos; tras cada puja solo se dice "más alto"/"más bajo", así que conviene converger por bisección | El Precio Justo |
| 118 | 🐟 Pesca de factores | Factores y divisores | Pesca entre un estanque de números solo los que dividen exactamente al objetivo, dejando fuera los señuelos que no lo dividen | Inventado: terna *factores/divisores + pescar + estanque* |

Verificación antes de publicar: `verify_kenken.mjs` sobre 5.000 rondas de
#114 (cuadrado latino siempre válido, jaulas de resta/división siempre de 2
celdas, objetivos coherentes recalculados de forma independiente);
`test_hitori.mjs` sobre 5.000 rondas de #115 (0 falsos negativos de
`esSolucionValida` sobre su propia construcción); `validate_clave.mjs`
sobre 500 rondas de #116 con verificación independiente de unicidad por
fuerza bruta (0 rondas con más de una solución); `validate_puja.mjs`
confirmando que el banco de 20 productos cabe en los 6 intentos incluso
sin bisección perfecta; `sim_anzuelo.mjs` sobre 3.000 rondas de #118
(generador siempre produce un estanque con 4+ divisores reales). Los 118
ejercicios cargan sin error de consola, y los 5 nuevos se jugaron de
verdad en el navegador calculando la jugada correcta de forma
independiente (sin acceder al estado interno del módulo: la resolución de
#114 y #116 se hizo leyendo solo el DOM — jaulas reconstruidas a partir de
los bordes ya dibujados por la UI, ecuación leída directamente del
`data-tile-letter` de cada ficha) y confirmando que el marcador sube
+10 en cada acierto; también se comprobó que fallar #118 a propósito resta
una vida con el mensaje correcto.

**Fallo real encontrado y corregido en #114 antes de publicar:** el
generador no comprobaba que la solución fuera única — en una simulación de
3.000 rondas, un **25%** tenían más de un cuadrado latino 4×4 que cumplía
todas las jaulas igual de bien, pero `kkFindIssue` solo aceptaba la
solución concreta que el generador había guardado internamente, así que
un jugador que encontrara una solución alternativa igual de válida habría
sido marcado como error. Se quitó esa comparación final (bastaba con que
filas, columnas y jaulas cuadren para que la rejilla sea correcta) y se
verificó con un test dedicado que, sobre una ronda con dos soluciones
reales, ambas quedan aceptadas.

## Ejercicios #119-#123 (sexta tanda) — tramo 2 (último)

### Tramo 2 — [`css/pack-q.css`](./css/pack-q.css)

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 119 | 🍳 Ajusta la receta | Fracciones y proporción | Escala los ingredientes de una receta al cambiar el número de raciones, multiplicando todos por el mismo factor sencillo (num/den) | Cooking with Fractions |
| 120 | 🚉 El horario de trenes | Tiempo y horarios | Lee una tabla de horarios con varios trenes y estaciones; según la pregunta, lee un hueco de la tabla, elige el mejor tren dentro de un límite o calcula cuánto hay que esperar | NRICH Train Timetable |
| 121 | 🏬 Apila cajas | Volumen | Rellena un almacén con el volumen exacto eligiendo el subconjunto correcto de cajas candidatas, calculando cada volumen antes de sumar | Inventado: terna *volumen + apilar + almacén* |
| 122 | 🤝 El trueque | Ecuaciones | Resuelve una ecuación lineal disfrazada de mercado: dos platillos con cestas (incógnita) y sacos (valor fijo) deben quedar igualados | Inventado: terna *ecuaciones + negociar + mercado* |
| 123 | 🔁 Conversión deslizante | Unidades | Arrastra un marcador sobre una regla de destino hasta la marca que coincide con la conversión exacta de la cantidad de origen | Inventado: terna *unidades + deslizar + laboratorio* |

Con este tramo se cierran los 10 ejercicios nuevos de la sexta tanda.
Verificación antes de publicar: simulación de 20.000 rondas de #119
(`sim_receta.mjs`, ninguna cantidad escalada sale con decimales
periódicos, nunca cantidad 0 ni factor 1); 12.000 rondas de #120
(`sim_horario.mjs`, coherencia horaria siempre, sin empates en las
rondas de "elige el mejor tren", espera siempre positiva); 5.000 rondas
de #121 (`verify_almacen.mjs`, por fuerza bruta sobre todos los
subconjuntos: siempre exactamente una combinación de cajas suma el
objetivo); 20.000 rondas de #122 (`test_trueque.mjs`, la incógnita
recalculada desde cero con la fórmula de la ecuación coincide siempre
con la generada, y siempre es un entero positivo); 20.000 rondas de
#123 (`sim_conversion.mjs`, el valor de destino cae siempre exacto en
una marca discreta de la regla, nunca hay que interpolar). Los 123
ejercicios cargan sin error de consola, y los 5 nuevos se jugaron de
verdad en el navegador calculando la respuesta correcta de forma
independiente sin acceder al estado interno del módulo — leyendo solo
el DOM (factor y cantidad mostrada en #119, la propia tabla de
horarios en #120, las dimensiones de las cajas en #121, el contenido
de los platillos en #122, la posición del marcador de origen en #123)
— y confirmando que el marcador sube +10 en cada acierto; también se
comprobó que fallar #121 a propósito resta una vida con el mensaje
correcto.

## Ejercicios #124-#129 (séptima tanda, 17-09-2026 noche) — tramo único

### Tramo único — [`css/pack-r.css`](./css/pack-r.css)

Antes de investigar se revisó el único ejercicio marcado con 🔧
(**#6 Equilibra la balanza**, marcado por tercera vez sin nota) —
ver la sección "Vuelta del 17-09-2026 (noche)" más abajo, donde se
explica el fallo VISUAL que se encontró y se corrigió (v4) antes de
tocar nada nuevo.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 124 | 🎨 Fábrica de colores primos | Factores primos | Reconstruye un número tocando chips de colores (uno por primo pequeño) cuyo producto dé el objetivo | Prime Climb (Math for Love), familia 5 |
| 125 | 🎲 Elige tu categoría | Combinatoria y patrones de dados | Tras una tirada de 5 dados, elige entre varias categorías de puntuación la que da MÁS puntos con esa tirada concreta | Yahtzee, familia 5 |
| 126 | 🀄 Escalera de mosaicos | Números triangulares y reparto | Con una bolsa de fichas de colores en cantidades limitadas, calcula cuántas filas de una escalera 1-2-3-4-5 puedes completar como máximo | Azul (Plan B Games), familia 5 |
| 127 | 🔢 Grupos y escaleras | Secuencias y valores iguales | De una mano de fichas numeradas y coloreadas, encuentra el conjunto válido más largo: un grupo (mismo valor, colores distintos) o una escalera (mismo color, consecutivos) | Rummikub, familia 5 |
| 128 | 🎬 Sesión de cine | Combinatoria | Cuenta de cuántas formas se pueden sentar unos amigos en fila (permutaciones) o elegir una pareja de butacas (combinaciones) | Inventado: terna *combinatoria + ordenar + cine* |
| 129 | 👀 ¿Cuál es más grande? | Estimación visual de ángulos | Ordena tres ángulos de menor a mayor solo a golpe de vista, sin transportador ni números en pantalla | Inventado: restricción 4.4 (sin números en pantalla) |

Tanda modesta a propósito (6 ejercicios, 1 tramo): el Mastermind
numérico que salió de investigar "Wordle/Mastermind digital" se
descartó al comprobar que `game-codigo.js` (#91) ya es exactamente esa
mecánica — recordatorio de revisar el catálogo real antes de dar una
idea de investigación por buena, no solo confiar en que "suena nueva".

Verificación antes de publicar: `verify_colorprimos.mjs` sobre 5.000
rondas de #124 (por fuerza bruta sobre los ≤2^8 subconjuntos del
banco, 0 soluciones alternativas con un multiset de primos distinto
al real — la factorización prima es única, así que no puede haberlas);
`test_categorias.mjs` sobre 20.000 rondas de #125 con las 5 fórmulas
de puntuación recalculadas desde cero en el test (0 desajustes, 0
rondas sin ninguna opción real); `test_mosaico.mjs` sobre 5.000 rondas
de #126 con el máximo recalculado por una fuerza bruta independiente
distinta a la del generador (0 discrepancias, distribución de
respuestas no sesgada hacia 0 ni al techo); `test_combina.mjs` sobre
5.000 rondas de #127 verificando por fuerza bruta que el tamaño máximo
real de la mano coincide siempre con el declarado; `test_butacas.mjs`
sobre 20.000 rondas de #128 recalculando N! y C(N,2) de forma
independiente; `sim_vistazo.mjs` sobre 200.000 rondas de #129
comprobando rango 15-165°, separación mínima de 12° entre ángulos
consecutivos y que los tres son siempre distintos. Los 129 ejercicios
cargan sin error de consola, y los 6 nuevos se jugaron de verdad en el
navegador calculando la respuesta correcta de forma independiente sin
acceder al estado interno del módulo — incluyendo #129, donde el
"ángulo correcto" se dedujo leyendo las coordenadas reales de las
líneas SVG del DOM y calculando el ángulo con trigonometría, nunca
mirando un número en pantalla (no lo hay) — confirmando que el
marcador sube +10 en cada acierto, y que fallar a propósito en #124
resta una vida con el mensaje correcto.

## Ejercicios #130-#135 (octava tanda, 17-09-2026 tarde) — tramo único

### Tramo único — [`css/pack-s.css`](./css/pack-s.css)

Sin filas `review` pendientes, se saltó el paso de revisión. Familia 7
(manipulativos de aula) llevaba 3 rondas sin tocarse, así que se
priorizó ahí, junto con prensa (NYT) e investigación educativa
(subitizing).

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 130 | 🟧 Regletas relativas | Fracciones equivalentes | Con dos regletas Cuisenaire (una declarada "la unidad"), di qué fracción de la unidad representa la más corta — el mismo color/longitud vale distinto según qué se elija como entero | Cuisenaire rods, familia 7 |
| 131 | 🔵 Bonos de agujeros | Number bonds / subitizing | Toca dos fichas con patrones de agujeros (sin ningún dígito impreso) cuya suma iguale la ficha objetivo, también mostrada como figura de agujeros | Numicon, familia 7 |
| 132 | 🎯 Da en el número | Operaciones combinadas | Combina números de una bolsa con +, −, ×, ÷ (cada uno usable una vez, sin fracciones ni negativos) hasta alcanzar exacto el objetivo | NYT Digits, familia 2 |
| 133 | ⚡ Vistazo relámpago | Subitizing | Un patrón de puntos aparece solo 500-900ms y desaparece; teclea cuántos había sin haber podido contarlos | Investigación en subitizing, familia 12 |
| 134 | 📐 Encierra el perímetro | Perímetro | En un geoplano, construye una figura tocando clavos en orden hasta que su perímetro real coincida con el objetivo — al revés que #39, que da la figura y pide calcular | Geoboard, familia 7 — inversión 4.3 |
| 135 | ⚽ Estadísticas de fútbol | Media, mediana y moda | Calcula la media o mediana de goles de 3 jugadores para decidir a cuál fichar — el cálculo es el medio para decidir, no la pregunta directa | Inventado: terna *media/mediana/moda + apostar + fútbol* |

Verificación antes de publicar: `verify_regletas.mjs` sobre 200.000
rondas de #130 (fracción siempre simplificada, longitudes siempre en
1-10); `verify_bonos10.mjs` sobre 20.000 rondas de #131 (por fuerza
bruta independiente: el banco tiene siempre EXACTAMENTE un par que
suma el objetivo); `verify_objetivo.mjs` sobre 5.000 rondas de #132
(cada paso de la solución de ejemplo recalculado desde cero, sin
fracciones ni negativos, ningún número de partida reutilizado);
`sim_flash.mjs` sobre 8.000 rondas de #133 (cantidad de puntos 3-9,
distancia mínima entre puntos siempre respetada, exposición siempre
en 500-900ms); `verify_geoclavos.mjs` sobre 20.000 rondas de #134
(el rectángulo generador siempre cabe en la rejilla 6×6 y el objetivo
es siempre par y alcanzable); `test_estadisticas.mjs` sobre 20.000
rondas de #135 (media y mediana recalculadas de forma independiente,
0 empates en la estadística preguntada). Los 135 ejercicios cargan sin
error de consola, y los 6 nuevos se jugaron de verdad en el navegador
calculando la respuesta correcta de forma independiente — incluyendo
#134, donde el generador de la prueba eligió su propio rectángulo
válido (no el de la ronda) para demostrar que cualquier figura
correcta se acepta — confirmando que el marcador sube +10 en cada
acierto, y que fallar a propósito en #134 resta una vida con el
mensaje correcto.

**Fallo real encontrado y corregido en #134 antes de publicar:** al
jugarlo de verdad, el clic para cerrar la figura sobre el primer clavo
fallaba de forma intermitente — el lado recién dibujado (una línea
SVG) se pintaba encima del clavo y le robaba el evento de clic,
porque solo los clavos ya tocados (`.gcv-nail`) tenían
`pointer-events: none`, pero los LADOS (`.gcv-side`) no. Añadido
`pointer-events: none` también a `.gcv-side`; reproducido el fallo
antes del cambio y confirmado que desaparece después, en Chromium real
(no fue un artefacto de la prueba).

## Ejercicios #136-#140 (novena tanda, 17-09-2026 tarde) — tramo único

### Tramo único — [`css/pack-t.css`](./css/pack-t.css)

Sin filas `review` pendientes, se saltó el paso de revisión. Familias
usadas: 1 (apps edtech, tape diagrams de Zearn), 5 (juegos de mesa /
código César), 6 (mecánicas de videojuego, panel "mayor/menor" tipo
puzle numérico), 11 (vida real, calidad/control) y 8 (retos lógicos,
secuencias con intruso).

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 136 | 📊 Diagrama de tiras | Razones y reparto proporcional | Dos tiras formadas por segmentos iguales representan un total repartido; sin ver el valor de cada segmento, deduce cuánto vale 1 segmento o cuánto tiene una persona | Tape diagrams (Zearn/Singapore Math), familia 1 |
| 137 | 🔐 Máquina de cifrado | Aritmética modular | Dada una letra, un desplazamiento k y si toca cifrar o descifrar, calcula la letra resultante en un alfabeto circular de 27 símbolos (con envoltura) | Cifrado César, familia 5 |
| 138 | ✈️ Panel de vuelos | Valor posicional | Con 4 dígitos sueltos, colócalos en orden para formar el mayor o el menor número posible — el caso "menor" con un 0 en el banco obliga a razonar que el 0 nunca puede ir primero | Puzles de valor posicional tipo "Number Sequencer", familia 6 |
| 139 | 🎚️ Iguala el relleno | Porcentajes | Sin ver ningún número, arrastra una barra hasta que su relleno iguale a ojo (con tolerancia) el de una barra de referencia marcada con un porcentaje objetivo oculto | Inventado: terna *porcentaje + arrastrar + comparar a ciegas* |
| 140 | 🥐 La hornada con un fallo | Secuencias | De una fila de bandejas con cantidades que siguen un patrón (aritmético, geométrico o cíclico), toca la única que rompe el patrón | Control de calidad / detección de intrusos en secuencias, familia 8 — inversión 4.3 sobre "completa la secuencia" |

Verificación antes de publicar: `verify_tiras.mjs` sobre 20.000 rondas
de #136 (unidad y reparto siempre recalculados de forma independiente,
sin restos); `test_enigma.mjs` sobre 20.000 rondas de #137 (cifrado y
descifrado comprobados con la fórmula modular reimplementada desde
cero, ~70% de los casos con envoltura del alfabeto); `test_maxmin.mjs`
sobre 8.000 rondas de #138 (mayor y menor recalculados por fuerza
bruta independiente, con el caso especial del 0 en primera posición
verificado en más de 2.800 rondas); `verify_iguala.mjs` sobre 10.000
generaciones de #139 (objetivo siempre múltiplo de 5 entre 10 y 90);
`test_hornada.mjs` sobre 20.000 rondas de #140 (la bandeja fallona
detectada de forma independiente por un solucionador que prueba los
tres patrones posibles, nunca reutilizando la lógica interna del
juego). Los 140 ejercicios cargan sin error de consola, y los 5 nuevos
se jugaron de verdad en el navegador calculando la respuesta correcta
de forma independiente, confirmando que el marcador sube +10 en cada
acierto; además se comprobó en #137 que fallar a propósito resta una
vida con el mensaje correcto.

**Hallazgo de auditoría (sin cambio de código):** al investigar la
familia de "Fermi" se confirmó que ya existe como ejercicio (#pack-7,
"¿De qué orden?"), así que se descartó antes de construir nada. Más
importante: comparando el código de #132 "Da en el número" (tanda
anterior, inspirado en NYT Digits) con [`game-cifras.js`](./js/game-cifras.js)
(#pack-4, ya existente) se confirmó que **ambos comparten el mismo
núcleo mecánico** — combinar números con +/−/×/÷ persiguiendo un
objetivo, estilo "Cifras y Letras"/Countdown Numbers. No se detectó
la tanda pasada porque solo se comprobó contra `game-codigo.js`
(Mastermind). Se documenta aquí en vez de reescribir #132 sin que
nadie lo haya pedido: no está marcado para revisar y funciona bien
matemáticamente por sí solo — pero queda anotado para que ninguna
tanda futura proponga un tercer ejercicio con esta misma mecánica.
También se descartó "Which One Doesn't Belong" por solapar con el
ya existente `game-intruso.js` (odd-one-out).

## Ejercicios #141-#145 (décima tanda, 17-09-2026) — tramo único

### Tramo único — [`css/pack-u.css`](./css/pack-u.css)

Sin filas `review` pendientes, se saltó el paso de revisión. Familias
usadas: 4 (puzzles de lápiz y papel), 10 (concursos de TV y juegos
populares) y 11 (vida real) — las 3 únicas que quedaban fuera de la
unión de familias de las 3 rondas anteriores.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 141 | ▢ Nonograma mini | Lógica | Rejilla 4×4 con pistas de fila/columna (longitudes de tramos rellenos); hay que deducir qué celdas van llenas para que cuadren TODAS las pistas a la vez | Nonograma / Griddler / Picross, familia 4 |
| 142 | 🔢 Descifra la suma | Aritmética con letras | Suma `AB + C = DE` donde cada letra es un dígito distinto; se acepta cualquier asignación que cumpla la ecuación, no solo la generada | Cryptarithm / SEND+MORE=MONEY (Henry Dudeney), familia 4 |
| 143 | 📉 Compra y vende | Finanzas | Arrastra un marcador sobre la línea de tiempo de precios de una acción hasta el día en que más se habría ganado vendiendo | Inventado, inspirado en juegos de bolsa educativos (Stock Market Game), familia 11 |
| 144 | 🧾 La factura por tramos | Tarifas por tramos | Una tarifa de agua o luz cobra distinto precio por tramos de consumo; hay que sumar cada tramo a su propio precio, no multiplicar todo por la tarifa más alta | Inventado, inspirado en tarifas progresivas reales, familia 11 |
| 145 | 🦆 La oca numérica | Operaciones con reglas | Suma la tirada de dado a la posición y aplica la regla de la casilla especial (oca = salta a la siguiente oca; puente = salto fijo) para hallar la casilla final | Juego de la oca (juego popular tradicional), familia 10 |

Verificación antes de publicar: `verify_nonograma.mjs` sobre 2.000
rondas de #141 (solución única confirmada por fuerza bruta exhaustiva
sobre las 65.536 rejillas 4×4 posibles; un bug real en la rejilla de
reserva —con 3 soluciones en vez de 1— se detectó y corrigió antes de
publicar); `verify_criptaritmo.mjs` sobre 2.000 rondas de #142 (unicidad
canónica comprobada por fuerza bruta sobre las 5!=120 permutaciones de
cada ronda, tras confirmar por fuerza bruta global que la forma
`AB+C=DE` tiene una simetría B↔C inevitable — dos letras con el mismo
peso en la suma — por lo que "exactamente una solución" solo tiene
sentido salvo ese intercambio; la corrección se hace sobre la propiedad
aritmética, nunca comparando con la solución generada, la misma lección
del bug de `game-kenken.js`); `verify_bolsa.mjs` sobre 10.000 rondas de
#143 (mejor día y ganancia máxima recalculados de forma independiente,
siempre estrictamente positiva); `verify_factura.mjs` sobre 10.000
rondas de #144 (importe recalculado tramo a tramo, tarifas siempre
estrictamente crecientes, sin huecos ni solapes entre tramos);
`verify_oca.mjs` sobre 10.000 rondas de #145 (destino final recalculado
de forma independiente, la regla nunca se encadena más de una vez, sin
solapes entre casillas especiales). Los 145 ejercicios cargan sin error
de consola, y los 5 nuevos se jugaron de verdad en el navegador
calculando la respuesta correcta de forma independiente, confirmando
que el marcador sube +10 en cada acierto.

**Fallo real encontrado y corregido en #143 antes de publicar:** al
jugarlo de verdad, arrastrar el marcador no movía nada — el marcador
visual (`.bls-marker`) se dibuja encima de la zona de arrastre real
(`.bls-hit`, más grande para poder tocarla con el pulgar) y, al nacer
centrado exactamente sobre ella, le robaba todos los eventos de puntero
desde el primer fotograma. Mismo bug que `.gcv-side`/`.gcv-nail` en
`game-geoclavos.js` de una tanda anterior: añadido `pointer-events: none`
a `.bls-marker`; reproducido el fallo antes del cambio (el día mostrado
nunca cambiaba al arrastrar) y confirmado que desaparece después, en
Chromium real.

**Hallazgo de auditoría (sin cambio de código):** al investigar la
familia 5 (juegos de mesa) para una idea de "múltiplos y sincronizar en
un circo" se descubrió que `game-malabares.js` (#pack-8, ya existente)
YA es exactamente esa mecánica (m.c.m. de periodos); descartada antes de
construir nada. También se descartó "reparte el presupuesto en
categorías por porcentaje" al descubrir que `game-sobres.js` (#pack-7,
"Reparte la paga") ya es esa mecánica, y "pinta una pared calculando el
área" al descubrir que `game-pintor.js` (#pack-4) ya la cubre. Una
cuarta idea ("el precio justo": pujar sin pasarse) se descartó por
solapar temáticamente con `game-puja.js` (#pack-9), aunque su mecánica
concreta —búsqueda binaria con pistas de más/menos— difiera; se
sustituyó por "la oca numérica" (#145).

## Ejercicios #146-#149 (undécima tanda, 17-09-2026 noche) — tramo único

### Tramo único — [`css/pack-v.css`](./css/pack-v.css)

Sin filas `review` pendientes, se saltó el paso de revisión. Familias
usadas: 3 (libros y divulgación), 5 (juegos de mesa) y 6 (mecánicas de
videojuego) — las 3 únicas que quedaban fuera de la unión de familias
de las 3 rondas anteriores. Tanda más modesta (4 ideas, no 5-6): la
auditoría previa descartó 4 falsos positivos antes de escribir código
(ver más abajo), y se prioriza calidad sobre forzar una quinta idea
calcada.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 146 | ⚖️ Pesas de Bachet | Numeración en base 3 | Con pesas de 1, 3, 9 y 27 que pueden ir al plato izquierdo (resta), al derecho (suma) o quedarse sin usar, pesa el objetivo exacto — es la representación en ternario equilibrado, única por construcción matemática | Problema de Bachet de Méziriac (Martin Gardner), familia 3 — aparcada en el backlog desde la primera ronda del día |
| 147 | 🧮 La fila que cuadra | Múltiplos | Una fila de fichas fijas más un hueco; dada una clave (3, 4 o 5), toca la única ficha de un banco de 4 que hace que la suma total sea múltiplo de la clave | Sumoku (Blue Orange Games), familia 5 |
| 148 | 🪜 La hilera que sube | Secuencias y puntuación | Dada una fila con números ya marcados en orden creciente y un número nuevo, decide si se podría marcar (solo si es mayor que el último) y cuántos puntos daría (su posición en la fila) | Qwixx (regla de orden estricto + puntuación posicional), familia 5 |
| 149 | 🐢 Lineal contra exponencial | Crecimiento exponencial | Dos secuencias arrancan con la exponencial por detrás; calcula en qué paso la exponencial adelanta a la lineal por primera vez | Inventado, inspirado en la matemática de los juegos idle/incremental, familia 6 |

Verificación antes de publicar: `verify_bachet.mjs` sobre los 40
valores posibles de #146 (fuerza bruta exhaustiva sobre las 3⁴=81
combinaciones de {-1,0,1}⁴ para cada objetivo, confirmando solución
única en los 40 casos); `verify_sumafila.mjs` sobre 10.000 rondas de
#147 (exactamente una candidata válida y las 4 distintas entre sí);
`verify_hilera.mjs` sobre 10.000 rondas de #148 (orden estrictamente
creciente y respuesta recalculada de forma independiente, con cobertura
real de los casos válido/inválido); `verify_crecimiento.mjs` sobre
10.000 rondas de #149 (paso de cruce recalculado por simulación paso a
paso, nunca con logaritmos, y siempre en el rango 2-9). Los 149
ejercicios cargan sin error de consola, y los 4 nuevos se jugaron de
verdad en el navegador calculando la respuesta correcta de forma
independiente, confirmando que el marcador sube +10 en cada acierto; se
comprobó además en #148 que fallar a propósito resta una vida con el
mensaje correcto.

**Hallazgo de auditoría (sin cambio de código):** antes de programar,
se descartaron 4 ideas por duplicar mecánicas ya existentes: Prime
Climb (colores por factores primos) ya es `game-colorprimos.js`
(#pack-11); Set (atributos todos-iguales-o-todos-distintos) ya es
`game-trio.js` (#pack-5); Rummikub (grupos y escaleras) ya es
`game-combina.js` (#pack-11); Yahtzee (elegir la categoría que más
puntúa) ya es `game-categorias.js` (#pack-11). También se descartó una
variante de dominó "que suma un número fijo" por ser la misma mecánica
de complemento a un total que `game-amigos10.js`, solo con otro disfraz.

## Ejercicios #150-#152 (duodécima tanda, 17-09-2026 noche) — tramo único

### Tramo único — [`css/pack-w.css`](./css/pack-w.css)

Sin filas `review` pendientes, se saltó el paso de revisión. Familias
usadas: 2 (prensa), 7 (manipulativos de aula) y 12 (investigación
educativa) — las 3 únicas que quedaban fuera de la unión de familias de
las 3 rondas anteriores. Tanda modesta (3 ideas): el catálogo (149
ejercicios antes de esta tanda) está ya muy saturado y la auditoría
previa a programar descartó 2 ideas más por duplicado (ver más abajo);
la familia 12 se investigó pero no dio ninguna mecánica nueva
transferible a un solo ejercicio (spaced retrieval es una propiedad del
reparto de rondas de toda la app, no de un ejercicio individual, y
productive struggle es un principio de diseño, no una mecánica).

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 150 | 🔗 Conexión numérica | Propiedades de los números | 6 números se reparten en secreto en 2 grupos de 3 que comparten una propiedad matemática cada uno; toca los 3 que crees que van juntos, sin que se diga cuál es la regla | NYT Connections (agrupar por categoría compartida sin decirla), familia 2 |
| 151 | 🦵 Salta a la decena | Estrategias de suma | Para sumar dos números por la estrategia de la recta numérica vacía, primero se salta hasta la siguiente decena; calcula el tamaño de ESE primer salto, no el resultado final | Recta numérica vacía / bridging through ten (Zearn, DreamBox, Singapore Math), familia 7 |
| 152 | 🥧 Suma de fracciones circulares | Fracciones con denominador común | Dos fracciones de denominador distinto se muestran como porciones de tarta; toca, en una tarta de referencia dividida en el mínimo común múltiplo, el número de porciones que representa la suma | Fracciones circulares (manipulativo de aula), adaptado para trabajar la suma con denominador común, familia 7 |

Verificación antes de publicar: `verify_conexion.mjs` sobre 3.000
rondas de #150 (fuerza bruta sobre las 10 particiones posibles de 6
números en 2 grupos de 3, confirmando que exactamente una es
"doblemente coherente" bajo el catálogo completo de 8 propiedades, no
solo las 2 usadas para generar la ronda); `verify_saltos.mjs` sobre
10.000 rondas de #151 (primer salto, aterrizaje y suma final
recalculados de forma independiente); `verify_sumafrac.mjs` sobre
10.000 rondas de #152 (mínimo común múltiplo y conversión de ambas
fracciones recalculados desde cero, suma siempre entera y sin pasarse
de una tarta completa). Los 152 ejercicios cargan sin error de consola,
y los 3 nuevos se jugaron de verdad en el navegador calculando la
respuesta correcta de forma independiente, confirmando que el marcador
sube +10 en cada acierto; se comprobó además en #151 que fallar a
propósito resta una vida con el mensaje correcto.

**Hallazgo de auditoría (sin cambio de código):** antes de programar,
se descartaron 2 ideas más por duplicar mecánicas ya existentes:
"construir un ángulo dado su valor arrastrando" ya es exactamente
`game-angulo.js`; "encontrar el paso que falla en un cálculo resuelto"
(worked examples + detección de error) ya es exactamente
`game-error.js`.

## Ejercicios #153-#154 (decimotercera tanda, 18-09-2026) — tramo único

### Tramo único — [`css/pack-x.css`](./css/pack-x.css)

Sin filas `review` pendientes. Familias usadas: 1 (apps edtech), 8
(retos) y 9 (museos) — las 3 únicas fuera de la unión de familias de
las 3 rondas anteriores. Tanda pequeña (2 ideas): el catálogo (152
ejercicios) sigue muy saturado. "La rueda cuadrada" (familia 9, aparcada
desde la primera ronda) volvió a estar disponible por rotación pero
sigue aparcada: rediseñando la mecánica, la lección matemática real se
reduce a "la separación entre baches debe igualar el lado del cuadrado",
demasiado trivial para el motor de curvas paramétricas que exigiría
dibujar bien. También se descartó "apila cajas por volumen en un
almacén" al descubrir que ya es exactamente `game-almacen.js`.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 153 | 🌱 El patrón que crece | Patrones crecientes | Un patrón visual de fichas crece paso a paso (se ven los pasos 1-3); hay que contar y deducir la regla para calcular un paso LEJANO (5-8) que no está dibujado | Visual Patterns (Fawn Nguyen / Kent Haines, rutina de aula), familia 8 |
| 154 | 🏃 Esquiva a tiempo | Velocidad y tiempo | Un obstáculo se acerca a una distancia y velocidad dadas; decide con un solo toque si te da tiempo a cruzar tu propia distancia a tu propia velocidad antes de que llegue | Inventado (combinación forzada: velocidad+esquivar+videojuego retro) |

Verificación antes de publicar: `verify_patronfiguras.mjs` sobre 10.000
rondas de #153 (respuesta recalculada de forma independiente a partir
de la regla lineal, rango de paso lejano y parámetros siempre dentro de
lo esperado); `verify_esquiva.mjs` sobre 10.000 rondas de #154 (ambos
tiempos recalculados de forma independiente por división exacta, nunca
un empate entre el tiempo disponible y el necesario, cobertura
equilibrada de ambos veredictos). Los 154 ejercicios cargan sin error
de consola, y los 2 nuevos se jugaron de verdad en el navegador
calculando la respuesta correcta de forma independiente, confirmando
que el marcador sube +10 en cada acierto; se comprobó además en #154
que fallar a propósito resta una vida con el mensaje correcto.

## Ejercicios #155-#156 (decimocuarta tanda, 18-09-2026) — tramo único

### Tramo único — [`css/pack-y.css`](./css/pack-y.css)

Sin filas `review` pendientes. Familias usadas: 4 (puzzles de lápiz y
papel), 10 (concursos de TV y juegos populares) y 11 (vida real) — las
3 únicas fuera de la unión de familias de las 3 rondas anteriores.
Tanda pequeña (2 ideas): "lotería/bingo mexicana" (familia 10) se
descartó por no encarnar una mecánica matemática concreta (es
principalmente emparejar por azar); "reparte la cuenta con propina"
(familia 11) se descartó por combinar dos habilidades ya cubiertas por
separado (porcentajes en `rebajas`, reparto igualitario en
`compra`/`trueque`) sin mecánica nueva.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 155 | 🔪 Sudoku asesino mini | Sudoku con jaulas | Sudoku 4×4 real (filas, columnas y cajas 2×2 sin repetir) sin pistas de partida: solo se ven jaulas con la suma de sus celdas (sin operador, sin repetir dígito dentro de la jaula) | Killer Sudoku, familia 4 — distinto de KenKen (cuadrado latino con operadores, sin restricción de caja) |
| 156 | ⚽ La clasificación | Puntos por resultado | Una racha de resultados (victoria/empate/derrota) de un equipo; suma los puntos totales con la regla victoria=3, empate=1, derrota=0 | Tablas de clasificación deportivas reales, familia 11 |

Verificación antes de publicar: `verify_asesino.mjs` (enumera por
fuerza bruta las 288 rejillas 4×4 válidas de sudoku, confirmadas todas
distintas y válidas; sobre 500 rondas de #155 comprueba que las jaulas
cubren las 16 celdas, que exactamente 1 de las 288 rejillas cumple
todas las sumas de jaula, y —tras el fix descrito abajo— que ninguna
jaula repite un dígito en la solución elegida); `verify_clasificacion.mjs`
sobre 10.000 rondas de #156 (puntos recalculados de forma
independiente contando victorias/empates/derrotas). Los 156 ejercicios
cargan sin error de consola, y los 2 nuevos se jugaron de verdad en el
navegador calculando la respuesta correcta de forma independiente,
confirmando que el marcador sube +10 en cada acierto; se comprobó
además en #156 que fallar a propósito resta una vida con el mensaje
correcto.

**Fallo real encontrado y corregido en #155 antes de publicar:** al
jugarlo de verdad varias veces seguidas, en aproximadamente 1 de cada 3
partidas la rejilla objetivamente correcta (reconstruida de forma
independiente resolviendo el puzzle desde las sumas de jaula visibles
en el DOM, sin tocar el estado interno del juego) se marcaba como
fallo. La causa: `generateAsesinoRound()` solo comprobaba que las sumas
de jaula tuvieran una única rejilla compatible entre las 288 posibles,
pero nunca comprobaba que, dentro de cada jaula, la solución elegida no
repitiera un dígito — algo que el propio sudoku de base NO impide,
porque una jaula puede cruzar filas, columnas y cajas sin restricción
alguna entre sí. El resultado: algunas rondas generaban una jaula cuya
ÚNICA solución posible (la correcta) repetía un dígito, violando la
regla de "sin repetidos en la jaula" que el propio juego exige al
comprobar la respuesta — la ronda era irresoluble incluso jugando
perfectamente. Corregido añadiendo `cagesHaveNoInternalRepeat()`: la
partición en jaulas se descarta y se reintenta si algún par de celdas
de una misma jaula comparte dígito en la solución, antes incluso de
comprobar la unicidad por sumas. Reproducido el fallo antes del cambio
(fallaba en 2 de 3 partidas jugadas de verdad en Chromium) y confirmado
que desaparece después (8 de 8 partidas correctas tras el fix).

## Ejercicio #157 (decimoquinta tanda, 18-09-2026) — tramo único

### Tramo único — [`css/pack-z.css`](./css/pack-z.css)

Sin filas `review` pendientes. Familias usadas: 3 (libros), 5 (juegos
de mesa) y 6 (mecánicas de videojuego) — las 3 únicas fuera de la
unión de familias de las 3 rondas anteriores. Tanda mínima (1 idea):
Mancala se descartó de nuevo (la captura real exige un tablero de dos
filas enfrentadas, y una versión de solo-siembra-circular se parecería
demasiado a `oca`); "dominó Matador" (suma fija de 7 en los extremos
abiertos) se descartó por depender de estado de un tablero multi-turno
difícil de comprimir en una sola ronda; Blokus se descartó de nuevo
(piezas geométricas ya cubiertas por pentominós/tangram-like).

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 157 | 🎮 Fusiona como en 2048 | Potencias de 2 | Una fila con fichas y huecos; al deslizar hacia la izquierda los huecos se cierran y dos fichas iguales que queden entonces juntas se fusionan duplicando su valor — calcula el mayor valor resultante | 2048 (Gabriele Cirulli), familia 6 |

Verificación antes de publicar: `verify_fusiona.mjs` sobre 20.000
rondas (simulación de deslizar+fusionar reimplementada de forma
independiente, confirmando que el máximo recalculado coincide siempre
con el valor fusionado, que ese máximo es siempre único —sin empates—,
y que la ficha "extra" opcional es siempre menor que el valor
fusionado para que la pregunta no se pueda responder sin simular la
fusión de verdad). Los 157 ejercicios cargan sin error de consola, y
el nuevo se jugó de verdad en el navegador (4 partidas con distintas
combinaciones generadas) calculando la respuesta correcta de forma
independiente, confirmando que el marcador sube +10 en cada acierto;
se comprobó además que fallar a propósito (respondiendo el valor SIN
fusionar, el error típico de no darse cuenta de que el hueco se cierra)
resta una vida con el mensaje correcto.

## Ejercicios #158-#159 (decimosexta tanda, 18-09-2026) — tramo único

### Tramo único — [`css/pack-aa.css`](./css/pack-aa.css)

Sin filas `review` pendientes. Familias elegidas: 2 (prensa), 7
(manipulativos de aula) y 12 (investigación educativa) — las 3 únicas
fuera de la unión de familias de las 3 rondas anteriores. Investigación
completamente estéril esta vez (12 consultas, cero ideas
aprovechables): "NYT Connections 3x3" (bonus puzzle de sept-2026) es el
mismo núcleo que `conexion` (#150, agrupar números por propiedad
compartida) con una rejilla más grande — descartado por duplicado real.
La balanza de dos platos para álgebra (PhET Equality Explorer), los
bloques base-10 para valor posicional y las fichas Numicon de
número-bonos ya existen en el catálogo como `balanza`, `bloques` y
`bonos10` respectivamente; el geoboard digital también ya existe como
`geoclavos`. La familia 12 solo devolvió principios de diseño
instructivo (retrieval practice, spaced repetition, productive
failure), no una mecánica de un solo ejercicio, igual que en rondas
anteriores. Con la investigación vacía, tanda 100% inventada mediante
el proceso 4.1-4.5 (concepto+verbo+contexto forzados, gesto que
encarna las matemáticas, inversión, restricción arbitraria):

- **`pitagoras`** (teorema de Pitágoras): una escalera apoyada en una
  pared forma un triángulo rectángulo con el suelo. Se usan solo ternas
  pitagóricas enteras (3,4,5 / 6,8,10 / 9,12,15 / 5,12,13 / 8,15,17 /
  7,24,25) para que la respuesta sea siempre un entero exacto sin
  ambigüedad. El lado que falta rota entre la hipotenusa (la escalera)
  y cada cateto, obligando a aplicar la fórmula en ambos sentidos
  (a²+b²=c² y c²−a²=b²) en vez de memorizar solo "sumar catetos". Tema
  geométrico completamente ausente del catálogo hasta ahora — se
  comprobó que ningún ejercicio existente enseña el teorema (los únicos
  usos de `Math.sqrt` en el resto del catálogo son distancias internas
  de colisión, sin relación pedagógica).
- **`caminos`** (combinatoria, regla de Pascal): cuenta caminos
  monótonos (solo derecha o solo abajo) en una cuadrícula. Cada ronda
  muestra ya rellenos los dos vecinos (izquierda y arriba) de la celda
  objetivo y solo pide esa celda, para que el gesto real sea aplicar la
  regla aditiva "izquierda + arriba", no memorizar la fórmula
  combinatoria C(n,k). Se comprobó que `laberinto` es un recorrido por
  regla de divisibilidad, sin relación con contar caminos, así que no
  hay solape de mecánica.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 158 | 📐 Escalera y pared | Teorema de Pitágoras | Escalera apoyada en una pared: dados dos lados del triángulo rectángulo (ternas pitagóricas enteras), halla el tercero — el lado desconocido rota entre hipotenusa y catetos | Inventado (proceso 4.1-4.5), geometría ausente del catálogo |
| 159 | 🧩 Cuadrícula de caminos | Combinatoria | Cuenta caminos monótonos (derecha/abajo) hasta una celda de una cuadrícula, sumando el valor de su vecina izquierda más el de su vecina de arriba (regla de Pascal) | Inventado (proceso 4.1-4.5), triángulo de Pascal |

Verificación antes de publicar: `verify_pitagoras.mjs` y
`verify_caminos.mjs`, cada uno sobre 20.000 rondas generadas,
reimplementando la comprobación desde cero (nunca reutilizando las
funciones internas del juego) — 0 fallos en ambos. Para `caminos` se
confirmó además, mediante fuerza bruta con programación dinámica
independiente sobre toda la rejilla, que "vecino-izquierda +
vecino-arriba" coincide siempre con el recuento real de caminos hasta
esa celda, incluida la celda de máximo valor posible en la rejilla
(70). Los 159 ejercicios cargan sin error de consola en Chromium a
400px de ancho, y los dos nuevos se jugaron de verdad en el navegador
(8 rondas correctas seguidas cada uno, deduciendo la respuesta
únicamente a partir del DOM —nunca del estado interno del juego—,
confirmando que el marcador sube +10 en cada acierto); se comprobó
además que fallar a propósito en ambos resta una vida con el mensaje
de feedback correcto. Se agotó la numeración de pack de una sola letra
(`pack-a.css` a `pack-z.css`); este tramo estrena `pack-aa.css` y la
convención de dos letras para los packs siguientes.

## Ejercicio #160 (decimoséptima tanda, 18-09-2026) — tramo único

### Tramo único — [`css/pack-ab.css`](./css/pack-ab.css)

Sin filas `review` pendientes. Familias elegidas: 1 (apps edtech), 8
(retos) y 9 (museos) — las 3 únicas fuera de la unión de familias de
las 3 rondas anteriores. Investigación de nuevo mayormente estéril (10
consultas): Duolingo Math, Khan Academy Kids, SplashLearn, Math
Playground/Coolmath4Kids no dieron ninguna mecánica nueva concreta;
olimpiadas/AMC 8 confirman temas ya cubiertos sin aportar mecánica de
un solo ejercicio; Exploratorium/MoMath no dieron detalle de mecánica
nueva. Se evaluó "lanzar fichas para estimar π" (Exploratorium,
Monte Carlo) y se descartó: para tener una única respuesta exacta
habría que fijar de antemano cuántos puntos caen dentro/fuera, lo que
lo convierte en un ejercicio de contar+dividir ya cubierto en espíritu
por `estima`/`fermi`, sin mecánica realmente nueva que compense la
complejidad visual de dibujar puntos dentro/fuera de un arco de forma
creíble.

Una idea sí pasó el filtro, de Zearn (tape diagrams, familia 1):
**`raciones`** — división de fracciones como MEDIDA REPETIDA (cuántas
raciones de tamaño 1/d caben en W litros enteros), en vez de como
reparto proporcional. Auditoría previa: `tiras` (tanda anterior) ya usa
un diagrama de tira para REPARTO PROPORCIONAL a:b de un total (dividir
como "compartir desigualmente según una razón"); aquí el concepto es
distinto — división como "cuántas veces cabe una fracción unitaria en
un entero" — así que se implementa con una RECTA NUMÉRICA de marcas
iguales, no una barra segmentada de dos partes, diferenciando también
el aspecto visual de `tiras` y de `recta` (arrastre continuo 0-20, sin
fracciones). La ronda rota entre pedir el número de raciones dado el
total (N = W×d) y pedir el total entero dadas las raciones ya servidas
(inversión 4.3, W = N/d), ambas derivadas del mismo par (W, d) para que
la respuesta sea siempre un entero exacto.

**Fallo real encontrado y corregido antes de publicar** (durante la
captura de pantalla de verificación a 400 px, no durante la simulación
en Node): en la dirección inversa, la recta dibujaba igualmente las
marcas de litro entero CON SU NÚMERO IMPRESO (0, 1, 2…) hasta el propio
límite W — como el ancho del dibujo coincide exactamente con la
respuesta, el último número impreso en el eje ERA la respuesta, así que
se podía acertar sin dividir nada, solo leyendo el eje. Corregido: en
la dirección inversa las marcas nunca distinguen "entero" de
"fracción" ni llevan número impreso — todas miden igual, así que hay
que contar las N marcas de verdad y dividir entre d de cabeza, tal
como pide el enunciado.

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 160 | 💊 Raciones de jarabe | División de fracciones | Recta numérica marcada en trozos de 1/d: halla cuántas raciones caben en W litros, o cuántos litros enteros son N raciones ya servidas | Zearn (tape diagrams), adaptado a recta para no solapar con `tiras` |

Verificación antes de publicar: `verify_raciones.mjs` sobre 20.000
rondas generadas (reimplementado desde cero), confirmando que
N = W×d siempre exactamente y que ambas direcciones dan un entero
sin resto, además de que el máximo N (90) cabe en el teclado de 2
dígitos. Los 141 ejercicios cargan sin error de consola en Chromium a
400 px de ancho. El nuevo se jugó de verdad en el navegador (10 rondas
correctas seguidas, forzando ambas direcciones, deduciendo la
respuesta únicamente del DOM, confirmando +10 en cada acierto tras
corregir el fallo de arriba); se comprobó además que fallar a
propósito resta una vida con el mensaje de feedback correcto.

## Ejercicios #161-#162 (decimoctava tanda, 18-09-2026) — tramo único

### Tramo único — [`css/pack-ac.css`](./css/pack-ac.css)

Sin filas `review` pendientes. Familias elegidas: 4 (puzzles de lápiz y
papel), 10 (concursos TV y juegos populares) y 11 (vida real) — las 3
únicas fuera de la unión de familias de las 3 rondas anteriores.
Familia 11 estéril de nuevo: precio por unidad se parece demasiado a
`rebajas`; tarifa de taxi es la misma estructura lineal que
`bolsa`/`horario`; conversión de divisas sería la misma mecánica de
arrastrar-hasta-la-conversión que ya hace `conversion` (solo cambia la
tasa). Familias 4 y 10 sí dieron ideas nuevas:

- **`rascacielos`** (familia 4, puzzle Skyscrapers/Torres de Nikoli):
  implementar el puzzle completo de deducción con pistas de borde
  exigiría resolver sobre las 576 combinaciones de un cuadrado latino
  4×4 — demasiado para una sola ronda de respuesta rápida. En su lugar
  se aísla el núcleo matemático real: contar cuántos edificios se ven
  desde un extremo de una fila de alturas distintas (un edificio se ve
  si es más alto que TODOS los anteriores — "máximos por prefijo",
  nunca contado antes en el catálogo). El skyline de barras ES la
  cuenta: no hace falta ningún paso intermedio, solo mirar qué barras
  destacan. También se consultaron Slitherlink, Masyu, Tents and Trees,
  Fillomino y Kurodoko, descartados por exigir una interfaz de dibujo
  de líneas/regiones que no encaja en una ronda de respuesta rápida.
- **`dardos`** (familia 10, dardos 501): elegir, entre varias tiradas
  candidatas (sencillo/doble/triple con su valor ya calculado), cuál
  deja el marcador EXACTAMENTE en 0. La resta sola no basta: si una
  tirada vale más de lo que queda, la partida real de dardos la anula
  ("bust"), así que hay que aplicar también esa restricción, no solo
  comparar números — la parte que un quiz de resta plano no tiene.
  También se consultaron Countdown numbers round (ya cubierto por
  `cifras`/`objetivo`) y Only Connect wall (ya cubierto por `conexion`).

| # | Juego | Tema | Mecánica | De dónde sale |
|---|---|---|---|---|
| 161 | 🏙️ Skyline de rascacielos | Visibilidad y máximos | Cuenta cuántos edificios se ven desde un extremo de una fila de alturas distintas (un edificio se ve si es más alto que todos los anteriores) | Skyscrapers/Torres (Nikoli), núcleo aislado del puzzle completo |
| 162 | 🎯 Cierra la partida | Resta con restricción | Elige, entre varias tiradas de dardos, cuál deja el marcador restante exactamente en 0 sin pasarse (bust) | Dardos 501 |

Verificación antes de publicar: `verify_rascacielos.mjs` y
`verify_dardos.mjs`, cada uno sobre 20.000 rondas generadas
(reimplementando la comprobación desde cero) — 0 fallos en ambos. Para
`dardos` se confirmó además que las 4 opciones son siempre valores
distintos, que exactamente una coincide con el marcador restante y que
siempre hay al menos una opción que se pasaría de verdad (bust real,
no decorativo). Los 143 ejercicios cargan sin error de consola en
Chromium a 400 px de ancho, y los dos nuevos se jugaron de verdad en el
navegador (8 rondas correctas seguidas cada uno, deduciendo la
respuesta únicamente del DOM, confirmando +10 en cada acierto); se
comprobó además que fallar a propósito en ambos resta una vida con el
mensaje de feedback correcto.

## Ejercicio #163 (primer juego grande multipantalla, 18-09-2026)

### Tramo único — [`css/pack-ad.css`](./css/pack-ad.css)

Primera tanda en **modo juego grande**: con 97 ejercicios sin valorar,
el encargo pasa de micro-ejercicios de una pantalla a juegos completos
con ciclo de aprendizaje. El tema sale del mapa de cobertura
(`work_state.cobertura` en Supabase): estadística y probabilidad era el
bloque más flojo (7 micro-ejercicios, y `ruleta` es el único que toca
probabilidad, en una sola vuelta sin frecuencias).

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 163 | 🧿 Laboratorio del azar | Probabilidad y frecuencia | Portada con progreso → tutorial interactivo (toca los sectores rojos, gira 20 veces y compara frecuencia con probabilidad) → nivel 1 fracción de la ruleta → nivel 2 diseña la ruleta (inversión) → nivel 3 ¿qué es más probable? (ruleta/dado/bolsa) → nivel 4 caza el dado trucado (60 tiradas) → casino (5 apuestas) → resultados con explicación de cada fallo y repaso | Inventado: ley de los grandes números + inversión 5.3 + "el fallo enseña" 5.6 |

**Ciclo de aprendizaje**: el tutorial es un ejemplo resuelto que se
manipula (no se lee); el nivel 1 lleva andamiaje (los sectores del
color van marcados) que desaparece en el repaso; los niveles cambian la
REPRESENTACIÓN (leer una fracción → construirla → compararla entre
dispositivos distintos → inferirla de frecuencias); el casino no quita
vidas y simula el resultado real para enseñar que el suceso más
probable también pierde a veces; la pantalla de resultados lista cada
error con su explicación y lo re-pregunta hasta acertar una vez. El
progreso (nivel máximo, fallos por tipo, partidas) se guarda en
`localStorage` y en la tabla `football_progress` (clave `game, player`,
creada con la Management API), y la portada ofrece "Continuar en el
nivel N".

**Generadores con solución única garantizada**: nivel 1, exactamente
una de las 4 fracciones coincide con el recuento de sectores; nivel 3 y
casino, los sucesos van separados al menos 8 puntos porcentuales y de
dispositivos distintos; nivel 4, el dado justo tiene todas las caras
entre 6 y 14 y el trucado una cara ≥ 22 con el resto ≤ 12 (60 tiradas
cada uno). Verificado con `verify_azar.mjs`: 20.000 rondas por
generador, recalculando las propiedades desde cero, 0 fallos. Los 144
ficheros de juego cargan sin error de consola, y el juego se recorrió
entero dos veces en Chromium a 400 px deduciendo cada jugada del DOM:
partida perfecta (17 aciertos, 170 pts) y partida con un fallo
deliberado en el nivel 1 (pierde una vida, el error aparece en
resultados, el repaso lo re-pregunta) — después la portada ya ofrece
"Continuar" con el progreso guardado.

## Ejercicio #164 (segundo juego grande, 18-09-2026)

### Tramo único — [`css/pack-ae.css`](./css/pack-ae.css)

Segundo juego grande de la misma tanda manual, sacado de la `cola` de
`work_state` (álgebra era uno de los huecos: no había ningún recorrido
de "de la balanza a la ecuación" con andamiaje que se retira).
`balanza` (#6) y `trueque` resuelven UNA ecuación por tanteo o por
intercambio; aquí el núcleo es la SECUENCIA de operaciones iguales en
los dos lados, y ese andamiaje desaparece etapa a etapa.

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 164 | 🪝 De la balanza a la ecuación | Ecuaciones de primer grado | Mapa de 5 etapas que se desbloquean → 1 Balanza (sacos x y pesas: quitar lo mismo de los dos platos y repartir) → 2 Símbolos (mismos botones, sin dibujo) → 3 Paso falso (juzgar si un paso ajeno es válido: inversión) → 4 Despeja de un golpe → 5 Reto a ciegas (tres ecuaciones que se comprueban al final) → resultados con explicación y repaso | Inventado: PhET Equality Explorer + inversión 5.3 + restricción "a ciegas" 5.4 |

**Ciclo de aprendizaje**: la balanza hace visible la regla ("lo que
quitas a un lado lo quitas al otro") y los botones SOLO permiten
operaciones simétricas; la etapa 2 retira el dibujo pero mantiene los
botones; la 3 invierte el papel (detectar los tres errores clásicos:
quitar solo a un lado, quitar sacos solo a un lado, restar en un lado y
sumar en el otro); la 4 exige hacerlo mentalmente; el reto quita el
feedback inmediato. El progreso (etapa máxima, fallos por tipo) se
guarda en `localStorage` y en `football_progress`, y el mapa permite
rejugar cualquier etapa superada.

**Generadores**: `a·x + c = b·x + d` con `a > b`, `x ∈ [1, 9]`,
`d ≤ 20`; `verify_ecuacion.mjs` (20.000 rondas por generador, 0 fallos)
comprueba que la solución es la única entera en [0, 50], que el reparto
final es exacto y que cada paso "válido" se corresponde con la misma
operación en ambos lados mientras cada paso "falso" rompe la solución
(sin ambigüedad). Los 145 ficheros de juego cargan sin error de
consola; flujo completo jugado dos veces en Chromium a 400 px
(partida perfecta: 16 aciertos, 160 pts; partida con fallo deliberado
en la balanza: pierde vida, el error se lista y el repaso lo cierra).
Pulido pendiente: en las etapas 1-2 el historial de pasos crece hacia
abajo y en móvil desplaza el dibujo de la balanza.

## Ejercicio #165 (tercer juego grande, 18-09-2026)

### Tramo único — [`css/pack-af.css`](./css/pack-af.css)

Tercer juego grande de la tanda manual, del hueco "medida: ningún juego
de estimación real con calibración progresiva" (`estima` es estimación
de orden de magnitud tipo Fermi, otra cosa).

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 165 | 🖐️ El medidor del cuerpo | Estimación de medidas | Mapa de misiones → Longitud (tutorial: poner palmos sobre el objeto hasta cubrirlo = medir es iterar la unidad; 4 rondas con margen 25→10 % y referente a escala solo en las dos primeras) → Capacidad (lo mismo con la botella de 1 L) → Reto sin referente (3 rondas mezcladas, ±15 %) → resultados con explicación y repaso | Estimation 180 (Andrew Stadel) + referentes corporales |

**Ciclo de aprendizaje**: el tutorial hace medir con el cuerpo (cada
toque pone un palmo; la cuenta × 20 da la longitud); las rondas
estrechan el margen y a mitad de misión retiran el referente, así que
hay que recordar el tamaño del palmo/botella; el reto quita el
referente del todo. Cada respuesta, acertada o no, superpone las
unidades sobre el objeto con el recuento exacto y la desviación en %:
el fallo enseña. Progreso (misiones superadas, fallos por tipo) en
`localStorage` y `football_progress`.

**Generadores**: longitudes múltiplos de 5 cm en [30, 200], capacidades
enteras en [2, 30] L; aceptación `|estimación − real|·100 ≤ % · real`
en aritmética entera (durante la verificación se vio que con coma
flotante el borde exacto —230 cm para 200 al 15 %— quedaba ambiguo y se
corrigió). `verify_medidor.mjs`: 20.000 rondas por misión, 0 fallos
(el valor exacto siempre entra, el doble y la mitad nunca, y la banda
entera coincide con la recalculada). Los 146 ficheros de juego cargan
sin error de consola; flujo completo jugado dos veces en Chromium a
400 px deduciendo el valor real de la GEOMETRÍA del dibujo (ancho/1,6
o alto/8), no de ningún atributo: partida perfecta (15 aciertos, 130
pts) y partida con fallo deliberado (pierde vida, error listado, repaso
lo cierra). Pulido pendiente: el dibujo de capacidad es poco legible
(recipiente bajo y ancho con hueco arriba) — merece un recipiente con
forma y una escala vertical.

## Ejercicio #166 (cuarto juego grande, 18-09-2026)

### Tramo único — [`css/pack-ag.css`](./css/pack-ag.css)

Cuarto y último juego grande de la tanda manual, del hueco "geometría:
nada de transformaciones encadenadas".

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 166 | 🗝️ Taller de transformaciones | Transformaciones geométricas | Mapa de 5 salas cerradas → salas 1-4 (traslación · giro · espejo · mezcla): llevar la figura hasta la silueta punteada encadenando ↑↓←→, giro de 90° horario alrededor del centro y espejo respecto a la línea vertical central, con presupuesto de movimientos → sala 5 (inversión): decir qué transformación ÚNICA convierte la figura en la silueta → resultados con la secuencia solución de cada sala fallada y repaso | Inventado: composición de isometrías en cuadrícula + inversión 5.3 |

**Ciclo de aprendizaje**: cada sala añade una transformación y sube el
presupuesto; las figuras son quirales (L, J, P), así que giro y espejo
nunca se confunden y ningún giro deshace un espejo; el fallo enseña la
secuencia solución sobre la silueta; la sala final invierte el reto.
Progreso (salas abiertas) en `localStorage` y `football_progress`.

**Generadores**: la silueta se obtiene aplicando una secuencia
aleatoria de movimientos permitidos (2-4 según la sala) y el presupuesto
es esa longitud + 1; `verify_transforma.mjs` (5.000 salas por nivel)
comprueba con un BFS propio que la silueta es alcanzable dentro del
presupuesto, que la secuencia declarada llega de verdad y que en la sala
5 exactamente una de las tres transformaciones convierte la figura en la
silueta — 0 fallos. Los 147 ficheros de juego cargan sin error de
consola; flujo completo jugado dos veces en Chromium a 400 px con un
resolutor BFS independiente que lee la figura y la silueta del DOM y
pulsa los botones: partida perfecta (11 aciertos, 110 pts) y partida con
fallo deliberado (agotar el presupuesto: pierde vida, se enseña la
solución, el error va a resultados y el repaso lo cierra).

## Ejercicio #167 (quinto juego grande, noche del 18-09-2026)

### Tramo — [`css/pack-ai.css`](./css/pack-ai.css)

Primera tanda nocturna con Fable. El juego sale de la `cola` de
`work_state` (hueco "no hay recorrido de estrategias de cálculo mental
enseñadas y luego exigidas"; `saltos` cubre solo "saltar a la decena"
en una ronda).

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 167 | 🥋 Escuela de cálculo mental | Estrategias de cálculo mental | Dojo con cinturones: blanco (dobles y casi dobles), amarillo (compensar), naranja (descomponer), verde (mitades y dobles: ×5, ×4, ×25) — cada uno con ejemplo manipulable (la cuenta se reescribe paso a paso al tocar), 3 rondas guiadas con los pasos a la vista y 2 a ciegas con cuenta atrás de 15 s; cinturón negro: problemas mezclados donde primero hay que ELEGIR la estrategia que encaja y luego resolver; resultados con la cuenta de cada fallo y repaso | Inventado: rutinas de "number talks" + inversión 5.3 (elegir la estrategia) |

**Ciclo de aprendizaje**: enseñar una estrategia con un ejemplo que se
manipula, practicarla con andamiaje (los pasos intermedios visibles),
retirarlo (a ciegas y contrarreloj) y, al final, invertir: reconocer
QUÉ estrategia pide cada problema. Progreso (cinturón máximo, fallos
por estrategia) en `localStorage` y `football_progress`.

**Generadores y clasificación excluyente**: cada problema del cinturón
negro se genera para encajar en una sola estrategia (multiplicación →
mitades; resta o sumando acabado en 8/9 → compensar; sumandos a
distancia ≤ 2 → dobles; el resto → descomponer). `verify_calculista.mjs`
(20.000 rondas por estrategia, clasificación reimplementada desde cero):
**cazó una ambigüedad real** — "dobles" generaba 7 + 9 o 18 + 19, que
la regla clasifica como "compensar"; corregido antes de publicar
haciendo que dobles nunca use números acabados en 8 o 9. Después, 0
fallos y distribución equilibrada (~25 % cada estrategia). Flujo
completo jugado dos veces en Chromium a 400 px leyendo el problema del
enunciado y recalculando: partida perfecta (5 cinturones, 340 pts) y
partida con fallo deliberado (vida perdida, error listado, repaso).

## Ejercicio #168 (sexto juego grande, noche del 18-09-2026)

### Tramo — [`css/pack-aj.css`](./css/pack-aj.css)

De la `cola` de `work_state` (hueco "gráficas de funciones lineales,
pendiente", sin ningún juego). `grafica` (#pack-e) dibuja la gráfica
proporcional de un enunciado arrastrando puntos en una ronda; aquí se
lee, se escribe y se cruza y = m·x + n con pendientes negativas y cortes
con el eje.

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 168 | 🎢 La cuesta de la recta | Funciones lineales | Tutorial "la escalera" (avanza 1 y mira cuánto sube: m y n aparecen sobre la recta manipulada) → tramo 1 leer la pendiente → tramo 2 leer la ecuación (opciones con los errores clásicos: signo de m, m y n intercambiados, n ± 1) → tramo 3 trazar la recta tocando dos puntos que la cumplan → tramo 4 "pasa por los aros" (ajustar m y n con botones hasta que la montaña rusa pase por dos aros: solución única) → reto "el corte" (tocar la intersección de dos rectas) → resultados y repaso | Inventado: montaña rusa + hallazgo Desmos Marbleslides (meta física que invita a iterar) |

**Ciclo de aprendizaje**: concreteness fading — la pendiente nace como
escalera dibujada sobre la recta y solo después se nombra m; leer →
escribir → construir → invertir (dado el objetivo físico, hallar los
parámetros) → componer (dos rectas). Progreso persistente en
`localStorage` y `football_progress`.

**Generadores** (todos por propiedades, `verify_pendiente.mjs`, 20.000
rondas por tramo, 0 fallos): pendientes enteras en −3..3 sin 0 y n en
−4..4 con al menos 3 puntos de retícula visibles; opciones de ecuación
siempre 4 pares distintos con una sola correcta; aros con pendiente y
ordenada enteras dentro del rango de los botones (solución única
recalculada desde los dos puntos); corte de dos rectas no paralelas en
un punto entero dentro de la rejilla (x recalculada). Flujo completo
jugado dos veces en Chromium a 400 px leyendo m y n de la GEOMETRÍA de
la línea (px → retícula), no de ningún atributo — de hecho la línea ya
no lleva `data-m`/`data-n`: se quitaron al ver que delataban la
respuesta en el DOM. Partida perfecta (16 aciertos, 160 pts) y partida
con fallo deliberado (vida perdida, error listado, repaso).

## Ejercicio #170 (octavo juego grande, noche del 18-09-2026)

### Tramo — [`css/pack-al.css`](./css/pack-al.css)

De la `cola` de `work_state` (hueco "potencias de 10 y notación
científica", sin ningún juego). Construido por un subagente con el
mismo contrato de casa y verificado aparte (simulación, contrato,
play-test y capturas rehechos por el orquestador antes de integrarlo).

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 170 | 🪐 Microscopio y telescopio | Notación científica | Tutorial "encuentra el virus" (un deslizador ◀ ▶ recorre 17 objetos reales de 10⁻⁷ m a 10⁹ m: cada paso divide o multiplica por 10) → nivel 1 "¿cuántos ceros?" (número escrito → m × 10ⁿ entre 4 opciones con los errores clásicos e ± 1 y −e) → nivel 2 "monta el número" (diales de mantisa y exponente con el decimal en vivo) → nivel 3 "salta de escala" (pasos ×10 entre dos objetos, 10ᵃ×10ᵇ y 10ᵃ÷10ᵇ con teclado) → reto "ordena sin escala" (4 objetos de menor a mayor, sin vidas) → resultados y repaso | Inventado: "Powers of Ten" (Eames) como paseo por escalas + hallazgo de concreteness fading |

**Ciclo de aprendizaje**: el exponente nace como "cuántos pasos de ×10"
entre cosas que se pueden imaginar (un virus, una hormiga, la Tierra) y
solo después se lee y se escribe como notación; leer → construir →
operar con exponentes → ordenar sin ayuda. Progreso persistente en
`localStorage` y `football_progress`.

**Generadores** (`verify_potencias.mjs`, 20.000 rondas por nivel, 0
fallos): tabla de 17 objetos con exponentes únicos en −7..9 y mantisas
enteras 1-9; m y e recalculados desde el texto del número; diferencia y
suma de exponentes recalculadas; orden recalculado por tamaño; opciones
siempre 4 distintas con una sola correcta. Flujo completo jugado dos
veces en Chromium a 400 px: partida perfecta (13 aciertos, 130 pts) y
partida con fallo deliberado en el nivel 1 (vida perdida, error listado,
repaso superado, portada con "Has jugado 2 veces").

## Ejercicio #171 (noveno juego grande, noche del 18-09-2026)

### Tramo — [`css/pack-am.css`](./css/pack-am.css)

De la `cola` de `work_state` (hueco "crecimiento exponencial, interés
compuesto y porcentajes encadenados", sin ningún juego). `porcentaje`
y `rebajas` (tandas anteriores) calculan un porcentaje suelto en una
ronda; aquí la idea es una sola, repetida en cinco disfraces: sumar
siempre lo mismo es una recta, multiplicar siempre por lo mismo es una
bola de nieve.

| # | Juego | Tema | Pantallas | De dónde sale |
|---|---|---|---|---|
| 171 | ❄️ Bola de nieve | Crecimiento exponencial | Tutorial "el arroz del tablero" (toca casilla a casilla: 1, 2, 4, … 128, y al lado lo que llevarías sumando de 1 en 1) → tramo 1 "Dobla" (sucesión geométrica dibujada como bolas crecientes; pide el término 4.º o 5.º; distractor "seguir sumando la última diferencia") → tramo 2 "La hucha" (capital al 10/20/50 % durante 1-2 años; distractor interés simple) → tramo 3 "Rebajas encadenadas" (un +20 % y un −20 % no se anulan: ×0,96; distractor "sumar los porcentajes") → tramo 4 "Lineal contra bola" (predice en qué mes la bola adelanta a la recta y luego ves crecer las barras mes a mes) → reto "¿cuántos años?" (años hasta doblar/triplicar/cuadruplicar un capital, sin vidas) → resultados y repaso | Inventado: leyenda del ajedrez y el arroz + hallazgo "feedback informativo: predecir y luego simular" |

**Ciclo de aprendizaje**: concreto (granos, bolas) → numérico
(sucesión) → dinero (interés compuesto) → trampa clásica (porcentajes
encadenados) → comparación con lo lineal (predicción + simulación) →
inversión (dado el objetivo, ¿cuántos pasos?). En cada fallo la
explicación dice qué modelo mental produjo el distractor elegido
("eso sería seguir sumando", "eso sería sumar los porcentajes").
Progreso persistente en `localStorage` y `football_progress`.

**Generadores** (`verify_bola.mjs`, 20.000 rondas por tramo, 0 fallos):
sucesiones a₁·r^(n−1) con r ∈ {2, 3}; capitales múltiplos de 100 y
porcentajes en {10, 20, 50} para que todo salga entero; pares de
porcentajes encadenados que siempre dan céntimos exactos, con la trampa
"se anulan" siempre entre las opciones cuando toca; plan lineal contra
exponencial con mes de adelantamiento único entre 2 y 8 y sin empates;
reto con la cadena año a año recalculada. Opciones siempre 4 distintas.
Flujo completo jugado dos veces en Chromium a 400 px deduciendo cada
respuesta de los parámetros del enunciado (nunca de la respuesta):
partida perfecta (16 aciertos, 160 pts) y partida con fallo deliberado
(vida perdida, error listado, repaso).

## Versiones (v2) y bandeja "Revisar"

Cuando un ejercicio recibe una vuelta de mejoras, se marca con un
distintivo **v2**, **v3**... en su tarjeta y en la cabecera de la
partida. Al publicarlo, quien hace la vuelta **borra su fila** de
`football_ratings` (`DELETE .../football_ratings?game=eq.<id>`): así
ese ejercicio vuelve a "🆕 Nuevos" para poder juzgarlo otra vez desde
cero. El menú además muestra un aviso con la nota de `last_rework`
(ver [`js/ratings.js`](./js/ratings.js), función `fetchReworkNote`)
diciendo qué se ha tocado y por qué. Las valoraciones 👍 y 👎 no se
tocan.

### Vuelta de la generación 2

- **Motor de preguntas (afecta a los 18 ejercicios de tipo pregunta)**:
  racha visible con bonus creciente (+2 por acierto encadenado a partir
  del tercero, hasta +10), resumen final con aciertos/intentos y mejor
  racha, y un modo nuevo de responder **escribiendo en un teclado
  numérico** en vez de elegir entre opciones.
- **#13 Cálculo veloz, #21 Problemas de palabras, #28 Temperaturas**:
  pasan a teclado numérico — hay que producir el resultado, no
  reconocerlo entre cuatro botones (con botón ± para los negativos).
- **#12 Mayor o menor**: los dos números se sitúan sobre una recta
  numérica compartida en vez de leerse sueltos, que es lo que explica
  de verdad por qué uno es mayor (y sostiene los negativos).
- **#16 Media y moda**: los datos se muestran como fichas y, en las
  rondas de mediana, ya ordenados — la pregunta era más de lectura
  apelotonada que de estadística.

### Vuelta del 17-09-2026 (tarde) — los 2 marcados con 🔧 otra vez

Tras la vuelta de la mañana, el usuario volvió a marcar **#6 Equilibra la
balanza** y **#36 Plano cartesiano** para revisar — sin nota escrita (la
casilla de texto para explicar el motivo se añadió esa misma tarde; ver
más abajo). Sin una queja concreta, esta vuelta se dedicó a **jugarlos de
verdad**: leer el estado del juego, calcular la respuesta correcta a mano
y confirmar que puntúa, además de simular sus generadores 20-30 mil veces
cada uno. Ninguno tenía rondas degeneradas ni fallos de puntuación — pero
jugándolos aparecieron dos defectos de diseño reales, no cosméticos:

| # | Juego | Qué chirriaba (encontrado jugando, no solo leyendo) | Qué hace ahora |
|---|---|---|---|
| 6 | 🏋️ Equilibra la balanza | El presupuesto de "ajustes" era fijo (8) en **todas** las rondas. Jugando de verdad: el coste óptimo real ronda 2-3 ajustes de media (máx. 5), así que sobraban hasta 6-7 de margen — justo el tanteo a ciegas que el propio diseño decía evitar, y sin relación entre nivel y dificultad real | El presupuesto se ata al coste óptimo de cada ronda (`moveCost`) con un margen que se estrecha con el nivel: +3 al empezar, +1 en el nivel avanzado. Simulado (30k rondas/nivel): presupuesto medio pasa de 5,7 → 4,7 → 3,7 al subir de nivel, siempre ≥ coste real |
| 36 | 🗺️ Plano cartesiano | En el nivel más difícil (oblicuo, sin coordenadas escritas) uno de los dos lados seguía en escuadra (horizontal o vertical) — siempre había una "pata gratis" de la que copiar una coordenada sin sumar ningún vector completo | Ese nivel (`bothOblique`) tiene ahora los **dos** lados inclinados: no hay atajo, hay que sumar el vector (dx, dy) completo desde C igual que desde B |

Ambos suben a **v3** y vuelven a "🆕 Nuevos". Verificación: generador
simulado sin degenerados en los dos casos, y partida jugada de principio a
fin calculando la respuesta correcta en cada ronda (incluidas las rondas
del nivel más difícil tras el cambio), confirmando que el marcador sube.

### Vuelta del 17-09-2026 (noche) — #6 marcado 🔧 una TERCERA vez

Otra vez sin nota. Antes de tocar nada se jugaron **40 rondas óptimas de
verdad** en Chromium a 390px de ancho (leyendo los platos del DOM,
resolviendo la ecuación y moviendo el dial con el número mínimo de
ajustes): **cero fallos**, margen de ajustes siempre positivo (mínimo 1).
El generador y el presupuesto de la v3 estaban bien — el problema no era
matemático.

Una captura de pantalla lo dejó claro: la cuerda de cada plato era tan
fina (2px) y apagada (opacity 0.6) que los platos parecían **flotar
sueltos**, sin conexión visible con la viga — no se leía como una
balanza a simple vista, aunque los números por debajo fueran correctos.
Además, en un desequilibrio extremo la cuerda del lado que sube podía
calcular una altura negativa (0 real), desapareciendo del todo.

| # | Juego | Qué chirriaba | Qué hace ahora |
|---|---|---|---|
| 6 | 🏋️ Equilibra la balanza | Cuerdas casi invisibles (2px, semitransparentes): los platos no se leían conectados a la viga | Cuerdas más gruesas (3px) y de color sólido, con un punto de anclaje circular donde entran en el plato, y una altura mínima de 4px para que nunca desaparezcan |

Sube a **v4**. Verificación: repetidas las mismas 40 rondas óptimas tras
el cambio (0 fallos), capturas de pantalla en claro y oscuro confirmando
que ahora se lee como una balanza, y suite completa de 123 ejercicios sin
error de consola.

### Vuelta del 17-09-2026 — los 9 marcados con 🔧

Los nueve ejercicios que estaban en la bandeja "🔧 Revisar" se han
**rehecho de mecánica**, no retocado de estilo: en los nueve el gesto del
dedo tenía que pasar a ser la propia matemática. Todos suben a **v2** y
vuelven a "🆕 Nuevos" para juzgarlos de cero.

| # | Juego | Qué chirriaba | Qué hace ahora | De dónde sale la mecánica |
|---|---|---|---|---|
| 6 | 🏋️ Equilibra la balanza | Acumular pesas +1/+2/+5/+10 hacia un objetivo es "Llena el vaso" con kg, y con el +1 disponible no hay nada que pensar | Álgebra real: sacos de peso desconocido y pesas en los platos; el dedo mueve **la incógnita** y la balanza solo dice qué lado pesa más, nunca los totales. Ajustes contados (8), así que el barrido a ciegas no llega. Nivel 3: sacos en los dos platos (`k·x + a = m·x + b`) | Inversión 4.3 (hallar el operando) + manipulativo de balanza algebraica (Polypad, familia 1) |
| 36 | 🗺️ Plano cartesiano | "Toca la celda (x, y)": se cuentan celdas sin leer el plano, sin cuadrantes negativos y sin que importe el orden del par | "Cierra la figura": se dan tres vértices y hay que colocar el cuarto (D = A + C − B) en los cuatro cuadrantes, leyendo los ejes | Inversión 4.3 |
| 47 | 📦 Reparte en cajas | El total era siempre múltiplo del tamaño, así que nunca había resto y se resolvía repartiendo una a cada caja, sin dividir | "Sin sobras": el **resto es el protagonista** y hay que encontrar **todos** los tamaños que reparten exacto (los divisores de N) | Inversión 4.3 (todas las soluciones) |
| 49 | 🏗️ Construye la torre | Todos los bloques valían 1: "apilar" era pulsar N veces un contador, equivalente a teclear el número | Piezas de valores distintos y de un solo uso, cada una mide en pantalla lo que vale; llegar a la altura es un subset-sum de **solución única**, y hay que calcular la relación (doble, mitad, triple) antes de apilar | Inversión 4.3 + regletas Cuisenaire (familia 7) |
| 50 | 🖍️ Mide con la regla | Test de 13 opciones con una regla dibujada al lado. Y un error de concepto: pedía una **longitud** y se respondía sobre una escala de **posiciones** | La medida se **construye**: un extremo clavado en una marca que casi nunca es el 0 y se arrastra el otro hasta que mida lo pedido; el readout da la posición, no la longitud, así que hay que restar. Nivel 3: regla numerada de 5 en 5 | Inversión 4.3 + restricción 4.4 (un único gesto) |
| 56 | 🗓️ Calendario | Mitad búsqueda visual ("el tercer martes" se barre con la vista), mitad resta disfrazada que se contestaba sin mirar el calendario | Dos rondas de aritmética modular con el dedo: **colocar el 1** deduciendo su columna a partir de otra fecha (módulo 7, y el mes no se dibuja hasta confirmar), y **planificar** marcando todos los días "cada N desde el D" | Inversión 4.3 (construir el mes) |
| 58 | ⚗️ Mezclas y proporciones | Regla de tres con 4 botones; los iconos de la receta no participaban — cambiando las mates por capitales funcionaba igual | Se **estira** una torre de bloques hasta que la mezcla sabe igual (el alto ES la cantidad, estirar = multiplicar); la mitad de las rondas dan el lado grande, así que hay que dividir antes | Regla 4.2 (el gesto encarna el concepto) |
| 61 | 📉 Continúa la gráfica | Cuatro puntos sobre la curva: se acertaba a ojo prolongando la recta, sin calcular el patrón | Se **dibuja** la gráfica: enunciado + primer punto, y el resto salen planos para arrastrarlos a su altura. En nivel alto el eje x va de 2 en 2, así que leer el eje es parte del problema | Inversión 4.3 (dibujar en vez de elegir) |
| 64 | 💡 Bombillas binarias | Traductor decimal→binario: con el método voraz (la bombilla más grande que quepa) se resuelve sin entender nada, y el acarreo —lo que da sentido a la base 2— no aparecía nunca | "El contador": el juego **nunca dice el número**, pide `+1` / `−1` varias veces, y el gesto de apagar la fila de unos y encender el de al lado **es** el acarreo | Inversión 4.3 + restricción 4.4 (sin el número en pantalla) |

Bugs reales encontrados al rehacerlos, además del rediseño:

- **#6 Balanza**: `rounds++` corría en **cada pesa tocada**, así que
  `saveScore(rounds)` guardaba basura; los `setTimeout` no se
  registraban, así que al salir al menú a mitad de ronda se seguía
  pintando sobre un contenedor ya desmontado; y sin bloqueo se podían
  perder varias vidas de un solo golpe.
- **#36 Plano cartesiano** y **#64 Bombillas**: mismo fallo de
  temporizadores sin cancelar en la función de limpieza.
- **#61 Continúa la gráfica**: el punto pintado tapaba el círculo de
  agarre y el arrastre no arrancaba (lo encontró la prueba de navegador,
  no la lectura del código).
- Varios `do/while` tenían guardas **imposibles por construcción**
  (`end0 > CM`, `length < 2`, `target < 2`), es decir que no protegían de
  nada.
- **#50 Regla** y **#49 Torre** no tenían progresión ninguna: el rango
  era fijo para toda la partida.

### Fallo de toda la app encontrado al verificar esta vuelta

Un verificador independiente (que no escribió ninguno de los nueve)
jugó los 9 en el navegador y encontró un fallo que **no era de esta
tanda: venía de antes y afectaba a los 65 ejercicios**, porque está en
el patrón de la casa ([`js/game-vaso.js`](./js/game-vaso.js)) y en el
motor de preguntas ([`js/quiz-engine.js`](./js/quiz-engine.js)).

Con el end-card en pantalla, el botón **«← Menú»** de la barra superior
quedaba muerto: el listener llama a `finish(true)` y `finish` empieza
con `if (finished) return`, así que al terminar la partida el clic se
tragaba y nunca se llamaba a `onExit()`. No dejaba encerrado a nadie
(el "Volver al menú" del end-card sí funcionaba), pero era un botón
visible y habilitado que no hacía nada.

Arreglado en los **73 ficheros** afectados dejando que la guarda frene
solo los remates automáticos, no la salida del usuario:

```js
if (finished) return userExited ? onExit() : undefined;
```

Los estilos de esta vuelta viven en [`css/pack-f.css`](./css/pack-f.css).
Las clases viejas que estos nueve ya no usan se han dejado intactas en
`pack-a…pack-e` porque las usan otros ejercicios.



## Valoración (🆕 / 👍 / 👎 / 🔧)

Cada pantalla de juego tiene, debajo del propio juego, tres botones fijos:
"👎 No me gusta", "🔧 Revisar" y "👍 Me gusta". Al pulsar "🔧 Revisar" se
abre un cuadro para escribir **qué falla** (opcional): ese texto se
guarda junto con la valoración y es lo primero que lee quien mejora el
ejercicio, en vez de tener que adivinarlo. Al pulsar "👎"/"👍", o al
guardar la nota de "🔧", el juego pasa a esa categoría y vuelves directo
al menú para ver dónde ha aterrizado (reabrir el ejercicio marcado con
"🔧" deja editar la nota o quitarlo de la bandeja; pulsar "👎"/"👍" otra
vez, desde la pantalla del juego, lo devuelve a "Nuevo"). El menú
principal tiene cuatro pestañas —🆕 Nuevos, 👍 Me gusta, 👎 No me gusta,
🔧 Revisar— que filtran la cuadrícula según la valoración, y en "🔧
Revisar" cada tarjeta muestra un resumen de la nota. Esto se guarda en
la tabla `football_ratings` de Supabase (compartido entre dispositivos,
no es solo del navegador — así lo puede leer también el agente que
revisa y mejora los ejercicios). **"🔧 Revisar" significa "me gusta la
idea pero algo falla o se puede mejorar"** — es la señal para volver a
ese ejercicio, probarlo a fondo y arreglarlo/mejorarlo antes de pasar a
"👍 Me gusta". Esto se guarda en `localStorage` del navegador (es una
preferencia personal de exploración, no vive en Supabase ni se
comparte entre dispositivos).

## Auditoría de consistencia (2026-09-16)

Se revisó generador por generador la lógica de los 20 ejercicios
originales y se encontraron y arreglaron, con simulaciones de decenas
de miles de rondas antes/después de cada arreglo:

- **#17/#18 Distancias/Pesos**: conversiones entre unidades muy
  dispares (mm→km, g→t) redondeaban a "0" y la ronda se quedaba con una
  única opción posible. Arreglado regenerando hasta un resultado real.
- **#16 Media y moda**: ~15% de las rondas de "moda" tenían un empate
  accidental entre dos números. Arreglado forzando una moda única.
- **#19 La tarta**: ~32% de las rondas no llegaban a 4 opciones
  distintas porque el rango de distractores era demasiado estrecho.
  Arreglado sorteando en todo el rango posible.
- **#7 Memoria**: ~11% de las partidas tenían dos cartas con el mismo
  texto (confuso — solo una de las dos emparejaba de verdad). Arreglado
  forzando texto único en las 12 caras.
- **#11 Une los puntos**: el conteo salteado siempre empezaba justo en
  el propio "salto" (2,2,2…), sin variedad. Ahora varía el inicio.
- **#3/#11 Ordena/Une los puntos**: puntuaban distinto al resto de
  juegos (+5 por toque, +15 por ronda) — normalizado a +10 por ronda
  completada, igual que el resto.
- **#7 Memoria**: no tenía ninguna señal de fallo (a diferencia de
  todos los demás, con corazones de vida) — se añadió un contador de
  fallos (❌) junto al de parejas.

Al construir los 20 ejercicios nuevos (#21-#40) se aplicó la misma
disciplina desde el principio — cada generador con aleatoriedad se
probó miles de veces antes de darlo por bueno — y aun así aparecieron
más casos reales del mismo tipo de fallo (empates y rangos de
distractores demasiado estrechos), ya corregidos: la ruleta de
probabilidad (#30) podía salir con dos colores empatados en el trozo
más grande (~40% de las rondas), el árbol de factores (#26) podía
tocarle un número primo sin factores propios (~25%), el lector de
gráficos (#25) podía tener barras empatadas en el máximo/mínimo (~7%),
y el primer diseño de Simetría (#37) dejaba varias celdas igual de
plausibles como "la que falta" en vez de una sola inequívoca.

## 1. Configura tus credenciales

Ya viene configurado en [`config.js`](./config.js) con el proyecto
compartido de este hosting. Si quieres apuntar a otro proyecto:

```js
window.FOOTBALL_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-KEY",
  tablePrefix: "football_",
};
```

## 2. Tabla de puntuaciones

```sql
create table football_scores (
  id bigint generated always as identity primary key,
  game text not null,
  score int not null,
  rounds int,
  avg_ms int,
  created_at timestamptz default now()
);

alter table football_scores enable row level security;

create policy "allow anon read" on football_scores
  for select to anon using (true);

create policy "allow anon insert" on football_scores
  for insert to anon with check (true);
```

## 3. Publica el sitio (GitHub Pages)

Esta app se despliega junto con el resto del hosting desde la raíz del
repo — ver el paso 3 del [README general](../README.md#3-publica-el-hosting-github-pages).
Una vez publicado, esta app queda en:

`https://<tu-usuario>.github.io/Train/football/`

## Qué hace la app

- Menú con los 171 ejercicios numerados, organizados en pestañas
  🆕/👍/👎/🔧; cada uno abre en su propia pantalla (`#/game/<id>`), sin
  recargar la página.
- Motor de preguntas compartido (`js/quiz-engine.js`) para los 18
  ejercicios de "pregunta + opciones o teclado" (`js/games-data.js` y
  `js/games-data-2.js`); los otros 153 (`js/game-*.js` y
  `js/balloons-game.js`) tienen cada uno su propia mecánica de
  interacción (arrastrar, tocar en orden, emparejar, construir,
  escribir, clasificar, recorrer…).
- Los estilos de cada tanda viven en su propio `css/pack-<letra(s)>.css`
  (de `pack-a.css` a `pack-z.css`, y de `pack-aa.css` en adelante una
  vez agotado el alfabeto de una sola letra, uno por tramo temático),
  para que tocar una tanda no arrastre a las demás.
- Guarda cada partida en `football_scores` y muestra las últimas en el
  menú.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app (las llamadas a Supabase nunca se cachean). Su
  caché usa el prefijo `football-shell-`.
- Al pie de página muestra un `build <hash>` para confirmar de un
  vistazo qué versión está sirviendo GitHub Pages.
