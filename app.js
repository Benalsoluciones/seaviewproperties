// Variable global para guardar los inmuebles una vez cargados
let todasLasPropiedades = [];
let mapaInstancia = null; // Instancia global para el mapa interactivo

// Variables globales para guardar la selección de los filtros
let filtroTipoActual = "todos";
let filtroZonaActual = "todas";

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("contenedor-propiedades");

    const botonesTipo = document.querySelectorAll(".btn-filtro-tipo");
    const botonesZona = document.querySelectorAll(".btn-filtro-zona");
    
    // Elementos del Modal Principal
    const modal = document.getElementById("modal-detalle");
    const btnCerrarModal = document.getElementById("cerrar-modal");
    const contenidoModal = document.getElementById("contenido-modal-inmueble");

    // Elementos del Visor de Imagen Ampliada (Zoom)
    const visorImagen = document.getElementById("visor-imagen");
    const imagenAmpliada = document.getElementById("imagen-ampliada");
    const btnCerrarVisor = document.getElementById("cerrar-visor");

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
            renderizarPropiedades(todasLasPropiedades);
        })
        .catch(error => {
            console.error("Error:", error);
            if (contenedor) {
                contenedor.innerHTML = `<p class="cargando">Error al cargar las propiedades. Por favor, inténtelo más tarde.</p>`;
            }
        });

    // 2. Lógica combinada de los botones de Filtro (Tipo y Zona)

    // Eventos para botones de Tipo (Todos / Venta / Alquiler)
    botonesTipo.forEach(boton => {
        boton.addEventListener("click", (e) => {
            botonesTipo.forEach(b => b.classList.remove("activo"));
            e.target.classList.add("activo");

            filtroTipoActual = e.target.getAttribute("data-tipo");
            aplicarFiltrosCombinados();
        });
    });

    // Eventos para botones de Zona (Todas / Benalmádena / Fuengirola / etc.)
    botonesZona.forEach(boton => {
        boton.addEventListener("click", (e) => {
            botonesZona.forEach(b => b.classList.remove("activo"));
            e.target.classList.add("activo");

            filtroZonaActual = e.target.getAttribute("data-zona");
            aplicarFiltrosCombinados();
        });
    });

    // Función que evalúa ambos criterios a la vez
    function aplicarFiltrosCombinados() {
        const resultado = todasLasPropiedades.filter(piso => {
            const tipoPiso = (piso.tipo || '').trim().toLowerCase();
            const zonaPiso = (piso.municipio || piso.zona || '').trim().toLowerCase();

            const coincideTipo = (filtroTipoActual === "todos") || (tipoPiso === filtroTipoActual);
            const coincideZona = (filtroZonaActual === "todas") || (zonaPiso === filtroZonaActual);

            return coincideTipo && coincideZona;
        });

        renderizarPropiedades(resultado);
    }

    // 3. Función encargada de pintar el HTML de las tarjetas
    function renderizarPropiedades(listaDePropiedades) {
        if (!contenedor) return;

        contenedor.innerHTML = "";

        if (listaDePropiedades.length === 0) {
            contenedor.innerHTML = `<p class="cargando">No hay propiedades disponibles en este momento bajo este criterio.</p>`;
            return;
        }

        const ruta = window.location.pathname;
        const esIndex = ruta.endsWith('index.html') || ruta.endsWith('/') || ruta === '';

        const propiedadesAMostrar = esIndex ? listaDePropiedades.slice(0, 3) : listaDePropiedades;

        propiedadesAMostrar.forEach(piso => {
            const tarjeta = document.createElement("div");
            tarjeta.classList.add("tarjeta-propiedad");

            const precioFormateado = piso.precio ? piso.precio.toLocaleString('es-ES') : 'Consultar';
            const textoAlquiler = piso.tipo === 'alquiler' ? '/mes' : '';
            const nBanos = piso.banos || piso.baños || 1;
            const nMetros = piso.metros_cuadrados || piso.metros || 0;

            tarjeta.innerHTML = `
                <div class="imagen-contenedor">
                    <img src="${piso.imagen}" alt="${piso.titulo}">
                    <span class="etiqueta ${piso.tipo}">${piso.tipo.toUpperCase()}</span>
                </div>
                <div class="info">
                    <h3>${piso.titulo}</h3>
                    <p class="precio">${precioFormateado} €${textoAlquiler}</p>
        
                    <div class="caracteristicas">
                        <span><i class="fa-solid fa-bed"></i> ${piso.habitaciones || 1} Hab</span>
                        <span><i class="fa-solid fa-bath"></i> ${nBanos} Baños</span>
                        <span><i class="fa-solid fa-ruler-combined"></i> ${nMetros} m²</span>
                    </div>

                    <p class="descripcion">${piso.descripcion}</p>
                    
                    <button class="btn-contacto btn-ver-detalle" data-id="${piso.id}">Ver detalles</button>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        });

        document.querySelectorAll(".btn-ver-detalle").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idPropiedad = parseInt(e.target.getAttribute("data-id"));
                abrirModalInmueble(idPropiedad);
            });
        });
    }

    // 4. Función para llenar y abrir el Modal Emergente
    function abrirModalInmueble(id) {
        const propiedad = todasLasPropiedades.find(p => p.id === id);
        if (!propiedad || !modal) return;

        const fotos = propiedad.galeria || [propiedad.imagen];
        const fotosHTML = fotos.map(foto => `<img src="${foto}" alt="${propiedad.titulo}" class="foto-galeria-item">`).join('');

        const precioFormateado = propiedad.precio ? propiedad.precio.toLocaleString('es-ES') : 'Consultar';

        const lat = propiedad.coordenadas?.latitud || propiedad.coordenadas?.lat || 36.5962;
        const lng = propiedad.coordenadas?.longitud || propiedad.coordenadas?.lng || -4.5273;

        contenidoModal.innerHTML = `
            <div class="modal-header">
                <h2>${propiedad.titulo}</h2>
                <p class="ubicacion"><i class="fa-solid fa-location-dot"></i> ${propiedad.ubicacion}</p>
            </div>

            <div class="modal-precio">${precioFormateado} €</div>

            <div class="modal-caracteristicas">
                <span><i class="fa-solid fa-bed"></i> ${propiedad.habitaciones || 1} Hab</span>
                <span><i class="fa-solid fa-bath"></i> ${propiedad.banos || propiedad.baños || 1} Baños</span>
                <span><i class="fa-solid fa-ruler-combined"></i> ${propiedad.metros_cuadrados || 0} m²</span>
            </div>

            <h3>Galería de fotos <small style="font-size: 0.8em; color: #64748b; font-weight: normal;">(haz clic en cualquier foto para ampliarla)</small></h3>
            <div class="modal-galeria">
                ${fotosHTML}
            </div>

            <h3>Descripción</h3>
            <p class="descripcion-modal">${propiedad.descripcion.replace(/\n/g, "<br>")}</p>

            <div class="contenedor-mapa">
                <h3>Ubicación en el mapa</h3>
                <div id="mapa-inmueble"></div>
            </div>
        `;

        modal.classList.add("activo");

        document.querySelectorAll(".foto-galeria-item").forEach(img => {
            img.addEventListener("click", (e) => {
                if (visorImagen && imagenAmpliada) {
                    imagenAmpliada.src = e.target.src;
                    visorImagen.classList.add("activo");
                }
            });
        });

       setTimeout(() => {
            if (mapaInstancia) {
                mapaInstancia.remove();
                mapaInstancia = null;
            }

            const elMapa = document.getElementById('mapa-inmueble');
            if (elMapa && typeof L !== 'undefined') {
                // Zoom en 14 para encuadrar bien la zona
                mapaInstancia = L.map('mapa-inmueble').setView([lat, lng], 14);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }).addTo(mapaInstancia);

                // Círculo del área en lugar del marcador exacto
                const circuloArea = L.circle([lat, lng], {
                    color: '#0d2c54',       // Borde azul corporativo
                    fillColor: '#0d2c54',   // Relleno azul
                    fillOpacity: 0.25,      // Transparencia suave
                    radius: 350             // Área de 350 metros
                }).addTo(mapaInstancia);

                circuloArea.bindPopup(`<b>Ubicación aproximada</b><br>${propiedad.municipio || propiedad.zona || 'Zona residencial'}`);

                setTimeout(() => {
                    mapaInstancia.invalidateSize();
                }, 100);
            }
        }, 300);
    } 

    // Eventos para cerrar el Modal Principal
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener("click", () => {
            modal.classList.remove("activo");
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("activo");
            }
        });
    }

    // Eventos para cerrar el Visor a Pantalla Completa
    if (btnCerrarVisor) {
        btnCerrarVisor.addEventListener("click", () => {
            visorImagen.classList.remove("activo");
        });
    }

    if (visorImagen) {
        visorImagen.addEventListener("click", (e) => {
            if (e.target === visorImagen) {
                visorImagen.classList.remove("activo");
            }
        });
    }

    // 5. Formulario de contacto
    const formulario = document.getElementById("form-contacto");
    if (formulario) {
        formulario.addEventListener("submit", (e) => {
            e.preventDefault();
            const nombre = document.getElementById("nombre").value;
            alert(`¡Gracias, ${nombre}! Hemos recibido tu mensaje. Nos pondremos en contacto contigo lo antes posible.`);
            formulario.reset();
        });
    }

    // ==========================================
    // 6. GESTIÓN DEL BANNER DE COOKIES
    // ==========================================
    const bannerCookies = document.getElementById("banner-cookies");
    const btnAceptarCookies = document.getElementById("btn-aceptar-cookies");

    if (bannerCookies && btnAceptarCookies) {
        // Si el usuario ya aceptó previamente las cookies, ocultamos el aviso
        if (localStorage.getItem("cookiesAceptadas") === "true") {
            bannerCookies.style.display = "none";
        }

        // Guardamos la decisión cuando el usuario presiona "Aceptar todo"
        btnAceptarCookies.addEventListener("click", () => {
            localStorage.setItem("cookiesAceptadas", "true");
            bannerCookies.style.display = "none";
        });
    }
});

// ==========================================
// MENÚ RESPONSIVE INDEPENDIENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        const iconoMenu = menuToggle.querySelector('i');

        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('activo');
            if (navMenu.classList.contains('activo')) {
                iconoMenu.className = 'fa-solid fa-xmark';
            } else {
                iconoMenu.className = 'fa-solid fa-bars';
            }
        });

        const enlaces = document.querySelectorAll('.nav-menu a');
        enlaces.forEach(enlace => {
            enlace.addEventListener('click', () => {
                navMenu.classList.remove('activo');
                iconoMenu.className = 'fa-solid fa-bars';
            });
        });
    }
});