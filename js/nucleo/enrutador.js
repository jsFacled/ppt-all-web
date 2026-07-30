(function () {
  "use strict";

  let alCambiar = null;
  let iniciado = false;

  function resolver() {
    const hash = window.location.hash || "#/";
    if (hash === "#" || hash === "#/" || hash === "") {
      return { id: null, hash: "#/", esIndice: true };
    }

    const coincidencia = hash.match(/^#\/(.+)$/);
    if (!coincidencia) {
      return { id: null, hash: hash, esIndice: false, desconocida: true };
    }

    let id;
    try {
      id = decodeURIComponent(coincidencia[1]);
    } catch (error) {
      return { id: null, hash: hash, esIndice: false, desconocida: true };
    }
    return { id: id, hash: hash, esIndice: false };
  }

  function notificar() {
    if (typeof alCambiar === "function") {
      alCambiar(resolver());
    }
  }

  function navegar(id) {
    const destino = id ? "#/" + encodeURIComponent(id) : "#/";
    if (window.location.hash === destino) {
      notificar();
      return;
    }
    window.location.hash = destino;
  }

  function iniciar(manejador) {
    alCambiar = manejador;
    if (!iniciado) {
      window.addEventListener("hashchange", notificar);
      iniciado = true;
    }
    if (!window.location.hash) {
      navegar(null);
    } else {
      notificar();
    }
  }

  Presentacion.nucleo.enrutador = {
    iniciar: iniciar,
    navegar: navegar,
    resolver: resolver
  };
})();
