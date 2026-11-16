# Rutina «Power» — calcular calorías pendientes (cada hora)

App: <https://pacosql.github.io/Train/power/>. Paco apunta comidas, ejercicio
y peso; lo que no trae kcal queda `estado = 'pendiente'` y esta rutina lo
calcula. **Si no hay nada pendiente, registra la pasada y termina** (no
gastes más).

```bash
U=https://dzlhsdpgyxnjwudmrnul.supabase.co
ANON=$(grep -o 'eyJ[^"]*' power/config.js)
H=(-H "apikey: $ANON" -H "Authorization: Bearer $ANON")
```

## Pasos

1. Leer pendientes (las tres tablas):
   ```bash
   curl -s "$U/rest/v1/power_comidas?estado=eq.pendiente&borrado=eq.false&order=created_at" "${H[@]}"
   curl -s "$U/rest/v1/power_ejercicios?estado=eq.pendiente&borrado=eq.false&order=created_at" "${H[@]}"
   curl -s "$U/rest/v1/power_pesos?estado=eq.pendiente&borrado=eq.false&order=created_at" "${H[@]}"
   curl -s "$U/rest/v1/power_ajustes?id=eq.1" "${H[@]}"   # peso/edad/altura de Paco
   ```
   Si las tres listas están vacías → paso 5 con `procesados: 0`.
2. Para cada fila con fotos (`fotos` en comidas/ejercicios, `foto` en pesos),
   descárgalas a un directorio temporal nuevo y **míralas de verdad** con Read:
   `curl -s -o /tmp/power/x.jpg "$U/storage/v1/object/public/power-fotos/<path>"`.
3. Calcular:
   - **Comidas** (`texto` + fotos, `momento`): identifica cada alimento,
     estima la ración (platos, vasos, cubiertos como referencia; en España,
     raciones normales, el aceite cuenta) y suma kcal. Mejor redondear un
     poco **hacia arriba** que quedarse corto. `detalle`: desglose breve,
     p. ej. `"Leche entera 250 ml 160 + 2 galletas María 60"`.
   - **Ejercicio** (`texto`, `minutos`, capturas de pulsera): si la captura
     muestra kcal **activas**, usa esas. Si solo muestra totales, réstale el
     basal del tiempo de la sesión. Sin captura: kcal = (MET − 1) × kg × horas
     (tenis individual 8, dobles 6, pádel 6, caminar 4.3, correr 8.3,
     pesas 5). `detalle`: de dónde sale el número.
   - **Pesos** (foto de la báscula): lee el número de la pantalla → `kg`.
     Si no se lee bien, deja `kg` null, `estado` `procesado` y explica en
     `detalle` ("no se lee el número, vuelve a hacer la foto").
4. Escribir cada resultado:
   ```bash
   curl -s -X PATCH "$U/rest/v1/power_comidas?id=eq.<ID>" "${H[@]}" -H "Content-Type: application/json" \
     -d '{"kcal": 160, "detalle": "Leche entera 250 ml", "estado": "procesado"}'
   # power_ejercicios igual; power_pesos: {"kg": 104.1, "detalle": "Leído de la foto", "estado": "procesado"}
   ```
   Si el texto remite a otro registro (p. ej. "lo mismo que ayer en la
   cena"), busca esa fila y úsala de referencia.
5. Registrar la pasada SIEMPRE:
   ```bash
   curl -s -X POST "$U/rest/v1/power_rutinas" "${H[@]}" -H "Content-Type: application/json" \
     -d '{"procesados": N, "resumen": "una frase"}'
   ```

## Qué NO hacer

- No borres nada ni toques filas `procesado` (salvo corregir una propia
  si Paco lo pide en un texto nuevo).
- No toques tablas de otras apps ni `power_ajustes`.
- No hagas commits, ni despliegues, ni toques `main`: los datos viven en
  Supabase.
