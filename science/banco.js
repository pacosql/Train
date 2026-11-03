// Science · Unit 1: Living organisms — banco de lecciones y preguntas.
//
// Contenido sacado de la ficha del colegio (célula vegetal/animal, seres
// vivos e inertes, las 3 funciones vitales) y del libro (págs. 6-19).
// Preguntas en inglés (como en el examen) con traducción; explicaciones en
// español para una niña de 8 años. [[…]] marca palabras en inglés: se ven
// resaltadas, se pueden tocar para oírlas y el lector las lee en inglés.
//
// Tipos de pregunta (k):
//   choice  opciones de texto (por defecto; se barajan salvo keep:true)
//   tf      verdadero / falso
//   label   dibujo de la ficha con las cajas en blanco: ¿qué va en la caja «?»
//   write   igual, pero se escribe la palabra con fichas de letras
//   tap     toca la parte en el dibujo
//   num     dibujo del libro con números: ¿qué es el número N?
//   pics    elige el dibujo correcto entre varios
//   order   toca las palabras en orden
(function () {
  const IMG = (p) => "../img/" + p;

  // ---------------------------------------------------------------- dibujos
  // Células de la ficha: cajas de etiqueta y puntos de las líneas guía en
  // coordenadas relativas (0-1). Las partes salen del mapa de partes
  // (img/cells/*-map.png: valor/25 = id de parte). Generado con tools/.
  const CELLS = {
    plant: {
      img: "cells/plant.png", map: "cells/plant-map.png", w: 1335, h: 768,
      boxes: { wall: [0.7858, 0.0078, 0.1948, 0.1003], membrane: [0.788, 0.1536, 0.2067, 0.1042], vacuole: [0.0045, 0.3216, 0.2, 0.1094], chloroplast: [0.8195, 0.3542, 0.1753, 0.099], nucleus: [0.827, 0.6628, 0.1648, 0.112] },
      dots: { wall: [0.7433, 0.0944], membrane: [0.7308, 0.2017], vacuole: [0.2874, 0.4634], chloroplast: [0.76, 0.4352], nucleus: [0.6575, 0.6691] },
      ids: { wall: 1, membrane: 2, vacuole: 3, nucleus: 4, chloroplast: 5, mitochondria: 6, vesicle: 7 },
    },
    animal: {
      img: "cells/animal.png", map: "cells/animal-map.png", w: 1405, h: 837,
      boxes: { membrane: [0.7238, 0.0335, 0.2712, 0.1147], nucleus: [0.8142, 0.2999, 0.1801, 0.1159], vacuole: [0.0043, 0.8483, 0.1879, 0.1111] },
      dots: { membrane: [0.6808, 0.1192], nucleus: [0.5544, 0.526], vacuole: [0.2999, 0.8338], vacuole2: [0.3696, 0.9012] },
      ids: { membrane: 2, vacuole: 3, nucleus: 4, mitochondria: 6 },
    },
  };
  // Nombre de cada parte tal y como sale en la ficha (lo que se escribe en el examen).
  const LABEL = {
    plant: { wall: "cell wall", membrane: "cell membrane", chloroplast: "chloroplast", nucleus: "nucleus", vacuole: "vacuole" },
    animal: { membrane: "cell membrane", nucleus: "nucleus", vacuole: "vacuoles" },
  };
  // Con artículo, para frases («en verde, el núcleo»).
  const PART_ART = {
    plant: { wall: "la pared celular", membrane: "la membrana celular", chloroplast: "los cloroplastos", nucleus: "el núcleo", vacuole: "la vacuola" },
    animal: { membrane: "la membrana celular", nucleus: "el núcleo", vacuole: "las vacuolas" },
  };
  const PART_ES = { wall: "pared celular", membrane: "membrana celular", chloroplast: "cloroplasto", nucleus: "núcleo", vacuole: "vacuola", mitochondria: "mitocondria", vesicle: "bolita (vesícula)" };
  // Partes que no hay que aprenderse (para explicar si las toca).
  const OTHER = {
    mitochondria: "Eso es otra cosa (una [[mitochondria]]): tiene una línea en zigzag dentro. No hace falta que te sepas su nombre.",
    vesicle: "Esa bolita pequeña no es la vacuola: en la célula vegetal la [[vacuole]] es la bolsa GRANDE.",
    none: "Ahí no hay ninguna de las partes que estudiamos.",
  };

  // Células del libro (pág. 11): números y a qué apuntan.
  const BOOK = {
    plant: { img: "libro/p11-plant-cell.jpg", w: 845, h: 850,
      n: { 1: { part: "wall", at: [0.8497, 0.1682], to: [0.6864, 0.2729] }, 2: { part: "chloroplast", at: [0.9349, 0.4918], to: [0.6568, 0.3647] },
           3: { part: "membrane", at: [0.6805, 0.9412], to: [0.5799, 0.8035] }, 4: { part: "nucleus", at: [0.0734, 0.8294], to: [0.5503, 0.6294] },
           5: { part: "vacuole", at: [0.1633, 0.1741], to: [0.3905, 0.4847] } },
      names: { wall: "cell wall", chloroplast: "chloroplasts", membrane: "cell membrane", nucleus: "nucleus", vacuole: "vacuole" } },
    animal: { img: "libro/p11-animal-cell.jpg", w: 844, h: 830,
      n: { 1: { part: "membrane", at: [0.8709, 0.0904], to: [0.782, 0.2108] }, 2: { part: "nucleus", at: [0.8768, 0.8313], to: [0.5592, 0.4434] },
           3: { part: "vacuole", at: [0.077, 0.8976], to: [0.7168, 0.7133] } },
      names: { membrane: "cell membrane", nucleus: "nucleus", vacuole: "vacuoles" } },
  };

  // ---------------------------------------------------------------- temas
  const TOPICS = [
    { id: "living", emoji: "🌍", en: "Living and non-living things", es: "Seres vivos e inertes" },
    { id: "vital", emoji: "⚡", en: "The 3 vital functions", es: "Las 3 funciones vitales" },
    { id: "cells", emoji: "🔬", en: "Cells", es: "Las células" },
    { id: "plantcell", emoji: "🌿", en: "Plant cell", es: "La célula vegetal" },
    { id: "animalcell", emoji: "🐾", en: "Animal cell", es: "La célula animal" },
    { id: "compare", emoji: "🆚", en: "Plant vs animal cells", es: "Vegetal contra animal" },
    { id: "levels", emoji: "🧱", en: "From a cell to an organism", es: "De la célula al organismo" },
    { id: "kingdoms", emoji: "👑", en: "The five kingdoms", es: "Los cinco reinos" },
  ];

  // Orden en el que «Jugar» va introduciendo los temas: alterna las dos caras
  // de la ficha del colegio (seres vivos ↔ células) antes de lo demás del libro.
  const PATH = ["living", "plantcell", "vital", "animalcell", "compare", "cells", "levels", "kingdoms"];

  // ---------------------------------------------------------------- lecciones
  // Diapositivas: t (título), es (texto), y uno de: img, gallery [[img, en, es]],
  // cell {cell, part?, labels?}, book {cell, n?}, both (las dos células), table.
  const LESSONS = {
    living: [
      { t: "Living and non-living things", img: "libro/p8-diagram.jpg",
        es: "Todo lo que ves es un [[living thing]] (ser vivo) o un [[non-living thing]] (ser inerte: no tiene vida)." },
      { t: "Living things", img: "libro/p18-summary.jpg",
        es: "Los [[living things]] [[are born]] (nacen), [[grow]] (crecen), [[reproduce]] (se reproducen) y [[die]] (mueren). Además hacen las 3 funciones vitales: [[nutrition]], [[interaction]] y [[reproduction]]." },
      { t: "Animals and plants", gallery: [["ficha/flamingo.png", "flamingo", "flamenco"], ["ficha/fox.png", "fox", "zorro"], ["ficha/seal.png", "seal", "foca"], ["ficha/tree.png", "tree", "árbol"], ["ficha/flower.png", "flower", "flor"], ["ficha/succulent.png", "succulent", "planta crasa"]],
        es: "Los seres vivos pueden ser [[animals]] (animales) o [[plants]] (plantas). ¡Las plantas también están vivas: beben agua, crecen y hacen semillas!" },
      { t: "Natural and artificial", gallery: [["ficha/wave.png", "wave", "ola"], ["ficha/sun.png", "sun", "sol"], ["ficha/volcano.png", "volcano", "volcán"], ["ficha/bicycle.png", "bicycle", "bicicleta"], ["ficha/balloon.png", "balloon", "globo"], ["ficha/trainers.png", "trainers", "zapatillas"]],
        es: "Los seres inertes pueden ser [[natural]] (los hace la naturaleza: la ola, el sol, el volcán) o [[artificial]] (los fabrican las personas: la bici, el globo, las zapatillas)." },
      { t: "Watch out!", gallery: [["ficha/sun.png", "sun", "sol"], ["ficha/balloon.png", "balloon", "globo"], ["ficha/tree.png", "tree", "árbol"]],
        es: "Moverse no significa estar vivo. 🌞 El sol se mueve y da luz, pero no come ni tiene bebés: es inerte. 🎈 El globo vuela, pero es artificial. 🌳 El árbol no camina… ¡pero SÍ está vivo!" },
    ],
    vital: [
      { t: "The 3 vital functions", img: "libro/p9-beach.jpg",
        es: "Todos los seres vivos hacen 3 [[vital functions]] (funciones vitales): 🍎 [[nutrition]] (nutrición), 👀 [[interaction]] (relación) y 🐣 [[reproduction]] (reproducción)." },
      { t: "Nutrition", gallery: [["ficha/dog-eats.png", "", ""], ["ficha/rabbit-drinks.png", "", ""], ["ficha/plant-sun.png", "", ""], ["ficha/fish.png", "", ""]],
        es: "🍎 [[Living things get food, water and air.]] Todos necesitan comida para crecer y tener energía ([[All living things need food to grow and for energy.]]). Los animales comen otros seres vivos y las plantas usan la luz del sol para fabricar su propia comida ([[Plants use sunlight to make their own food.]])." },
      { t: "Interaction", gallery: [["ficha/dog-butterfly.png", "", ""], ["ficha/sunflower-sun.png", "", ""], ["ficha/cat.png", "", ""], ["ficha/chameleon.png", "", ""]],
        es: "👀 [[Living things sense and react.]] Notan lo que pasa (ven, oyen, huelen, tocan…) y reaccionan. Los animales se relacionan con lo que les rodea y con otros seres vivos. Las plantas no pueden moverse de sitio, pero reaccionan a estímulos como la luz del sol: el girasol se gira hacia el sol 🌻." },
      { t: "Reproduction", gallery: [["ficha/dog-puppies.png", "", ""], ["ficha/hen-chicks.png", "", ""], ["ficha/turtle.png", "", ""], ["ficha/sunflower-seeds.png", "", ""]],
        es: "🐣 [[Living things have babies to make new living things.]] Algunos animales tienen crías ([[give birth to babies]]) y otros ponen huevos ([[lay eggs]]). Las plantas se reproducen con semillas o esporas ([[seeds or spores]])." },
      { t: "Remember!", gallery: [["ficha/dog-eats.png", "Nutrition", "comer, beber, respirar"], ["ficha/dog-butterfly.png", "Interaction", "sentir y reaccionar"], ["ficha/dog-puppies.png", "Reproduction", "tener bebés"]],
        es: "Truco: 🍎 [[Nutrition]] = comer, beber y respirar. 👀 [[Interaction]] = sentir y reaccionar. 🐣 [[Reproduction]] = tener bebés." },
    ],
    cells: [
      { t: "What is a cell?", img: "libro/p10-microscope.jpg",
        es: "Una [[cell]] (célula) es la unidad viva más pequeña que forma un ser vivo: [[A cell is the smallest living unit.]] Son tan pequeñas que necesitamos un [[microscope]] (microscopio) para verlas 🔬." },
      { t: "Unicellular organisms", gallery: [["libro/p10-algae.jpg", "algae", "algas"], ["libro/p10-bacteria.jpg", "bacteria", "bacterias"]],
        es: "Los seres [[unicellular]] (unicelulares) tienen UNA sola célula (uni = uno). Esa única célula hace las 3 funciones vitales. Las algas y las bacterias son unicelulares: [[Algae and bacteria are unicellular organisms.]]" },
      { t: "Multicellular organisms", gallery: [["libro/p10-orangutan.jpg", "orangutan", "orangután"], ["libro/p10-girl.jpg", "people", "personas"], ["libro/p19-cactus.jpg", "cactus", "cactus"]],
        es: "Los seres [[multicellular]] (multicelulares) tienen MUCHAS células (multi = muchas) y cada una tiene un trabajo distinto. Las plantas, los animales y las personas somos multicelulares: [[Plants, animals and people are multicellular organisms.]]" },
    ],
    plantcell: [
      { t: "Plant cell", cell: { cell: "plant", labels: "all" },
        es: "Esta es una [[plant cell]] (célula vegetal). Todas las células vegetales tienen una forma regular ([[a regular shape]]), como una caja. Vamos a ver sus 5 partes." },
      { t: "cell wall", cell: { cell: "plant", part: "wall" },
        es: "La [[cell wall]] (pared celular) es la pared gorda de fuera 🧱. Es dura y hace que la planta esté firme: [[Cell wall makes the plant rigid.]] ¡Solo la tienen las plantas!" },
      { t: "cell membrane", cell: { cell: "plant", part: "membrane" },
        es: "Justo dentro de la pared está la [[cell membrane]] (membrana celular), una piel fina. Es como la puerta 🚪: [[Cell membrane controls substances entering and leaving the cell.]] (controla lo que entra y sale)." },
      { t: "chloroplasts", cell: { cell: "plant", part: "chloroplast" },
        es: "Los [[chloroplasts]] (cloroplastos) tienen dentro como montoncitos de monedas. [[Chloroplasts contain chlorophyll: they make plants green.]] 💚 Gracias a ellos la planta usa la luz del sol para fabricar su comida. ¡Solo los tienen las plantas!" },
      { t: "nucleus", cell: { cell: "plant", part: "nucleus" },
        es: "El [[nucleus]] (núcleo) es la bola del centro. Es el jefe, el centro de control 🧠: [[Nucleus controls cell functions.]]" },
      { t: "vacuole", cell: { cell: "plant", part: "vacuole" },
        es: "La [[vacuole]] (vacuola) es una bolsa llena de agua 💧. En las plantas es GRANDE: [[Large vacuoles contain water.]]" },
      { t: "Careful!", cell: { cell: "plant", part: "chloroplast", also: "mitochondria" },
        es: "¡Ojo! Los óvalos con una línea en zigzag dentro (en naranja) NO son cloroplastos: son otra cosa que no hace falta aprender. Los [[chloroplasts]] son los de los montoncitos de monedas (en verde)." },
      { t: "In your book", book: { cell: "plant" },
        es: "En el libro sale en color y con números: 1 [[cell wall]], 2 [[chloroplasts]], 3 [[cell membrane]], 4 [[nucleus]] y 5 [[vacuole]]." },
    ],
    animalcell: [
      { t: "Animal cell", cell: { cell: "animal", labels: "all" },
        es: "Esta es una [[animal cell]] (célula animal). Puede tener forma rectangular, ovalada o irregular ([[rectangular, oval or irregular shapes]])." },
      { t: "cell membrane", cell: { cell: "animal", part: "membrane" },
        es: "Por fuera tiene la [[cell membrane]] (membrana celular). Como no tiene pared, es más blandita y redondeada. [[Cell membrane controls substances entering and leaving the cell.]]" },
      { t: "nucleus", cell: { cell: "animal", part: "nucleus" },
        es: "En el centro, el [[nucleus]] (núcleo), el jefe 🧠: [[Nucleus controls cell functions.]]" },
      { t: "vacuoles", cell: { cell: "animal", part: "vacuole" },
        es: "Tiene muchas [[vacuoles]] (vacuolas) pequeñitas, por eso en la ficha pone [[vacuoles]], en plural: [[Small vacuoles contain water.]] 💧" },
      { t: "No wall, no chloroplasts", both: "hl",
        es: "[[The animal cell does not have a cell wall or chloroplasts.]] La célula animal NO tiene pared ni cloroplastos. ¡Por eso los animales no son verdes ni fabrican su comida con el sol!" },
      { t: "In your book", book: { cell: "animal" },
        es: "En el libro: 1 [[cell membrane]], 2 [[nucleus]] y 3 [[vacuoles]] (las pequeñas)." },
    ],
    compare: [
      { t: "Plant cell vs animal cell", both: true,
        es: "Las dos tienen [[nucleus]], [[cell membrane]] y [[vacuoles]]. Solo la vegetal tiene [[cell wall]] y [[chloroplasts]]." },
      { t: "Same and different", table: true,
        es: "Mira la tabla. Las vacuolas: en la vegetal, una GRANDE ([[large vacuoles]]); en la animal, varias pequeñas ([[small vacuoles]])." },
      { t: "Shapes", both: true,
        es: "Todas las células vegetales tienen forma regular ([[all plant cells have a regular shape]]). Las animales pueden ser rectangulares, ovaladas o irregulares ([[rectangular, oval or irregular shapes]])." },
      { t: "The nucleus is the boss", cell: { cell: "animal", part: "nucleus" },
        es: "El [[nucleus]] es el centro de control de la célula ([[the control centre]]): controla sus funciones, como la reproducción. Se parece más al cerebro 🧠 que al corazón." },
    ],
    levels: [
      { t: "How are cells organised?", gallery: [["libro/lv-plant-cell.jpg", "cell", "célula"], ["libro/lv-plant-tissue.jpg", "tissue", "tejido"], ["libro/lv-plant-organ.jpg", "organ", "órgano"], ["libro/lv-plant-system.jpg", "system", "sistema"], ["libro/lv-plant-organism.jpg", "organism", "organismo"]],
        es: "En los seres multicelulares las células trabajan juntas. Hay 5 niveles, del más pequeño al más grande: [[cell]] → [[tissue]] → [[organ]] → [[system]] → [[organism]]." },
      { t: "cell", gallery: [["libro/lv-plant-cell.jpg", "plant cell", ""], ["libro/lv-animal-cell.jpg", "animal cell", ""]],
        es: "1. [[A cell is the smallest living unit.]] La célula es lo más pequeño que está vivo." },
      { t: "tissue", gallery: [["libro/lv-plant-tissue.jpg", "plant tissue", ""], ["libro/lv-animal-tissue.jpg", "animal tissue", ""]],
        es: "2. [[When cells perform the same function, they group together and form tissue.]] Muchas células iguales haciendo el mismo trabajo forman un tejido." },
      { t: "organ", gallery: [["libro/lv-plant-organ.jpg", "leaf", "hoja"], ["libro/lv-animal-organ.jpg", "heart", "corazón"]],
        es: "3. [[Tissues group together and form an organ.]] Varios tejidos forman un órgano: la hoja de la planta o el corazón." },
      { t: "system", gallery: [["libro/lv-plant-system.jpg", "plant system", ""], ["libro/lv-animal-system.jpg", "animal system", ""]],
        es: "4. [[Organs work together and form organ systems.]] Varios órganos trabajando juntos forman un sistema." },
      { t: "organism", gallery: [["libro/lv-plant-organism.jpg", "plant", "planta"], ["libro/lv-animal-organism.jpg", "cat", "gato"]],
        es: "5. [[When all the systems work together, they form a complete living organism.]] ¡Ya tenemos un ser vivo completo! Truco: «Cinco Tortugas Organizan Sus Orquestas» 🐢 = Cell, Tissue, Organ, System, Organism." },
    ],
    kingdoms: [
      { t: "The five kingdoms", img: "libro/p13-kingdoms.jpg",
        es: "Clasificamos todos los seres vivos en 5 grupos llamados reinos ([[kingdoms]]): [[plants]], [[animals]], [[fungi]] (hongos), [[protists]] (protistas) y [[monera]] (moneras)." },
      { t: "Plants", img: "libro/k-plants.jpg",
        es: "[[Plants are multicellular.]] [[They make their own food.]] [[They reproduce through seeds or spores.]] Son multicelulares, fabrican su comida y se reproducen con semillas o esporas." },
      { t: "Animals", img: "libro/k-animals.jpg",
        es: "[[Animals are multicellular.]] [[They feed on other living things.]] [[They respond to stimuli.]] [[Animals lay eggs or give birth to babies.]] ¡Las personas también somos animales!" },
      { t: "Fungi", img: "libro/k-fungi.jpg",
        es: "[[Fungi can be multicellular or unicellular.]] Toman su alimento de plantas y animales muertos ([[They take nutrients from dead plants and animals.]]). No pueden moverse y se reproducen con esporas ([[spores]]). Las setas 🍄 y la levadura del pan son hongos." },
      { t: "Protists", img: "libro/k-protists.jpg",
        es: "[[Protists are usually unicellular.]] Casi todos viven en el agua o cerca ([[in or near water]]). Algunos se dividen en dos células para reproducirse ([[divide into two cells]])." },
      { t: "Monera", img: "libro/k-monera.jpg",
        es: "[[Monera are unicellular.]] Viven en la tierra, en el aire, en el agua y dentro de otros seres vivos. Algunas se alimentan de plantas y animales muertos. Se dividen en dos células para reproducirse. ¡Las bacterias son moneras!" },
      { t: "Is yeast alive?", gallery: [["libro/p15-yeast.jpg", "yeast and sugar", "levadura y azúcar"], ["libro/p15-test3.jpg", "the balloon", "el globo"]],
        es: "La levadura ([[yeast]]) es un hongo: ¡está viva! Con agua tibia y azúcar se alimenta (eso es [[nutrition]]) y suelta un gas, el [[carbon dioxide]], que hincha el globo 🎈. Sin azúcar, el globo casi no se hincha. Por eso el pan con levadura sale esponjoso." },
    ],
  };

  // ---------------------------------------------------------------- conceptos
  const CONCEPTS = [];
  const c = (id, topic, o) => CONCEPTS.push(Object.assign({ id, topic, need: 2, qs: [] }, o));
  const NO = ["No, it is a non-living thing", "Yes, it is a living thing"];
  const YES = ["Yes, it is a living thing", "No, it is a non-living thing"];

  // ======================= 1. Living and non-living things
  c("living.def", "living", {
    t: "Are born, grow, reproduce and die", es: "Nacen, crecen, se reproducen y mueren",
    ex: "Los [[living things]] (seres vivos) [[are born]] (nacen), [[grow]] (crecen), [[reproduce]] (se reproducen) y [[die]] (mueren). Los [[non-living things]] no hacen nada de eso.",
    qs: [
      { q: "Living things are born, grow, ____ and die.", es: "Los seres vivos nacen, crecen, ____ y mueren.", o: ["reproduce", "shine", "fly", "break"], a: 0 },
      { q: "What do living things do?", es: "¿Qué hacen los seres vivos?", o: ["They are born, grow, reproduce and die.", "They are made in factories.", "They never change."], a: 0 },
      { q: "Living things are ____, grow, reproduce and die.", es: "Los seres vivos ____, crecen, se reproducen y mueren.", o: ["born", "built", "painted"], a: 0 },
      { k: "order", q: "Put the life of a living thing in order.", es: "Ordena la vida de un ser vivo.", o: ["are born", "grow", "reproduce", "die"] },
      { k: "tf", q: "A balloon is born, grows and has babies.", es: "Un globo nace, crece y tiene bebés.", a: false,
        why: "¡Qué va! El globo lo fabrican las personas: no nace, no crece y no tiene bebés. Es un [[non-living thing]] [[artificial]]." },
    ],
  });
  c("living.groups", "living", {
    t: "Animals & plants · natural & artificial", es: "Grupos de seres vivos e inertes",
    ex: "Dos grandes grupos. [[Living things]]: [[animals]] y [[plants]]. [[Non-living things]]: [[natural]] y [[artificial]].",
    see: { img: "libro/p8-diagram.jpg" },
    qs: [
      { q: "Living things can be…", es: "Los seres vivos pueden ser…", o: ["animals or plants", "natural or artificial", "big or small"], a: 0 },
      { q: "Non-living things can be…", es: "Los seres inertes pueden ser…", o: ["natural or artificial", "animals or plants", "happy or sad"], a: 0 },
      { q: "Which two groups are living things?", es: "¿Qué dos grupos son seres vivos?", o: ["Animals and Plants", "Natural and Artificial", "Animals and Artificial"], a: 0 },
      { k: "tf", q: "Plants are living things.", es: "Las plantas son seres vivos.", a: true,
        why: "¡Sí! Las plantas nacen, crecen, se alimentan y hacen semillas: son [[living things]]." },
    ],
  });
  c("living.natart", "living", {
    t: "Natural = nature · Artificial = people", es: "Natural y artificial",
    ex: "[[Natural]]: lo hace la naturaleza (el sol, el mar, un volcán). [[Artificial]]: lo fabrican las personas (una bici, un globo, unas zapatillas).",
    qs: [
      { q: "Artificial things are made by…", es: "Las cosas artificiales las hacen…", o: ["people", "nature", "animals"], a: 0 },
      { q: "Natural non-living things are made by…", es: "Los seres inertes naturales los hace…", o: ["nature", "people", "a factory"], a: 0 },
      { k: "tf", q: "A bicycle is natural.", es: "Una bicicleta es natural.", a: false, img: "ficha/bicycle.png",
        why: "La bici la fabrican las personas: es [[artificial]]." },
      { k: "tf", q: "A volcano is natural.", es: "Un volcán es natural.", a: true, img: "ficha/volcano.png",
        why: "El volcán lo hace la naturaleza: es [[natural]] (y no está vivo)." },
    ],
  });

  // Dibujos para clasificar (ficha en blanco y negro + libro en color).
  const ITEMS = [
    ["animals", "flamingo", "flamenco", ["ficha/flamingo.png", "libro/c-flamingo.jpg"]],
    ["animals", "fox", "zorro", ["ficha/fox.png", "libro/c-fox.jpg"]],
    ["animals", "seal", "foca", ["ficha/seal.png", "libro/c-seal.jpg"]],
    ["animals", "cat", "gato", ["ficha/cat.png"]],
    ["animals", "chameleon", "camaleón", ["ficha/chameleon.png"]],
    ["animals", "elephants", "elefantes", ["libro/p19-elephants.jpg"]],
    ["plants", "tree", "árbol", ["ficha/tree.png", "libro/c-tree.jpg"]],
    ["plants", "flower", "flor", ["ficha/flower.png", "libro/c-flower.jpg"]],
    ["plants", "succulent", "planta crasa", ["ficha/succulent.png", "libro/c-succulent.jpg"]],
    ["plants", "cactus", "cactus", ["libro/p19-cactus.jpg"]],
    ["natural", "wave", "ola", ["ficha/wave.png", "libro/c-wave.jpg"]],
    ["natural", "sun", "sol", ["ficha/sun.png", "libro/c-sun.jpg"]],
    ["natural", "volcano", "volcán", ["ficha/volcano.png", "libro/c-volcano.jpg"]],
    ["artificial", "bicycle", "bicicleta", ["ficha/bicycle.png", "libro/c-bicycle.jpg"]],
    ["artificial", "balloon", "globo", ["ficha/balloon.png", "libro/c-balloon.jpg"]],
    ["artificial", "trainers", "zapatillas", ["ficha/trainers.png", "libro/c-trainers.jpg"]],
  ];
  const GROUP = {
    animals: { en: "Animals", es: "animales", living: true, ex: "Es un animal: nace, crece, come, siente y tiene crías. Es un [[living thing]] del grupo [[Animals]]." },
    plants: { en: "Plants", es: "plantas", living: true, ex: "Es una planta: nace, crece, bebe agua y hace semillas. Es un [[living thing]] del grupo [[Plants]]." },
    natural: { en: "Natural", es: "natural", living: false, ex: "No está vivo: no come ni tiene bebés. Y lo hace la naturaleza, así que es un [[non-living thing]] [[natural]]." },
    artificial: { en: "Artificial", es: "artificial", living: false, ex: "No está vivo y lo fabrican las personas: es un [[non-living thing]] [[artificial]]." },
  };
  const G4 = ["Animals", "Plants", "Natural", "Artificial"];
  for (const g of Object.keys(GROUP)) {
    const qs = [];
    for (const [gg, en, es, imgs] of ITEMS) {
      if (gg !== g) continue;
      imgs.forEach((img, i) => {
        const cap = { cap: en, capEs: es, img };
        qs.push(Object.assign({ q: "Is it a living thing or a non-living thing?", es: "¿Es un ser vivo o un ser inerte?",
          o: ["Living thing", "Non-living thing"], a: GROUP[g].living ? 0 : 1, keep: true, why: GROUP[g].ex, id: `${en}${i}.ln` }, cap));
        qs.push(Object.assign({ q: "Which group does it belong to?", es: "¿A qué grupo pertenece?", o: G4, a: G4.indexOf(GROUP[g].en),
          keep: true, groups: true, why: GROUP[g].ex, id: `${en}${i}.g4` }, cap));
        if (!GROUP[g].living) qs.push(Object.assign({ q: "Is it natural or artificial?", es: "¿Es natural o artificial?", o: ["Natural", "Artificial"],
          a: g === "natural" ? 0 : 1, keep: true, why: GROUP[g].ex, id: `${en}${i}.na` }, cap));
      });
    }
    c("items." + g, "living", { t: `Pictures: ${GROUP[g].en}`, es: `Dibujos: ${GROUP[g].es}`, ex: GROUP[g].ex, need: 3, pic: true, qs });
  }
  c("living.tricky", "living", {
    t: "Tricky ones: moving is not living", es: "Trampas: moverse no es estar vivo",
    ex: "Moverse no significa estar vivo. 🌞 El sol y 🌊 la ola se mueven, pero no comen ni tienen bebés. 🌳 Las plantas no caminan, pero sí están vivas.",
    need: 3,
    qs: [
      { q: "The sun moves across the sky and gives light. Is it a living thing?", es: "El sol se mueve por el cielo y da luz. ¿Es un ser vivo?", o: NO, a: 0, keep: true, img: "ficha/sun.png",
        why: "El sol no nace, no come y no tiene bebés: es un [[non-living thing]] [[natural]]." },
      { q: "A tree can't walk. Is it a living thing?", es: "Un árbol no puede andar. ¿Es un ser vivo?", o: YES, a: 0, keep: true, img: "ficha/tree.png",
        why: "Las plantas no se mueven de sitio, pero nacen, crecen, beben agua y hacen semillas: son [[living things]]." },
      { q: "A balloon can fly. Is it a living thing?", es: "Un globo puede volar. ¿Es un ser vivo?", o: NO, a: 0, keep: true, img: "ficha/balloon.png",
        why: "Volar no es estar vivo: el globo lo fabrican las personas. Es [[artificial]]." },
      { q: "A wave moves. Is it a living thing?", es: "Una ola se mueve. ¿Es un ser vivo?", o: NO, a: 0, keep: true, img: "ficha/wave.png",
        why: "La ola es agua que se mueve: es un [[non-living thing]] [[natural]]." },
      { q: "Does a bicycle need food?", es: "¿Una bicicleta necesita comida?", o: ["No", "Yes"], a: 0, keep: true, img: "ficha/bicycle.png",
        why: "Los seres inertes no comen ni beben: no hacen [[nutrition]]. Solo los seres vivos necesitan comida." },
      { q: "A flower doesn't walk or talk. Is it a living thing?", es: "Una flor no anda ni habla. ¿Es un ser vivo?", o: YES, a: 0, keep: true, img: "ficha/flower.png",
        why: "La flor es una planta: nace, crece y hace semillas. ¡Está viva!" },
    ],
  });
  // ¿Cuál es…? con varios dibujos.
  const P = (g, i = 0) => ITEMS.filter((x) => x[0] === g).map((x) => x[3][0])[i];
  c("living.pick", "living", {
    t: "Pick the picture", es: "Elige el dibujo",
    ex: "Seres vivos: [[animals]] y [[plants]]. Seres inertes: [[natural]] (naturaleza) y [[artificial]] (personas).",
    qs: [
      { k: "pics", q: "Which one is a living thing?", es: "¿Cuál es un ser vivo?", pics: [P("animals", 1), P("natural", 1), P("artificial", 0)], a: 0 },
      { k: "pics", q: "Which one is a living thing?", es: "¿Cuál es un ser vivo?", pics: [P("plants", 2), P("artificial", 1), P("natural", 0)], a: 0 },
      { k: "pics", q: "Which one is a non-living thing?", es: "¿Cuál es un ser inerte?", pics: [P("natural", 2), P("animals", 0), P("plants", 1)], a: 0 },
      { k: "pics", q: "Which one is artificial?", es: "¿Cuál es artificial?", pics: [P("artificial", 2), P("natural", 0), P("natural", 1)], a: 0 },
      { k: "pics", q: "Which one is natural?", es: "¿Cuál es natural?", pics: [P("natural", 1), P("artificial", 0), P("artificial", 1)], a: 0 },
      { k: "pics", q: "Which one is a plant?", es: "¿Cuál es una planta?", pics: [P("plants", 0), P("animals", 2), P("natural", 2)], a: 0 },
    ],
  });

  // ======================= 2. The 3 vital functions
  const VF = ["Nutrition", "Interaction", "Reproduction"];
  c("vital.three", "vital", {
    t: "Nutrition, interaction, reproduction", es: "Las tres funciones vitales",
    ex: "Son 3: [[nutrition]], [[interaction]] y [[reproduction]]. Truco: 🍎 comer, 👀 sentir, 🐣 tener bebés.",
    qs: [
      { q: "How many vital functions are there?", es: "¿Cuántas funciones vitales hay?", o: ["3", "2", "5"], a: 0 },
      { q: "What are the three vital functions?", es: "¿Cuáles son las tres funciones vitales?", o: ["Nutrition, interaction and reproduction", "Animals, plants and fungi", "Cell, tissue and organ"], a: 0 },
      { q: "Which one is NOT a vital function?", es: "¿Cuál NO es una función vital?", o: ["Artificial", "Nutrition", "Interaction", "Reproduction"], a: 0,
        why: "[[Artificial]] es un grupo de seres inertes (cosas fabricadas por personas), no una función vital." },
      { q: "Living things perform three vital functions: nutrition, reproduction and…", es: "Los seres vivos hacen tres funciones vitales: nutrición, reproducción y…", o: ["interaction", "decoration", "imagination"], a: 0 },
    ],
  });
  const vdef = (id, i, word, sentence, sentEs, extra) => c(id, "vital", {
    t: `${VF[i]}: ${sentence}`, es: sentEs, word,
    ex: extra.ex,
    qs: [
      { q: `"${sentence}" Which vital function is it?`, es: `«${sentEs}» ¿Qué función vital es?`, o: VF, a: i, keep: true },
      { q: `What is ${word}?`, es: `¿Qué es la ${extra.nameEs}?`, o: ["Living things get food, water and air.", "Living things sense and react.", "Living things have babies to make new living things."], a: i },
      ...extra.qs,
    ],
  });
  vdef("vital.nut", 0, "nutrition", "Living things get food, water and air.", "Los seres vivos consiguen comida, agua y aire.", {
    nameEs: "nutrición",
    ex: "🍎 [[Nutrition]]: [[Living things get food, water and air.]] Comer, beber y respirar. [[All living things need food to grow and for energy.]]",
    qs: [
      { q: "Living things get food, ____ and air.", es: "Los seres vivos consiguen comida, ____ y aire.", o: ["water", "babies", "toys"], a: 0 },
      { q: "All living things need food to grow and for ____.", es: "Todos los seres vivos necesitan comida para crecer y para tener ____.", o: ["energy", "colour", "music"], a: 0 },
    ],
  });
  vdef("vital.int", 1, "interaction", "Living things sense and react.", "Los seres vivos sienten y reaccionan.", {
    nameEs: "relación (interacción)",
    ex: "👀 [[Interaction]]: [[Living things sense and react.]] Ven, oyen, huelen o tocan algo… ¡y reaccionan! [[Animals interact with the environment and other living things.]]",
    qs: [
      { q: "Living things ____ and react.", es: "Los seres vivos ____ y reaccionan.", o: ["sense", "eat", "sleep"], a: 0 },
      { q: "Animals interact with the environment and other…", es: "Los animales se relacionan con lo que les rodea y con otros…", o: ["living things", "bicycles", "stones"], a: 0 },
    ],
  });
  vdef("vital.rep", 2, "reproduction", "Living things have babies to make new living things.", "Los seres vivos tienen bebés para que haya seres vivos nuevos.", {
    nameEs: "reproducción",
    ex: "🐣 [[Reproduction]]: [[Living things have babies to make new living things.]] [[All living things reproduce. They make new living things.]]",
    qs: [
      { q: "Living things have ____ to make new living things.", es: "Los seres vivos tienen ____ para que haya seres vivos nuevos.", o: ["babies", "food", "water"], a: 0 },
      { q: "All living things reproduce. They make new…", es: "Todos los seres vivos se reproducen. Hacen nuevos…", o: ["living things", "toys", "stones"], a: 0 },
    ],
  });
  c("vital.plantfood", "vital", {
    t: "Plants make their own food", es: "Las plantas fabrican su comida",
    ex: "Las plantas fabrican su propia comida con la luz del sol ☀️: [[Plants use sunlight to make their own food.]] Los animales comen otros seres vivos: [[Animals feed on other living things.]]",
    qs: [
      { q: "How do plants get their food?", es: "¿Cómo consiguen su comida las plantas?", o: ["They use sunlight to make their own food.", "They eat insects and worms.", "They don't need food."], a: 0, img: "ficha/plant-sun.png" },
      { q: "What do animals feed on?", es: "¿De qué se alimentan los animales?", o: ["Other living things", "Sunlight", "Stones"], a: 0 },
      { k: "tf", q: "Animals make their own food.", es: "Los animales fabrican su propia comida.", a: false,
        why: "Las que fabrican su comida son las [[plants]]. Los animales comen otros seres vivos." },
      { q: "Plants use ____ to make their own food.", es: "Las plantas usan ____ para fabricar su comida.", o: ["sunlight", "toys", "eggs"], a: 0 },
    ],
  });
  c("vital.plantmove", "vital", {
    t: "Plants can't move but react to sunlight", es: "Las plantas no se mueven, pero reaccionan",
    ex: "Las plantas no pueden moverse de sitio ([[Plants cannot move around.]]), pero reaccionan a estímulos como la luz del sol ([[They react to stimuli, such as sunlight.]]): el girasol se gira hacia el sol 🌻.",
    qs: [
      { q: "Can plants move around?", es: "¿Pueden las plantas moverse de un sitio a otro?", o: ["No, but they react to sunlight.", "Yes, they can walk.", "No, they never do anything."], a: 0 },
      { q: "The sunflower turns towards the sun. Which vital function is it?", es: "El girasol se gira hacia el sol. ¿Qué función vital es?", o: VF, a: 1, keep: true, img: "ficha/sunflower-sun.png" },
      { q: "Plants react to stimuli, such as…", es: "Las plantas reaccionan a estímulos como…", o: ["sunlight", "music", "toys"], a: 0 },
    ],
  });
  c("vital.eggs", "vital", {
    t: "Babies, eggs, seeds or spores", es: "Crías, huevos, semillas o esporas",
    ex: "Algunos animales tienen crías ([[give birth to babies]]): la perra, la gata, las personas. Otros ponen huevos ([[lay eggs]]): la gallina, la tortuga. Las plantas se reproducen con semillas o esporas ([[seeds or spores]]).",
    qs: [
      { q: "How does a hen reproduce?", es: "¿Cómo se reproduce una gallina?", o: ["It lays eggs.", "It gives birth to babies.", "With seeds."], a: 0, img: "ficha/hen-chicks.png" },
      { q: "How does a dog reproduce?", es: "¿Cómo se reproduce un perro?", o: ["It gives birth to babies.", "It lays eggs.", "With spores."], a: 0, img: "ficha/dog-puppies.png" },
      { q: "How do plants reproduce?", es: "¿Cómo se reproducen las plantas?", o: ["Through seeds or spores.", "They lay eggs.", "They give birth to babies."], a: 0, img: "ficha/sunflower-seeds.png" },
      { q: "How does a turtle reproduce?", es: "¿Cómo se reproduce una tortuga?", o: ["It lays eggs.", "It gives birth to babies.", "With seeds."], a: 0, img: "ficha/turtle.png" },
      { q: "Some animals give birth to babies, and others…", es: "Algunos animales tienen crías y otros…", o: ["lay eggs", "make their own food", "never reproduce"], a: 0 },
    ],
  });
  // Dibujos y fotos de las funciones vitales.
  const VPICS = [
    [0, "ficha/dog-eats.png", "The dog is eating.", "El perro come."],
    [0, "ficha/rabbit-drinks.png", "The rabbit is drinking water.", "El conejo bebe agua."],
    [0, "ficha/plant-sun.png", "The plant uses sunlight to make its food.", "La planta usa la luz del sol para fabricar su comida."],
    [0, "ficha/fish.png", "The fish gets air from the water.", "El pez toma el aire del agua."],
    [0, "libro/p16-sheep.jpg", "The sheep is eating grass.", "La oveja come hierba."],
    [0, "libro/p16-horse.jpg", "The horse is drinking water.", "El caballo bebe agua."],
    [0, "libro/p7-giraffe.jpg", "The giraffe is eating leaves.", "La jirafa come hojas."],
    [0, "libro/p9-seagull.jpg", "The seagull is eating.", "La gaviota está comiendo."],
    [1, "ficha/dog-butterfly.png", "The dog sees a butterfly and chases it.", "El perro ve una mariposa y la persigue."],
    [1, "ficha/sunflower-sun.png", "The sunflower turns towards the sun.", "El girasol se gira hacia el sol."],
    [1, "ficha/cat.png", "The cat hears a noise and looks.", "El gato oye un ruido y mira."],
    [1, "ficha/chameleon.png", "The chameleon sees something and reacts.", "El camaleón ve algo y reacciona."],
    [1, "libro/p16-hares.jpg", "Two hares are fighting.", "Dos liebres se pelean."],
    [1, "libro/p16-talking.jpg", "A boy and his grandmother are talking.", "Un niño y su abuela hablan."],
    [1, "libro/p7-plant-light.jpg", "The plant grows towards the light.", "La planta crece hacia la luz."],
    [1, "libro/p9-dog-butterfly.jpg", "The dog jumps to catch a butterfly.", "El perro salta para coger una mariposa."],
    [2, "ficha/dog-puppies.png", "A dog with her puppies.", "Una perra con sus cachorros."],
    [2, "ficha/hen-chicks.png", "A hen with her chicks.", "Una gallina con sus pollitos."],
    [2, "ficha/turtle.png", "Baby turtles come out of their eggs.", "Las tortuguitas salen de sus huevos."],
    [2, "ficha/sunflower-seeds.png", "A seed grows into a new plant.", "Una semilla se convierte en una planta nueva."],
    [2, "libro/p16-egg.jpg", "A chick is hatching from an egg.", "Un pollito sale del huevo."],
    [2, "libro/p16-seeds.jpg", "Someone is planting seeds.", "Alguien planta semillas."],
    [2, "libro/p7-baby.jpg", "A mother with her new baby.", "Una madre con su bebé recién nacido."],
    [2, "libro/p9-cat-kittens.jpg", "A cat with her kittens.", "Una gata con sus gatitos."],
  ];
  const VEX = [
    "Comer, beber o respirar es 🍎 [[Nutrition]]: [[Living things get food, water and air.]]",
    "Notar algo y reaccionar es 👀 [[Interaction]]: [[Living things sense and react.]]",
    "Tener bebés, huevos o semillas es 🐣 [[Reproduction]]: [[Living things have babies to make new living things.]]",
  ];
  ["nut", "int", "rep"].forEach((k, i) => c("pic." + k, "vital", {
    t: `Pictures: ${VF[i]}`, es: `Dibujos: ${["nutrición", "relación", "reproducción"][i]}`, ex: VEX[i], need: 3, pic: true,
    qs: VPICS.filter((v) => v[0] === i).map(([, img, cap, capEs], j) => ({ id: `p${j}`, img, cap, capEs, q: "Which vital function does the picture show?",
      es: "¿Qué función vital muestra el dibujo?", o: VF, a: i, keep: true, why: VEX[i] })),
  }));
  c("vital.scen", "vital", {
    t: "What is happening? (no picture)", es: "¿Qué función es? (sin dibujo)",
    ex: "🍎 Comer, beber, respirar → [[Nutrition]]. 👀 Notar algo y reaccionar → [[Interaction]]. 🐣 Bebés, huevos, semillas → [[Reproduction]].",
    need: 3,
    qs: [
      ["A cow eats grass.", "Una vaca come hierba.", 0], ["A cat hears a noise and runs away.", "Un gato oye un ruido y sale corriendo.", 1],
      ["A bird lays eggs.", "Un pájaro pone huevos.", 2], ["You drink a glass of water.", "Te bebes un vaso de agua.", 0],
      ["You pull your hand away from something hot.", "Apartas la mano de algo que quema.", 1], ["A plant makes seeds.", "Una planta hace semillas.", 2],
      ["A puppy is born.", "Nace un cachorro.", 2], ["A plant grows towards the light.", "Una planta crece hacia la luz.", 1],
      ["A fish breathes air from the water.", "Un pez respira el aire del agua.", 0],
    ].map(([q, es, a], j) => ({ id: `s${j}`, q: `"${q}" Which vital function is it?`, es: `«${es}» ¿Qué función vital es?`, o: VF, a, keep: true, why: VEX[a] })),
  });

  // ======================= 3. Cells
  c("cells.def", "cells", {
    t: "A cell is the smallest living unit", es: "La célula, la unidad viva más pequeña",
    ex: "La [[cell]] (célula) es la unidad viva más pequeña: [[A cell is the smallest living unit that makes up a living thing.]] Todos los seres vivos están hechos de células.",
    qs: [
      { q: "What is the smallest living unit?", es: "¿Cuál es la unidad viva más pequeña?", o: ["The cell", "The organ", "The tissue", "The organism"], a: 0 },
      { q: "A cell is the ____ living unit that makes up a living thing.", es: "Una célula es la unidad viva más ____ que forma un ser vivo.", o: ["smallest", "biggest", "oldest"], a: 0 },
      { k: "tf", q: "All living things are made of cells.", es: "Todos los seres vivos están hechos de células.", a: true },
    ],
  });
  c("cells.micro", "cells", {
    t: "We need a microscope", es: "Necesitamos un microscopio",
    ex: "Las células son diminutas: para verlas necesitamos un [[microscope]] (microscopio) 🔬. ¡Ojo! Un [[telescope]] (telescopio) es para mirar las estrellas.",
    see: { img: "libro/p10-microscope.jpg" },
    qs: [
      { q: "What do we need to see individual cells?", es: "¿Qué necesitamos para ver las células?", o: ["A microscope", "A telescope", "Sunglasses"], a: 0 },
      { k: "tf", q: "We can see individual cells with our eyes.", es: "Podemos ver las células a simple vista.", a: false,
        why: "Son tan pequeñas que necesitamos un [[microscope]] para verlas." },
    ],
  });
  c("cells.uni", "cells", {
    t: "Unicellular: one cell (algae, bacteria)", es: "Unicelulares: una célula",
    ex: "[[Unicellular]] = UNA sola célula (uni = uno). Ejemplos: las algas ([[algae]]) y las bacterias ([[bacteria]]). Esa única célula hace las 3 funciones vitales.",
    qs: [
      { q: "Unicellular organisms have…", es: "Los seres unicelulares tienen…", o: ["only one cell", "many cells", "no cells"], a: 0 },
      { q: "Bacteria are…", es: "Las bacterias son…", o: ["unicellular", "multicellular"], a: 0, keep: true, img: "libro/p10-bacteria.jpg" },
      { q: "Algae are…", es: "Las algas son…", o: ["unicellular", "multicellular"], a: 0, keep: true, img: "libro/p10-algae.jpg" },
      { q: "____ organisms, such as algae or bacteria, have just one cell.", es: "Los seres ____, como las algas o las bacterias, tienen una sola célula.", o: ["Unicellular", "Multicellular"], a: 0, keep: true },
      { k: "tf", q: "In a unicellular organism, the single cell carries out all three vital functions.", es: "En un ser unicelular, su única célula hace las tres funciones vitales.", a: true },
    ],
  });
  c("cells.multi", "cells", {
    t: "Multicellular: many cells (plants, animals, people)", es: "Multicelulares: muchas células",
    ex: "[[Multicellular]] = MUCHAS células (multi = muchas). Las plantas, los animales y las personas somos multicelulares, y cada célula tiene un trabajo distinto ([[Each cell has a different function.]]).",
    qs: [
      { q: "Multicellular organisms have…", es: "Los seres multicelulares tienen…", o: ["many cells", "only one cell", "no cells"], a: 0 },
      { q: "____ organisms, such as a bat or a cactus, have many cells.", es: "Los seres ____, como un murciélago o un cactus, tienen muchas células.", o: ["Multicellular", "Unicellular"], a: 0, keep: true },
      { q: "Are people unicellular or multicellular?", es: "¿Las personas somos unicelulares o multicelulares?", o: ["Multicellular", "Unicellular"], a: 0, keep: true, img: "libro/p10-girl.jpg" },
      { q: "Is a cactus unicellular or multicellular?", es: "¿Un cactus es unicelular o multicelular?", o: ["Multicellular", "Unicellular"], a: 0, keep: true, img: "libro/p19-cactus.jpg" },
      { k: "pics", q: "Which one is unicellular?", es: "¿Cuál es unicelular?", pics: ["libro/p10-bacteria.jpg", "libro/p10-orangutan.jpg", "libro/p19-cactus.jpg"], a: 0 },
      { k: "tf", q: "In multicellular organisms, each cell has a different function.", es: "En los seres multicelulares, cada célula tiene una función distinta.", a: true },
    ],
  });

  // ======================= 4. Plant cell  ·  5. Animal cell
  // Para cada parte: etiqueta (ficha), escribir, tocar, número (libro) + función.
  const part = (id, topic, cell, p, o) => {
    const qs = [{ k: "label", cell, part: p, id: "label" }, { k: "write", cell, part: p, id: "write" }];
    if (o.tap !== false) qs.push({ k: "tap", cell, part: p, id: "tap" });
    const n = Object.keys(BOOK[cell].n).find((k) => BOOK[cell].n[k].part === p);
    qs.push({ k: "num", cell, n: Number(n), id: "num" });
    c(id, topic, Object.assign({ word: LABEL[cell][p], see: { cell, part: p }, must: "write" }, o, { qs: qs.concat(o.qs || []) }));
  };
  part("plant.wall", "plantcell", "plant", "wall", {
    t: "cell wall · pared celular", es: "Pared celular",
    ex: "La [[cell wall]] (pared celular) es la pared gorda de fuera 🧱: [[Cell wall makes the plant rigid.]] (hace que la planta esté firme). Solo la tienen las plantas. Suena «sel uol».",
    qs: [
      { q: "Which part makes the plant rigid?", es: "¿Qué parte hace que la planta sea rígida?", o: ["cell wall", "nucleus", "vacuole", "cell membrane"], a: 0 },
      { q: "What does the cell wall do?", es: "¿Qué hace la pared celular?", o: ["It makes the plant rigid.", "It controls cell functions.", "It contains water."], a: 0 },
    ],
  });
  part("plant.membrane", "plantcell", "plant", "membrane", {
    t: "cell membrane · membrana celular", es: "Membrana celular (vegetal)", tap: false,
    ex: "La [[cell membrane]] (membrana celular) es la piel fina justo dentro de la pared. Es como la puerta 🚪: [[Cell membrane controls substances entering and leaving the cell.]] Suena «sel mém-brein».",
    qs: [
      { q: "Which part controls substances entering and leaving the cell?", es: "¿Qué parte controla lo que entra y sale de la célula?", o: ["cell membrane", "cell wall", "nucleus", "chloroplast"], a: 0 },
      { q: "In the plant cell, where is the cell membrane?", es: "En la célula vegetal, ¿dónde está la membrana?", o: ["Just inside the cell wall", "In the middle of the cell", "Outside the cell wall"], a: 0 },
    ],
  });
  part("plant.chloro", "plantcell", "plant", "chloroplast", {
    t: "chloroplasts · cloroplastos", es: "Cloroplastos",
    ex: "Los [[chloroplasts]] (cloroplastos) tienen dentro como montoncitos de monedas. [[Chloroplasts contain chlorophyll: they make plants green.]] 💚 Solo los tienen las plantas. Suena «cló-ro-plast».",
    qs: [
      { q: "Which part contains chlorophyll?", es: "¿Qué parte tiene clorofila?", o: ["chloroplast", "nucleus", "vacuole", "cell wall"], a: 0 },
      { q: "What makes plants green?", es: "¿Qué hace que las plantas sean verdes?", o: ["The chlorophyll in the chloroplasts", "The water in the vacuole", "The cell wall"], a: 0 },
      { q: "Chloroplasts contain…", es: "Los cloroplastos contienen…", o: ["chlorophyll", "babies", "stones"], a: 0 },
    ],
  });
  part("plant.nucleus", "plantcell", "plant", "nucleus", {
    t: "nucleus · núcleo (vegetal)", es: "Núcleo (vegetal)",
    ex: "El [[nucleus]] (núcleo) es la bola del centro, el jefe de la célula 🧠: [[Nucleus controls cell functions.]] Suena «niú-cli-us».",
    qs: [
      { q: "Which part controls cell functions?", es: "¿Qué parte controla las funciones de la célula?", o: ["nucleus", "cell membrane", "vacuole", "chloroplast"], a: 0 },
    ],
  });
  part("plant.vacuole", "plantcell", "plant", "vacuole", {
    t: "vacuole · vacuola (grande)", es: "Vacuola (vegetal)",
    ex: "La [[vacuole]] (vacuola) es una bolsa llena de agua 💧. En las plantas es GRANDE: [[Large vacuoles contain water.]] Suena «vá-kiu-oul».",
    qs: [
      { q: "What do vacuoles contain?", es: "¿Qué tienen dentro las vacuolas?", o: ["water", "chlorophyll", "babies"], a: 0 },
      { q: "In plant cells, the vacuoles are…", es: "En las células vegetales, las vacuolas son…", o: ["large", "small", "green"], a: 0 },
    ],
  });
  c("plant.which", "plantcell", {
    t: "Is it a plant cell?", es: "¿Es una célula vegetal?", need: 3,
    ex: "Pistas de la [[plant cell]]: forma regular como una caja, pared gorda ([[cell wall]]) y [[chloroplasts]]. Sin pared y más redondita: [[animal cell]].",
    see: { both: true },
    qs: [
      { q: "Is it a plant cell or an animal cell?", es: "¿Es una célula vegetal o animal?", cellimg: "plant", o: ["Plant cell", "Animal cell"], a: 0, keep: true },
      { q: "Is it a plant cell or an animal cell?", es: "¿Es una célula vegetal o animal?", img: "libro/p11-plant-cell.jpg", o: ["Plant cell", "Animal cell"], a: 0, keep: true },
      { q: "Is it a plant cell or an animal cell?", es: "¿Es una célula vegetal o animal?", img: "libro/lv-plant-cell.jpg", o: ["Plant cell", "Animal cell"], a: 0, keep: true },
    ],
  });

  part("animal.membrane", "animalcell", "animal", "membrane", {
    t: "cell membrane · membrana (animal)", es: "Membrana celular (animal)",
    ex: "La [[cell membrane]] es la piel de fuera de la célula animal. [[Cell membrane controls substances entering and leaving the cell.]] ¡La célula animal NO tiene [[cell wall]]!",
    qs: [
      { q: "In the animal cell, what is the outside layer?", es: "En la célula animal, ¿qué hay por fuera?", o: ["cell membrane", "cell wall", "chloroplast"], a: 0,
        w: { 1: "¡Trampa! Las células animales NO tienen [[cell wall]]. Por fuera solo tienen la [[cell membrane]]." } },
    ],
  });
  part("animal.nucleus", "animalcell", "animal", "nucleus", {
    t: "nucleus · núcleo (animal)", es: "Núcleo (animal)",
    ex: "El [[nucleus]] es el jefe de la célula 🧠: [[Nucleus controls cell functions.]] Lo tienen las células animales y las vegetales.",
    qs: [
      { q: "Which part of the animal cell controls cell functions?", es: "¿Qué parte de la célula animal controla sus funciones?", o: ["nucleus", "vacuoles", "cell membrane"], a: 0 },
    ],
  });
  part("animal.vacuoles", "animalcell", "animal", "vacuole", {
    t: "vacuoles · vacuolas (pequeñas)", es: "Vacuolas (animal)",
    ex: "La célula animal tiene muchas [[vacuoles]] pequeñitas: [[Small vacuoles contain water.]] 💧 Por eso en la ficha pone [[vacuoles]], en plural.",
    qs: [
      { q: "Animal cells have…", es: "Las células animales tienen…", o: ["small vacuoles", "one large vacuole", "no vacuoles"], a: 0 },
      { q: "Small vacuoles contain…", es: "Las vacuolas pequeñas contienen…", o: ["water", "chlorophyll", "seeds"], a: 0 },
    ],
  });
  c("animal.which", "animalcell", {
    t: "Is it an animal cell?", es: "¿Es una célula animal?", need: 3,
    ex: "Pistas de la [[animal cell]]: no tiene [[cell wall]] ni [[chloroplasts]], y su forma puede ser rectangular, ovalada o irregular.",
    see: { both: true },
    qs: [
      { q: "Is it a plant cell or an animal cell?", es: "¿Es una célula vegetal o animal?", cellimg: "animal", o: ["Plant cell", "Animal cell"], a: 1, keep: true },
      { q: "Is it a plant cell or an animal cell?", es: "¿Es una célula vegetal o animal?", img: "libro/p11-animal-cell.jpg", o: ["Plant cell", "Animal cell"], a: 1, keep: true },
      { q: "Is it a plant cell or an animal cell?", es: "¿Es una célula vegetal o animal?", img: "libro/lv-animal-cell.jpg", o: ["Plant cell", "Animal cell"], a: 1, keep: true,
        why: "Es una célula animal (de músculo): alargada, sin pared y sin cloroplastos. Las animales pueden tener formas muy distintas." },
    ],
  });

  // ======================= 6. Plant vs animal
  c("cmp.only", "compare", {
    t: "Only plants: cell wall and chloroplasts", es: "Solo las plantas: pared y cloroplastos",
    ex: "[[The animal cell does not have a cell wall or chloroplasts.]] Solo la célula vegetal tiene [[cell wall]] y [[chloroplasts]].",
    see: { both: true },
    qs: [
      { q: "Which parts do only plant cells have?", es: "¿Qué partes tienen solo las células vegetales?", o: ["Cell wall and chloroplasts", "Nucleus and cell membrane", "Small vacuoles"], a: 0 },
      { q: "Which part do animal cells NOT have?", es: "¿Qué parte NO tienen las células animales?", o: ["cell wall", "nucleus", "cell membrane", "vacuoles"], a: 0 },
      { q: "Do animal cells have chloroplasts?", es: "¿Las células animales tienen cloroplastos?", o: ["No", "Yes"], a: 0, keep: true },
      { k: "tf", q: "The animal cell does not have a cell wall or chloroplasts.", es: "La célula animal no tiene pared celular ni cloroplastos.", a: true },
    ],
  });
  c("cmp.both", "compare", {
    t: "Both: nucleus, cell membrane, vacuoles", es: "Las dos: núcleo, membrana, vacuolas",
    ex: "Las dos células tienen [[nucleus]], [[cell membrane]] y [[vacuoles]]. ¡Ojo! La vegetal también tiene membrana, justo dentro de la pared.",
    see: { both: true },
    qs: [
      { q: "Which part do BOTH cells have?", es: "¿Qué parte tienen LAS DOS células?", o: ["nucleus", "cell wall", "chloroplast"], a: 0 },
      { k: "tf", q: "Only animal cells have a nucleus.", es: "Solo las células animales tienen núcleo.", a: false,
        why: "¡Falso! Las dos tienen [[nucleus]]: la vegetal y la animal." },
      { k: "tf", q: "Plant cells have a cell membrane.", es: "Las células vegetales tienen membrana celular.", a: true,
        why: "¡Sí! La vegetal tiene [[cell membrane]] justo dentro de la [[cell wall]]." },
    ],
  });
  c("cmp.vac", "compare", {
    t: "Large vacuoles vs small vacuoles", es: "Vacuolas grandes y pequeñas", need: 3,
    ex: "Planta: vacuola GRANDE ([[large vacuoles]]). Animal: vacuolas pequeñitas ([[small vacuoles]]). Las dos guardan agua 💧.",
    see: { both: true },
    qs: [
      { q: "Plant cells have ____ vacuoles and animal cells have ____ vacuoles.", es: "Las vegetales tienen vacuolas ____ y las animales vacuolas ____.", o: ["large / small", "small / large", "green / red"], a: 0, keep: true },
      { q: "Which cell has a large vacuole?", es: "¿Qué célula tiene una vacuola grande?", o: ["Plant cell", "Animal cell"], a: 0, keep: true },
    ],
  });
  c("cmp.shape", "compare", {
    t: "Shapes: plant regular, animal varied", es: "Las formas",
    ex: "Todas las células vegetales tienen forma regular ([[all plant cells have a regular shape]]). Las animales pueden ser rectangulares, ovaladas o irregulares.",
    see: { both: true },
    qs: [
      { q: "Which cells all have a regular shape?", es: "¿Qué células tienen todas forma regular?", o: ["Plant cells", "Animal cells"], a: 0, keep: true },
      { q: "Animal cells can have…", es: "Las células animales pueden tener…", o: ["rectangular, oval or irregular shapes", "only square shapes", "no shape"], a: 0 },
      { q: "Plant cells…", es: "Las células vegetales…", o: ["all have regular shapes", "have irregular shapes", "have no shape"], a: 0 },
    ],
  });
  c("cmp.nucleus", "compare", {
    t: "The nucleus: the control centre", es: "El núcleo, centro de control",
    ex: "El [[nucleus]] es el centro de control de la célula ([[the control centre]]) y controla funciones como la reproducción. Se parece más al cerebro 🧠 que al corazón.",
    see: { cell: "animal", part: "nucleus" },
    qs: [
      { k: "tf", q: "The nucleus is similar to the cell's heart.", es: "El núcleo se parece al corazón de la célula.", a: false,
        why: "Falso: el [[nucleus]] es como el cerebro 🧠, el centro de control de la célula." },
      { k: "tf", q: "The nucleus acts as the control centre of the cell.", es: "El núcleo es el centro de control de la célula.", a: true },
      { k: "tf", q: "The nucleus controls functions like a cell's reproduction.", es: "El núcleo controla funciones como la reproducción de la célula.", a: true },
    ],
  });

  // ======================= 7. Levels of organisation
  const LV = ["cell", "tissue", "organ", "system", "organism"];
  const LVES = { cell: "célula", tissue: "tejido", organ: "órgano", system: "sistema", organism: "organismo" };
  c("lv.order", "levels", {
    t: "Cell → tissue → organ → system → organism", es: "El orden de los niveles",
    ex: "Del más pequeño al más grande: [[cell]] → [[tissue]] → [[organ]] → [[system]] → [[organism]]. Truco: «Cinco Tortugas Organizan Sus Orquestas» 🐢.",
    qs: [
      { k: "order", q: "Put them in order, from the smallest to the largest.", es: "Ordénalos del más pequeño al más grande.", o: LV },
      { q: "Which is the smallest?", es: "¿Cuál es el más pequeño?", o: ["cell", "tissue", "organ", "organism"], a: 0 },
      { q: "Which is the largest?", es: "¿Cuál es el más grande?", o: ["organism", "organ", "tissue", "cell"], a: 0 },
      { q: "What comes after tissue?", es: "¿Qué va después del tejido?", o: ["organ", "cell", "organism"], a: 0 },
      { q: "What comes after organ?", es: "¿Qué va después del órgano?", o: ["system", "tissue", "cell"], a: 0 },
    ],
  });
  const LVDEF = {
    cell: ["A cell is the smallest living unit.", "La célula es la unidad viva más pequeña."],
    tissue: ["When cells perform the same function, they group together and form tissue.", "Cuando las células hacen el mismo trabajo, se juntan y forman un tejido."],
    organ: ["Tissues group together and form an organ.", "Los tejidos se juntan y forman un órgano."],
    system: ["Organs work together and form organ systems.", "Los órganos trabajan juntos y forman sistemas."],
    organism: ["When all the systems work together, they form a complete living organism.", "Cuando todos los sistemas trabajan juntos, forman un organismo completo."],
  };
  const LVPIC = { cell: ["libro/lv-plant-cell.jpg", "libro/lv-animal-cell.jpg"], tissue: ["libro/lv-plant-tissue.jpg", "libro/lv-animal-tissue.jpg"],
    organ: ["libro/lv-plant-organ.jpg", "libro/lv-animal-organ.jpg"], system: ["libro/lv-plant-system.jpg", "libro/lv-animal-system.jpg"],
    organism: ["libro/lv-plant-organism.jpg", "libro/lv-animal-organism.jpg"] };
  for (const l of LV) {
    const [en, es] = LVDEF[l];
    const blank = en.replace(new RegExp(`\\b(an? )?${l}s?\\b`), "$1____");
    const qs = [
      { q: blank, es, o: LV, a: LV.indexOf(l), keep: true, id: "def" },
      ...LVPIC[l].map((img, i) => ({ id: "pic" + i, img, q: "Which level is it?", es: "¿Qué nivel es?", o: LV, a: LV.indexOf(l), keep: true })),
    ];
    if (l === "organ") qs.push({ q: "A leaf is an…", es: "Una hoja es un…", o: ["organ", "organism", "cell"], a: 0, img: "libro/lv-plant-organ.jpg" },
      { q: "The heart is an…", es: "El corazón es un…", o: ["organ", "tissue", "organism"], a: 0, img: "libro/lv-animal-organ.jpg" });
    if (l === "organism") qs.push({ q: "A cat is a complete living…", es: "Un gato es un ser vivo completo, un…", o: ["organism", "organ", "tissue"], a: 0, img: "libro/lv-animal-organism.jpg" });
    c("lv." + l, "levels", { t: `${l} · ${LVES[l]}`, es: LVES[l], word: l, need: 2,
      ex: `[[${l}]] (${LVES[l]}): [[${en}]]`, see: { gallery: LVPIC[l].map((g) => [g, l, LVES[l]]) }, qs });
  }

  // ======================= 8. The five kingdoms
  const K5 = ["Plants", "Animals", "Fungi", "Protists", "Monera"];
  const KEX = {
    Plants: "[[Plants]]: multicelulares, fabrican su comida y se reproducen con semillas o esporas.",
    Animals: "[[Animals]]: multicelulares, comen otros seres vivos, reaccionan a estímulos y ponen huevos o tienen crías. ¡Las personas somos animales!",
    Fungi: "[[Fungi]] (hongos): toman su alimento de plantas y animales muertos, no se mueven y se reproducen con esporas. Setas 🍄 y levadura.",
    Protists: "[[Protists]]: casi siempre unicelulares y viven en el agua o cerca. Algunos se dividen en dos para reproducirse.",
    Monera: "[[Monera]]: unicelulares (las bacterias). Viven en tierra, aire, agua y dentro de otros seres vivos. Se dividen en dos células para reproducirse.",
  };
  c("k.five", "kingdoms", {
    t: "Five kingdoms", es: "Los cinco reinos",
    ex: "Clasificamos los seres vivos en 5 [[kingdoms]] (reinos): [[plants]], [[animals]], [[fungi]], [[protists]] y [[monera]].",
    see: { img: "libro/p13-kingdoms.jpg" },
    qs: [
      { q: "How many kingdoms are there?", es: "¿Cuántos reinos hay?", o: ["5", "3", "2"], a: 0 },
      { q: "We classify all living things into five groups called…", es: "Clasificamos los seres vivos en cinco grupos llamados…", o: ["kingdoms", "tissues", "vital functions"], a: 0 },
      { q: "Which one is NOT a kingdom?", es: "¿Cuál NO es un reino?", o: ["Natural", "Fungi", "Monera", "Protists"], a: 0,
        why: "[[Natural]] es un grupo de seres inertes. Los reinos son [[plants]], [[animals]], [[fungi]], [[protists]] y [[monera]]." },
      { q: "Which list shows the five kingdoms?", es: "¿Qué lista tiene los cinco reinos?", o: ["plants, animals, fungi, protists and monera", "animals, plants, natural, artificial and fungi", "cell, tissue, organ, system and organism"], a: 0 },
    ],
  });
  c("k.plants", "kingdoms", {
    t: "Plants: make their own food", es: "Reino plantas", ex: KEX.Plants, see: { img: "libro/k-plants.jpg" },
    qs: [
      { q: "Which kingdom makes its own food?", es: "¿Qué reino fabrica su propia comida?", o: ["Plants", "Animals", "Fungi"], a: 0 },
      { q: "Plants reproduce through…", es: "Las plantas se reproducen con…", o: ["seeds or spores", "eggs", "babies"], a: 0 },
      { k: "tf", q: "Plants are unicellular.", es: "Las plantas son unicelulares.", a: false, why: "Las plantas son [[multicellular]]: tienen muchas células." },
    ],
  });
  c("k.animals", "kingdoms", {
    t: "Animals: feed on other living things", es: "Reino animales", ex: KEX.Animals, see: { img: "libro/k-animals.jpg" },
    qs: [
      { q: "Which kingdom feeds on other living things?", es: "¿Qué reino se alimenta de otros seres vivos?", o: ["Animals", "Plants", "Monera"], a: 0 },
      { q: "Animals are…", es: "Los animales son…", o: ["multicellular", "unicellular"], a: 0, keep: true },
      { q: "People belong to the…", es: "Las personas pertenecemos al…", o: ["animal kingdom", "plant kingdom", "fungi kingdom"], a: 0, img: "libro/p19-child.jpg" },
      { q: "Animals lay eggs or…", es: "Los animales ponen huevos o…", o: ["give birth to babies", "make their own food", "divide into two cells"], a: 0 },
    ],
  });
  c("k.fungi", "kingdoms", {
    t: "Fungi: nutrients from dead things, spores", es: "Reino hongos", ex: KEX.Fungi, see: { img: "libro/k-fungi.jpg" },
    qs: [
      { q: "Fungi take nutrients from…", es: "Los hongos toman su alimento de…", o: ["dead plants and animals", "sunlight", "stones"], a: 0 },
      { q: "Fungi reproduce through…", es: "Los hongos se reproducen con…", o: ["spores", "eggs", "babies"], a: 0 },
      { q: "Can fungi move around?", es: "¿Los hongos pueden moverse?", o: ["No", "Yes"], a: 0, keep: true },
      { q: "Mushrooms belong to the…", es: "Las setas pertenecen al reino…", o: ["fungi kingdom", "plant kingdom", "animal kingdom"], a: 0, img: "libro/p19-mushrooms.jpg",
        why: "¡Las setas no son plantas! No fabrican su comida: son [[fungi]]." },
      { q: "What is a difference between fungi and plants?", es: "¿En qué se diferencian los hongos de las plantas?", o: ["Plants make their own food, but fungi don't.", "Fungi are green, but plants aren't.", "Plants can walk, but fungi can't."], a: 0 },
      { k: "tf", q: "Fungi feed on flowering plants.", es: "Los hongos se alimentan de plantas con flores.", a: false,
        why: "Falso: los [[fungi]] toman su alimento de plantas y animales MUERTOS ([[dead plants and animals]])." },
    ],
  });
  c("k.protists", "kingdoms", {
    t: "Protists: usually unicellular, in water", es: "Reino protistas", ex: KEX.Protists, see: { img: "libro/k-protists.jpg" },
    qs: [
      { q: "Protists are usually…", es: "Los protistas suelen ser…", o: ["unicellular organisms", "multicellular organisms", "non-living things"], a: 0 },
      { q: "Where do most protists live?", es: "¿Dónde viven casi todos los protistas?", o: ["In or near water", "In the desert", "Inside stones"], a: 0 },
      { k: "tf", q: "Protists reproduce with spores.", es: "Los protistas se reproducen con esporas.", a: false,
        why: "Falso: algunos [[protists]] se dividen en dos células para reproducirse ([[divide into two cells]])." },
    ],
  });
  c("k.monera", "kingdoms", {
    t: "Monera: bacteria, divide into two", es: "Reino moneras", ex: KEX.Monera, see: { img: "libro/k-monera.jpg" },
    qs: [
      { q: "Monera are…", es: "Las moneras son…", o: ["unicellular", "multicellular"], a: 0, keep: true },
      { q: "How do monera reproduce?", es: "¿Cómo se reproducen las moneras?", o: ["They divide into two cells.", "They lay eggs.", "With seeds."], a: 0 },
      { q: "Bacteria belong to the…", es: "Las bacterias pertenecen al reino…", o: ["monera kingdom", "animal kingdom", "plant kingdom"], a: 0, img: "libro/p19-petri.jpg" },
      { q: "Some monera feed…", es: "Algunas moneras se alimentan…", o: ["on dead plants and animals", "on sunlight", "on stones"], a: 0 },
      { k: "tf", q: "Monera can only live in water.", es: "Las moneras solo pueden vivir en el agua.", a: false,
        why: "Falso: viven en la tierra, en el aire, en el agua y dentro de otros seres vivos." },
    ],
  });
  const KPICS = [
    ["libro/p19-elephants.jpg", "Animals", "elephants", "elefantes"], ["libro/p19-child.jpg", "Animals", "a child", "un niño"],
    ["libro/k-animals.jpg", "Animals", "toucan, ant, rabbit", "tucán, hormiga, conejo"], ["libro/p19-cactus.jpg", "Plants", "cactus", "cactus"],
    ["libro/p19-flowers.jpg", "Plants", "flowers", "flores"], ["libro/k-plants.jpg", "Plants", "rose, grass, fern", "rosa, hierba, helecho"],
    ["libro/p19-mushrooms.jpg", "Fungi", "mushrooms", "setas"], ["libro/p17-mushrooms.jpg", "Fungi", "mushrooms", "setas"],
    ["libro/k-fungi.jpg", "Fungi", "fungi", "hongos"], ["libro/p19-petri.jpg", "Monera", "bacteria", "bacterias"],
    ["libro/k-monera.jpg", "Monera", "bacteria", "bacterias"], ["libro/k-protists.jpg", "Protists", "protists", "protistas"],
  ];
  c("k.pics", "kingdoms", {
    t: "Pictures: which kingdom?", es: "Fotos: ¿qué reino?", need: 3, pic: true,
    ex: "Plants 🌵 · Animals 🐘 (¡y personas!) · Fungi 🍄 · Protists (en el agua) · Monera (bacterias).",
    qs: KPICS.map(([img, k, cap, capEs], j) => ({ id: "k" + j, img, cap, capEs, q: "Which kingdom does it belong to?", es: "¿A qué reino pertenece?", o: K5, a: K5.indexOf(k), keep: true, why: KEX[k] })),
  });
  c("k.yeast", "kingdoms", {
    t: "Yeast experiment", es: "El experimento de la levadura",
    ex: "La levadura ([[yeast]]) es un hongo vivo. Con azúcar se alimenta (eso es [[nutrition]]) y suelta un gas, el [[carbon dioxide]], que hincha el globo 🎈.",
    see: { img: "libro/p15-test3.jpg" },
    qs: [
      { q: "Is yeast a living thing?", es: "¿La levadura es un ser vivo?", o: ["Yes, it is a fungus.", "No, it is a non-living thing.", "Yes, it is a plant."], a: 0, img: "libro/p15-yeast.jpg" },
      { q: "In the experiment, what happened to the balloon on the bottle with sugar?", es: "En el experimento, ¿qué le pasó al globo de la botella con azúcar?", o: ["It blew up.", "Nothing happened.", "It turned green."], a: 0, img: "libro/p15-test3.jpg" },
      { q: "What vital function produced the gas carbon dioxide?", es: "¿Qué función vital produjo el gas (dióxido de carbono)?", o: VF, a: 0, keep: true,
        why: "La levadura se comió el azúcar: eso es [[nutrition]]. Al alimentarse, suelta [[carbon dioxide]]." },
    ],
  });

  // ---------------------------------------------------------------- índices
  const byId = Object.fromEntries(CONCEPTS.map((x) => [x.id, x]));
  CONCEPTS.forEach((x) => x.qs.forEach((q, i) => { q.qid = `${x.id}#${q.id || i}`; q.cid = x.id; }));
  const qById = Object.fromEntries(CONCEPTS.flatMap((x) => x.qs.map((q) => [q.qid, q])));

  window.SCI = { IMG, CELLS, LABEL, PART_ES, PART_ART, OTHER, BOOK, TOPICS, PATH, LESSONS, CONCEPTS, byId, qById, GROUP, VF, K5, LV };
})();
