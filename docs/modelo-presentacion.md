# Modelo de presentación

## 1. Objetivo

`ppt-all-web` será un motor de presentaciones estático, reutilizable y ejecutable
directamente en el navegador. El mapa de Interconexiones deja de ser la
aplicación completa y pasa a ser una diapositiva interactiva registrada dentro
del motor.

La primera versión debe demostrar que el núcleo puede montar, navegar y
desmontar contenidos sin conocer su implementación interna, preservando a la
vez el aspecto y el comportamiento actuales de Interconexiones.

## 2. Restricciones

Las siguientes restricciones forman parte del contrato:

- La presentación abre con doble clic sobre `index.html` mediante `file://`.
- No requiere servidor, backend, proceso de compilación, `npm` ni dependencias
  externas.
- Funciona sin conexión a internet. No usa CDN, fuentes remotas ni recursos
  externos.
- No usa `fetch()` para leer archivos locales.
- Todos los scripts son clásicos y se cargan en un orden explícito. No se usa
  `<script type="module">`.
- El funcionamiento no depende de `localStorage` ni `sessionStorage`.
- Las diapositivas no se aíslan con `iframe`.
- El refactor no modifica los datos, el aspecto ni el comportamiento funcional
  del mapa de Interconexiones.

El documento HTML contiene todos los recursos necesarios por referencia local.
Los datos, el guion y las implementaciones se incorporan mediante scripts
clásicos que amplían un único espacio de nombres global.

## 3. Separación entre núcleo y contenido

El núcleo administra las capacidades permanentes de la presentación:

- espacio de nombres y registro;
- cruce y validación del guion con las implementaciones;
- enrutamiento por hash;
- marco, escenario, índice, controles y contador;
- estado y navegación entre diapositivas;
- pasos guionados;
- arbitraje del teclado global;
- modo presentación;
- contención de errores durante el montaje;
- creación y destrucción del contenido activo.

Cada diapositiva administra exclusivamente su contenido:

- construcción y consulta de su DOM a partir de la raíz recibida;
- estado de interacción libre;
- listeners internos;
- observadores, timers y animaciones propios;
- comportamiento de teclas que el contrato le asigna;
- validación interna de sus datos;
- liberación de todos sus recursos en `desmontar()`.

El núcleo no conoce sectores, flujos, filtros ni paneles del mapa.
Interconexiones no modifica rutas, contador, paso activo, índice, modo
presentación ni listeners globales.

## 4. Modelo sección–diapositiva–paso

La jerarquía conceptual tiene tres niveles:

1. **Sección:** metadato opcional que agrupa entradas en el índice. No tiene
   ruta, navegación, estado, ciclo de vida ni pasos.
2. **Diapositiva:** unidad navegable y direccionable por URL. Cada entrada del
   guion representa una diapositiva.
3. **Paso:** aparición guionada dentro de la diapositiva. El estado inicial es
   el paso `0`; `cantidadPasos()` informa cuántas apariciones existen después
   de ese estado inicial.

El orden de navegación es únicamente la posición de cada entrada en el arreglo
del guion. No existe un campo `orden` ni otra fuente de ordenamiento.

## 5. Estructura del guion

`guion.js` contiene solo metadatos y orden:

```javascript
Presentacion.guion = [
  {
    id: "interconexiones",
    titulo: "Interconexiones",
    bajada: "Relaciones entre sectores",
    seccion: "Funcionamiento interno",
    tipo: "interactivo"
  }
];
```

Campos mínimos comunes:

- `id`: identificador globalmente único y apto para la ruta;
- `titulo`: nombre visible en el índice y el marco;
- `tipo`: uno de `portada`, `contenido` o `interactivo`.

Campos opcionales comunes:

- `bajada`: descripción breve;
- `seccion`: rótulo de agrupación en el índice.

Las entradas de tipo `contenido` declaran exactamente una de estas dos vías:

- `contenido`, con datos estructurados;
- `plantilla`, con el identificador de un `<template>` existente en
  `index.html`.

El guion no contiene funciones, nodos DOM ni referencias a implementaciones.

## 6. Registro de implementaciones

El registro de implementaciones es independiente del guion y se cruza por
`id`:

```javascript
Presentacion.registrarDiapositiva("interconexiones", {
  montar: function (raiz, contexto) {},
  desmontar: function () {}
});
```

Una implementación interactiva cumple este contrato:

