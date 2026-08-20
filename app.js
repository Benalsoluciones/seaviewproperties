// Función universal para formatear cualquier ruta de imagen (tarjetas y modal)
function obtenerRutaImagen(foto) {
    if (!foto) return '';

    const esGitHub = window.location.pathname.includes('/seaviewproperties');
    const basePath = esGitHub ? '/seaviewproperties' : '';

    if (esGitHub) {
        const rutaLimpia = foto.startsWith('/') ? foto : `/${foto}`;
        return `${basePath}${rutaLimpia}`;
    }

    // En Netlify o Local: si ya empieza con barra la dejamos tal cual, si no, le ponemos ./
    return foto.startsWith('/') ? foto : `./${foto}`;
}

// Variable global para guardar los inmuebles una vez cargados
let todasLasPropiedades = [];
let mapaInstancia = null; // Instancia global para el mapa interactivo

function formatearPrecio(precio) {
    return precio ? precio.toLocaleString('es-ES') : 'Consultar';
}

function esPaginaIndex() {
    const ruta = window.location.pathname;
    return ruta.endsWith('index.html') || ruta.endsWith('/') || ruta === '';
}

function obtenerValor(obj, ...claves) {
    for (const clave of claves) {
        if (obj[clave] != null && obj[clave] !== '') return obj[clave];
    }
    return null;
}

