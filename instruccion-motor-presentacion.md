# Instrucción de implementación — Motor de presentaciones `ppt-all-web`

> Pegá este documento completo en Cowork, con la carpeta del proyecto accesible.
> Es autocontenido: no asume ninguna conversación previa.

---

## 0. Contexto y objetivo

`ppt-all-web` es hoy un sitio estático de un solo tema: un mapa interactivo de
interconexiones entre sectores. Nació para reemplazar PowerPoint, pero quedó
construido como una aplicación de propósito único.

**Objetivo del trabajo:** invertir la jerarquía. El proyecto pasa a ser un
*motor de presentaciones reutilizable* y el mapa actual pasa a ser una
diapositiva más dentro de ese motor.

La arquitectura ya fue discutida y cerrada. **Este documento es el contrato: no
lo rediscutas, implementalo.** Si encontrás una contradicción interna o un
bloqueo técnico real, detenete y consultá antes de improvisar una alternativa.

---

## 1. Restricciones inviolables

Estas restricciones son el motivo de existir del proyecto. Cualquier solución
que las rompa es incorrecta, por elegante que sea.

1. **Abre con doble clic en `index.html`, mediante `file://`.** Sin servidor,
   sin backend, sin build, sin `npm`, sin dependencias externas.
2. **Funciona sin conexión a internet.** Nada de CDNs, fuentes remotas ni
   recursos externos.
3. **Prohibido `fetch()` sobre archivos locales.** Los navegadores lo bloquean
   por política de origen en `file://`.
4. **Prohibido `<script type="module">`.** Los navegadores previstos lo bloquean
   en `file://`. Se usan exclusivamente scripts clásicos con orden de carga
   explícito.
5. **Prohibido `localStorage` / `sessionStorage`** como dependencia de
   funcionamiento: su comportamiento en `file://` es inconsistente.
6. **Prohibido `iframe`** para aislar diapositivas: rompe teclado, foco, tamaño
   y accesibilidad.
7. **No se altera el comportamiento visual ni funcional del mapa.** El refactor
   es estructural. Al terminar, el mapa debe verse y comportarse exactamente
   igual que antes.

---

## 2. Estado actual del código (verificalo antes de tocar nada)

- `index.html` no es un contenedor genérico: contiene todo el marcado
  específico del mapa (encabezado, viewport, filtros de flujo, panel
  informativo, controles).
- `js/app.js` es un IIFE que se autoejecuta y llama a `initialize()` al final
  del archivo.
- Los datos son constantes globales sueltas: `DEPARTMENTS`, `RESOURCES`,
  `FLOWS`, `FLOW_GROUPS`.
- `app.js` construye su objeto `elements` con `document.getElementById()`, y
  además hace accesos globales posteriores del tipo
  `document.getElementById("department-" + id)` dentro de la navegación entre
  sectores y del cálculo geométrico de las cajas. **No alcanza con reemplazar
  el objeto `elements`: hay que barrer todos los accesos.**
- Registra un `keydown` sobre `window` sin conservar referencia al manejador.
- Crea un `ResizeObserver` que nunca se desconecta.
- Mantiene un `redrawTimer` (`window.setTimeout`) pendiente para redibujar
  conexiones.
- El modo presentación lo controla el propio mapa y togglea
  `document.body.classList` directamente.
- `css/styles.css` usa selectores muy generales (`button`, `h1, h2, h3, p`) y
  clases sin namespace (`.workspace`, `.info-panel`, `.control-button`,
  `.site-header`).
- `validateData()` aborta la inicialización completa si los datos son
  inválidos.

Todo esto es correcto hoy porque el mapa *es* toda la aplicación. Deja de serlo
en cuanto haya un segundo contenido.

---

## 3. Modelo cerrado

### 3.1 Tres niveles

```
sección  →  diapositiva  →  paso
```

- **Sección:** agrupa visualmente en el índice. Metadato opcional y nada más.
  No participa de las rutas, no navega, no tiene ciclo de vida, no tiene pasos.
