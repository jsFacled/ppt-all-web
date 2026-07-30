(function () {
  "use strict";

  function agregarTextoEstructurado(raiz, entrada) {
    const contenido = entrada.contenido || {};
    const articulo = document.createElement("article");
    articulo.className = "tipo-contenido";

    if (contenido.titulo || entrada.titulo) {
      const titulo = document.createElement("h2");
      titulo.textContent = contenido.titulo || entrada.titulo;
      articulo.appendChild(titulo);
    }
    if (contenido.texto) {
      const texto = document.createElement("p");
      texto.textContent = contenido.texto;
      articulo.appendChild(texto);
    }
    if (Array.isArray(contenido.puntos)) {
      const lista = document.createElement("ul");
      contenido.puntos.forEach(function (punto) {
        const elemento = document.createElement("li");
        elemento.textContent = punto;
        lista.appendChild(elemento);
      });
      articulo.appendChild(lista);
    }
    raiz.appendChild(articulo);
  }

  Presentacion.registrarTipo("contenido", {
    montar: function (raiz, contexto, entrada) {
      if (entrada.plantilla) {
        const plantilla = document.getElementById(entrada.plantilla);
        const contenedor = document.createElement("article");
        contenedor.className = "tipo-contenido";
        contenedor.appendChild(plantilla.content.cloneNode(true));
        raiz.appendChild(contenedor);
        return;
      }
      agregarTextoEstructurado(raiz, entrada);
    },
    desmontar: function () {}
  });
})();
