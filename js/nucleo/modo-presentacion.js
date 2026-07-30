(function () {
  "use strict";

  let activo = false;
  let boton = null;
  let alCambiar = null;

  function actualizar() {
    const etiqueta = activo ? "Salir de presentación" : "Modo presentación";
    const etiquetaAccesible = activo
      ? "Salir del modo presentación"
      : "Activar modo presentación";

    document.body.classList.toggle("is-presentation", activo);
    if (boton) {
      boton.setAttribute("aria-pressed", activo ? "true" : "false");
      boton.setAttribute("aria-label", etiquetaAccesible);
      boton.title = etiquetaAccesible + " (P)";
      const nodoEtiqueta = boton.querySelector(
        ".presentacion-control__etiqueta"
      );
      if (nodoEtiqueta) {
        nodoEtiqueta.textContent = etiqueta;
      }
    }
    if (typeof alCambiar === "function") {
      alCambiar(activo);
    }
  }

  function establecer(valor) {
    const siguiente = Boolean(valor);
    if (siguiente === activo) {
      return;
    }
    activo = siguiente;
    actualizar();
  }

  function inicializar(nodoBoton, manejadorCambio) {
    boton = nodoBoton;
    alCambiar = manejadorCambio;
    boton.addEventListener("click", function () {
      establecer(!activo);
    });
    actualizar();
  }

  Presentacion.nucleo.modoPresentacion = {
    inicializar: inicializar,
    alternar: function () {
      establecer(!activo);
    },
    salir: function () {
      establecer(false);
    },
    estaActivo: function () {
      return activo;
    }
    // La integración futura con Fullscreen API se incorpora en este límite,
    // sin cambiar el contrato del modo CSS.
  };
})();
