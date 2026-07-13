// Variable global para guardar los inmuebles una vez cargados
let todasLasPropiedades = [];

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("contenedor-propiedades");
    const botonesFiltro = document.querySelectorAll(".btn-filtro");

    // 1. Cargar los datos desde el archivo JSON
    fetch("propiedades.json")
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar el archivo JSON de propiedades");
            }
            return respuesta.json();
        })
        .then(datos => {
            todasLasPropiedades = datos;
            // Mostramos todas las propiedades al cargar la web por primera vez
            renderizarPropiedades(todasLasPropiedades);
        })
        .catch(error => {
            console.error("Error:", error);
            contenedor.innerHTML = `<p class="cargando">Error al cargar las propiedades. Por favor, inténtelo más tarde.</p>`;
        });

    // 2. Lógica de los botones de Filtro
    botonesFiltro.forEach(boton => {
        boton.addEventListener("click", (e) => {
            // Quitar la clase 'activo' del botón anterior y ponérsela al que se ha pulsado
            botonesFiltro.forEach(b => b.classList.remove("activo"));
            e.target.classList.add("activo");

            // Saber qué tipo de filtro quiere el usuario (todos, venta o alquiler)
            const filtroSeleccionado = e.target.getAttribute("data-tipo");

            // Filtrar el array de propiedades
            if (filtroSeleccionado === "todos") {
                renderizarPropiedades(todasLasPropiedades);
            } else {
                const propiedadesFiltradas = todasLasPropiedades.filter(piso => piso.tipo === filtroSeleccionado);
                renderizarPropiedades(propiedadesFiltradas);
            }
        });
    });

    // 3. Función encargada de pintar el HTML de las tarjetas
    function renderizarPropiedades(listaDePropiedades) {
        // Limpiamos el contenedor (así quitamos el texto de "Cargando...")
        contenedor.innerHTML = "";

        // Si no hay propiedades que coincidan con el filtro
        if (listaDePropiedades.length === 0) {
            contenedor.innerHTML = `<p class="cargando">No hay propiedades disponibles en este momento bajo este criterio.</p>`;
            return;
        }

        // Recorremos la lista y creamos el HTML de cada tarjeta
        listaDePropiedades.forEach(piso => {
            const tarjeta = document.createElement("div");
            tarjeta.classList.add("tarjeta-propiedad");

            // Formateamos el precio para que tenga puntos (ej: 150.000)
            const precioFormateado = piso.precio.toLocaleString('es-ES');
            const textoAlquiler = piso.tipo === 'alquiler' ? '/mes' : '';

            tarjeta.innerHTML = `
                <img src="${piso.imagen}" alt="${piso.titulo}">
                <div class="info">
                    <span class="etiqueta ${piso.tipo}">${piso.tipo.toUpperCase()}</span>
                    <h3>${piso.titulo}</h3>
                    <p class="precio">${precioFormateado} €${textoAlquiler}</p>
                    <p>${piso.descripcion}</p>
                    <button class="btn-contacto">Ver detalles</button>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        });
    }
});

// 4. Para que el formulario no recargue la página de golpe y podamos mostrar un mensaje de agradecimiento
const formulario = document.getElementById("form-contacto");

if (formulario) {
    formulario.addEventListener("submit", (e) => {
        e.preventDefault(); // Evitamos que la web se refresque
        
        // Recogemos los datos (por si los necesitas en el futuro)
        const nombre = document.getElementById("nombre").value;

        // Simulamos el envío de forma elegante
        alert(`¡Gracias, ${nombre}! Hemos recibido tu mensaje. Nos pondremos en contacto contigo lo antes posible.`);
        
        formulario.reset(); // Vaciamos los campos
    });
}