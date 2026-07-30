(function () {
  "use strict";

  const registro = Presentacion.nucleo.registro;
  const enrutador = Presentacion.nucleo.enrutador;
  const pasos = Presentacion.nucleo.pasos;
  const modoPresentacion = Presentacion.nucleo.modoPresentacion;
  const teclado = Presentacion.nucleo.teclado;
  const nodos = {
    escenario: document.getElementById("presentacion-escenario"),
    sobrelinea: document.getElementById("presentacion-sobrelinea"),
    titulo: document.getElementById("presentacion-titulo"),
    bajada: document.getElementById("presentacion-bajada"),
    botonIndice: document.getElementById("presentacion-boton-indice"),
    botonModo: document.getElementById("presentacion-boton-modo"),
    acciones: document.getElementById("presentacion-acciones-contenido"),
    progreso: document.getElementById("presentacion-progreso"),
    contador: document.getElementById("presentacion-contador"),
    indicadorPasos: document.getElementById("presentacion-pasos")
  };
  const estado = {
    entradaActiva: null,
    indiceActivo: -1,
    contenidoActivo: null,
    contextoActivo: null,
    pasoActivo: 0,
    cantidadPasos: 0,
    ultimaId: null,
    validacion: null,
    montando: false,
    enIndice: true
  };

  function establecerAcciones(acciones) {
    nodos.acciones.replaceChildren();
    (acciones || []).forEach(function (accion) {
      if (accion && accion.nodeType) {
        nodos.acciones.appendChild(accion);
      }
    });
  }

  function crearContexto(entrada) {
    return {
      entrada: entrada,
      obtenerPasoActivo: function () {
        return estado.pasoActivo;
      },
      establecerAcciones: establecerAcciones,
      navegar: function (id) {
        enrutador.navegar(id);
      }
    };
  }

  function actualizarEncabezado(entrada, esIndice) {
    if (esIndice) {
      nodos.sobrelinea.textContent = "Presentación";
      nodos.titulo.textContent = "Índice";
      nodos.bajada.textContent = "Elegí una diapositiva para comenzar.";
      document.title = "Índice — Presentación";
      return;
    }
    if (!entrada) {
      nodos.sobrelinea.textContent = "Presentación";
      nodos.titulo.textContent = "Ruta no encontrada";
      nodos.bajada.textContent = "La dirección solicitada no pertenece al guion.";
      document.title = "Ruta no encontrada — Presentación";
      return;
    }
    nodos.sobrelinea.textContent = entrada.seccion || "Presentación";
    nodos.titulo.textContent = entrada.titulo;
    nodos.bajada.textContent = entrada.bajada || "";
    document.title = entrada.titulo + " — Presentación";
  }

  function actualizarControlIndice() {
    nodos.botonIndice.setAttribute(
      "aria-pressed",
      estado.enIndice ? "true" : "false"
    );
    nodos.botonIndice.setAttribute(
      "aria-label",
      estado.enIndice ? "Cerrar índice" : "Abrir índice"
    );
  }

  function actualizarProgreso() {
    if (!estado.entradaActiva || estado.indiceActivo < 0) {
      nodos.progreso.hidden = true;
      nodos.contador.textContent = "";
      nodos.indicadorPasos.replaceChildren();
      return;
    }

    nodos.progreso.hidden = false;
    nodos.contador.textContent =
      estado.indiceActivo + 1 + " / " + Presentacion.guion.length;
    nodos.indicadorPasos.replaceChildren();
    nodos.indicadorPasos.hidden = estado.cantidadPasos === 0;

    if (estado.cantidadPasos > 0) {
      const totalEstados = estado.cantidadPasos + 1;
      nodos.indicadorPasos.setAttribute(
        "aria-label",
        "Paso " + (estado.pasoActivo + 1) + " de " + totalEstados
      );
      for (let indice = 0; indice < totalEstados; indice += 1) {
        const punto = document.createElement("i");
        punto.className =
          "presentacion-paso" +
          (indice === estado.pasoActivo ? " is-active" : "");
        punto.setAttribute("aria-hidden", "true");
        nodos.indicadorPasos.appendChild(punto);
      }
    }
  }

  function crearError(titulo, mensajes) {
    const caja = document.createElement("section");
    const encabezado = document.createElement("h2");
    const lista = document.createElement("ul");
    const regreso = document.createElement("a");
    caja.className = "presentacion-error";
    encabezado.textContent = titulo;
    caja.appendChild(encabezado);

    (mensajes || []).forEach(function (mensaje) {
      const elemento = document.createElement("li");
      elemento.textContent = mensaje;
      lista.appendChild(elemento);
    });
    if (lista.childNodes.length) {
      caja.appendChild(lista);
    }

    regreso.href = "#/";
    regreso.textContent = "Volver al índice";
    caja.appendChild(regreso);
    return caja;
  }

  function desmontarContenido() {
    const contenido = estado.contenidoActivo;
    estado.contenidoActivo = null;
    estado.contextoActivo = null;
    if (contenido && typeof contenido.desmontar === "function") {
      try {
        contenido.desmontar();
      } catch (error) {
        console.error("Falló desmontar() de la diapositiva activa.", error);
      }
    }
    establecerAcciones([]);
    nodos.escenario.replaceChildren();
  }

  function obtenerEntrada(id) {
    const indice = Presentacion.guion.findIndex(function (entrada) {
      return entrada && entrada.id === id;
    });
    return {
      entrada: indice >= 0 ? Presentacion.guion[indice] : null,
      indice: indice
    };
  }

  function obtenerContenido(entrada) {
    return entrada.tipo === "interactivo"
      ? registro.obtenerDiapositiva(entrada.id)
      : Presentacion.tipos[entrada.tipo];
  }

  function fallarContenido(error, entrada) {
    console.error(
      'Falló la diapositiva "' + (entrada ? entrada.id : "desconocida") + '".',
      error
    );
    desmontarContenido();
    nodos.escenario.appendChild(
      crearError("No se pudo mostrar esta diapositiva.", [
        "El contenido produjo un error y fue aislado del resto de la presentación."
      ])
    );
    actualizarProgreso();
  }

  function montarEntrada(entrada, indice) {
    desmontarContenido();
    estado.enIndice = false;
    estado.entradaActiva = entrada;
    estado.indiceActivo = indice;
    estado.pasoActivo = 0;
    estado.cantidadPasos = 0;
    estado.ultimaId = entrada.id;
    actualizarEncabezado(entrada, false);
    actualizarControlIndice();

    const errores = estado.validacion.porId[entrada.id] || [];
    if (errores.length) {
      nodos.escenario.appendChild(
        crearError("Esta diapositiva tiene errores de configuración.", errores)
      );
      actualizarProgreso();
      return;
    }

    const contenido = obtenerContenido(entrada);
    const contexto = crearContexto(entrada);
    estado.contenidoActivo = contenido;
    estado.contextoActivo = contexto;

    try {
      contenido.montar(nodos.escenario, contexto, entrada);
      estado.cantidadPasos = pasos.obtenerCantidad(contenido);
      pasos.aplicar(contenido, 0, contexto);
      actualizarProgreso();
    } catch (error) {
      fallarContenido(error, entrada);
    }
  }

  function crearEnlaceIndice(entrada, indice) {
    const elemento = document.createElement("li");
    const enlace = document.createElement("a");
    const numero = document.createElement("span");
    const cuerpo = document.createElement("span");
    const titulo = document.createElement("strong");
    const bajada = document.createElement("span");
    const errores = estado.validacion.porId[entrada.id] || [];

    enlace.className = "presentacion-indice__enlace";
    enlace.href = "#/" + encodeURIComponent(entrada.id);
    numero.className = "presentacion-indice__numero";
    numero.textContent = indice + 1;
    titulo.className = "presentacion-indice__titulo";
    titulo.textContent = entrada.titulo || entrada.id || "Sin título";
    bajada.className = "presentacion-indice__bajada";
    bajada.textContent = entrada.bajada || "";

    cuerpo.appendChild(titulo);
    if (entrada.bajada) {
      cuerpo.appendChild(bajada);
    }
    if (errores.length) {
      const aviso = document.createElement("span");
      aviso.className = "presentacion-indice__error";
      aviso.textContent = "Requiere revisión";
      cuerpo.appendChild(aviso);
      enlace.setAttribute(
        "aria-label",
        (entrada.titulo || entrada.id) + ". Requiere revisión."
      );
    }

    enlace.appendChild(numero);
    enlace.appendChild(cuerpo);
    elemento.appendChild(enlace);
    return elemento;
  }

  function renderizarIndice() {
    const indice = document.createElement("nav");
    const grupos = [];
    const porNombre = Object.create(null);
    indice.className = "presentacion-indice";
    indice.setAttribute("aria-label", "Índice de diapositivas");

    if (estado.validacion.generales.length) {
      const aviso = document.createElement("div");
      const titulo = document.createElement("strong");
      const lista = document.createElement("ul");
      aviso.className = "presentacion-indice__aviso";
      titulo.textContent = "Se detectaron problemas de configuración.";
      aviso.appendChild(titulo);
      estado.validacion.generales.forEach(function (mensaje) {
        const elemento = document.createElement("li");
        elemento.textContent = mensaje;
        lista.appendChild(elemento);
      });
      aviso.appendChild(lista);
      indice.appendChild(aviso);
    }

    Presentacion.guion.forEach(function (entrada, posicion) {
      const nombre = entrada.seccion || "";
      if (!porNombre[nombre]) {
        porNombre[nombre] = {
          nombre: nombre,
          entradas: []
        };
        grupos.push(porNombre[nombre]);
      }
      porNombre[nombre].entradas.push({
        entrada: entrada,
        posicion: posicion
      });
    });

    grupos.forEach(function (grupo) {
      const seccion = document.createElement("section");
      const lista = document.createElement("ol");
      seccion.className = "presentacion-indice__seccion";
      lista.className = "presentacion-indice__lista";
      if (grupo.nombre) {
        const titulo = document.createElement("h2");
        titulo.textContent = grupo.nombre;
        seccion.appendChild(titulo);
      }
      grupo.entradas.forEach(function (elemento) {
        lista.appendChild(
          crearEnlaceIndice(elemento.entrada, elemento.posicion)
        );
      });
      seccion.appendChild(lista);
      indice.appendChild(seccion);
    });

    nodos.escenario.appendChild(indice);
  }

  function mostrarIndice() {
    desmontarContenido();
    estado.enIndice = true;
    estado.entradaActiva = null;
    estado.indiceActivo = -1;
    estado.pasoActivo = 0;
    estado.cantidadPasos = 0;
    actualizarEncabezado(null, true);
    actualizarControlIndice();
    actualizarProgreso();
    renderizarIndice();
  }

  function manejarRuta(ruta) {
    if (estado.montando) {
      return;
    }
    estado.montando = true;
    try {
      if (ruta.esIndice) {
        mostrarIndice();
        return;
      }

      const resultado = obtenerEntrada(ruta.id);
      if (ruta.desconocida || !resultado.entrada) {
        desmontarContenido();
        estado.enIndice = false;
        estado.entradaActiva = null;
        estado.indiceActivo = -1;
        actualizarEncabezado(null, false);
        actualizarControlIndice();
        actualizarProgreso();
        nodos.escenario.appendChild(
          crearError("Ruta no encontrada.", [
            "No existe una diapositiva asociada a " + ruta.hash + "."
          ])
        );
        return;
      }
      montarEntrada(resultado.entrada, resultado.indice);
    } finally {
      estado.montando = false;
    }
  }

  function aplicarPaso(numero) {
    if (
      !estado.contenidoActivo ||
      numero < 0 ||
      numero > estado.cantidadPasos
    ) {
      return false;
    }
    try {
      pasos.aplicar(
        estado.contenidoActivo,
        numero,
        estado.contextoActivo
      );
      estado.pasoActivo = numero;
      actualizarProgreso();
      return true;
    } catch (error) {
      fallarContenido(error, estado.entradaActiva);
      return false;
    }
  }

  function avanzar() {
    if (estado.enIndice) {
      if (Presentacion.guion.length) {
        enrutador.navegar(Presentacion.guion[0].id);
      }
      return;
    }
    if (aplicarPaso(estado.pasoActivo + 1)) {
      return;
    }
    if (
      estado.indiceActivo >= 0 &&
      estado.indiceActivo < Presentacion.guion.length - 1
    ) {
      enrutador.navegar(Presentacion.guion[estado.indiceActivo + 1].id);
    }
  }

  function retroceder() {
    if (estado.enIndice) {
      if (Presentacion.guion.length) {
        enrutador.navegar(
          estado.ultimaId || Presentacion.guion[Presentacion.guion.length - 1].id
        );
      }
      return;
    }
    if (aplicarPaso(estado.pasoActivo - 1)) {
      return;
    }
    if (estado.indiceActivo > 0) {
      enrutador.navegar(Presentacion.guion[estado.indiceActivo - 1].id);
    }
  }

  function alternarIndice() {
    if (estado.enIndice) {
      const destino =
        estado.ultimaId ||
        (Presentacion.guion[0] && Presentacion.guion[0].id);
      if (destino) {
        enrutador.navegar(destino);
      }
      return;
    }
    enrutador.navegar(null);
  }

  function escapar() {
    if (estado.enIndice) {
      alternarIndice();
      return;
    }
    if (modoPresentacion.estaActivo()) {
      modoPresentacion.salir();
    }
  }

  function iniciar() {
    estado.validacion = registro.validar();
    nodos.botonIndice.addEventListener("click", alternarIndice);
    modoPresentacion.inicializar(nodos.botonModo);
    teclado.inicializar({
      obtenerContenido: function () {
        return estado.contenidoActivo;
      },
      obtenerContexto: function () {
        return estado.contextoActivo;
      },
      manejarError: function (error) {
        fallarContenido(error, estado.entradaActiva);
      },
      acciones: {
        avanzar: avanzar,
        retroceder: retroceder,
        alternarIndice: alternarIndice,
        alternarPresentacion: modoPresentacion.alternar,
        escapar: escapar
      }
    });
    enrutador.iniciar(manejarRuta);
  }

  Presentacion.nucleo.marco = {
    iniciar: iniciar,
    navegar: enrutador.navegar,
    obtenerEstado: function () {
      return {
        id: estado.entradaActiva ? estado.entradaActiva.id : null,
        enIndice: estado.enIndice,
        pasoActivo: estado.pasoActivo,
        cantidadPasos: estado.cantidadPasos,
        modoPresentacion: modoPresentacion.estaActivo()
      };
    }
  };

  iniciar();
})();
