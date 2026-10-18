// Corrector (Hunspell, diccionario es de LibreOffice vía dictionary-es) para
// validar que las respuestas correctas existen y los distractores no.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nspell from "nspell";
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "dictionary-es");
const sp = nspell(fs.readFileSync(path.join(raiz, "index.aff")), fs.readFileSync(path.join(raiz, "index.dic")));
// Formas que el diccionario acepta pero la norma de 2010 desaconseja o que
// tratamos como error en Orto.
const NO = new Set(["sólo", "éste", "ésta", "éstos", "éstas", "ése", "ésa", "ésos", "ésas", "aquél", "aquélla", "aquéllos", "aquéllas", "guión", "truhán", "huí", "rió", "fié", "lié", "crié", "guié", "pié"]);
export const existe = (w) => !NO.has(w.toLowerCase()) && w.split(/\s+/).every((p) => sp.correct(p));
export const existeLiteral = (w) => sp.correct(w);
