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
const displayTituloContainer = document.getElementById('display-titulo');
const displayFechaContainer = document.getElementById('display-fecha');
const displayFecha = document.getElementById('subtitulo-fecha');
const setlistContenedor = document.getElementById('setlist-activo');
const centerGuide = document.getElementById('center-guide');
const clearEvento = document.getElementById('clear-evento');
const clearFecha = document.getElementById('clear-fecha');
const btnExportarImg = document.getElementById('btn-exportar-img');
const btnLimpiarSetlist = document.getElementById('btn-limpiar-setlist');
const btnExportarPdf = document.getElementById('btn-exportar-pdf');
const btnExportarExcel = document.getElementById('btn-exportar-excel');
const btnImportarExcel = document.getElementById('btn-importar-excel');
const inputImportarExcel = document.getElementById('importar-excel');
const contadorCatalogo = document.getElementById('contador-catalogo');
const contadorSetlist = document.getElementById('contador-setlist');
const inputColor = document.getElementById('color-fondo');
const inputColorEvento = document.getElementById('color-evento');
const inputColorFecha = document.getElementById('color-fecha');
const btnAplicarDegradado = document.getElementById('btn-aplicar-degradado');
const btnInvertirDegradado = document.getElementById('btn-invertir-degradado');

// --- Estado Inicial ---
let listaActual;
const datosGuardados = localStorage.getItem('setlistData');
// Carga el catálogo desde localStorage o inicia uno vacío si no existe.
listaActual = datosGuardados ? JSON.parse(datosGuardados) : [];
let fondosPersonalizados = JSON.parse(localStorage.getItem('fondosPersonalizados')) || [];
let setlist = JSON.parse(localStorage.getItem('setlistActivo')) || [];
let colorEventoPersonalizado = localStorage.getItem('colorEvento') || null;
let colorFechaPersonalizado = localStorage.getItem('colorFecha') || null;

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
    contadorCatalogo.textContent = `(${listaActual.length})`;
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
    const songCount = setlist.filter(item => item.type === 'song').length;
    contadorSetlist.textContent = `(${songCount} ${songCount === 1 ? 'canción' : 'canciones'})`;

    if (setlist.length === 0) {
        setlistContenedor.style.fontSize = '';
        return;
    }

    let songCounter = 0;
    setlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-setlist';
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

function isColorDark(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Formula for luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
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

btnLimpiarSetlist.onclick = () => {
    if (setlist.length === 0) return; // No hacer nada si ya está vacío
    if (confirm('¿Estás seguro de que quieres limpiar todo el setlist? Esta acción no se puede deshacer.')) {
        setlist = [];
        guardarSetlist();
        renderizarSetlist();
    }
};

inputColorEvento.oninput = (e) => {
    colorEventoPersonalizado = e.target.value;
    displayTitulo.style.color = colorEventoPersonalizado;
    localStorage.setItem('colorEvento', colorEventoPersonalizado);
};

inputColorFecha.oninput = (e) => {
    colorFechaPersonalizado = e.target.value;
    displayFecha.style.color = colorFechaPersonalizado;
    localStorage.setItem('colorFecha', colorFechaPersonalizado);
};

inputColor.oninput = (e) => {
    const color = e.target.value;
    aplicarFondo(color);
    actualizarFondoActivo(color);
};

btnAplicarDegradado.onclick = () => {
    const fondoActual = localStorage.getItem('fondoElegido') || 'negro';
    const colorSeleccionado = inputColor.value;

    if (fondoActual.startsWith('gradient-')) {
        // Si ya hay un degradado, vuelve al color sólido
        aplicarFondo(colorSeleccionado);
        actualizarFondoActivo(colorSeleccionado);
    } else {
        // Si no hay degradado, aplícalo (hacia abajo por defecto)
        const gradientValue = `gradient-down:${colorSeleccionado}`;
        aplicarFondo(gradientValue);
        actualizarFondoActivo(gradientValue);
    }
};

btnInvertirDegradado.onclick = () => {
    const fondoActual = localStorage.getItem('fondoElegido') || 'negro';
    if (!fondoActual.startsWith('gradient-')) return; // Solo funciona si hay degradado

    const [gradient, color] = fondoActual.split(':');
    const direction = gradient.split('-')[1];

    const nuevaDireccion = direction === 'down' ? 'up' : 'down';
    const nuevoFondo = `gradient-${nuevaDireccion}:${color}`;

    aplicarFondo(nuevoFondo);
    actualizarFondoActivo(nuevoFondo);
};
btnAgregar.onclick = () => {
    const nombreCancion = inputNueva.value.trim();
    if (nombreCancion !== "") {
        const nombreEnMayusculas = nombreCancion.toUpperCase();

        // Añadir al catálogo
        const nuevaCancionCatalogo = { nombre: nombreEnMayusculas, favorito: false };
        listaActual.push(nuevaCancionCatalogo);

        // Añadir también al setlist
        const nuevaCancionSetlist = { type: 'song', nombre: nombreEnMayusculas, observacion: '' };
        setlist.push(nuevaCancionSetlist);

        // Guardar y renderizar todo
        guardarDatos();
        guardarSetlist();
        inputNueva.value = '';
        renderizar(listaActual);
        renderizarSetlist();
    }
};

inputNueva.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evita cualquier comportamiento por defecto del Enter
        btnAgregar.click(); // Simula un clic en el botón de agregar
    }
});

