(function () {
  "use strict";

  Presentacion.registrarTipo("portada", {
    montar: function (raiz, contexto, entrada) {
      const articulo = document.createElement("article");
      const titulo = document.createElement("h2");
      articulo.className = "tipo-portada";
      titulo.textContent = entrada.titulo;
      articulo.appendChild(titulo);

      if (entrada.bajada) {
        const bajada = document.createElement("p");
        bajada.textContent = entrada.bajada;
        articulo.appendChild(bajada);
      }
      raiz.appendChild(articulo);
    },
    desmontar: function () {}
  });
})();
