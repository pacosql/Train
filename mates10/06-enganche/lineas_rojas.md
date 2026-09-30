# Líneas rojas de enganche con menores: propuesta para Paco

Qué dicen la normativa y la literatura que **no** se debe hacer con niños en una app como Mates10. Cada punto indica su
fuente archivada (código en `mates10_fuente`). Se propone a Paco adoptarlas como sus líneas rojas (módulo 06 §7) y
añadir las suyas propias. Los mecanismos afectados están en `mecanismos.json` con `estado: "retirado"` o con
restricciones en `parametros`.

**Sobre si nos afectan (criterio propio, no es asesoramiento jurídico):** el art. 28 del DSA obliga a las
"plataformas en línea accesibles a menores". Mates10, sin contenido de usuarios difundido al público, probablemente no
lo es; aun así, las directrices de la Comisión (2025) son la mejor referencia europea de qué se considera diseño
seguro para menores. El RGPD sí nos aplica, y la AEPD lo usa para tratar los patrones adictivos. El código del ICO es
británico: aquí sirve como buena práctica.

## Las líneas rojas

1. **Nada de urgencia artificial ni cuentas atrás.** No habrá temporizadores de presión, "solo hoy" ni avisos de
   escasez. La AEPD clasifica la urgencia, la cuenta atrás y los mensajes por tiempo limitado como patrones adictivos, y
   pone como ejemplo una plataforma de aprendizaje con cuenta atrás para no perder una insignia. La CE pide no mostrar
   a menores señales de escasez o urgencia.
   Fuentes: `NORM-AEPD-PATRONES-ADICTIVOS-2024`, `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-OCDE-DARK-PATTERNS-2022`.

2. **Nada de castigos ni de culpa por no volver.** El progreso no se pierde nunca. No habrá mensajes del tipo "te
   echamos de menos" ni mascotas tristes. Seguir o parar se presenta de forma neutra. El ICO (estándar 5) pide ofrecer la
   opción de seguir "sin sugerir que el niño se pierde algo" y permitir pausar en cualquier momento sin perder el
   progreso. La AEPD recoge la culpa y la penalización por no conectarse ("jugar con cita", "recompensas periódicas").
   Fuentes: `NORM-ICO-AADC-05-DETRIMENTAL`, `NORM-AEPD-PATRONES-ADICTIVOS-2024`.

3. **Nada de comparación pública entre niños.** No habrá ligas, rankings ni actividad visible para otros niños. Por
   defecto, nadie debe ver la actividad del menor; la CE lo recomienda así. La AEPD incluye la presión y la comparación
   social y la "competencia guiada" entre los patrones adictivos.
   Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-AEPD-PATRONES-ADICTIVOS-2024`, `BLOG-DUOLINGO-LIGAS`
   (el modelo que no copiamos).

4. **Nada de feed infinito ni de continuación automática.** Toda sesión tiene fin, y seguir exige una elección activa.
   La CE cita el scroll indefinido y el arranque automático de contenido como diseño persuasivo que hay que evitar. El
   ICO incluye scroll continuo, autoplay, bucles de recompensa y notificaciones entre las "sticky features" que pueden
   romper el principio de lealtad del RGPD.
   Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-ICO-AADC-05-DETRIMENTAL`, `NORM-5RIGHTS-DISRUPTED-CHILDHOOD`.

5. **Nada de recompensas variables ligadas a rendimiento, tiempo de uso o dinero.** La CE pide no exponer a menores a
   "recompensas intermitentes o aleatorias" que lleven a gasto o conductas adictivas. Lo único que se admite como idea es
   una sorpresa ocasional sin relación con cuánto se juega (`SORPRESA`, pendiente de revisión).
   Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-AEPD-PATRONES-ADICTIVOS-2024`.

6. **Nada de cajas botín, moneda virtual ni nada aleatorio que se compre.** El gasto en cajas botín se asocia con el
   juego problemático (encuesta a 7.422 jugadores). La CE pide que los menores no vean cajas botín de pago ni monedas
   virtuales canjeables por dinero, y la OCDE señala las cajas botín como patrón oscuro, especialmente con niños.
   Fuentes: `ART-ZENDLE-CAIRNS-2018`, `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-OCDE-DARK-PATTERNS-2022`,
   `NORM-5RIGHTS-DISRUPTED-CHILDHOOD`.

7. **Nada de compras por impulso ni de ventajas de pago visibles para el niño.** La relación comercial es con el padre
   y queda fuera de la experiencia del niño. El caso Prodigy es el antiejemplo: la queja de Fairplay/CCFC ante la FTC
   (2021) denuncia anuncios constantes de Premium dentro del juego, premios virtuales que solo se consiguen con
   membresía y alumnos Premium que avanzan más rápido, lo que da la falsa impresión de que saben más matemáticas. La CE
   pide separar el contenido de la compra y no exponer a menores a transacciones que no entienden.
   Fuentes: `NORM-FAIRPLAY-FTC-PRODIGY-2021`, `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-OCDE-DARK-PATTERNS-2022`.

8. **Las notificaciones empiezan apagadas y las decide el padre.** Como máximo una al día, nunca en horario escolar
   ni de sueño, nunca si el niño ya ha jugado, siempre con contenido concreto y sin culpa. La CE recomienda que las
   notificaciones push estén desactivadas por defecto y siempre apagadas en horas de sueño, y que no se programen
   artificialmente para recuperar la atención del menor. Common Sense (2023) midió una mediana de 237 notificaciones
   diarias en jóvenes de 11 a 17 años, un 23 % de ellas en horario escolar.
   Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `WEB-COMMONSENSE-CONSTANT-COMPANION-2023`,
   `NORM-AEPD-PATRONES-ADICTIVOS-2024`.

9. **Rachas desactivadas por defecto; si el padre las activa, van con perdón y sin pérdida.** La CE pone las
   "streaks" entre las funciones que contribuyen al uso excesivo y que deben estar apagadas por defecto para menores.
   La AEPD recoge las rachas y las "recompensas periódicas" como patrón adictivo. El propio Duolingo reconoce que romper
   la racha desmotiva y que el miedo a perderla puede frenar a quien empieza.
   Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-AEPD-PATRONES-ADICTIVOS-2024`,
   `BLOG-DUOLINGO-RACHA-HABITO-2022`.