buscador.oninput = (e) => {
    const texto = e.target.value.toUpperCase();
    const filtradas = listaActual.filter(c => c.nombre.includes(texto));
    renderizar(filtradas);
};

// --- Gestión de Catálogo (Importar) ---
btnImportarExcel.onclick = () => {
    inputImportarExcel.click();
};

inputImportarExcel.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convierte la hoja a un array de arrays (filas)
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

            // Omitir encabezado si existe
            if (rows.length > 0 && typeof rows[0][0] === 'string' && rows[0][0].toLowerCase().includes('nombre')) {
                rows.shift();
            }

            const nuevasCanciones = rows.map(row => {
                const nombreCancion = row[0] ? row[0].toString().trim() : null;
                if (!nombreCancion) return null; // Ignorar filas sin nombre de canción

                const esFavorito = row[1] ? row[1].toString().trim() === '*' : false;
                return { nombre: nombreCancion.toUpperCase(), favorito: esFavorito };
            }).filter(Boolean); // Elimina las entradas nulas

            if (nuevasCanciones.length > 0) {
                if (confirm(`Se encontraron ${nuevasCanciones.length} canciones. ¿Quieres reemplazar tu catálogo actual? Esta acción no se puede deshacer.`)) {
                    listaActual = nuevasCanciones;
                    guardarDatos();
                    renderizar(listaActual);
                    alert('Catálogo importado y guardado correctamente.');
                }
            } else {
                alert('No se encontraron canciones en la primera columna del archivo.');
            }
        } catch (error) {
            console.error("Error al importar el archivo:", error);
            alert("Ocurrió un error al leer el archivo. Asegúrate de que sea un archivo de Excel o CSV válido. Revisa la consola para más detalles.");
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Resetea el valor para poder cargar el mismo archivo otra vez
};

// --- Gestión de Catálogo (Exportar) ---
btnExportarExcel.onclick = () => {
    if (listaActual.length === 0) {
        alert("El catálogo está vacío. No hay nada que exportar.");
        return;
    }

    // 1. Prepara los datos con encabezado y dos columnas, ordenados alfabéticamente.
    const sortedList = [...listaActual].sort((a, b) => a.nombre.localeCompare(b.nombre));
    const dataForSheet = [
        ["Nombre Canción", "Favorito"], // Encabezados
        ...sortedList.map(cancion => [
            cancion.nombre,
            cancion.favorito ? '*' : '' // Añade '*' en la segunda columna si es favorito
        ])
    ];

    // 2. Crea la hoja de cálculo y el libro.
    const worksheet = XLSX.utils.aoa_to_sheet(dataForSheet);
    worksheet['!cols'] = [{ wch: 40 }, { wch: 10 }]; // Ancho de columnas
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");
    XLSX.writeFile(workbook, "catalogo_canciones_actualizado.xlsx");
};

