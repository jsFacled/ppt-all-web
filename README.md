# Motor de presentaciones

`ppt-all-web` es un motor estático para crear presentaciones navegables e
interactivas sin PowerPoint. La presentación funciona directamente mediante
`file://`: no necesita instalación, servidor, conexión a internet, proceso de
compilación ni dependencias externas.

Interconexiones es la primera diapositiva interactiva del motor. Conserva el
mapa de sectores, flujos, filtros y panel informativo del proyecto original.

## Uso

1. Abrí `index.html` con doble clic.
2. Elegí una diapositiva en el índice.
3. Navegá con los controles visibles o con el teclado.

Las rutas son planas y se almacenan en el hash:

```text
#/                    índice
#/interconexiones     mapa de Interconexiones
```

## Teclado

| Tecla | Acción |
|---|---|
| `AvPág` | Avanza al paso siguiente; al terminar, avanza de diapositiva |
| `RePág` | Retrocede al paso anterior; al inicio, vuelve de diapositiva |
| `M` | Abre o cierra el índice |
| `P` | Activa o desactiva el modo presentación |
| `Esc` | Cierra el índice o sale del modo presentación |
| `←`, `→` | Recorren los sectores de Interconexiones |
| `Enter` | Selecciona el sector enfocado |

Interconexiones contiene tres estados guionados: vista inicial, Dirección y
Directorio, y Tecnología / IT / Data. La exploración libre del mapa no cambia
el paso activo.

## Guion y tipos

`guion.js` define el contenido visible, sus metadatos y el orden de navegación.
El orden es la posición de cada entrada en el arreglo; no existe un campo
`orden`.

La versión actual admite exactamente tres tipos:

- `portada`;
- `contenido`, mediante datos estructurados o un `<template>`;
- `interactivo`, mediante una implementación registrada.

Las implementaciones interactivas se registran por identificador:

```javascript
Presentacion.registrarDiapositiva("ejemplo", {
  montar: function (raiz, contexto) {},
  desmontar: function () {}
});
```

El motor valida el guion y el registro en ambas direcciones. Una diapositiva
inválida muestra un error contenido y no impide usar el índice ni el resto de
la presentación.

## Estructura

```text
index.html
guion.js
css/
├── nucleo/                 marco, índice y estilos base
├── tipos/                  portada y contenido
└── diapositivas/           estilos aislados por tema
js/
├── nucleo/                 registro, rutas, marco, pasos y teclado
├── tipos/                  renderizadores reutilizables
└── diapositivas/           datos y vistas interactivas
docs/
└── modelo-presentacion.md  contrato arquitectónico
```

Todo contenido específico debe quedar anidado bajo `.tema-<id>`. Dentro de una
diapositiva, las búsquedas de nodos propios parten de la raíz recibida en
`montar()` y todos los listeners, observers, timers y animaciones se liberan en
`desmontar()`.

## Restricciones técnicas

- scripts clásicos con orden de carga explícito;
- sin `fetch()` de archivos locales;
- sin módulos JavaScript;
- sin `iframe`;
- sin almacenamiento web como requisito de funcionamiento;
- sin CDN ni recursos remotos.

El contrato completo está en `docs/modelo-presentacion.md`.