- **Diapositiva:** la unidad que se navega y que aparece en la URL. El mapa de
  Interconexiones es **una sola** diapositiva.
- **Paso:** una aparición guionada dentro de una diapositiva (el equivalente a
  las "apariciones" de PowerPoint).

### 3.2 Pasos guionados vs. interacción libre

Distinción crítica, no la colapses:

- **Paso guionado:** avanza el guion. El motor es dueño de `pasoActivo`.
- **Interacción libre:** el usuario explora el contenido (clickear cualquier
  sector del mapa durante las preguntas). Modifica **solo** el estado interno
  del contenido. **No mueve el contador ni la posición en el guion.**

### 3.3 Rutas

Planas, por hash. Sin rutas anidadas por sección y sin rutas por paso.

```
#/                  índice / inicio
#/portada
#/interconexiones
```

Los identificadores de diapositiva son globalmente únicos.

### 3.4 Orden

**El orden es la posición en el arreglo del guion. No existe ningún campo
`orden`.** Una segunda fuente de ordenamiento está explícitamente prohibida.

---

## 4. Terminología y nomenclatura

**Todo en español, sin excepciones.** Se descarta el término `shell`: se usa
**`marco`**.

| Concepto | Término | Archivo | Clase CSS |
|---|---|---|---|
| Contenedor global permanente | marco | `js/nucleo/marco.js` | `.presentacion-marco` |
| Zona donde se monta el contenido | escenario | — | `.presentacion-escenario` |
| Índice invocable | índice | — | `.presentacion-indice` |
| Controles globales | controles | — | `.presentacion-controles` |
| Contador | contador | — | `.presentacion-contador` |
| Manifiesto de la presentación | guion | `guion.js` | — |
| Ruteo por hash | enrutador | `js/nucleo/enrutador.js` | — |

Todo contenido específico se escribe anidado bajo `.tema-<id>`
(ej. `.tema-interconexiones`).

---

## 5. Estructura de carpetas objetivo

```
index.html
guion.js

css/
├── nucleo/
│   ├── base.css          tokens :root, reset, tipografía
│   ├── marco.css         encabezado, escenario, controles, contador
│   └── indice.css        índice invocable
├── tipos/
│   ├── portada.css
│   └── contenido.css
└── diapositivas/
    └── interconexiones.css

js/
├── nucleo/
│   ├── espacio-nombres.js
│   ├── registro.js
│   ├── enrutador.js
│   ├── marco.js
│   ├── teclado.js
│   ├── pasos.js
│   └── modo-presentacion.js
├── tipos/
│   ├── portada.js
│   └── contenido.js
└── diapositivas/
    └── interconexiones/
        ├── datos.js
        └── vista.js

docs/
├── modelo-presentacion.md      (a crear en la Fase 0)
├── checklist-presentacion.md   (a actualizar)
├── criterios-visuales.md
└── matriz-fuente.md

assets/
```

### Mapa de migración

| Archivo actual | Destino |
|---|---|
| `js/departments.js`, `js/resources.js`, `js/flows.js` | `js/diapositivas/interconexiones/datos.js` (fusionados bajo namespace) |
| `js/app.js` | `js/diapositivas/interconexiones/vista.js` (encapsulado) + lo global sube al núcleo |
| `css/styles.css` — `:root`, reset, tipografía | `css/nucleo/base.css` |
| `css/styles.css` — `.app-shell`, `.site-header`, `.control-button`, `.skip-link` | `css/nucleo/marco.css`, renombradas a `.presentacion-*` |
| `css/styles.css` — mapa, sectores, flechas, panel, filtros | `css/diapositivas/interconexiones.css`, anidadas bajo `.tema-interconexiones` |
| `index.html` — marcado del mapa | `<template>` o construcción en `montar()` de la vista |
| `index.html` — encabezado y controles | marco genérico |

---

## 6. Espacio de nombres y registro

Un único objeto global. Nada de constantes sueltas en `window`.

