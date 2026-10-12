// Ejercicios #223-#322: 100 ejercicios "como en el cuaderno" (primaria y ESO).
// Cada uno es un procedimiento real del colegio español dibujado como en el
// libro (la caja de dividir, la raya de factorizar, Ruffini…), con una línea 💡
// que explica el porqué con los números de cada ronda. Tanda del 12-10-2026.
import { mountAnteriorGame } from "./game-anterior.js";
import { mountDoblemitadGame } from "./game-doblemitad.js";
import { mountOrdinalesGame } from "./game-ordinales.js";
import { mountTablacienGame } from "./game-tablacien.js";
import { mountDescomponGame } from "./game-descompon.js";
import { mountParesimparesGame } from "./game-paresimpares.js";
import { mountCuantasdecenasGame } from "./game-cuantasdecenas.js";
import { mountSumarepetidaGame } from "./game-sumarepetida.js";
import { mountFamiliaGame } from "./game-familia.js";
import { mountFaltaparaGame } from "./game-faltapara.js";
import { mountMultiplicaGame } from "./game-multiplica.js";
import { mountCajaGame } from "./game-caja.js";
import { mountDecimalescolumnaGame } from "./game-decimalescolumna.js";
import { mountCifraquefaltaGame } from "./game-cifraquefalta.js";
import { mountPruebarestaGame } from "./game-pruebaresta.js";
import { mountPolinomicaGame } from "./game-polinomica.js";
import { mountDecimasGame } from "./game-decimas.js";
import { mountCerosGame } from "./game-ceros.js";
import { mountRedondeaGame } from "./game-redondea.js";
import { mountEscribefraccionGame } from "./game-escribefraccion.js";
import { mountEscalaunidadesGame } from "./game-escalaunidades.js";
import { mountMedidascomplejasGame } from "./game-medidascomplejas.js";
import { mountHorasminGame } from "./game-horasmin.js";
import { mountFracciondehoraGame } from "./game-fracciondehora.js";
import { mountEuroscentimosGame } from "./game-euroscentimos.js";
import { mountDistributivaGame } from "./game-distributiva.js";
import { mountDivisibleGame } from "./game-divisible.js";
import { mountCincomultiplosGame } from "./game-cincomultiplos.js";
import { mountListadivisoresGame } from "./game-listadivisores.js";
import { mountSignoGame } from "./game-signo.js";
import { mountPiramideGame } from "./game-piramide.js";
import { mountRuedaGame } from "./game-rueda.js";
import { mountCrucigramaGame } from "./game-crucigrama.js";
import { mountTablahuecosGame } from "./game-tablahuecos.js";
import { mountMaquinaGame } from "./game-maquina.js";
import { mountLeefraccionesGame } from "./game-leefracciones.js";
import { mountPintafraccionGame } from "./game-pintafraccion.js";
import { mountMixtoGame } from "./game-mixto.js";
import { mountComundenominadorGame } from "./game-comundenominador.js";
import { mountFraccionesopGame } from "./game-fraccionesop.js";
import { mountFactorizaGame } from "./game-factoriza.js";
import { mountMcmfactoresGame } from "./game-mcmfactores.js";
import { mountRaizalgoritmoGame } from "./game-raizalgoritmo.js";
import { mountCelosiaGame } from "./game-celosia.js";
import { mountSiglosGame } from "./game-siglos.js";
import { mountReglatresGame } from "./game-reglatres.js";
import { mountSexagesimalGame } from "./game-sexagesimal.js";
import { mountCircunferenciaGame } from "./game-circunferencia.js";
import { mountAreaformulaGame } from "./game-areaformula.js";
import { mountVolumenesGame } from "./game-volumenes.js";
import { mountFracadecimalGame } from "./game-fracadecimal.js";
import { mountTresformasGame } from "./game-tresformas.js";
import { mountMediaGame } from "./game-media.js";
import { mountFrecuenciasGame } from "./game-frecuencias.js";
import { mountSectoresGame } from "./game-sectores.js";
import { mountElementoscirculoGame } from "./game-elementoscirculo.js";
import { mountElementostrianguloGame } from "./game-elementostriangulo.js";
import { mountClasificatriangulosGame } from "./game-clasificatriangulos.js";
import { mountAngulostipoGame } from "./game-angulostipo.js";
import { mountRectasparalelasGame } from "./game-rectasparalelas.js";
import { mountAngulosinterioresGame } from "./game-angulosinteriores.js";
import { mountTerminosGame } from "./game-terminos.js";
import { mountDobleentradaGame } from "./game-dobleentrada.js";
import { mountCombinacionesGame } from "./game-combinaciones.js";
import { mountDosdadosGame } from "./game-dosdados.js";
import { mountPropiedadespotenciasGame } from "./game-propiedadespotencias.js";
import { mountAbsolutoGame } from "./game-absoluto.js";
import { mountPasosGame } from "./game-pasos.js";
import { mountLenguajealgebraicoGame } from "./game-lenguajealgebraico.js";
import { mountMonomiosGame } from "./game-monomios.js";
import { mountValornumericoGame } from "./game-valornumerico.js";
import { mountSumapolinomiosGame } from "./game-sumapolinomios.js";
import { mountNotablesGame } from "./game-notables.js";
import { mountSacafactorGame } from "./game-sacafactor.js";
import { mountSegundogradoGame } from "./game-segundogrado.js";
import { mountSistemaGame } from "./game-sistema.js";
import { mountInecuacionGame } from "./game-inecuacion.js";
import { mountIntervalosGame } from "./game-intervalos.js";
import { mountConsecutivosGame } from "./game-consecutivos.js";
import { mountEdadesGame } from "./game-edades.js";
import { mountTalesGame } from "./game-tales.js";
import { mountTrigoGame } from "./game-trigo.js";
import { mountLogaritmoGame } from "./game-logaritmo.js";
import { mountRadicalesGame } from "./game-radicales.js";
import { mountGeneratrizGame } from "./game-generatriz.js";
import { mountProgresionGame } from "./game-progresion.js";
import { mountLaplaceGame } from "./game-laplace.js";
import { mountRepartoGame } from "./game-reparto.js";
import { mountInteresGame } from "./game-interes.js";
import { mountCambiodivisasGame } from "./game-cambiodivisas.js";
import { mountRuffiniGame } from "./game-ruffini.js";
import { mountTablavaloresGame } from "./game-tablavalores.js";
import { mountDespejaformulaGame } from "./game-despejaformula.js";
import { mountErroresGame } from "./game-errores.js";
import { mountKmhmsGame } from "./game-kmhms.js";
import { mountBingoGame } from "./game-bingo.js";
import { mountDominoGame } from "./game-domino.js";
import { mountPascalGame } from "./game-pascal.js";
import { mountGaussGame } from "./game-gauss.js";
import { mountTrucosGame } from "./game-trucos.js";

