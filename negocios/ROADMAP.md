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

1. **Mostrar los campos nuevos en la ficha**: `venta` (desasistida /
   asistida / mixta), `efecto_red` (individual / red), `ltv_eur` junto al
   CAC con el ratio LTV/CAC, `payback_meses`, `uso_ia` (barra 1-10) y
   `etiquetas` como chips. Mostrar "–" cuando falten.
2. **Puntuación alineada con los criterios del usuario**: penalizar
   `venta = 'asistida'` y `efecto_red = 'red'`, usar LTV/CAC en lugar de
   ticket/CAC cuando exista LTV, y explicar el cálculo en un desplegable
   "Cómo se calcula". Documentar la fórmula nueva en `README.md`.
3. **Vista "Explorar"** (nueva pestaña o botón): lista de TODAS las fichas
   (pendientes y decididas) con filtros combinables por sector, modelo
   (B2C/B2B…), tipo, venta, efecto de red, impacto de la IA y decisión.
4. **Filtros numéricos** en Explorar: éxito mínimo, inversión máxima, CAC
   máximo, LTV/CAC mínimo, payback máximo, uso de IA mínimo. Con
   deslizadores o botones de rango, y contador de resultados.
5. **Ordenar** Explorar por puntuación, éxito, inversión, CAC, LTV/CAC,
   payback, fecha. Recordar filtros y orden en `localStorage`.
6. **Buscador de texto** (nombre, resumen, etiquetas, sector).
7. **Comparar**: seleccionar 2-3 fichas y verlas en una tabla lado a lado
   con las métricas clave.
8. **Resumen por sector**: pequeño panel con nº de ideas y puntuación media
   por sector y por tipo de venta, tocable para filtrar.
9. **Estado de las rutinas**: sección al pie que muestre las últimas
   ejecuciones de `negocios_rutinas` (fecha, rutina, resumen) para saber
   que siguen vivas.
10. **Fichas nuevas destacadas**: marcar como "nueva" las insertadas desde
    la última visita (fecha en `localStorage`) y avisar con un contador.
11. **Editar decisión con motivo rápido**: al etiquetar, ofrecer 3-4 motivos
    frecuentes en un toque ("venta humana", "efecto de red", "poco margen",
    "no es para mí") que se guardan como comentario de texto.
12. **Exportar** las fichas filtradas a CSV para Power BI.

## Hechas

- 2026-09-18 · `615e8a7` · Etiquetas gusta / no_gusta / definitivo y comentarios por texto y audio.
- 2026-09-18 · `373b7dc` · Primera versión: fichas ordenadas por puntuación, decidir y deshacer.