```javascript
window.Presentacion = {
  nucleo: {},
  tipos: {},
  diapositivas: {},
  guion: []
};
```

### 6.1 Separación manifiesto / implementación

Son dos registros distintos que el motor cruza por `id`.

**`guion.js`** — solo metadatos y orden:

```javascript
Presentacion.guion = [
  {
    id: "interconexiones",
    titulo: "Interconexiones",
    bajada: "Relaciones entre sectores",
    seccion: "Funcionamiento interno",   // opcional
    tipo: "interactivo"
  }
];
```

**Registro de implementaciones** — el comportamiento:

```javascript
Presentacion.registrarDiapositiva("interconexiones", {
  montar: function (raiz, contexto) {},
  desmontar: function () {}
});
```

### 6.2 Validación bidireccional (obligatoria)

Al arrancar, el motor detecta y reporta:

- diapositiva `interactivo` en el guion sin implementación registrada;
- implementación registrada sin entrada en el guion;
- identificadores duplicados;
- `tipo` inexistente;
- `plantilla` declarada que no existe en el documento;
- entrada que declara simultáneamente `contenido` y `plantilla`;
- entradas sin los metadatos mínimos.

**Una entrada huérfana nunca debe producir silenciosamente una diapositiva
vacía.** El problema se muestra de forma visible en la diapositiva afectada y
en el índice. En consola puede ir el detalle técnico.

---

## 7. Contrato de diapositiva interactiva

```javascript
{
  montar: function (raiz, contexto) {},        // obligatorio
  desmontar: function () {},                   // obligatorio

  cantidadPasos: function () { return 0; },    // opcional
  irAPaso: function (numero, contexto) {},     // opcional
  manejarTecla: function (evento, contexto) { return false; }  // opcional
}
```

### Reglas

- El paso `0` es el estado inicial. `cantidadPasos()` devuelve las apariciones
  **posteriores** al estado inicial.
- El motor es dueño de `pasoActivo`. El contenido no lo modifica.
- `irAPaso(n)` debe ser **determinista**: volver a un paso no puede depender de
  haber recorrido los anteriores.
- Si `cantidadPasos()` devuelve `0`, `AvPág` cambia directamente de diapositiva.
- `manejarTecla` devuelve `true` si consumió la tecla.

### Regla de oro del aislamiento DOM

> Dentro de una diapositiva, `document` solo puede usarse para **crear** nodos,
> nunca para **localizar** nodos propios.

Correcto: `document.createElement("button")`
Prohibido: `document.getElementById("map-stage")`

Para los sectores, en lugar de repetir búsquedas por id, mantené un mapa
interno de nodos (`new Map()`) construido en `montar()`.

### `desmontar()` debe liberar

- el `ResizeObserver`;
- listeners internos;
- timers, incluido `redrawTimer`;
- animaciones programadas (`requestAnimationFrame` pendiente);
- referencias a nodos;
- cualquier trabajo de renderizado pendiente.

El listener global de teclado, el modo presentación, el enrutador y el contador
**pertenecen exclusivamente al motor**.

---

## 8. Teclado

**El motor es el único dueño del `keydown` global.** Ninguna diapositiva
registra listeners de teclado sobre `window`.

Flujo de arbitraje:

```
keydown
   ↓
¿el foco está en input/textarea/select/[contenteditable]?
   └── sí → ignorar atajos globales
   ↓
contenidoActivo.manejarTecla(evento, contexto)
   ├── devuelve true  → fin
   └── devuelve false → motor.manejarTeclaGlobal(evento)
```

### Asignación cerrada

| Tecla | Dueño | Acción |
|---|---|---|
| `←` `→` | contenido | Interconexiones recorre sectores |
| `AvPág` | motor | siguiente paso; si no quedan, siguiente diapositiva |
| `RePág` | motor | paso anterior; si no quedan, diapositiva anterior |
| `M` | motor | abre / cierra el índice |
| `P` | motor | modo presentación |
| `Esc` | motor | cierra el índice; si no está abierto, sale del modo presentación |