function aplicarFondo(valor) {
  let defaultTituloColor, defaultFechaColor;
  let isDark = true;
  btnInvertirDegradado.style.display = 'none'; // Ocultar por defecto

  if (valor === 'negro') {
    lienzo.style.backgroundImage = 'none';
    lienzo.style.backgroundColor = 'var(--vanta-black)';
    defaultTituloColor = 'var(--neon-acento)';
    defaultFechaColor = 'var(--blanco-texto)';
    isDark = true;
  } else if (valor.startsWith('gradient-')) {
    const [gradient, color] = valor.split(':');
    const direction = gradient.split('-')[1]; // 'up' or 'down'
    const gradientDirection = direction === 'up' ? 'to top' : 'to bottom';
    lienzo.style.backgroundImage = `linear-gradient(${gradientDirection}, ${color}, var(--vanta-black))`;
    lienzo.style.backgroundColor = 'transparent';
    btnInvertirDegradado.style.display = 'block'; // Mostrar botón de invertir
    if (isColorDark(color)) {
      defaultTituloColor = 'var(--blanco-texto)';
      defaultFechaColor = 'var(--blanco-texto)';
      isDark = true;
    } else {
      defaultTituloColor = '#000000';
      defaultFechaColor = '#000000';
      isDark = false;
    }
  } else if (valor === 'blanco') {
    lienzo.style.backgroundImage = 'none';
    lienzo.style.backgroundColor = '#ffffff';
    defaultTituloColor = '#000000';
    defaultFechaColor = '#000000';
    isDark = false;
  } else if (valor.startsWith('#')) { // Custom color from picker
    lienzo.style.backgroundImage = 'none';
    lienzo.style.backgroundColor = valor;
    if (isColorDark(valor)) {
      defaultTituloColor = 'var(--blanco-texto)';
      defaultFechaColor = 'var(--blanco-texto)';
      isDark = true;
    } else {
      defaultTituloColor = '#000000';
      defaultFechaColor = '#000000';
      isDark = false;
    }
  } else { // Es una imagen
    lienzo.style.backgroundImage = `url('${valor}')`;
    lienzo.style.backgroundColor = 'transparent';
    defaultTituloColor = '#000000';
    defaultFechaColor = '#000000';
    isDark = false;
  }

  // Apply colors respecting custom choices
  displayTitulo.style.color = colorEventoPersonalizado || defaultTituloColor;
  displayFecha.style.color = colorFechaPersonalizado || defaultFechaColor;

  if (isDark) {
    setlistContenedor.classList.remove('texto-negro');
  } else {
    setlistContenedor.classList.add('texto-negro');
  }
}

