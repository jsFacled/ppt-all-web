(function () {
  "use strict";

  const implementaciones = Object.create(null);
  const duplicadosImplementacion = [];
  const duplicadosTipo = [];
  const tiposPermitidos = new Set(["portada", "contenido", "interactivo"]);

  function registrarDiapositiva(id, implementacion) {
    if (typeof id !== "string" || !id.trim()) {
      throw new Error("No se puede registrar una diapositiva sin identificador.");
    }
    if (Object.prototype.hasOwnProperty.call(implementaciones, id)) {
      duplicadosImplementacion.push(id);
      console.error(
        'La implementación de la diapositiva "' + id + '" está duplicada.'
      );
      return;
    }
    implementaciones[id] = implementacion;
  }

  function registrarTipo(id, implementacion) {
    if (Object.prototype.hasOwnProperty.call(Presentacion.tipos, id)) {
      duplicadosTipo.push(id);
      console.error('El tipo de diapositiva "' + id + '" está duplicado.');
      return;
    }
    Presentacion.tipos[id] = implementacion;
  }

  function validar() {
    const generales = [];
    const porId = Object.create(null);
    const entradasPorId = Object.create(null);
    const vistos = new Set();
    const guion = Array.isArray(Presentacion.guion)
      ? Presentacion.guion
      : [];

    function agregar(id, mensaje) {
      if (id) {
        porId[id] = porId[id] || [];
        porId[id].push(mensaje);
      } else {
        generales.push(mensaje);
      }
      console.error(mensaje);
    }

    if (!Array.isArray(Presentacion.guion)) {
      agregar(null, "El guion debe ser un arreglo.");
    }

    guion.forEach(function (entrada, indice) {
      const referencia =
        entrada && entrada.id
          ? entrada.id
          : "entrada " + (indice + 1);
      const id = entrada && entrada.id;

      if (!entrada || typeof entrada !== "object") {
        agregar(null, "La entrada " + (indice + 1) + " del guion es inválida.");
        return;
      }
      if (typeof id !== "string" || !id.trim()) {
        agregar(null, "La " + referencia + " no tiene un identificador válido.");
      } else {
        entradasPorId[id] = entrada;
        if (vistos.has(id)) {
          agregar(id, 'El identificador de diapositiva "' + id + '" está duplicado.');
        }
        vistos.add(id);
      }
      if (typeof entrada.titulo !== "string" || !entrada.titulo.trim()) {
        agregar(id, "La " + referencia + " no tiene título.");
      }
      if (!tiposPermitidos.has(entrada.tipo)) {
        agregar(
          id,
          'La ' + referencia + ' declara el tipo inexistente "' + entrada.tipo + '".'
        );
      }

      if (entrada.tipo === "interactivo") {
        if (!id || !implementaciones[id]) {
          agregar(
            id,
            'La diapositiva interactiva "' + referencia + '" no tiene implementación registrada.'
          );
        }
      } else if (
        tiposPermitidos.has(entrada.tipo) &&
        !Presentacion.tipos[entrada.tipo]
      ) {
        agregar(
          id,
          'No existe un renderizador registrado para el tipo "' + entrada.tipo + '".'
        );
      }

      if (entrada.tipo === "contenido") {
        const tieneContenido = entrada.contenido !== undefined;
        const tienePlantilla = entrada.plantilla !== undefined;
        if (tieneContenido && tienePlantilla) {
          agregar(
            id,
            'La diapositiva "' + referencia + '" declara contenido y plantilla simultáneamente.'
          );
        } else if (!tieneContenido && !tienePlantilla) {
          agregar(
            id,
            'La diapositiva "' + referencia + '" no declara contenido ni plantilla.'
          );
        }
        if (
          tienePlantilla &&
          (typeof entrada.plantilla !== "string" ||
            !document.getElementById(entrada.plantilla))
        ) {
          agregar(
            id,
            'La plantilla "' + entrada.plantilla + '" declarada por "' + referencia + '" no existe.'
          );
        }
      }
    });

    Object.keys(implementaciones).forEach(function (id) {
      const implementacion = implementaciones[id];
      if (!entradasPorId[id]) {
        agregar(
          null,
          'La implementación registrada "' + id + '" no tiene entrada en el guion.'
        );
      }
      if (
        !implementacion ||
        typeof implementacion.montar !== "function" ||
        typeof implementacion.desmontar !== "function"
      ) {
        agregar(
          id,
          'La implementación "' + id + '" debe definir montar() y desmontar().'
        );
      }
    });

    duplicadosImplementacion.forEach(function (id) {
      agregar(
        id,
        'La implementación de la diapositiva "' + id + '" está duplicada.'
      );
    });
    duplicadosTipo.forEach(function (id) {
      agregar(null, 'El tipo de diapositiva "' + id + '" está duplicado.');
    });

    return {
      generales: generales,
      porId: porId,
      tieneErrores:
        generales.length > 0 ||
        Object.keys(porId).some(function (id) {
          return porId[id].length > 0;
        })
    };
  }

  Presentacion.registrarDiapositiva = registrarDiapositiva;
  Presentacion.registrarTipo = registrarTipo;
  Presentacion.nucleo.registro = {
    obtenerDiapositiva: function (id) {
      return implementaciones[id] || null;
    },
    obtenerImplementaciones: function () {
      return Object.assign({}, implementaciones);
    },
    validar: validar
  };
})();
