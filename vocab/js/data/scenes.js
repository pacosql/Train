// Escenas para los juegos #13 (Viste la escena) y #14 (La cadena de la
// escena) — varias palabras relacionadas (bufanda→cuello, gorro→cabeza…)
// se refuerzan juntas en una sola figura, en vez de sueltas. `anchors` son
// posiciones en % dentro de la figura de la persona (ver .person-figure en
// css/style.css); cada ancla apunta a un wordId real de data/words.js.
export const SCENES = [
  {
    id: "frio-en-la-calle",
    title: "Hace frío en la calle",
    intro: "Vístete para el frío: toca una prenda y luego toca dónde se pone.",
    anchors: [
      { id: "head", wordId: "hat", x: 50, y: 6, label: "la cabeza" },
      { id: "neck", wordId: "scarf", x: 50, y: 27, label: "el cuello" },
      { id: "hand-l", wordId: "gloves", x: 12, y: 47, label: "la mano" },
      { id: "torso", wordId: "coat", x: 50, y: 50, label: "el cuerpo" },
      { id: "foot", wordId: "boots", x: 41, y: 93, label: "los pies" },
    ],
  },
  {
    id: "dia-de-playa",
    title: "Un día de playa",
    intro: "Prepárate para la playa: toca una prenda y luego toca dónde se pone.",
    anchors: [
      { id: "head", wordId: "hat", x: 50, y: 6, label: "la cabeza" },
      { id: "eyes", wordId: "sunglasses", x: 50, y: 19, label: "los ojos" },
      { id: "torso", wordId: "swimsuit", x: 50, y: 50, label: "el cuerpo" },
      { id: "foot", wordId: "sandals", x: 41, y: 93, label: "los pies" },
    ],
  },
];
