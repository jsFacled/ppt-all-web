(function () {
  "use strict";

  function obtenerCantidad(contenido) {
    if (!contenido || typeof contenido.cantidadPasos !== "function") {
      return 0;
    }
    const cantidad = Number(contenido.cantidadPasos());
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      throw new Error("cantidadPasos() debe devolver un entero mayor o igual a cero.");
    }
    return cantidad;
  }

  function aplicar(contenido, numero, contexto) {
    if (contenido && typeof contenido.irAPaso === "function") {
      contenido.irAPaso(numero, contexto);
    }
  }

  Presentacion.nucleo.pasos = {
    obtenerCantidad: obtenerCantidad,
    aplicar: aplicar
  };
})();