`Enter` sigue perteneciendo al contenido.

---

## 9. Modo presentación y pantalla completa

Son dos capacidades técnicas distintas presentadas como **una sola acción** al
usuario.

- **Modo presentación:** oculta el cromo por CSS (`body.is-presentation`).
  Propiedad del motor.
- **Pantalla completa:** Fullscreen API real. **Diferida — no la implementes en
  la v1**, pero dejá el punto de extensión previsto.

Cuando se incorpore: se solicita como consecuencia directa del gesto del
usuario; si el navegador la rechaza, el modo CSS sigue funcionando igual. El
estado debe sincronizarse escuchando `fullscreenchange`, **nunca asumiendo que
el motor controla toda salida** — el navegador consume `Escape` primero.

---

## 10. Índice y contador

- El índice es invocable en cualquier momento con `M`, y es la vista de `#/`.
- Agrupa por `seccion` cuando el metadato está presente. Las diapositivas sin
  sección van al nivel principal.
- **El contador principal cuenta diapositivas** y es estable: `3 / 14`.
- Los pasos se indican por separado, con puntos o un indicador secundario
  discreto. **No se anida el número dentro del número.**

---

## 11. Tipos de diapositiva — alcance de la v1

Se implementan **exactamente tres**:

1. `portada`
2. `contenido`
3. `interactivo`

**No crees anticipadamente** renderizadores de timeline, comparación, imagen,
video ni PDF. Se incorporan cuando una presentación concreta los necesite y
después de validar el motor en una exposición real.

### El tipo `contenido` acepta dos vías, mutuamente excluyentes

**Contenido estructurado**, para lo trivial:

```javascript
{
  id: "objetivo",
  tipo: "contenido",
  contenido: { titulo: "Objetivo", texto: "...", puntos: ["...", "..."] }
}
```

**Plantilla HTML**, para markup libre (enlaces, tablas, énfasis):

```html
<template id="diapositiva-arquitectura">
  <article>
    <h1>Arquitectura</h1>
    <p>Texto con <strong>énfasis</strong> y <a href="#">un enlace</a>.</p>
  </article>
</template>
```

```javascript
{ id: "arquitectura", tipo: "contenido", plantilla: "diapositiva-arquitectura" }
```

Declarar ambas a la vez es un error de validación.

---

## 12. Aislamiento de errores

Dos niveles independientes:

1. **Validación interna del contenido** — `validateData()` de Interconexiones se
   conserva tal cual, con sus mensajes detallados sobre flujos, recursos y
   sectores.
2. **Contención del motor** — el montaje va envuelto:

```javascript
try {
  contenido.montar(raiz, contexto);
} catch (error) {
  mostrarErrorDeDiapositiva(raiz, entrada, error);
}
```

Una diapositiva rota **no puede derribar** el índice, la navegación, los
controles globales ni las demás diapositivas.

---

## 13. Plan de ejecución

### Fase 0 — Documento de contrato

Escribir `docs/modelo-presentacion.md`. Es una **especificación
arquitectónica, no una implementación adelantada**. Secciones obligatorias:

1. objetivo
2. restricciones, en especial `file://`
3. separación núcleo / contenido
4. modelo sección–diapositiva–paso
5. estructura del guion
6. registro de implementaciones
7. validación bidireccional
8. rutas planas
9. estado del motor
10. ciclo de vida
11. pasos guionados vs. interacción libre
12. arbitraje del teclado
13. índice y modo presentación
14. contador e indicador de pasos
15. contenido estructurado y `<template>`
16. namespaces JavaScript y CSS
17. aislamiento de errores
18. alcance exacto de la v1
19. estructura de carpetas
20. criterios de aceptación de la Fase 1
21. decisiones diferidas

**Detenete acá y mostrame el documento antes de escribir una línea de código.**

### Fase 1 — Motor con Interconexiones como único contenido

En este orden:

