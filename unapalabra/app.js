


async function cargarPalabraDelDia() {
  const elementoPalabra = document.getElementById("palabra");
  const elementoCategoria = document.getElementById("categoria");
  const elementoAcepciones = document.getElementById("acepciones");

// Obtener la fecha de Polonia
const ahora = new Date();

const partesFecha = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
}).formatToParts(ahora);

const partes = Object.fromEntries(
    partesFecha.map(p => [p.type, p.value])
);

const fechaPolonia = `${partes.year}-${partes.month}-${partes.day}`;

// Mostrar la fecha
document.getElementById("fecha").textContent =
    new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Warsaw",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(ahora);

  try {
    // Obtener la palabra del día
   // Comprobar si ya tenemos una palabra guardada para hoy
const palabraGuardada = JSON.parse(
    localStorage.getItem("palabraDelDia") || "null"
);

let palabra;

if (palabraGuardada && palabraGuardada.fecha === fechaPolonia) {

    // Si es el mismo día, reutilizamos la palabra
    palabra = palabraGuardada.palabra;

} else {

    // Si cambió el día en Polonia, consultamos la API
    const respuestaDiaria = await fetch("https://rae-api.com/api/daily");
    const datosDiarios = await respuestaDiaria.json();

    if (!datosDiarios.ok) {
        throw new Error("No se pudo obtener la palabra del día");
    }

    palabra = datosDiarios.data.word;

    // Guardamos la palabra y su fecha
    localStorage.setItem(
        "palabraDelDia",
        JSON.stringify({
            fecha: fechaPolonia,
            palabra: palabra
        })
    );
}

    // Obtener sus definiciones
    const respuestaDefinicion = await fetch(
      `https://rae-api.com/api/words/${encodeURIComponent(palabra)}`
    );

    const datosDefinicion = await respuestaDefinicion.json();

    if (!datosDefinicion.ok) {
      throw new Error("No se pudo obtener la definición");
    }

    const significados = datosDefinicion.data.meanings;

    // Obtener todas las acepciones
    const acepciones = significados.flatMap(significado =>
    (significado.senses || []).map(sense => ({
        description: sense.description,
        examples: sense.examples || [],
        synonyms: sense.synonyms || [],
        category_labels: significado.category_labels || []
    }))
);

if (acepciones.length === 0) {
    throw new Error("No se encontraron acepciones");
}

// Actualizar el botón de favoritos


    // Mostrar la palabra
    elementoPalabra.textContent = palabra;
    const botonAudio = document.getElementById("escuchar");

botonAudio.onclick = () => {
    if (!("speechSynthesis" in window)) {
        alert("Tu navegador no admite la reproducción de voz.");
        return;
    }

    // Detener cualquier pronunciación anterior
    window.speechSynthesis.cancel();

    const pronunciacion = new SpeechSynthesisUtterance(palabra);

    // Español de España como variedad general
    pronunciacion.lang = "es-ES";
    pronunciacion.rate = 0.85;

    // Preferir una voz española disponible
    const voces = window.speechSynthesis.getVoices();
    const vozEspanol = voces.find(voz => voz.lang === "es-ES")
        || voces.find(voz => voz.lang.startsWith("es"));

    if (vozEspanol) {
        pronunciacion.voice = vozEspanol;
    }

    window.speechSynthesis.speak(pronunciacion);
};

    elementoCategoria.textContent =
      acepciones[0].category_labels?.[0] || "";

    // Limpiar contenido anterior
    elementoAcepciones.replaceChildren();

    // Crear una sección por cada acepción
    acepciones.forEach((acepcion, indice) => {
      const seccion = document.createElement("div");
      seccion.classList.add("seccion");

      // Título
      const titulo = document.createElement("h3");
      titulo.textContent = `Acepción ${indice + 1}`;
      seccion.appendChild(titulo);

      // Categoría gramatical
      if (acepcion.category_labels?.length) {
        const categoria = document.createElement("p");
        categoria.textContent = acepcion.category_labels.join(", ");
        seccion.appendChild(categoria);
      }

      // Definición
      const definicion = document.createElement("p");
      definicion.textContent = acepcion.description;
      seccion.appendChild(definicion);

      // Ejemplos
      if (acepcion.examples?.length) {
        const subtituloEjemplo = document.createElement("h4");
        subtituloEjemplo.textContent = "Ejemplo";
        seccion.appendChild(subtituloEjemplo);

        acepcion.examples.forEach(ejemplo => {
          const textoEjemplo = document.createElement("p");
          textoEjemplo.textContent = ejemplo;
          seccion.appendChild(textoEjemplo);
        });
      }

      // Sinónimos
      if (acepcion.synonyms?.length) {
        const subtituloSinonimos = document.createElement("h4");
        subtituloSinonimos.textContent = "Sinónimos";
        seccion.appendChild(subtituloSinonimos);

        const sinonimos = document.createElement("p");
        sinonimos.textContent = acepcion.synonyms.join(", ");
        seccion.appendChild(sinonimos);
      }

      elementoAcepciones.appendChild(seccion);
    });

  } catch (error) {
    console.error("Error:", error);

    elementoPalabra.textContent = "No pudimos cargar la palabra";
    elementoCategoria.textContent = "";
    elementoAcepciones.textContent =
      "Por favor, intentá nuevamente más tarde.";
  }
}

cargarPalabraDelDia();



cargarPalabraDelDia();



function actualizarBotonFavorito(palabra, significado) {
    const guardada = favoritos.some(
        item => item.palabra === palabra
    );

    botonFavorito.textContent = guardada ? "♥" : "♡";
    botonFavorito.classList.toggle("activo", guardada);

    botonFavorito.onclick = () => {
        const indice = favoritos.findIndex(
            item => item.palabra === palabra
        );

        if (indice !== -1) {
            favoritos.splice(indice, 1);
        } else {
            favoritos.push({ palabra, significado });
        }

        localStorage.setItem(
            "palabrasFavoritas",
            JSON.stringify(favoritos)
        );

        mostrarFavoritos();
        actualizarBotonFavorito(palabra, significado);
    };
}

mostrarFavoritos();