(function () {
  "use strict";

  let configuracion = null;
  let iniciado = false;

  function esEditable(objetivo) {
    return Boolean(
      objetivo &&
        ((typeof objetivo.matches === "function" &&
          objetivo.matches("input, textarea, select, [contenteditable]")) ||
          objetivo.isContentEditable)
    );
  }

  function manejar(evento) {
    if (!configuracion || esEditable(evento.target)) {
      return;
    }

    const contenido = configuracion.obtenerContenido();
    if (contenido && typeof contenido.manejarTecla === "function") {
      try {
        if (
          contenido.manejarTecla(
            evento,
            configuracion.obtenerContexto()
          ) === true
        ) {
          return;
        }
      } catch (error) {
        configuracion.manejarError(error);
        return;
      }
    }

    const sinModificadores =
      !evento.ctrlKey && !evento.metaKey && !evento.altKey;
    if (evento.key === "PageDown" && sinModificadores) {
      evento.preventDefault();
      configuracion.acciones.avanzar();
      return;
    }
    if (evento.key === "PageUp" && sinModificadores) {
      evento.preventDefault();
      configuracion.acciones.retroceder();
      return;
    }
    if (evento.key.toLowerCase() === "m" && sinModificadores) {
      evento.preventDefault();
      configuracion.acciones.alternarIndice();
      return;
    }
    if (evento.key.toLowerCase() === "p" && sinModificadores) {
      evento.preventDefault();
      configuracion.acciones.alternarPresentacion();
      return;
    }
    if (evento.key === "Escape") {
      configuracion.acciones.escapar();
    }
  }

  function inicializar(opciones) {
    configuracion = opciones;
    if (!iniciado) {
      window.addEventListener("keydown", manejar);
      iniciado = true;
    }
  }

  Presentacion.nucleo.teclado = {
    inicializar: inicializar
  };
})();