function actualizarFondoActivo(fondoUrl) {
    document.querySelectorAll('.fondo-thumbnail').forEach(thumb => {
        thumb.classList.remove('activo');
        if (thumb.dataset.fondo === fondoUrl) {
            thumb.classList.add('activo');
        }
    });
    if (fondoUrl.startsWith('#')) {
        inputColor.value = fondoUrl;
    } else if (fondoUrl.startsWith('gradient-')) {
        const color = fondoUrl.split(':')[1];
        inputColor.value = color;
    }
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
    const dataString = e.dataTransfer.getData('text/plain');

    // Si el dato no es un JSON para una canción, no hacer nada.
    // Esto evita el conflicto con el arrastre del cuadro de información.
    if (!dataString || !dataString.startsWith('{')) {
        return;
    }

    const draggableElements = [...setlistContenedor.querySelectorAll('.item-setlist:not(.dragging)')];
    const afterElement = getDragAfterElement(setlistContenedor, e.clientY);

    const data = JSON.parse(dataString);

    if (data.source === 'catalog') {
        const newSong = { type: 'song', nombre: data.nombre, observacion: '' };
        const index = afterElement ? draggableElements.indexOf(afterElement) : draggableElements.length;
        setlist.splice(index, 0, newSong);
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

inputEvento.oninput = () => {
    const eventName = inputEvento.value;
    localStorage.setItem('nombreEvento', eventName);
    displayTitulo.textContent = eventName;
    displayTitulo.style.visibility = eventName ? 'visible' : 'hidden';
    clearEvento.style.display = eventName ? 'block' : 'none';
};

inputFecha.onchange = () => {
    const showDate = inputFecha.value;
    localStorage.setItem('fechaShow', showDate);
    clearFecha.style.display = showDate ? 'block' : 'none';
    if (showDate) {
        const date = new Date(showDate + 'T00:00:00'); // Evitar problemas de zona horaria
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        displayFecha.textContent = date.toLocaleDateString('es-ES', options);
        displayFecha.style.visibility = 'visible';
    } else {
        displayFecha.textContent = '';
        displayFecha.style.visibility = 'hidden';
    }
};

clearEvento.onclick = () => {
    inputEvento.value = '';
    inputEvento.dispatchEvent(new Event('input'));
};

clearFecha.onclick = () => {
    inputFecha.value = '';
    inputFecha.dispatchEvent(new Event('change'));
};

function makeVerticallyDraggable(element, storageKey, defaultConfig) {
    let position = JSON.parse(localStorage.getItem(storageKey)) || defaultConfig;

    // Apply initial position
    element.style.top = position.top;

    element.addEventListener('mousedown', (e) => {
        // No arrastrar si se hace clic en un botón de control
        if (e.target.closest('.btn-borrar-setlist, .btn-add-obs, .btn-add-break')) {
            return;
        }
        if (e.button !== 0) return; // Solo mover con el botón izquierdo
        e.preventDefault(); // Previene la selección de texto

        const lienzoRect = lienzo.getBoundingClientRect();
        const offsetY = e.clientY - element.getBoundingClientRect().top;

        function onMouseMove(moveEvent) {
            let newY = moveEvent.clientY - lienzoRect.top - offsetY;

            // Limitar al contenedor
            newY = Math.max(0, Math.min(newY, lienzoRect.height - element.offsetHeight));

            element.style.top = `${newY}px`;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Guardar la posición final
            position = { top: element.style.top };
            localStorage.setItem(storageKey, JSON.stringify(position));
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// --- Lógica de Posición de Texto ---
function makeDraggable(element, storageKey, defaultConfig) {
    let position = JSON.parse(localStorage.getItem(storageKey)) || defaultConfig;

    // Apply initial position
    element.style.top = position.top;
    element.style.left = position.left;
    element.style.transform = position.transform;

    element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Solo mover con el botón izquierdo
        e.preventDefault();

        const lienzoRect = lienzo.getBoundingClientRect();
        const offsetX = e.clientX - element.getBoundingClientRect().left;
        const offsetY = e.clientY - element.getBoundingClientRect().top;

        function onMouseMove(moveEvent) {
            let newX = moveEvent.clientX - lienzoRect.left - offsetX;
            let newY = moveEvent.clientY - lienzoRect.top - offsetY;

            // Lógica para centrar y mostrar guía
            const elementCenter = newX + element.offsetWidth / 2;
            const lienzoCenter = lienzoRect.width / 2;
            const snapThreshold = 5; // píxeles

            if (Math.abs(elementCenter - lienzoCenter) < snapThreshold) {
                newX = lienzoCenter - element.offsetWidth / 2;
                centerGuide.style.display = 'block';
            } else {
                centerGuide.style.display = 'none';
            }

            // Limitar al contenedor
            newX = Math.max(0, Math.min(newX, lienzoRect.width - element.offsetWidth));
            newY = Math.max(0, Math.min(newY, lienzoRect.height - element.offsetHeight));

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            element.style.transform = 'translateX(0)'; // Anular el centrado inicial
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            centerGuide.style.display = 'none'; // Ocultar guía

            // Guardar la posición final
            position = {
                top: element.style.top,
                left: element.style.left,
                transform: element.style.transform
            };
            localStorage.setItem(storageKey, JSON.stringify(position));
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// --- Carga Inicial al Abrir la App ---
window.onload = () => {
    const savedEventName = localStorage.getItem('nombreEvento') || '';
    inputEvento.value = savedEventName;
    displayTitulo.textContent = savedEventName;
    displayTitulo.style.visibility = savedEventName ? 'visible' : 'hidden';
    clearEvento.style.display = savedEventName ? 'block' : 'none';

    const savedShowDate = localStorage.getItem('fechaShow') || '';
    inputFecha.value = savedShowDate;
    clearFecha.style.display = savedShowDate ? 'block' : 'none';
    if (savedShowDate) {
        const date = new Date(savedShowDate + 'T00:00:00');
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        displayFecha.textContent = date.toLocaleDateString('es-ES', options);
        displayFecha.style.visibility = 'visible';
    } else {
        displayFecha.textContent = '';
        displayFecha.style.visibility = 'hidden';
    }

    renderizar(listaActual);
    renderizarSetlist();

    // Carga de fondos
    renderizarFondos();
    const fondoGuardado = localStorage.getItem('fondoElegido') || 'negro'; // Negro por defecto
    aplicarFondo(fondoGuardado);
    actualizarFondoActivo(fondoGuardado);

    // Sincronizar los selectores de color con los valores guardados (si existen)
    if (colorEventoPersonalizado) {
        inputColorEvento.value = colorEventoPersonalizado;
    }
    if (colorFechaPersonalizado) {
        inputColorFecha.value = colorFechaPersonalizado;
    }

    // Iniciar la funcionalidad de arrastre para ambos elementos
    makeDraggable(displayTituloContainer, 'titleBoxPosition', { top: '40px', left: '50%', transform: 'translateX(-50%)' });
    makeDraggable(displayFechaContainer, 'dateBoxPosition', { top: '70px', left: '50%', transform: 'translateX(-50%)' });
    makeVerticallyDraggable(setlistContenedor, 'songBlockPosition', { top: '120px' });
};