export const GAMES_PACK_39 = [
  { id: "anterior", title: "Anterior y posterior", emoji: "↔️", topic: "Cuaderno · 1º-2º", custom: mountAnteriorGame },
  { id: "doblemitad", title: "Doble y mitad", emoji: "✌️", topic: "Cuaderno · 1º-3º", custom: mountDoblemitadGame },
  { id: "ordinales", title: "Ordinales", emoji: "🏅", topic: "Cuaderno · 1º-2º", custom: mountOrdinalesGame },
  { id: "tablacien", title: "La tabla del 100", emoji: "🗒️", topic: "Cuaderno · 1º-2º", custom: mountTablacienGame },
  { id: "descompon", title: "Unidades, decenas y centenas", emoji: "🏢", topic: "Cuaderno · 1º-3º", custom: mountDescomponGame },
  { id: "paresimpares", title: "Par o impar", emoji: "👫", topic: "Cuaderno · 1º-2º", custom: mountParesimparesGame },
  { id: "cuantasdecenas", title: "¿Cuántas decenas hay?", emoji: "🎳", topic: "Cuaderno · 2º-3º", custom: mountCuantasdecenasGame },
  { id: "sumarepetida", title: "Suma repetida y multiplicación", emoji: "🐣", topic: "Cuaderno · 2º-3º", custom: mountSumarepetidaGame },
  { id: "familia", title: "La familia de operaciones", emoji: "👨‍👩‍👧", topic: "Cuaderno · 1º-3º", custom: mountFamiliaGame },
  { id: "faltapara", title: "¿Cuánto falta?", emoji: "⛽", topic: "Cuaderno · 2º-4º", custom: mountFaltaparaGame },
  { id: "multiplica", title: "Multiplica en columna", emoji: "📝", topic: "Cuaderno · 3º-5º", custom: mountMultiplicaGame },
  { id: "caja", title: "La caja de dividir", emoji: "📮", topic: "Cuaderno · 3º-6º", custom: mountCajaGame },
  { id: "decimalescolumna", title: "Decimales en columna", emoji: "📃", topic: "Cuaderno · 4º-6º", custom: mountDecimalescolumnaGame },
  { id: "cifraquefalta", title: "La cifra que falta", emoji: "🎐", topic: "Cuaderno · 3º-5º", custom: mountCifraquefaltaGame },
  { id: "pruebaresta", title: "La prueba de la resta", emoji: "✔️", topic: "Cuaderno · 2º-5º", custom: mountPruebarestaGame },
  { id: "polinomica", title: "Descomposición polinómica", emoji: "🎼", topic: "Cuaderno · 3º-5º", custom: mountPolinomicaGame },
  { id: "decimas", title: "Décimas, centésimas y milésimas", emoji: "🎏", topic: "Cuaderno · 4º-6º", custom: mountDecimasGame },
  { id: "ceros", title: "Por 10, 100 y 1.000", emoji: "0️⃣", topic: "Cuaderno · 3º-5º", custom: mountCerosGame },
  { id: "redondea", title: "Redondea", emoji: "🏀", topic: "Cuaderno · 3º-5º", custom: mountRedondeaGame },
  { id: "escribefraccion", title: "Escribe la fracción", emoji: "✍️", topic: "Cuaderno · 3º-5º", custom: mountEscribefraccionGame },
  { id: "escalaunidades", title: "La escalera de unidades", emoji: "🛗", topic: "Cuaderno · 3º-6º", custom: mountEscalaunidadesGame },
  { id: "medidascomplejas", title: "Forma compleja e incompleja", emoji: "🪡", topic: "Cuaderno · 4º-6º", custom: mountMedidascomplejasGame },
  { id: "horasmin", title: "Horas y minutos", emoji: "⏰", topic: "Cuaderno · 3º-5º", custom: mountHorasminGame },
  { id: "fracciondehora", title: "Fracciones de hora", emoji: "🕒", topic: "Cuaderno · 3º-5º", custom: mountFracciondehoraGame },
  { id: "euroscentimos", title: "Euros y céntimos", emoji: "💶", topic: "Cuaderno · 2º-4º", custom: mountEuroscentimosGame },
  { id: "distributiva", title: "Propiedades de las operaciones", emoji: "🪅", topic: "Cuaderno · 3º-5º", custom: mountDistributivaGame },
  { id: "divisible", title: "¿Es divisible?", emoji: "🪆", topic: "Cuaderno · 4º-6º", custom: mountDivisibleGame },
  { id: "cincomultiplos", title: "Los primeros múltiplos", emoji: "✳️", topic: "Cuaderno · 3º-5º", custom: mountCincomultiplosGame },
  { id: "listadivisores", title: "Todos los divisores", emoji: "⛓️", topic: "Cuaderno · 4º-6º", custom: mountListadivisoresGame },
  { id: "signo", title: "El signo que falta", emoji: "❓", topic: "Cuaderno · 2º-4º", custom: mountSignoGame },
  { id: "piramide", title: "Pirámide de sumas", emoji: "⛰️", topic: "Cuaderno · 2º-5º", custom: mountPiramideGame },
  { id: "rueda", title: "La rueda de operaciones", emoji: "🛞", topic: "Cuaderno · 2º-4º", custom: mountRuedaGame },
  { id: "crucigrama", title: "Crucigrama de cuentas", emoji: "🔠", topic: "Cuaderno · 3º-5º", custom: mountCrucigramaGame },
  { id: "tablahuecos", title: "La tabla con huecos", emoji: "🟫", topic: "Cuaderno · 2º-4º", custom: mountTablahuecosGame },
  { id: "maquina", title: "La máquina de operar", emoji: "🏭", topic: "Cuaderno · 2º-4º", custom: mountMaquinaGame },
  { id: "leefracciones", title: "Lee y escribe fracciones", emoji: "🗣️", topic: "Cuaderno · 3º-5º", custom: mountLeefraccionesGame },
  { id: "pintafraccion", title: "Pinta la fracción", emoji: "🖌️", topic: "Cuaderno · 3º-5º", custom: mountPintafraccionGame },
  { id: "mixto", title: "Número mixto", emoji: "🧁", topic: "Cuaderno · 5º-1º ESO", custom: mountMixtoGame },
  { id: "comundenominador", title: "Común denominador", emoji: "🫱", topic: "Cuaderno · 5º-1º ESO", custom: mountComundenominadorGame },
  { id: "fraccionesop", title: "Opera con fracciones", emoji: "🍯", topic: "Cuaderno · 5º-2º ESO", custom: mountFraccionesopGame },
  { id: "factoriza", title: "Descompón en factores primos", emoji: "🌲", topic: "Cuaderno · 5º-1º ESO", custom: mountFactorizaGame },
  { id: "mcmfactores", title: "mcm y mcd por factores", emoji: "🧬", topic: "Cuaderno · 6º-1º ESO", custom: mountMcmfactoresGame },
  { id: "raizalgoritmo", title: "Raíz cuadrada entera", emoji: "🥝", topic: "Cuaderno · 6º-1º ESO", custom: mountRaizalgoritmoGame },
  { id: "celosia", title: "Multiplicación por celosía", emoji: "🧶", topic: "Cuaderno · 4º-6º", custom: mountCelosiaGame },
  { id: "siglos", title: "¿Qué siglo es?", emoji: "📜", topic: "Cuaderno · 4º-6º", custom: mountSiglosGame },
  { id: "reglatres", title: "Regla de tres", emoji: "🪖", topic: "Cuaderno · 6º-2º ESO", custom: mountReglatresGame },
  { id: "sexagesimal", title: "Horas, minutos y segundos en columna", emoji: "⏱️", topic: "Cuaderno · 5º-1º ESO", custom: mountSexagesimalGame },
  { id: "circunferencia", title: "Longitud de la circunferencia", emoji: "🛟", topic: "Cuaderno · 6º-1º ESO", custom: mountCircunferenciaGame },
  { id: "areaformula", title: "Fórmulas de área", emoji: "🏞️", topic: "Cuaderno · 5º-1º ESO", custom: mountAreaformulaGame },
  { id: "volumenes", title: "Volumen de cuerpos", emoji: "🥫", topic: "Cuaderno · 6º-2º ESO", custom: mountVolumenesGame },
  { id: "fracadecimal", title: "De fracción a decimal", emoji: "🔄", topic: "Cuaderno · 5º-1º ESO", custom: mountFracadecimalGame },
  { id: "tresformas", title: "Fracción, decimal y porcentaje", emoji: "🔃", topic: "Cuaderno · 6º-1º ESO", custom: mountTresformasGame },
  { id: "media", title: "La media", emoji: "🧑‍🎓", topic: "Cuaderno · 5º-1º ESO", custom: mountMediaGame },
  { id: "frecuencias", title: "Tabla de frecuencias", emoji: "🗂️", topic: "Cuaderno · 5º-2º ESO", custom: mountFrecuenciasGame },
  { id: "sectores", title: "Gráfico de sectores", emoji: "🍩", topic: "Cuaderno · 6º-2º ESO", custom: mountSectoresGame },
  { id: "elementoscirculo", title: "Elementos del círculo", emoji: "🌕", topic: "Cuaderno · 4º-6º", custom: mountElementoscirculoGame },
  { id: "elementostriangulo", title: "Elementos del triángulo", emoji: "⛺", topic: "Cuaderno · 5º-1º ESO", custom: mountElementostrianguloGame },
  { id: "clasificatriangulos", title: "Clasifica triángulos", emoji: "🔻", topic: "Cuaderno · 3º-5º", custom: mountClasificatriangulosGame },
  { id: "angulostipo", title: "Agudo, recto, obtuso", emoji: "🕑", topic: "Cuaderno · 3º-5º", custom: mountAngulostipoGame },
  { id: "rectasparalelas", title: "Paralelas, secantes y perpendiculares", emoji: "🛤️", topic: "Cuaderno · 3º-5º", custom: mountRectasparalelasGame },
  { id: "angulosinteriores", title: "Ángulos de un polígono", emoji: "🛑", topic: "Cuaderno · 6º-2º ESO", custom: mountAngulosinterioresGame },
  { id: "terminos", title: "Los nombres de las cuentas", emoji: "🔖", topic: "Cuaderno · 2º-4º", custom: mountTerminosGame },
  { id: "dobleentrada", title: "Tablas de doble entrada", emoji: "📇", topic: "Cuaderno · 2º-4º", custom: mountDobleentradaGame },
  { id: "combinaciones", title: "¿De cuántas formas?", emoji: "👚", topic: "Cuaderno · 5º-2º ESO", custom: mountCombinacionesGame },
  { id: "dosdados", title: "La tabla de los dos dados", emoji: "🏓", topic: "Cuaderno · 6º-2º ESO", custom: mountDosdadosGame },
  { id: "propiedadespotencias", title: "Propiedades de las potencias", emoji: "🔋", topic: "Cuaderno · 1º-2º ESO", custom: mountPropiedadespotenciasGame },
  { id: "absoluto", title: "Valor absoluto y opuesto", emoji: "🥥", topic: "Cuaderno · 1º ESO", custom: mountAbsolutoGame },
  { id: "pasos", title: "Resuelve paso a paso", emoji: "👣", topic: "Cuaderno · 1º-2º ESO", custom: mountPasosGame },
  { id: "lenguajealgebraico", title: "Del lenguaje al álgebra", emoji: "💬", topic: "Cuaderno · 1º-2º ESO", custom: mountLenguajealgebraicoGame },
  { id: "monomios", title: "Monomios", emoji: "🔣", topic: "Cuaderno · 1º-2º ESO", custom: mountMonomiosGame },
  { id: "valornumerico", title: "Valor numérico", emoji: "🔡", topic: "Cuaderno · 1º-2º ESO", custom: mountValornumericoGame },
  { id: "sumapolinomios", title: "Suma y resta de polinomios", emoji: "🌽", topic: "Cuaderno · 2º-3º ESO", custom: mountSumapolinomiosGame },
  { id: "notables", title: "Identidades notables", emoji: "✨", topic: "Cuaderno · 2º-3º ESO", custom: mountNotablesGame },
  { id: "sacafactor", title: "Saca factor común", emoji: "🫑", topic: "Cuaderno · 2º-3º ESO", custom: mountSacafactorGame },
  { id: "segundogrado", title: "Ecuación de segundo grado", emoji: "🍄", topic: "Cuaderno · 3º-4º ESO", custom: mountSegundogradoGame },
  { id: "sistema", title: "Sistema de ecuaciones", emoji: "🥜", topic: "Cuaderno · 2º-3º ESO", custom: mountSistemaGame },
  { id: "inecuacion", title: "Inecuaciones", emoji: "🚥", topic: "Cuaderno · 3º ESO", custom: mountInecuacionGame },
  { id: "intervalos", title: "Intervalos", emoji: "🎚", topic: "Cuaderno · 3º-4º ESO", custom: mountIntervalosGame },
  { id: "consecutivos", title: "Números consecutivos", emoji: "🚃", topic: "Cuaderno · 2º-3º ESO", custom: mountConsecutivosGame },
  { id: "edades", title: "Problemas de edades", emoji: "🎂", topic: "Cuaderno · 2º-3º ESO", custom: mountEdadesGame },
  { id: "tales", title: "Teorema de Tales", emoji: "🌞", topic: "Cuaderno · 2º-3º ESO", custom: mountTalesGame },
  { id: "trigo", title: "Seno, coseno y tangente", emoji: "🛰️", topic: "Cuaderno · 4º ESO", custom: mountTrigoGame },
  { id: "logaritmo", title: "Logaritmos", emoji: "🔊", topic: "Cuaderno · 4º ESO", custom: mountLogaritmoGame },
  { id: "radicales", title: "Saca factores de la raíz", emoji: "🌿", topic: "Cuaderno · 3º-4º ESO", custom: mountRadicalesGame },
  { id: "generatriz", title: "Fracción generatriz", emoji: "♾️", topic: "Cuaderno · 3º-4º ESO", custom: mountGeneratrizGame },
  { id: "progresion", title: "Progresiones", emoji: "🐌", topic: "Cuaderno · 3º ESO", custom: mountProgresionGame },
  { id: "laplace", title: "Regla de Laplace", emoji: "🪃", topic: "Cuaderno · 6º-2º ESO", custom: mountLaplaceGame },
  { id: "reparto", title: "Repartos proporcionales", emoji: "🫴", topic: "Cuaderno · 2º-3º ESO", custom: mountRepartoGame },
  { id: "interes", title: "Interés simple", emoji: "🏦", topic: "Cuaderno · 3º ESO", custom: mountInteresGame },
  { id: "cambiodivisas", title: "Cambio de moneda", emoji: "💱", topic: "Cuaderno · 1º-2º ESO", custom: mountCambiodivisasGame },
  { id: "ruffini", title: "Regla de Ruffini", emoji: "🪚", topic: "Cuaderno · 3º-4º ESO", custom: mountRuffiniGame },
  { id: "tablavalores", title: "Tabla de valores de una función", emoji: "🧇", topic: "Cuaderno · 2º-3º ESO", custom: mountTablavaloresGame },
  { id: "despejaformula", title: "Despeja la fórmula", emoji: "🔧", topic: "Cuaderno · 2º-3º ESO", custom: mountDespejaformulaGame },
  { id: "errores", title: "Error absoluto y relativo", emoji: "❌", topic: "Cuaderno · 4º ESO", custom: mountErroresGame },
  { id: "kmhms", title: "De km/h a m/s", emoji: "🚄", topic: "Cuaderno · 2º-3º ESO", custom: mountKmhmsGame },
  { id: "bingo", title: "Bingo de las tablas", emoji: "🎟️", topic: "Cuaderno · 2º-4º", custom: mountBingoGame },
  { id: "domino", title: "Dominó de fracciones", emoji: "🪨", topic: "Cuaderno · 4º-6º", custom: mountDominoGame },
  { id: "pascal", title: "El triángulo de Pascal", emoji: "🛕", topic: "Cuaderno · 6º-3º ESO", custom: mountPascalGame },
  { id: "gauss", title: "La suma de Gauss", emoji: "🧠", topic: "Cuaderno · 6º-2º ESO", custom: mountGaussGame },
  { id: "trucos", title: "Trucos de cálculo mental", emoji: "🎩", topic: "Cuaderno · 3º-6º", custom: mountTrucosGame },
];
