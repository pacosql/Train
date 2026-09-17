# Math Games 🧠

PWA (sin build, HTML/CSS/JS puro) con **113 ejercicios de matemáticas**,
cada uno numerado (#1-#113) para poder referirse a ellos sin ambigüedad.
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

## Versiones (v2) y bandeja "Revisar"

Cuando un ejercicio recibe una vuelta de mejoras, se marca con un
distintivo **v2** en su tarjeta y en la cabecera de la partida. Al
publicarse una tanda de mejoras, la app sube su `REWORK_GENERATION`
(ver [`js/ratings.js`](./js/ratings.js)) y, la primera vez que se abre
después, **vacía la bandeja "🔧 Revisar"**: esos ejercicios vuelven a
"🆕 Nuevos" para poder juzgarlos otra vez desde cero, con un aviso en
el menú diciendo cuáles han vuelto. Las valoraciones 👍 y 👎 no se
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

- Menú con los 113 ejercicios numerados, organizados en pestañas
  🆕/👍/👎/🔧; cada uno abre en su propia pantalla (`#/game/<id>`), sin
  recargar la página.
- Motor de preguntas compartido (`js/quiz-engine.js`) para los 18
  ejercicios de "pregunta + opciones o teclado" (`js/games-data.js` y
  `js/games-data-2.js`); los otros 95 (`js/game-*.js` y
  `js/balloons-game.js`) tienen cada uno su propia mecánica de
  interacción (arrastrar, tocar en orden, emparejar, construir,
  escribir, clasificar, recorrer…).
- Los estilos de cada tanda viven en su propio `css/pack-<letra>.css`
  (de `pack-a.css` a `pack-o.css`, uno por tramo temático), para que
  tocar una tanda no arrastre a las demás.
- Guarda cada partida en `football_scores` y muestra las últimas en el
  menú.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app (las llamadas a Supabase nunca se cachean). Su
  caché usa el prefijo `football-shell-`.
- Al pie de página muestra un `build <hash>` para confirmar de un
  vistazo qué versión está sirviendo GitHub Pages.
