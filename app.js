// --- Elementos del DOM ---
const contenedor = document.getElementById('canciones');
const buscador = document.getElementById('buscador');
const inputNueva = document.getElementById('nueva-cancion');
const btnAgregar = document.getElementById('btn-agregar');
const subirFondo = document.getElementById('subir-fondo');
const lienzo = document.getElementById('canvas-setlist');
const galeriaFondos = document.getElementById('galeria-fondos');
const inputEvento = document.getElementById('nombre-evento');
const inputFecha = document.getElementById('fecha-show');
const displayTitulo = document.getElementById('titulo-evento');
const displayFecha = document.getElementById('subtitulo-fecha');
const setlistContenedor = document.getElementById('setlist-activo');
const btnExportarImg = document.getElementById('btn-exportar-img');
const btnExportarPdf = document.getElementById('btn-exportar-pdf');

// --- Estado Inicial ---
let listaActual;
const datosGuardados = localStorage.getItem('setlistData');

// Si no hay datos guardados o la lista está vacía, se usa el catálogo de canciones por defecto.
if (!datosGuardados || datosGuardados === '[]') {
    listaActual = catalogoCanciones;
} else {
    listaActual = JSON.parse(datosGuardados);
}

let fondosPersonalizados = JSON.parse(localStorage.getItem('fondosPersonalizados')) || [];
let setlist = JSON.parse(localStorage.getItem('setlistActivo')) || [];

// --- Funciones de Persistencia ---
function guardarDatos() {
    localStorage.setItem('setlistData', JSON.stringify(listaActual));
}

function guardarSetlist() {
    localStorage.setItem('setlistActivo', JSON.stringify(setlist));
}

// --- Lógica de Renderizado ---
function renderizar(lista) {
    contenedor.innerHTML = '';
    const listaOrdenada = [...lista].sort((a, b) => {
        if (a.favorito !== b.favorito) {
            return b.favorito - a.favorito;
        }
        return a.nombre.localeCompare(b.nombre);
    });

    listaOrdenada.forEach(cancion => {
        const div = document.createElement('div');
        div.className = 'item-cancion';
        div.setAttribute('draggable', true);
        div.innerHTML = `
            <span>${cancion.nombre}</span>
            <div>
                <span class="btn-fav ${cancion.favorito ? 'es-favorito' : ''}">★</span>
                <span class="btn-borrar">-</span>
            </div>
        `;

        div.addEventListener('click', () => {
            const newSong = { type: 'song', nombre: cancion.nombre, observacion: '' };
            setlist.push(newSong);
            guardarSetlist();
            renderizarSetlist();
        });

        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'catalog', nombre: cancion.nombre }));
        });
        
        div.querySelector('.btn-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            cancion.favorito = !cancion.favorito;
            guardarDatos();
            renderizar(lista);
        });
        
        div.querySelector('.btn-borrar').addEventListener('click', (e) => {
            e.stopPropagation();
            const index = listaActual.indexOf(cancion);
            listaActual.splice(index, 1);
            guardarDatos();
            renderizar(listaActual);
        });
        
        contenedor.appendChild(div);
    });
}

function renderizarSetlist() {
    setlistContenedor.innerHTML = '';
    if (setlist.length === 0) {
        setlistContenedor.style.fontSize = ''; // Restablecer al valor por defecto del CSS
        return;
    }

    let songCounter = 0;
    setlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-setlist';
        div.setAttribute('draggable', true);
        div.dataset.index = index;

        const isBreak = item.type === 'break';
        if (!isBreak) {
            songCounter++;
        }

        const hasObs = item.observacion && item.observacion.trim() !== '';

        // --- Build HTML String ---
        let textContentHTML = '';
        if (isBreak) {
            div.classList.add('item-break');
            if (hasObs) {
                textContentHTML = `<span class="break-texto">${item.observacion.toUpperCase()}</span>`;
            }
        } else {
            textContentHTML = `<span class="setlist-song-name">${songCounter}. ${item.nombre}</span>${hasObs ? ` <small class="observacion-texto">(${item.observacion})</small>` : ''}`;
        }

        const rightControlsHTML = `
            <div class="setlist-right-controls">
                <span class="btn-add-obs ${hasObs ? 'has-obs' : ''}">+</span>
                <span class="btn-add-break">↓</span>
            </div>
        `;

        div.innerHTML = `
            <span class="btn-borrar-setlist">×</span>
            ${textContentHTML}
            ${rightControlsHTML}
        `;

        // --- Add Event Listeners ---
        div.querySelector('.btn-add-obs').onclick = () => {
            const obsActual = item.observacion || '';
            const message = hasObs ? 'Editar texto (dejar en blanco para eliminar):' : 'Añadir texto:';
            const nuevaObs = prompt(message, obsActual);
            if (nuevaObs !== null) { // prompt returns null if user clicks cancel
                item.observacion = nuevaObs.trim();
                guardarSetlist();
                renderizarSetlist();
            }
        };

        div.querySelector('.btn-add-break').onclick = () => {
            setlist.splice(index + 1, 0, { type: 'break', observacion: '' });
            guardarSetlist();
            renderizarSetlist();
        };

        div.querySelector('.btn-borrar-setlist').onclick = (e) => {
            e.stopPropagation();
            setlist.splice(index, 1);
            guardarSetlist();
            renderizarSetlist();
        };

        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'setlist', index }));
            setTimeout(() => div.classList.add('dragging'), 0);
        });

        div.addEventListener('dragend', () => div.classList.remove('dragging'));

        setlistContenedor.appendChild(div);
    });
    ajustarFuenteSetlist();
}