// Función encargada de crear el HTML de cada tarjeta individual
function crearTarjetaPropiedad(piso) {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('tarjeta-propiedad');

    const precioFormateado = formatearPrecio(piso.precio);
    const textoAlquiler = piso.tipo === 'alquiler' ? '/mes' : '';
    const nBanos = obtenerValor(piso, 'banos', 'baños') || 1;
    const nMetros = obtenerValor(piso, 'metros_cuadrados', 'metros') || 0;
    const fotoPrincipal = obtenerRutaImagen(piso.imagen);

    tarjeta.innerHTML = `
        <div class="imagen-contenedor">
            <img src="${fotoPrincipal}" alt="${piso.titulo}">
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

    return tarjeta;
}

// Función encargada de pintar el HTML de las tarjetas
function renderizarPropiedades(listaDePropiedades, contenedor) {
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (listaDePropiedades.length === 0) {
        contenedor.innerHTML = '<p class="cargando">No hay propiedades disponibles en este momento bajo este criterio.</p>';
        return;
    }

    const esIndex = esPaginaIndex();
    const propiedadesAMostrar = esIndex ? listaDePropiedades.slice(0, 3) : listaDePropiedades;

    const fragment = document.createDocumentFragment();
    propiedadesAMostrar.forEach(piso => fragment.appendChild(crearTarjetaPropiedad(piso)));
    contenedor.appendChild(fragment);
}

// ==========================================
// 2. LÓGICA DE FILTRADO CON DESPLEGABLES
// ==========================================
function filtrarPropiedades() {
    const getVal = (id) => document.getElementById(id);
    const valOperacion = getVal('filtro-operacion')?.value.toLowerCase() ?? 'todos';
    const valZona = getVal('filtro-zona')?.value.toLowerCase() ?? 'todas';
    const valTipo = getVal('filtro-tipo')?.value.toLowerCase() ?? 'todos';
    const valHabitaciones = getVal('filtro-habitaciones')?.value ?? 'todas';
    const valBanos = getVal('filtro-banos')?.value ?? 'todos';
    const valPrecioMin = parseFloat(getVal('filtro-precio-min')?.value) || 0;
    const valPrecioMax = parseFloat(getVal('filtro-precio-max')?.value) || Infinity;

    return todasLasPropiedades.filter(piso => {
        // 1. Operación (Venta / Alquiler)
        const tipoPiso = (piso.tipo || '').trim().toLowerCase();
        const coincideOperacion = (valOperacion === 'todos') || (tipoPiso === valOperacion);

        // 2. Zona / Municipio
        const zonaPiso = (obtenerValor(piso, 'municipio', 'zona') || '').trim().toLowerCase();
        const coincideZona = (valZona === 'todas') || (zonaPiso.includes(valZona));

        // 3. Tipo de inmueble (Filtrado estricto por categoría)
        const categoriaPiso = (obtenerValor(piso, 'categoria') || '').trim().toLowerCase();
        const normalizar = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        const coincideTipo = (valTipo === 'todos') || (normalizar(categoriaPiso) === normalizar(valTipo));

        // 4. Mínimo de habitaciones
        const habs = parseInt(piso.habitaciones, 10) || 0;
        const coincideHabitaciones = (valHabitaciones === 'todas') || (habs >= parseInt(valHabitaciones, 10));

        // 5. Mínimo de baños
        const banos = parseInt(obtenerValor(piso, 'banos', 'baños'), 10) || 0;
        const coincideBanos = (valBanos === 'todos') || (banos >= parseInt(valBanos, 10));

        // 6. Rango de precio
        const precio = parseFloat(piso.precio) || 0;
        const coincidePrecio = (precio >= valPrecioMin) && (precio <= valPrecioMax);

        // Devuelve true solo si cumple TODOS los criterios
        return coincideOperacion && coincideZona && coincideTipo &&
               coincideHabitaciones && coincideBanos && coincidePrecio;
    });
}

function resetearFiltros() {
    const valores = {
        'filtro-operacion': 'todos',
        'filtro-zona': 'todas',
        'filtro-tipo': 'todos',
        'filtro-habitaciones': 'todas',
        'filtro-banos': 'todos',
    };

    Object.entries(valores).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.value = valor;
    });

    ['filtro-precio-min', 'filtro-precio-max'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

function abrirModalInmueble(id, modal, contenidoModal, visorImagen, imagenAmpliada) {
    const propiedad = todasLasPropiedades.find(p => p.id === id);
    if (!propiedad || !modal || !contenidoModal) return;

    // Si hay galería la usamos, si no, usamos la imagen principal
    const fotos = (propiedad.galeria && propiedad.galeria.length > 0)
        ? propiedad.galeria
        : [propiedad.imagen];

    // Procesamos CADA FOTO de la galería exactamente con la misma lógica que las tarjetas
    const fotosHTML = fotos.map(foto => {
        const rutaFoto = obtenerRutaImagen(foto);
        return `<img src="${rutaFoto}" alt="${propiedad.titulo}" class="foto-galeria-item">`;
    }).join('');

    const precioFormateado = formatearPrecio(propiedad.precio);
    const lat = propiedad.coordenadas?.latitud || propiedad.coordenadas?.lat || 36.5962;
    const lng = propiedad.coordenadas?.longitud || propiedad.coordenadas?.lng || -4.5273;

    // Generar enlace dinámico de WhatsApp para compartir el inmueble
    const baseUri = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUri}?id=${propiedad.id}`;
    const textoCompartir = `¡Mira este increíble inmueble de SeaView Properties! 🌟🏡\n\n*${propiedad.titulo}*\n💰 Precio: *${precioFormateado} €*\n📍 Ubicación: ${propiedad.ubicacion}\n\nVer todos los detalles, fotos y ubicación aquí:\n👉 ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir)}`;

    contenidoModal.innerHTML = `
        <button class="btn-cerrar-modal" id="btn-cerrar-modal" title="Cerrar">&times;</button>
        <div class="modal-header">
            <h2>${propiedad.titulo}</h2>
            <p class="ubicacion"><i class="fa-solid fa-location-dot"></i> ${propiedad.ubicacion}</p>
        </div>
        <div class="modal-precio">${precioFormateado} €</div>
        <div class="modal-caracteristicas">
            <span><i class="fa-solid fa-bed"></i> ${propiedad.habitaciones || 1} Hab</span>
            <span><i class="fa-solid fa-bath"></i> ${obtenerValor(propiedad, 'banos', 'baños') || 1} Baños</span>
            <span><i class="fa-solid fa-ruler-combined"></i> ${propiedad.metros_cuadrados || 0} m²</span>
        </div>
        <div class="modal-acciones">
            <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-compartir-whatsapp">
                <svg class="icono-whatsapp-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
                <span>Compartir por WhatsApp</span>
            </a>
        </div>
        <h3>Galería de fotos <small class="galeria-ayuda">(haz clic en cualquier foto para ampliarla)</small></h3>
        <div class="modal-galeria">${fotosHTML}</div>
        <h3>Descripción</h3>
        <p class="descripcion-modal">${propiedad.descripcion.replace(/\n/g, '<br>')}</p>
        <div class="contenedor-mapa">
            <h3>Ubicación en el mapa</h3>
            <div id="mapa-inmueble"></div>
        </div>
    `;

    modal.classList.add('activo');

    // Evento para abrir las imágenes en el visor ampliado
    contenidoModal.querySelectorAll('.foto-galeria-item').forEach(img => {
        img.addEventListener('click', (e) => {
            if (visorImagen && imagenAmpliada) {
                imagenAmpliada.src = e.target.src;
                visorImagen.classList.add('activo');
            }
        });
    });

    // Inicialización del mapa
    setTimeout(() => {
        if (mapaInstancia) {
            mapaInstancia.remove();
            mapaInstancia = null;
        }

        const elMapa = document.getElementById('mapa-inmueble');
        if (elMapa && typeof L !== 'undefined') {
            mapaInstancia = L.map('mapa-inmueble').setView([lat, lng], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap',
            }).addTo(mapaInstancia);

            const circuloArea = L.circle([lat, lng], {
                color: '#0d2c54',
                fillColor: '#0d2c54',
                fillOpacity: 0.25,
                radius: 350,
            }).addTo(mapaInstancia);

            circuloArea.bindPopup(`<b>Ubicación aproximada</b><br>${propiedad.municipio || propiedad.zona || 'Zona residencial'}`);

            setTimeout(() => {
                mapaInstancia.invalidateSize();
            }, 100);
        }
    }, 300);
}