```javascript
{
  montar: function (raiz, contexto) {},
  desmontar: function () {},
  cantidadPasos: function () { return 0; },
  irAPaso: function (numero, contexto) {},
  manejarTecla: function (evento, contexto) { return false; }
}
```

`montar` y `desmontar` son obligatorios. Los demás métodos son opcionales. El
registro rechaza identificadores duplicados y conserva una única
implementación por identificador.

Los tipos `portada` y `contenido` son renderizadores del motor registrados en
`Presentacion.tipos`. El tipo `interactivo` requiere una implementación en el
registro de diapositivas.

## 7. Validación bidireccional

Antes de habilitar la navegación, el motor valida el guion, los tipos, las
plantillas y el registro en ambas direcciones.

Debe detectar como mínimo:

- identificadores duplicados en el guion;
- implementaciones registradas más de una vez;
- entradas sin `id`, `titulo` o `tipo`;
- tipos distintos de `portada`, `contenido` e `interactivo`;
- entradas `interactivo` sin implementación registrada;
- implementaciones registradas sin entrada correspondiente en el guion;
- implementaciones sin `montar` o `desmontar`;
- plantillas declaradas que no existen en el documento;
- entradas que declaran a la vez `contenido` y `plantilla`;
- entradas de tipo `contenido` que no declaran ninguna de las dos vías.

Los problemas se guardan asociados a la entrada o implementación afectada. Una
entrada inválida continúa apareciendo en el índice, señalada como error. Si se
navega hacia ella, el escenario muestra un mensaje visible y contenido, con
una salida para volver al índice. El detalle técnico se informa en consola.

Una implementación huérfana se informa en la validación y en el índice, pero no
crea una diapositiva adicional ni altera el orden del guion.

## 8. Rutas planas

El enrutador usa exclusivamente el hash:

```text
#/                    índice
#/portada             diapositiva con id "portada"
#/interconexiones     diapositiva con id "interconexiones"
```

Las secciones y los pasos no forman parte de la URL. Los identificadores de
diapositiva son globalmente únicos.

El enrutador escucha `hashchange`, normaliza el hash vacío a `#/` y resuelve
solo rutas conocidas. Una ruta desconocida muestra un error navegable o
redirige al índice de forma explícita; nunca deja el escenario en blanco.

Abrir el índice con `M` navega a `#/`. Cerrar el índice regresa a la última
diapositiva válida cuando existe; si no existe, permanece en el índice.

## 9. Estado del motor

El núcleo mantiene un único estado de ejecución con, como mínimo:

- ruta activa;
- entrada activa del guion;
- posición de la diapositiva activa en el guion;
- implementación o renderizador activo;
- `pasoActivo`;
- cantidad de pasos de la diapositiva activa;
- última ruta de diapositiva válida;
- índice abierto o cerrado, derivado de la ruta;
- modo presentación activo o inactivo;
- resultado de la validación;
- indicador de montaje en curso para evitar ciclos de vida solapados.

`pasoActivo` pertenece exclusivamente al motor. Al cambiar de diapositiva vuelve
a `0`. La interacción interna de una diapositiva no modifica este estado.

El estado se conserva en memoria mientras la página está abierta. No se
persiste.

## 10. Ciclo de vida

Al cambiar de ruta de contenido, el marco ejecuta esta secuencia:

1. bloquea transitoriamente un nuevo montaje;
2. llama a `desmontar()` del contenido activo dentro de un bloque de
   contención;
3. elimina referencias del núcleo al contenido anterior;
4. limpia el escenario;
5. resuelve y valida la nueva entrada;
6. establece `pasoActivo` en `0`;
7. llama a `montar(raiz, contexto)` dentro de un `try/catch`;
8. consulta `cantidadPasos()` cuando existe;
9. actualiza título, contador, indicador de pasos y controles;
10. libera el bloqueo de montaje.

`desmontar()` de Interconexiones debe cancelar y liberar:

- `ResizeObserver`;
- listeners internos;
- fallback de `resize`, si se registró;
- `redrawTimer`;
- todo `requestAnimationFrame` pendiente;
- referencias a nodos y mapas internos;
- cualquier tarea de representación pendiente.

Montar y desmontar la diapositiva repetidamente debe producir siempre una sola
respuesta por evento.

Dentro de una diapositiva, `document` se usa para crear nodos, no para localizar
nodos propios. Toda consulta parte de `raiz` o de referencias conservadas
durante `montar()`. Interconexiones mantiene un `Map` de nodos de sectores para
la navegación y el cálculo geométrico.