1. Crear el espacio de nombres global y el registro.
2. Crear `guion.js` con Interconexiones como única entrada.
3. Crear el marco vacío: encabezado, escenario, índice y controles.
4. Crear el enrutador por hash entre `#/` y `#/interconexiones`.
5. Mover el modo presentación y el teclado global al motor.
6. Encapsular Interconexiones con `montar(raiz)` / `desmontar()`, barriendo
   **todos** los accesos globales al DOM.
7. Namespacear datos (`Presentacion.diapositivas.interconexiones.datos`) y CSS
   (`.tema-interconexiones`).
8. Implementar la validación bidireccional y la contención de errores.
9. Verificar que `index.html` sigue abriendo con doble clic.

**No agregues todavía una secuencia de pasos dentro de Interconexiones.**
`cantidadPasos()` devuelve `0`. Primero se preserva el comportamiento actual.

### Fase 2 — Verificación de pasos

Recién después de que la Fase 1 esté estable: agregar una secuencia mínima de
pasos guionados en Interconexiones (por ejemplo vista inicial → Dirección →
Tecnología) para validar el arbitraje de `AvPág` / `RePág` y confirmar que la
interacción libre no mueve el contador.

### Fase 3 — Documentación

Actualizar `docs/checklist-presentacion.md` con las teclas nuevas, el índice y
el contador. Actualizar `README.md` para que describa el motor y no el mapa.

---

## 14. Criterios de aceptación

La Fase 1 está terminada cuando:

- [ ] `index.html` abre con doble clic, sin conexión, y muestra el índice.
- [ ] `#/interconexiones` monta el mapa **con comportamiento idéntico al
      actual**: todos los ítems de `docs/checklist-presentacion.md` pasan.
- [ ] `M` abre y cierra el índice desde cualquier diapositiva.
- [ ] `←` y `→` siguen recorriendo sectores y **no** cambian de diapositiva.
- [ ] `P` activa el modo presentación desde el motor.
- [ ] Montar y desmontar Interconexiones diez veces seguidas no acumula
      listeners, observers ni timers, y no duplica respuestas a una tecla.
- [ ] Ninguna búsqueda de nodos propios por `document` queda dentro de
      `vista.js`.
- [ ] Una entrada huérfana en el guion produce un error visible y contenido, no
      una pantalla en blanco, y el resto de la presentación sigue navegable.
- [ ] No hay `fetch()`, `type="module"`, dependencias externas ni build.
- [ ] `window` no contiene `DEPARTMENTS`, `FLOWS`, `RESOURCES` ni
      `FLOW_GROUPS`.

---

## 15. Decisiones explícitamente diferidas

No las implementes ni las propongas ahora. Deben quedar listadas como
diferidas en `docs/modelo-presentacion.md`:

- nuevos tipos de diapositiva (timeline, comparación, imagen, video, PDF);
- Fullscreen API;
- transiciones complejas entre diapositivas;
- persistencia del estado;
- carga mediante servidor o proceso de compilación;
- rutas anidadas por sección;
- estado de pasos en la URL;
- extracción de las plantillas a un mecanismo más complejo;
- normalización de las secciones como entidad con metadatos propios
  (descripciones, colores).

---

## 16. Reglas de trabajo

- Antes de empezar, verificá acceso de escritura a la carpeta del proyecto. Si
  falta algún permiso, **detenete y avisá antes de escribir nada**. No uses
  rutas alternativas ni cambies el destino en silencio.
- Hacé un commit o una copia de respaldo del estado actual antes de la Fase 1.
- No introduzcas dependencias. Ninguna.
- No reescribas el contenido de los datos: los flujos, recursos y sectores se
  mueven y se namespacean, pero **no se modifican**.
- No "aproveches para mejorar" el mapa. Cualquier mejora visual o funcional
  detectada se anota en un apartado aparte y se decide después.
- Al terminar cada fase, informá qué quedó fuera de lo pedido y dónde se ubicó
  cada archivo.