function ajustarFuenteSetlist() {
    const numCanciones = setlist.length;
    let fontSize;

    if (numCanciones <= 15) {
        fontSize = '1.1rem';
    } else if (numCanciones <= 20) {
        fontSize = '1.0rem';
    } else if (numCanciones <= 25) {
        fontSize = '0.9rem';
    } else if (numCanciones <= 30) {
        fontSize = '0.8rem';
    } else if (numCanciones <= 37) {
        fontSize = '0.75rem';
    } else {
        fontSize = '0.7rem';
    }
    setlistContenedor.style.fontSize = fontSize;
}

function getExportFileName() {
    const eventName = inputEvento.value.trim();
    // Replace invalid characters for a filename and default to 'evento'
    const safeEventName = eventName.replace(/[^a-z0-9_ -]/gi, '_') || 'evento';
    return `${safeEventName}_Setlist`;
}

// --- Lógica de Exportación ---
btnExportarImg.onclick = () => {
    // Ocultar la barra de scroll y resetear dirección para la captura
    const originalDirection = lienzo.style.direction;
    const originalOverflow = lienzo.style.overflowY;
    lienzo.style.direction = 'ltr';
    lienzo.style.overflowY = 'hidden'; // Oculta el scrollbar si existiera

    html2canvas(lienzo, { scale: 3, useCORS: true }).then(canvas => {
        // Restaurar estilos
        lienzo.style.direction = originalDirection;
        lienzo.style.overflowY = originalOverflow;

        const link = document.createElement('a');
        link.download = `${getExportFileName()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    }).catch(err => {
        // Asegurarse de restaurar estilos en caso de error
        lienzo.style.direction = originalDirection;
        lienzo.style.overflowY = originalOverflow;
        console.error("Error al exportar imagen:", err);
        alert("Ocurrió un error al exportar la imagen.");
    });
};

btnExportarPdf.onclick = () => {
    const { jsPDF } = window.jspdf;
    
    const originalDirection = lienzo.style.direction;
    const originalOverflow = lienzo.style.overflowY;
    lienzo.style.direction = 'ltr';
    lienzo.style.overflowY = 'hidden';

    html2canvas(lienzo, { scale: 3, useCORS: true }).then(canvas => {
        lienzo.style.direction = originalDirection;
        lienzo.style.overflowY = originalOverflow;

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a2' });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;

        let imgWidth = pageWidth;
        let imgHeight = imgWidth / canvasAspectRatio;

        if (imgHeight > pageHeight) {
            imgHeight = pageHeight;
            imgWidth = imgHeight * canvasAspectRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        pdf.save(`${getExportFileName()}.pdf`);
    }).catch(err => {
        lienzo.style.direction = originalDirection;
        lienzo.style.overflowY = originalOverflow;
        console.error("Error al exportar PDF:", err);
        alert("Ocurrió un error al exportar el PDF.");
    });
};
// --- Gestión de Canciones ---
btnAgregar.onclick = () => {
    if (inputNueva.value.trim() !== "") {
        const nuevaCancion = { nombre: inputNueva.value.toUpperCase(), favorito: false };
        listaActual.push(nuevaCancion);
        guardarDatos();
        inputNueva.value = '';
        renderizar(listaActual);
    }
};

buscador.oninput = (e) => {
    const texto = e.target.value.toUpperCase();
    const filtradas = listaActual.filter(c => c.nombre.includes(texto));
    renderizar(filtradas);
};

function aplicarFondo(valor) {
    if (valor === 'negro') {
        lienzo.style.backgroundImage = 'none';
        lienzo.style.backgroundColor = 'var(--vanta-black)';
        displayTitulo.style.color = 'var(--neon-acento)'; // Restaurar color neón
        displayFecha.style.color = 'var(--blanco-texto)'; // Restaurar color blanco
        setlistContenedor.classList.remove('texto-negro');
    } else {
        // Para fondos blancos o de imagen, el texto es negro.
        displayTitulo.style.color = '#000000';
        displayFecha.style.color = '#000000';
        setlistContenedor.classList.add('texto-negro');

        if (valor === 'blanco') {
        lienzo.style.backgroundImage = 'none';
        lienzo.style.backgroundColor = '#ffffff';
        } else { // Es una imagen
        lienzo.style.backgroundImage = `url('${valor}')`;
        lienzo.style.backgroundColor = 'transparent';
        }
    }
}

function actualizarFondoActivo(fondoUrl) {
    document.querySelectorAll('.fondo-thumbnail').forEach(thumb => {
        thumb.classList.remove('activo');
        if (thumb.dataset.fondo === fondoUrl) {
            thumb.classList.add('activo');
        }
    });
    localStorage.setItem('fondoElegido', fondoUrl);
}

function renderizarFondos() {
    galeriaFondos.innerHTML = '';

    const fondosBase = [
        { nombre: 'Fondo Negro', valor: 'negro' },
        { nombre: 'Fondo Blanco', valor: 'blanco' }
    ];

    // Renderizar fondos base
    fondosBase.forEach(fondo => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'fondo-thumbnail';
        thumbnail.dataset.fondo = fondo.valor;
        thumbnail.title = fondo.nombre;
        thumbnail.onclick = () => {
            aplicarFondo(fondo.valor);
            actualizarFondoActivo(fondo.valor);
        };
        galeriaFondos.appendChild(thumbnail);
    });

    // Opciones personalizadas
    fondosPersonalizados.forEach((fondoUrl, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'fondo-thumbnail';
        thumbnail.style.backgroundImage = `url('${fondoUrl}')`;
        thumbnail.dataset.fondo = fondoUrl;
        thumbnail.title = `Fondo Personalizado ${index + 1}`;

        thumbnail.onclick = () => {
            aplicarFondo(fondoUrl);
            actualizarFondoActivo(fondoUrl);
        };

        const btnBorrar = document.createElement('span');
        btnBorrar.className = 'btn-borrar-fondo';
        btnBorrar.innerHTML = '&times;';
        btnBorrar.onclick = (e) => {
            e.stopPropagation(); // Evita que se seleccione el fondo al borrarlo
            if (confirm('¿Seguro que quieres eliminar este fondo?')) {
                fondosPersonalizados.splice(index, 1);
                localStorage.setItem('fondosPersonalizados', JSON.stringify(fondosPersonalizados));
                // Si el fondo borrado era el activo, vuelve al negro por defecto
                if (localStorage.getItem('fondoElegido') === fondoUrl) {
                    aplicarFondo('negro');
                    actualizarFondoActivo('negro');
                }
                renderizarFondos();
            }
        };

        thumbnail.appendChild(btnBorrar);
        galeriaFondos.appendChild(thumbnail);
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.item-setlist:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

lienzo.addEventListener('dragover', e => {
    e.preventDefault();
});

lienzo.addEventListener('drop', e => {
    e.preventDefault();
    const draggableElements = [...setlistContenedor.querySelectorAll('.item-setlist:not(.dragging)')];
    const afterElement = getDragAfterElement(setlistContenedor, e.clientY);
    const dataString = e.dataTransfer.getData('text/plain');
    if (!dataString) return;

    const data = JSON.parse(dataString);

    if (data.source === 'catalog') {
        const newSong = { type: 'song', nombre: data.nombre, observacion: '' };
        const index = afterElement ? draggableElements.indexOf(afterElement) : draggableElements.length;
        setlist.splice(index, 0, newSong);
    } else if (data.source === 'setlist') {
        const [movedItem] = setlist.splice(data.index, 1);
        const newIndex = afterElement ? draggableElements.indexOf(afterElement) : draggableElements.length;
        setlist.splice(newIndex, 0, movedItem);
    }
    
    guardarSetlist();
    renderizarSetlist();
});

if (subirFondo) {
    subirFondo.onchange = (e) => {
        if (!e.target.files || !e.target.files[0]) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imgDataUrl = event.target.result;
            fondosPersonalizados.push(imgDataUrl);
            localStorage.setItem('fondosPersonalizados', JSON.stringify(fondosPersonalizados));
            
            renderizarFondos();
            
            aplicarFondo(imgDataUrl);
            actualizarFondoActivo(imgDataUrl);
        };
        reader.readAsDataURL(e.target.files[0]);
        e.target.value = '';
    };
}

// --- Lógica de Texto (Evento/Fecha) ---
inputEvento.oninput = () => {
    localStorage.setItem('nombreEvento', inputEvento.value);
    displayTitulo.textContent = inputEvento.value || 'Nombre del Evento';
};

inputFecha.onchange = () => {
    localStorage.setItem('fechaShow', inputFecha.value);
    displayFecha.textContent = inputFecha.value || 'Fecha del Show';
};

// --- Carga Inicial al Abrir la App ---
window.onload = () => {
    inputEvento.value = localStorage.getItem('nombreEvento') || '';
    inputFecha.value = localStorage.getItem('fechaShow') || '';
    displayTitulo.textContent = inputEvento.value || 'Nombre del Evento';
    displayFecha.textContent = inputFecha.value || 'Fecha del Show';
    
    renderizar(listaActual);
    renderizarSetlist();

    // Carga de fondos
    renderizarFondos();
    const fondoGuardado = localStorage.getItem('fondoElegido') || 'negro'; // Negro por defecto
    aplicarFondo(fondoGuardado);
    actualizarFondoActivo(fondoGuardado);
};