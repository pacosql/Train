# Instrucciones comunes para agentes de Mates10 (fases 3+)

- Repo: /home/user/Train. Trabaja SOLO dentro de `mates10/`. NO hagas git commit/push.
- BD: solo tablas `mates10_*`, vía `python3 mates10/tools/db.py "SQL"` ($SUPABASE_ACCESS_TOKEN; nunca lo imprimas ni lo escribas).
- Regla del módulo 07: nada entra sin fuente archivada. Para CADA fuente que uses (artículo, web, documentación, normativa),
  archívala ANTES de usarla:
  ```bash
  cd /home/user/Train/mates10/tools && python3 -c "
  from archivar import archivar
  print(archivar(codigo='ART-ROEDIGER-KARPICKE-2006', url='https://…', tipo='articulo_cientifico',
     titulo='Roediger & Karpicke (2006). Test-enhanced learning…', origen='busqueda_web', confianza='alta',
     modulos=['04'], anio=2006, notas='PDF del autor / resumen del editor'))"
  ```
  Tipos: articulo_cientifico, manual_didactica, material_metodo, documentacion_producto, normativa, web, blog_producto.
  Si solo accedes al resumen (abstract) de un artículo, archívalo igual con confianza='media' y dilo en notas.
  Si una web bloquea la descarga, prueba otra URL del mismo documento; si no hay manera, NO la uses como fuente.
- No inventes fuentes, autores, años ni resultados. Si algo es tu criterio y no está en una fuente, dilo explícitamente
  (campo "criterio": true).
- Escribe en castellano claro. Resume con tus palabras; no copies párrafos.
- La lista de familias de habilidades está en mates10/01-contenido/taxonomia/familias.md.
