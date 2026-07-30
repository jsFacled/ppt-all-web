# Criterios visuales del mapa

Este documento registra las decisiones vigentes para representar e interpretar
las interconexiones. No reemplaza la matriz fuente ni agrega relaciones nuevas.

## Sectores

- La posición de los sectores se mantiene estable al cambiar de vista.
- El sector seleccionado aparece en primer plano.
- El sector seleccionado se identifica con un pulso sutil en su borde, que no
  altera el tamaño de la caja ni la legibilidad del título.
- La animación del borde se detiene cuando el sistema pide reducir el
  movimiento.
- Los sectores relacionados conservan su color y nitidez.
- Los sectores no relacionados permanecen visibles, pero atenuados.
- PMO se presenta como elemento externo y también puede seleccionarse.

## Flechas

- Toda flecha nace en el borde del sector emisor.
- La punta de la flecha termina en el borde del sector receptor.
- El color de la flecha corresponde siempre al sector emisor.
- Cada flecha tiene un único sentido; no se usan flechas de doble punta.
- Las relaciones recíprocas se representan mediante flechas independientes.
- Los recorridos deben evitar atravesar sectores y textos.
- Dos flujos no comparten el mismo punto de un borde: cuando coinciden en el
  mismo lado se separan con desplazamientos declarados (`startOffset` y
  `endOffset`).
- Las etiquetas de recursos se ubican junto a su propio recorrido, sin pisar
  cajas, líneas ni otras etiquetas.
- Los desvíos especiales se declaran junto con el flujo, no dentro de la lógica
  general de la aplicación.

## Recursos

- Los recursos visibles se obtienen del catálogo y de los flujos canónicos.
- El panel informativo muestra siempre el texto completo.
- Las etiquetas del mapa pueden usar una versión abreviada cuando sea necesario.
- No se fusionan recursos similares sin una decisión explícita sobre el
  contenido.

## Agrupación de Dirección

- “Todos los sectores” representa seis destinos reales, no un sector ficticio.
- Dirección conserva seis flujos salientes hacia esos destinos.
- Los cuatro recursos compartidos se muestran una sola vez.
- La representación usa una troncal, una barra distribuidora común y
  ramificaciones con punta hacia cada receptor.

## Modos de visualización

- La vista inicial no muestra flechas.
- “Todas” muestra entradas y salidas del sector seleccionado.
- “Recibe” muestra únicamente los flujos que terminan en el sector.
- “Entrega” muestra únicamente los flujos que nacen en el sector.
- El filtro persiste al seleccionar otro sector.
- El resaltado de sectores y el panel informativo siguen el filtro activo.
- Restablecer el mapa vuelve al modo “Todas”.

## Panel y presentación

- El panel informativo puede abrirse y cerrarse sin perder la selección.
- El modo presentación oculta elementos secundarios para ampliar el mapa.
- El mapa y el panel ofrecen información equivalente para no depender solamente
  del color.
