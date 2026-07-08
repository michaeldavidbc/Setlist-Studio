// --- Estado Inicial ---
let listaActual;
const datosGuardados = localStorage.getItem('setlistData');
// Carga el catálogo desde localStorage o inicia uno vacío si no existe.
listaActual = datosGuardados ? JSON.parse(datosGuardados) : [];
let fondosPersonalizados = JSON.parse(localStorage.getItem('fondosPersonalizados')) || [];
let setlist = JSON.parse(localStorage.getItem('setlistActivo')) || [];
let setlistAlignment = localStorage.getItem('setlistAlignment') || 'center';
let colorEventoPersonalizado = localStorage.getItem('colorEvento') || null;
let colorFechaPersonalizado = localStorage.getItem('colorFecha') || null;
let onModalSave = null; // Callback para el guardado del modal

// --- Funciones de Persistencia ---
function guardarDatos() {
    localStorage.setItem('setlistData', JSON.stringify(listaActual));
}

function guardarSetlist() {
    localStorage.setItem('setlistActivo', JSON.stringify(setlist));
}