## 11. Pasos guionados e interacción libre

Un paso guionado cambia la posición del relato. El motor:

- incrementa o decrementa `pasoActivo`;
- invoca `irAPaso(numero, contexto)`;
- actualiza el indicador de pasos;
- cambia de diapositiva cuando no quedan pasos en la dirección solicitada.

`irAPaso()` debe ser determinista: aplicar el paso `n` produce el mismo
resultado sin importar el recorrido previo.

La interacción libre modifica solamente el estado interno del contenido. Por
ejemplo, seleccionar cualquier sector durante preguntas puede cambiar filtros,
conexiones y panel informativo, pero no altera `pasoActivo`, el contador ni la
ruta.

En la Fase 1, Interconexiones declara `cantidadPasos()` igual a `0`; no se
incorpora todavía una secuencia de apariciones.

## 12. Arbitraje del teclado

El motor registra el único `keydown` global. Antes de procesar un atajo:

1. comprueba si el foco está en `input`, `textarea`, `select` o un elemento
   `[contenteditable]`; en ese caso no interviene;
2. ofrece el evento a `contenidoActivo.manejarTecla(evento, contexto)`;
3. si el contenido devuelve `true`, termina;
4. si devuelve `false`, aplica los atajos globales.

Asignación:

| Tecla | Dueño | Acción |
|---|---|---|
| `←`, `→` | Interconexiones | Recorrer sectores |
| `Enter` | Interconexiones | Seleccionar o activar el sector enfocado |
| `AvPág` | motor | Paso siguiente o diapositiva siguiente |
| `RePág` | motor | Paso anterior o diapositiva anterior |
| `M` | motor | Abrir o cerrar el índice |
| `P` | motor | Activar o desactivar modo presentación |
| `Esc` | motor | Cerrar índice; si está cerrado, salir de modo presentación |

Las diapositivas no registran listeners de teclado sobre `window`.

## 13. Índice y modo presentación

El índice es la vista de `#/` y puede invocarse desde cualquier diapositiva.
Lista las entradas en el orden del guion, agrupadas por `seccion` cuando
corresponde. Las entradas sin sección aparecen en el nivel principal. Las
entradas inválidas permanecen visibles con una indicación accesible del
problema.

El modo presentación pertenece al motor y se expresa mediante
`body.is-presentation`. Oculta el cromo global definido por el marco sin
modificar el DOM ni el estado interno del contenido.

La acción `P` alterna el modo CSS. `Esc` lo desactiva solamente cuando el índice
no está abierto. La Fullscreen API no forma parte de la v1, pero
`modo-presentacion.js` debe dejar una frontera clara para añadirla después sin
cambiar el contrato público.

## 14. Contador e indicador de pasos

El contador principal representa la posición de la diapositiva dentro del
guion:

```text
3 / 14
```

Su numeración es estable y no incorpora los pasos. El índice no inventa una
posición adicional.

Los pasos se muestran en un indicador secundario y discreto, por ejemplo puntos
o una leyenda separada. El estado inicial y las apariciones posteriores se
representan sin anidar una numeración dentro del contador principal. Cuando una
diapositiva tiene cero pasos posteriores, el indicador puede ocultarse.

## 15. Contenido estructurado y `<template>`

El tipo `contenido` admite exactamente una de dos fuentes.

Contenido estructurado:

```javascript
{
  id: "objetivo",
  titulo: "Objetivo",
  tipo: "contenido",
  contenido: {
    titulo: "Objetivo",
    texto: "Descripción breve.",
    puntos: ["Primer punto", "Segundo punto"]
  }
}
```

Plantilla HTML:

```html
<template id="diapositiva-arquitectura">
  <article>
    <h1>Arquitectura</h1>
    <p>Contenido libre con <strong>énfasis</strong>.</p>
  </article>
</template>
```

```javascript
{
  id: "arquitectura",
  titulo: "Arquitectura",
  tipo: "contenido",
  plantilla: "diapositiva-arquitectura"
}
```

El renderizador estructurado crea nodos de forma segura. El renderizador de
plantilla clona `template.content`; no mueve ni reutiliza nodos ya montados.

## 16. Espacios de nombres JavaScript y CSS

JavaScript expone un único objeto global:

```javascript
window.Presentacion = {
  nucleo: {},
  tipos: {},
  diapositivas: {},
  guion: []
};
```