function initPropiedades() {
    const contenedor = document.getElementById('contenedor-propiedades');
    if (!contenedor) return;

    // Elementos del Modal Principal
    const modal = document.getElementById('modal-detalle');
    const contenidoModal = document.getElementById('contenido-modal-inmueble');

    // Elementos del Visor de Imagen Ampliada (Zoom)
    const visorImagen = document.getElementById('visor-imagen');
    const imagenAmpliada = document.getElementById('imagen-ampliada');

    // 1. Cargar los datos desde el archivo JSON
    fetch('propiedades.json')
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error('No se pudo cargar el archivo JSON de propiedades');
            }
            return respuesta.json();
        })
        .then(datos => {
            todasLasPropiedades = datos.propiedades || datos;
            renderizarPropiedades(todasLasPropiedades, contenedor);

            // Verificar si hay un ID de propiedad en la URL para abrirla de forma automática (enlace compartido)
            const urlParams = new URLSearchParams(window.location.search);
            const propiedadId = parseInt(urlParams.get('propiedad') || urlParams.get('id'), 10);
            if (propiedadId) {
                const propiedadExiste = todasLasPropiedades.find(p => p.id === propiedadId);
                if (propiedadExiste) {
                    abrirModalInmueble(
                        propiedadId,
                        modal,
                        contenidoModal,
                        visorImagen,
                        imagenAmpliada
                    );
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            contenedor.innerHTML = '<p class="cargando">Error al cargar las propiedades. Por favor, inténtelo más tarde.</p>';
        });

    contenedor.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ver-detalle');
        if (btn) {
            abrirModalInmueble(
                parseInt(btn.dataset.id, 10),
                modal,
                contenidoModal,
                visorImagen,
                imagenAmpliada
            );
        }
    });

    // ------------------------------------------
    // ESCUCHADORES DE EVENTOS DE BOTONES
    // ------------------------------------------

    // 1. Botón Buscar: Ejecuta el filtrado solo al hacer clic
    const btnBuscar = document.getElementById('btn-buscar-filtros');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            // Pinta las tarjetas filtradas
            renderizarPropiedades(filtrarPropiedades(), contenedor);
        });
    }

    // 2. Botón Limpiar: Resetea todos los campos y recarga la lista completa
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            resetearFiltros();
            renderizarPropiedades(todasLasPropiedades, contenedor);
        });
    }
}

// ==========================================
// 6. Gestión del Banner de Cookies
// ==========================================
function initCookies() {
    const bannerCookies = document.getElementById('banner-cookies');
    const btnAceptarCookies = document.getElementById('btn-aceptar-cookies');
    if (!bannerCookies || !btnAceptarCookies) return;

    if (localStorage.getItem('cookiesAceptadas') === 'true') {
        bannerCookies.style.display = 'none';
        return;
    }

    btnAceptarCookies.addEventListener('click', () => {
        localStorage.setItem('cookiesAceptadas', 'true');
        bannerCookies.style.display = 'none';
    });
}

// ==========================================
// MENÚ RESPONSIVE INDEPENDIENTE
// ==========================================
function initMenuResponsive() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (!menuToggle || !navMenu) return;

    const iconoMenu = menuToggle.querySelector('i');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('activo');
        iconoMenu.className = navMenu.classList.contains('activo')
            ? 'fa-solid fa-xmark'
            : 'fa-solid fa-bars';
    });

    const enlaces = navMenu.querySelectorAll('a');
    enlaces.forEach(enlace => {
        enlace.addEventListener('click', () => {
            navMenu.classList.remove('activo');
            iconoMenu.className = 'fa-solid fa-bars';
        });
    });
}

// ==========================================
// MANEJO GLOBAL DE CIERRES (MODAL Y VISOR DE FOTOS)
// ==========================================
function initCierreModales() {
    // Cierre del Modal Principal (botón X o clic en el fondo fuera del contenido)
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('modal-detalle');
        if (e.target.matches('#btn-cerrar-modal, .cerrar-modal, .btn-cerrar-modal, #cerrar-modal') || e.target === modal) {
            if (modal) {
                modal.classList.remove('activo');
            }
        }
    });

    // Cierre del Visor Ampliado de Fotos (botón X o clic en el fondo oscuro)
    document.addEventListener('click', (e) => {
        const visorImagen = document.getElementById('visor-imagen');
        if (e.target.matches('#cerrar-visor, #btn-cerrar-visor, .cerrar-visor, .btn-cerrar-visor') || e.target === visorImagen) {
            if (visorImagen) {
                visorImagen.classList.remove('activo');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMenuResponsive();
    initCierreModales();
    initCookies();
    initPropiedades();
});