10. **Nada de recompensas virtuales por repetir acciones ni por tiempo de uso.** Los coleccionables se ganan
    dominando una habilidad, nunca por minutos ni por días seguidos, y sin colecciones "incompletas" que presionen. La CE
    cita "la creación de recompensas virtuales por realizar acciones (repetidas)" como diseño persuasivo. La AEPD recoge
    "completar la colección". Deci, Koestner y Ryan (1999) muestran que las recompensas tangibles esperadas reducen la
    motivación intrínseca, más en niños que en adultos.
    Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `NORM-AEPD-PATRONES-ADICTIVOS-2024`,
    `ART-DECI-KOESTNER-RYAN-1999`.

11. **No usar los datos del niño para alargar su uso.** Nada de ventajas personalizadas a cambio de jugar más, ni de
    notificaciones o contenidos afinados para maximizar vueltas. Las optimizaciones (hora, parámetros) sirven al
    aprendizaje y el padre las ve. Lo dice el ICO (estándar 5; estándar 13 sobre técnicas de "nudge", que no deben
    explotar procesos psicológicos inconscientes). 5Rights (Pathways) documenta que a los diseñadores se les encarga
    maximizar tiempo, alcance y actividad incluso cuando el usuario es un niño.
    Fuentes: `NORM-ICO-AADC-05-DETRIMENTAL`, `NORM-ICO-AADC-13-NUDGE`, `NORM-5RIGHTS-PATHWAYS-2021`.

12. **Herramientas de tiempo y guardia de sobreuso siempre activas.** El niño ve cuánto ha practicado hoy. El padre
    puede fijar un límite, y si hay más de tres sesiones al día de forma sostenida se le avisa. La CE pide herramientas de
    gestión del tiempo visibles y eficaces que disuadan de pasar más tiempo en la plataforma.
    Fuentes: `NORM-CE-DIRECTRICES-MENORES-DSA-2025`, `MATES10-DOC-UNIFICADO-1.1` (módulo 06 §5).

13. **Todo mecanismo se explica al padre en una frase y se puede apagar.** Es un principio del módulo 06. Encaja con la
    transparencia y los controles parentales del ICO (estándares 4 y 11) y con las herramientas para tutores de la CE.
    Fuentes: `MATES10-DOC-UNIFICADO-1.1`, `NORM-ICO-AADC`, `NORM-CE-DIRECTRICES-MENORES-DSA-2025`.

## Matices que conviene que Paco conozca

- La **barra de progreso** (nuestro `PROGRESO_CERCANO`, activo) aparece en la tabla de la AEPD dentro del patrón de
  "persistencia" (Zeigarnik/Ovsiankina). La mantenemos porque refleja dominio real, no tiene presión de tiempo y no se
  usa para retener al final de la sesión. Aun así, conviene no convertirla en un "te falta poco, sigue".
- El **efecto Zeigarnik** tiene poca base: el metaanálisis de Ghibellini y Meier (2025) no encuentra ventaja de memoria
  para lo inacabado, aunque sí una tendencia a retomarlo (`ART-GHIBELLINI-MEIER-2025`).
- Las cifras de Duolingo (rachas, notificaciones) miden **uso en adultos**, no aprendizaje en niños
  (`ART-YANCEY-SETTLES-2020`, `BLOG-DUOLINGO-RACHA-HABITO-2022`).

## Preguntas para Paco

1. ¿Aceptas estas 13 como líneas rojas? ¿Añades alguna (por ejemplo, ningún anuncio de ningún tipo, o ningún dato del
   niño a terceros)?
2. Las rachas y las notificaciones: ¿las dejamos directamente fuera de la v1, o como opción que activa el padre?
3. ¿Las notificaciones irían solo al móvil del padre?