No quedan constantes globales sueltas como `DEPARTMENTS`, `RESOURCES`, `FLOWS`
o `FLOW_GROUPS`. Los datos del mapa viven bajo:

```javascript
Presentacion.diapositivas.interconexiones.datos
```

Las clases globales usan el prefijo `.presentacion-`, entre ellas:

- `.presentacion-marco`;
- `.presentacion-escenario`;
- `.presentacion-indice`;
- `.presentacion-controles`;
- `.presentacion-contador`.

Todo selector específico de Interconexiones está anidado bajo
`.tema-interconexiones`. Los resets y tokens viven en `css/nucleo/base.css`;
los selectores generales del mapa no escapan de su tema.

## 17. Aislamiento de errores

Existen dos niveles independientes:

1. Interconexiones conserva `validateData()` y sus mensajes detallados para
   sectores, recursos y flujos.
2. El motor envuelve montaje, desmontaje y métodos opcionales para contener
   fallos de una diapositiva.

Si `montar()` falla, el escenario muestra un error asociado a la entrada
afectada. El marco, el índice, el enrutador, el teclado global, el contador y
las demás diapositivas continúan operativos. Un fallo en `desmontar()` se
informa, pero no impide limpiar el escenario y continuar la navegación.

Los errores visibles no exponen una traza técnica; la traza completa se envía
a la consola.

## 18. Alcance exacto de la v1

La v1 implementa únicamente:

- tipo `portada`;
- tipo `contenido`;
- tipo `interactivo`;
- guion ordenado en memoria;
- rutas planas por hash;
- marco, escenario, índice, controles y contador;
- indicador independiente de pasos;
- teclado global arbitrado;
- modo presentación por CSS;
- registro y validación bidireccional;
- ciclo de vida y contención de errores;
- Interconexiones como única entrada inicial, sin pasos guionados.

No se incorporan tipos ni capacidades adicionales de forma anticipada.

## 19. Estructura de carpetas

```text
index.html
guion.js

css/
├── nucleo/
│   ├── base.css
│   ├── marco.css
│   └── indice.css
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
├── modelo-presentacion.md
├── checklist-presentacion.md
├── criterios-visuales.md
└── matriz-fuente.md

assets/
```

El orden de los `<script>` en `index.html` debe respetar dependencias:
espacio de nombres, registro y núcleo; tipos; datos e implementaciones;
guion; arranque del marco.

## 20. Criterios de aceptación de la Fase 1

La Fase 1 se acepta cuando:

- `index.html` abre con doble clic, sin conexión, y muestra el índice;
- `#/interconexiones` monta el mapa con el mismo aspecto y comportamiento que
  el estado anterior al refactor;
- todos los ítems aplicables de `docs/checklist-presentacion.md` pasan;
- `M` abre y cierra el índice desde cualquier diapositiva;
- `←` y `→` recorren sectores sin cambiar de diapositiva;
- `Enter` mantiene su comportamiento dentro del mapa;
- `AvPág` y `RePág` navegan directamente entre diapositivas mientras
  Interconexiones tenga cero pasos;
- `P` alterna el modo presentación desde el motor;
- montar y desmontar Interconexiones diez veces no acumula listeners,
  observadores, timers ni respuestas duplicadas;
- `vista.js` no localiza nodos propios mediante `document`;
- una entrada huérfana produce un error visible y contenido, y el resto de la
  presentación sigue navegable;
- no existen `fetch()`, scripts de tipo módulo, dependencias externas ni
  proceso de build;
- `window` no expone `DEPARTMENTS`, `FLOWS`, `RESOURCES` ni `FLOW_GROUPS`;
- el mapa conserva sus datos, filtros, panel, navegación, redibujado y estados
  visuales;
- el índice, el contador, los controles y los errores son utilizables con
  teclado y tienen nombres accesibles.

## 21. Decisiones diferidas

Quedan fuera de la v1:

- nuevos tipos de diapositiva: timeline, comparación, imagen, video y PDF;
- integración con Fullscreen API;
- transiciones complejas entre diapositivas;
- persistencia del estado;
- carga mediante servidor o proceso de compilación;
- rutas anidadas por sección;
- estado de pasos en la URL;
- extracción de plantillas a un mecanismo más complejo;
- normalización de las secciones como entidades con descripciones, colores u
  otros metadatos.

Estas decisiones se reevaluarán después de validar el motor en una exposición
real. La implementación inicial solo debe conservar puntos de extensión
claros, sin anticipar soluciones.
