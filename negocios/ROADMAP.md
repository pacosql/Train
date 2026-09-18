# Negocios — backlog de mejoras de la app

Lo mantiene la rutina "Negocios · mejora de la app" (cada 2 horas). En cada
ejecución coge **una** mejora de "Pendientes" (la primera que no esté
bloqueada), la implementa en `negocios/index.html`, la prueba con
`node negocios/test/smoke.js`, la fusiona en `main`, comprueba que el
workflow de Pages termina en verde, la mueve a "Hechas" con la fecha y el
hash del commit, y registra la ejecución en la tabla `negocios_rutinas`.

Principios: una sola página sin build, móvil primero, mismo estilo visual
(Barlow Condensed, fondo oscuro, acento dorado), nada de frameworks. Las
fichas nuevas las inserta otra rutina en `negocios_ideas`; el esquema está
en `README.md`. Lo que el usuario más valora está en `negocios_perfil.criterios`:
compra desasistida y valor con un solo cliente.

## Pendientes (en orden)

1. **Comparar**: seleccionar 2-3 fichas y verlas en una tabla lado a lado
   con las métricas clave.
2. **Resumen por sector**: pequeño panel con nº de ideas y puntuación media
   por sector y por tipo de venta, tocable para filtrar.
3. **Estado de las rutinas**: sección al pie que muestre las últimas
   ejecuciones de `negocios_rutinas` (fecha, rutina, resumen) para saber
   que siguen vivas.
4. **Fichas nuevas destacadas**: marcar como "nueva" las insertadas desde
    la última visita (fecha en `localStorage`) y avisar con un contador.
5. **Editar decisión con motivo rápido**: al etiquetar, ofrecer 3-4 motivos
    frecuentes en un toque ("venta humana", "efecto de red", "poco margen",
    "no es para mí") que se guardan como comentario de texto.

## Hechas

- 2026-09-18 · (este commit) · Vista Explorar: todas las fichas con filtros por etiqueta, sector, modelo, tipo, venta, cliente, impacto de la IA, éxito mínimo, inversión máxima, IA Score mínimo y LTV/CAC mínimo; buscador de texto; orden por puntuación, IA Score, éxito, inversión, CAC, LTV/CAC, retorno, fecha o nombre; filtros recordados en localStorage; exportación a CSV para Power BI.
- 2026-09-18 · (este commit) · Puntuación = probabilidad de éxito para el usuario (venta, efecto de red, inversión, LTV/CAC, viralidad, éxito); ficha muestra venta, efecto de red, LTV con ratio, retorno, uso de IA, viralidad, etiquetas y "Cómo se calcula"; bloque "He tenido en cuenta" de la rutina de revisión; dictado por voz y transcripción en el navegador; IA Score (`claude_pct`: % del trabajo que se haría con Claude) como segundo anillo.
- 2026-09-18 · `615e8a7` · Etiquetas gusta / no_gusta / definitivo y comentarios por texto y audio.
- 2026-09-18 · `373b7dc` · Primera versión: fichas ordenadas por puntuación, decidir y deshacer.
