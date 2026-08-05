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
const modalObservacion = document.getElementById('modal-observacion');
const modalTitulo = document.getElementById('modal-titulo');
const modalInput = document.getElementById('modal-input');
const modalBtnCancelar = document.getElementById('modal-btn-cancelar');
const modalBtnGuardar = document.getElementById('modal-btn-guardar');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');

// --- History Management ---
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY_STEPS = 10;

function updateUndoRedoUI() {
    if (btnUndo) btnUndo.disabled = historyIndex <= 0;
    if (btnRedo) btnRedo.disabled = historyIndex >= historyStack.length - 1;
}

function saveState() {
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }
    const currentState = {
        listaActual: JSON.parse(JSON.stringify(listaActual)),
        setlist: JSON.parse(JSON.stringify(setlist))
    };
    historyStack.push(currentState);
    if (historyStack.length > MAX_HISTORY_STEPS + 1) {
        historyStack.shift();
    } else {
        historyIndex++;
    }
    updateUndoRedoUI();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        applyHistoryState();
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        applyHistoryState();
    }
}

function applyHistoryState() {
    const state = historyStack[historyIndex];
    if (!state) return;
    listaActual = JSON.parse(JSON.stringify(state.listaActual));
    setlist = JSON.parse(JSON.stringify(state.setlist));
    renderizar(listaActual);
    renderizarSetlist();
    guardarDatos();
    guardarSetlist();
    updateUndoRedoUI();
}

function commitState() {
    guardarDatos();
    guardarSetlist();
    saveState();
}

function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png')); // Usar PNG para mantener la transparencia
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
            commitState();
            renderizarSetlist();
        });

        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'catalog', nombre: cancion.nombre }));
        });
        div.querySelector('.btn-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            cancion.favorito = !cancion.favorito;
            commitState();
            renderizar(lista);
        });
        div.querySelector('.btn-borrar').addEventListener('click', (e) => {
            e.stopPropagation();
            const index = listaActual.indexOf(cancion);
            listaActual.splice(index, 1);
            commitState();
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

        div.setAttribute('draggable', true);

        div.addEventListener('dragstart', e => {
            // Set a transparent drag image to hide the default browser "ghost"
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(img, 0, 0);

            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'setlist', index: index }));
            // Add 'dragging' class to the actual element so we can style and move it.
            setTimeout(() => { div.classList.add('dragging'); }, 0);
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });

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

        setlistContenedor.appendChild(div);
    });
    ajustarFuenteSetlist();
}

function showObservacionModal(item) {
    const hasObs = item.observacion && item.observacion.trim() !== '';
    modalTitulo.textContent = hasObs ? 'Editar Texto' : 'Añadir Texto';
    modalInput.value = item.observacion || '';
    modalObservacion.style.display = 'flex';
    modalInput.focus();

    // Define lo que sucede cuando se hace clic en "Guardar"
    onModalSave = () => {
        item.observacion = modalInput.value.trim();
        commitState();
        renderizarSetlist();
        hideObservacionModal();
    };
}

function hideObservacionModal() {
    modalObservacion.style.display = 'none';
    onModalSave = null; // Limpia el callback para evitar ejecuciones accidentales
}

// --- Event Listeners del Modal ---
modalBtnGuardar.onclick = () => {
    if (onModalSave) {
        onModalSave();
    }
};

modalBtnCancelar.onclick = hideObservacionModal;

modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Guardar con Enter (sin Shift)
        e.preventDefault(); // Evita que se cree una nueva línea
        modalBtnGuardar.click();
    }
});

window.addEventListener('keydown', (e) => {
    // Cierra el modal con la tecla Escape
    if (e.key === 'Escape' && modalObservacion.style.display === 'flex') {
        hideObservacionModal();
    }
});

// --- Event Delegation para el Setlist ---
setlistContenedor.addEventListener('click', (e) => {
    const itemDiv = e.target.closest('.item-setlist');
    if (!itemDiv) return;

    const index = parseInt(itemDiv.dataset.index, 10);
    // Validar que el índice sea un número válido dentro de los límites del array
    if (isNaN(index) || index < 0 || index >= setlist.length) return;
    
    const item = setlist[index];

    // Botón de añadir/editar observación
    if (e.target.closest('.btn-add-obs')) {
        showObservacionModal(item);
        return;
    }

    // Botón de añadir descanso
    if (e.target.closest('.btn-add-break')) {
        setlist.splice(index + 1, 0, { type: 'break', observacion: '' });
        commitState();
        renderizarSetlist();
        return;
    }

    // Botón de borrar del setlist
    if (e.target.closest('.btn-borrar-setlist')) {
        setlist.splice(index, 1);
        commitState();
        renderizarSetlist();
        return;
    }
});

function ajustarFuenteSetlist() {
    const songCount = setlist.filter(item => item.type === 'song').length;
    const fontSteps = [
        { threshold: 15, size: '1.1rem' },
        { threshold: 20, size: '1.0rem' },
        { threshold: 25, size: '0.9rem' },
        { threshold: 30, size: '0.8rem' },
        { threshold: 37, size: '0.75rem' },
    ];

    const step = fontSteps.find(s => songCount <= s.threshold);
    const fontSize = step ? step.size : '0.7rem'; // Default for more than 37 songs
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

async function withPreparedCanvas(callback) {
    const originalDirection = lienzo.style.direction;
    const originalOverflow = lienzo.style.overflowY;
    lienzo.style.direction = 'ltr';
    lienzo.style.overflowY = 'hidden';
    lienzo.classList.add('exporting');

    try {
        const canvas = await html2canvas(lienzo, { scale: 3, useCORS: true });
        callback(canvas);
    } catch (err) {
        console.error("Error durante la captura del lienzo:", err);
        alert("Ocurrió un error durante la captura del lienzo.");
    } finally {
        lienzo.style.direction = originalDirection;
        lienzo.style.overflowY = originalOverflow;
        lienzo.classList.remove('exporting');
    }
}

// --- Lógica de Exportación ---
btnExportarImg.onclick = () => {
    withPreparedCanvas(canvas => {
        const link = document.createElement('a');
        link.download = `${getExportFileName()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    });
};

btnExportarPdf.onclick = () => {
    const { jsPDF } = window.jspdf;
    withPreparedCanvas(canvas => {
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
    });
};

btnLimpiarSetlist.onclick = () => {
    if (setlist.length === 0) return; // No hacer nada si ya está vacío
    if (confirm('¿Estás seguro de que quieres limpiar todo el setlist? Esta acción no se puede deshacer.')) {
        setlist = [];
        commitState();
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
        commitState();
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
  // En lugar de llamar a Electron, simulamos un clic en el input de archivo oculto.
  inputImportarExcel.click();
};

inputImportarExcel.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const data = event.target.result;
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rows.length > 0 && typeof rows[0][0] === 'string' && rows[0][0].toLowerCase().includes('nombre')) {
      rows.shift();
    }

    const nuevasCanciones = rows.map((row) => {
      const nombreCancion = row[0] ? row[0].toString().trim() : null;
      if (!nombreCancion) return null;
      const esFavorito = row[1] ? row[1].toString().trim() === '*' : false;
      return { nombre: nombreCancion.toUpperCase(), favorito: esFavorito };
    }).filter(Boolean);

    if (nuevasCanciones.length > 0) {
      if (confirm(`Se encontraron ${nuevasCanciones.length} canciones. ¿Quieres reemplazar tu catálogo actual?`)) {
        listaActual = nuevasCanciones;
        commitState();
        renderizar(listaActual);
        alert('Catálogo importado y guardado correctamente.');
      }
    } else {
      alert('No se encontraron canciones válidas en el archivo.');
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = ''; // Resetear el input para poder cargar el mismo archivo de nuevo
};

// --- Gestión de Catálogo (Exportar) ---
btnExportarExcel.onclick = () => {
  if (listaActual.length === 0) {
    alert('El catálogo está vacío. No hay nada que exportar.');
    return;
  }

  const sortedList = [...listaActual].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const dataForSheet = [
    ['Nombre Canción', 'Favorito'], // Encabezados
    ...sortedList.map((cancion) => [
      cancion.nombre,
      cancion.favorito ? '*' : '',
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(dataForSheet);
  worksheet['!cols'] = [{ wch: 40 }, { wch: 10 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');

  // Usar XLSX.writeFile para generar y descargar el archivo en el navegador.
  // El tercer argumento es el nombre del archivo.
  XLSX.writeFile(workbook, 'catalogo_canciones.xlsx');
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
  } else if (valor.startsWith('#')) {
    // Custom color from picker
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
  } else {
    // Es una imagen
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
  document.querySelectorAll('.fondo-thumbnail').forEach((thumb) => {
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
    { nombre: 'Fondo Blanco', valor: 'blanco' },
  ];

  // Renderizar fondos base
  fondosBase.forEach((fondo) => {
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
        localStorage.setItem(
          'fondosPersonalizados',
          JSON.stringify(fondosPersonalizados)
        );
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
  const draggableElements = [
    ...container.querySelectorAll('.item-setlist:not(.dragging)'),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

lienzo.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    // Solo ejecutar la lógica de reordenamiento dinámico si estamos arrastrando un elemento del setlist.
    if (dragging) {
        const afterElement = getDragAfterElement(setlistContenedor, e.clientY);
        if (afterElement == null) {
            setlistContenedor.appendChild(dragging);
        } else {
            setlistContenedor.insertBefore(dragging, afterElement);
        }
    }
});

lienzo.addEventListener('drop', (e) => {
    e.preventDefault();
    const dataString = e.dataTransfer.getData('text/plain');

    // Si no hay datos de canción, es probable que sea otro elemento arrastrable (como el título), así que lo ignoramos.
    if (!dataString || !dataString.startsWith('{')) {
        return;
    }

    const data = JSON.parse(dataString);

    if (data.source === 'setlist') {
        // Reordenamiento de un elemento existente en el setlist.
        // El DOM ya está en el orden visual correcto gracias a 'dragover'.
        // Ahora, sincronizamos el array 'setlist' para que coincida con el DOM.
        const newOrderedSetlist = [];
        const finalNodes = setlistContenedor.querySelectorAll('.item-setlist');
        
        finalNodes.forEach(node => {
            const originalIndex = parseInt(node.dataset.index, 10);
            newOrderedSetlist.push(setlist[originalIndex]);
        });
        setlist = newOrderedSetlist;

    } else if (data.source === 'catalog') {
        // Añadir una nueva canción desde el catálogo.
        const newSong = { type: 'song', nombre: data.nombre, observacion: '' };
        const afterElement = getDragAfterElement(setlistContenedor, e.clientY);
        const allElements = [...setlistContenedor.querySelectorAll('.item-setlist')];
        const insertAtIndex = afterElement ? allElements.indexOf(afterElement) : allElements.length;
        
        setlist.splice(insertAtIndex, 0, newSong);
    }

    commitState();
    // Volvemos a renderizar todo para asegurarnos de que los 'data-index' y los listeners
    // estén actualizados y limpios para la próxima interacción.
    renderizarSetlist();
});

if (subirFondo) {
  subirFondo.onchange = (e) => {
    if (!e.target.files || !e.target.files[0]) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target.result;
      fondosPersonalizados.push(imgDataUrl);
      localStorage.setItem(
        'fondosPersonalizados',
        JSON.stringify(fondosPersonalizados)
      );

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
    // No arrastrar si se hace clic en un item de canción (para permitir reordenar) o en un botón de control.
    if (e.target.closest('.item-setlist')) {
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
        transform: element.style.transform,
      };
      localStorage.setItem(storageKey, JSON.stringify(position));
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function initializeAppState() {
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
    const activeComplements = JSON.parse(localStorage.getItem('activeComplements')) || [];
    activeComplements.forEach(comp => displayComplemento(comp));
}
function setupSceneControls() {
  const panelControlesDerecha = document.querySelector('.panel-controles-derecha');
  const panelEscenas = document.createElement('div');
  panelEscenas.className = 'panel-escenas';
  panelEscenas.innerHTML = `
    <h2 class="subtitulo-controles">Escenas</h2>
    <div class="grupo-escena-acciones">
        <button id="btn-nueva-escena" class="btn-neon btn-escena">Nuevo</button>
        <button id="btn-cargar-escena" class="btn-neon btn-escena">Cargar</button>
        <button id="btn-borrar-escena" class="btn-neon btn-escena btn-limpiar">Borrar</button>
    </div>
    <div class="grupo-escena-selector">
        <select id="selector-escena" class="input-escena" title="Seleccionar una escena guardada"></select>
    </div>
    <hr class="escena-divisor">
    <div class="grupo-escena-guardar">
        <input type="text" id="input-nombre-escena" placeholder="Guardar escena actual como..." class="input-escena">
        <button id="btn-guardar-escena" class="btn-neon btn-escena">Guardar</button>
    </div>
  `;
  panelControlesDerecha.appendChild(panelEscenas);

  const btnNuevaEscena = panelEscenas.querySelector('#btn-nueva-escena');
  const selectorEscena = panelEscenas.querySelector('#selector-escena');
  const btnCargarEscena = panelEscenas.querySelector('#btn-cargar-escena');
  const inputNombreEscena = panelEscenas.querySelector('#input-nombre-escena');
  const btnGuardarEscena = panelEscenas.querySelector('#btn-guardar-escena');
  const btnBorrarEscena = panelEscenas.querySelector('#btn-borrar-escena');

  const SCENES_KEY = 'setlistStudio_scenes';
  const KEYS_TO_SAVE = [
      'setlistData', 'setlistActivo', 'setlistAlignment', 'colorEvento',
      'colorFecha', 'fondoElegido', 'nombreEvento', 'fechaShow', 'titleBoxPosition', 'dateBoxPosition', 'songBlockPosition', 'activeComplements',
      'fondosPersonalizados', 'complementosPersonalizados'
  ];

  function getScenes() {
      return JSON.parse(localStorage.getItem(SCENES_KEY)) || {};
  }

  function populateScenesDropdown() {
      const scenes = getScenes();
      const sceneNames = Object.keys(scenes).sort();
      selectorEscena.innerHTML = '<option value="">-- Seleccionar escena --</option>';
      sceneNames.forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          selectorEscena.appendChild(option);
      });
  }

  selectorEscena.addEventListener('change', () => {
      const sceneName = selectorEscena.value;
      if (sceneName) {
          inputNombreEscena.value = sceneName;
      }
  });

  btnNuevaEscena.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres empezar una nueva sesión? Se perderán todos los cambios no guardados.')) {
        // Limpia todos los datos de la sesión actual del localStorage
        KEYS_TO_SAVE.forEach(key => {
            localStorage.removeItem(key);
        });
        window.location.reload();
    }
  });

  btnGuardarEscena.addEventListener('click', () => {
      const sceneName = inputNombreEscena.value.trim();
      if (!sceneName) {
          alert('Por favor, introduce un nombre para la escena.');
          return;
      }
      const scenes = getScenes();
      if (scenes[sceneName] && !confirm(`Ya existe una escena llamada "${sceneName}". ¿Quieres sobrescribirla?`)) {
          return;
      }
      const sceneData = {};
      KEYS_TO_SAVE.forEach(key => {
          const value = localStorage.getItem(key);
          if (value !== null) sceneData[key] = value;
      });
      scenes[sceneName] = sceneData;
      localStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
      alert(`Escena "${sceneName}" guardada.`);
      inputNombreEscena.value = '';
      populateScenesDropdown();
      selectorEscena.value = sceneName;
  });

  btnCargarEscena.addEventListener('click', () => {
      const sceneName = selectorEscena.value;
      if (!sceneName) return;
      if (!confirm(`¿Seguro que quieres cargar la escena "${sceneName}"? Se perderán los cambios no guardados.`)) return;
      const scenes = getScenes();
      const sceneData = scenes[sceneName];
      if (sceneData) {
          KEYS_TO_SAVE.forEach(key => localStorage.removeItem(key));
          for (const key in sceneData) localStorage.setItem(key, sceneData[key]);
          window.location.reload();
      }
  });

  btnBorrarEscena.addEventListener('click', () => {
      const sceneName = selectorEscena.value;
      if (!sceneName) return;
      if (!confirm(`¿Estás seguro de que quieres borrar la escena "${sceneName}"?`)) return;
      const scenes = getScenes();
      delete scenes[sceneName];
      localStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
      alert(`Escena "${sceneName}" borrada.`);
      populateScenesDropdown();
  });

  populateScenesDropdown();
}

function setupAlignmentControls() {
  const panelControlesDerecha = document.querySelector('.panel-controles-derecha');
  
  // --- Lógica de Alineación del Setlist ---
  const grupoAlineacion = document.createElement('div');
  grupoAlineacion.className = 'grupo-alineacion';

  const alignments = {
    left: 'Izquierda',
    center: 'Centro',
    right: 'Derecha'
  };

  Object.entries(alignments).forEach(([align, text]) => {
    const btn = document.createElement('button');
    btn.id = `btn-align-${align}`;
    btn.className = 'btn-align';
    btn.title = `Alinear ${text.toLowerCase()}`;
    btn.dataset.align = align;
    btn.textContent = text;
    grupoAlineacion.appendChild(btn);
  });
  
  panelControlesDerecha.appendChild(grupoAlineacion);
  
  function aplicarAlineacion(alineacion) {
    setlistAlignment = alineacion;
    localStorage.setItem('setlistAlignment', setlistAlignment);
    setlistContenedor.classList.remove('align-left', 'align-center', 'align-right');
    setlistContenedor.classList.add(`align-${setlistAlignment}`);
    document.querySelectorAll('.btn-align').forEach(btn => {
      btn.classList.toggle('activo', btn.dataset.align === setlistAlignment);
    });
  }
  
  grupoAlineacion.addEventListener('click', (e) => {
    if (e.target.matches('.btn-align')) {
      aplicarAlineacion(e.target.dataset.align);
    }
  });
  
  // Aplicar alineación guardada al cargar
  aplicarAlineacion(setlistAlignment);
}

function renderizarComplementos() {
    const galeriaComplementos = document.getElementById('galeria-complementos');
    if (!galeriaComplementos) return;
    galeriaComplementos.innerHTML = '';

    const complementos = JSON.parse(localStorage.getItem('complementosPersonalizados')) || [];

    if (complementos.length === 0) {
        galeriaComplementos.classList.add('vacia');
        galeriaComplementos.innerHTML = '<span class="galeria-placeholder">Sube un complemento para añadirlo a la galería.</span>';
        return;
    }
    galeriaComplementos.classList.remove('vacia');

    complementos.forEach((complemento, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'complemento-galeria-thumbnail';
        thumbnail.style.backgroundImage = `url('${complemento.thumb}')`;
        thumbnail.dataset.complemento = complemento.full;
        thumbnail.title = `Complemento Personalizado ${index + 1}`;

        thumbnail.onclick = () => addComplemento(complemento.full);

        const btnBorrar = document.createElement('span');
        btnBorrar.className = 'btn-borrar-complemento-galeria';
        btnBorrar.innerHTML = '×';
        btnBorrar.onclick = (e) => {
            e.stopPropagation();
            if (confirm('¿Seguro que quieres eliminar este complemento de la galería?')) {
                const currentComplementos = JSON.parse(localStorage.getItem('complementosPersonalizados')) || [];
                currentComplementos.splice(index, 1);
                localStorage.setItem('complementosPersonalizados', JSON.stringify(currentComplementos));
                
                // Remove all instances of this complement from the canvas
                const activeComplements = JSON.parse(localStorage.getItem('activeComplements')) || [];
                const complementsToRemove = activeComplements.filter(c => c.src === complemento.full);
                complementsToRemove.forEach(c => removeComplemento(c.id));

                renderizarComplementos();
            }
        };

        thumbnail.appendChild(btnBorrar);
        galeriaComplementos.appendChild(thumbnail);
    });
}

function setupComplementosControls() {
    const panelControlesDerecha = document.querySelector('.panel-controles-derecha');
    const complementosControlsContainer = document.createElement('div');
    complementosControlsContainer.className = 'grupo-acciones-complemento';

    const galeriaComplementos = document.createElement('div');
    galeriaComplementos.id = 'galeria-complementos';
    galeriaComplementos.className = 'galeria-complementos-horizontal';

    const inputSubirComplemento = document.createElement('input');
    inputSubirComplemento.type = 'file';
    inputSubirComplemento.id = 'input-subir-complemento';
    inputSubirComplemento.accept = 'image/*';
    inputSubirComplemento.style.display = 'none';

    const btnSubirComplemento = document.createElement('button');
    btnSubirComplemento.id = 'btn-subir-complemento';
    btnSubirComplemento.className = 'btn-neon';
    btnSubirComplemento.textContent = 'Subir Complemento';


    complementosControlsContainer.appendChild(galeriaComplementos);
    complementosControlsContainer.appendChild(inputSubirComplemento);
    complementosControlsContainer.appendChild(btnSubirComplemento);
    panelControlesDerecha.appendChild(complementosControlsContainer);

    btnSubirComplemento.addEventListener('click', () => inputSubirComplemento.click());

    inputSubirComplemento.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        btnSubirComplemento.textContent = 'Procesando...';
        btnSubirComplemento.disabled = true;

        try {
            const [fullUrl, thumbUrl] = await Promise.all([
                resizeImage(file, 1024, 1024),
                resizeImage(file, 120, 120)
            ]);

            let complementos = JSON.parse(localStorage.getItem('complementosPersonalizados')) || [];
            
            if (!complementos.some(c => c.thumb === thumbUrl)) {
                complementos.push({ full: fullUrl, thumb: thumbUrl });
                localStorage.setItem('complementosPersonalizados', JSON.stringify(complementos));
                renderizarComplementos();
            }

            addComplemento(fullUrl);

        } catch (error) {
            console.error("Error al procesar la imagen:", error);
            alert("Hubo un error al procesar la imagen. Inténtalo con otra.");
        } finally {
            e.target.value = '';
            btnSubirComplemento.textContent = 'Subir Complemento';
            btnSubirComplemento.disabled = false;
        }
    });

    // Renderizar logos al iniciar
    renderizarComplementos();
}

function addComplemento(src) {
    const activeComplements = JSON.parse(localStorage.getItem('activeComplements')) || [];
    const newComplement = {
        id: `complemento-${Date.now()}`,
        src: src,
        top: '100px',
        left: '100px',
        width: '150px'
    };
    activeComplements.push(newComplement);
    localStorage.setItem('activeComplements', JSON.stringify(activeComplements));
    displayComplemento(newComplement);
}

function displayComplemento(state) {
    const complementoContainer = document.createElement('div');
    complementoContainer.id = state.id;
    complementoContainer.className = 'complemento-container';
    complementoContainer.innerHTML = `
            <span class="btn-borrar-complemento">×</span>
            <img src="" alt="Complemento">
            <div class="resize-handle"></div>
        `;
    lienzo.appendChild(complementoContainer);

    const complementoImg = complementoContainer.querySelector('img');
    complementoImg.src = state.src;

    complementoContainer.style.top = state.top || '100px';
    complementoContainer.style.left = state.left || '100px';
    complementoContainer.style.width = state.width || '150px';

    complementoContainer.querySelector('.btn-borrar-complemento').addEventListener('click', (e) => {
        e.stopPropagation();
        removeComplemento(state.id);
    });

    makeComplementoInteractive(complementoContainer);
}

function removeComplemento(complementoId) {
    const activeComplements = JSON.parse(localStorage.getItem('activeComplements')) || [];
    const updatedComplements = activeComplements.filter(c => c.id !== complementoId);
    localStorage.setItem('activeComplements', JSON.stringify(updatedComplements));

    const complementoContainer = document.getElementById(complementoId);
    if (complementoContainer) {
        complementoContainer.remove();
    }
}

function saveComplementoState(element) {
    const complementoId = element.id;
    const activeComplements = JSON.parse(localStorage.getItem('activeComplements')) || [];
    const complementIndex = activeComplements.findIndex(c => c.id === complementoId);
    if (complementIndex > -1) {
        activeComplements[complementIndex].top = element.style.top;
        activeComplements[complementIndex].left = element.style.left;
        activeComplements[complementIndex].width = element.style.width;
        localStorage.setItem('activeComplements', JSON.stringify(activeComplements));
    }
}

function makeComplementoInteractive(element) {
    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle') || e.button !== 0) return;
        e.preventDefault();
        const lienzoRect = lienzo.getBoundingClientRect();
        const offsetX = e.clientX - element.getBoundingClientRect().left;
        const offsetY = e.clientY - element.getBoundingClientRect().top;

        function onMouseMove(moveEvent) {
            let newX = moveEvent.clientX - lienzoRect.left - offsetX;
            let newY = moveEvent.clientY - lienzoRect.top - offsetY;
            newX = Math.max(0, Math.min(newX, lienzoRect.width - element.offsetWidth));
            newY = Math.max(0, Math.min(newY, lienzoRect.height - element.offsetHeight));
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveComplementoState(element);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    const resizeHandle = element.querySelector('.resize-handle');
    resizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);

        function onMouseMove(moveEvent) {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            if (newWidth > 20) {
                element.style.width = `${newWidth}px`;
            }
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveComplementoState(element);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function setupDraggableUI() {
    makeDraggable(displayTituloContainer, 'titleBoxPosition', { top: '40px', left: '50%', transform: 'translateX(-50%)' });
  makeDraggable(displayFechaContainer, 'dateBoxPosition', {
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
  });
  makeVerticallyDraggable(setlistContenedor, 'songBlockPosition', {
    top: '120px',
  });
}

function registerServiceWorker() {
    // --- Registro del Service Worker para funcionalidad Offline ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registrado con éxito:', registration);
        })
        .catch(err => {
          console.log('Fallo en el registro del ServiceWorker:', err);
        });
    });
  }
}

function setupHistory() {
    btnUndo.onclick = undo;
    btnRedo.onclick = redo;
    saveState();
    updateUndoRedoUI();
}

// --- Carga Inicial al Abrir la App ---
function init() {
    const contenedorPrincipal = document.querySelector('.contenedor-principal');
    const panelControlesDerecha = document.createElement('div');
    panelControlesDerecha.className = 'panel-controles-derecha';

    // Adjuntar el panel de la derecha al DOM principal
    contenedorPrincipal.appendChild(panelControlesDerecha);

    initializeAppState();
    setupSceneControls();

    // Añadir separadores y títulos para organizar el panel
    panelControlesDerecha.appendChild(Object.assign(document.createElement('hr'), { className: 'panel-divisor' }));

    btnLimpiarSetlist.textContent = 'Limpiar Setlist';
    panelControlesDerecha.appendChild(btnLimpiarSetlist);

    panelControlesDerecha.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Alinear', className: 'subtitulo-controles' }));
    
    setupAlignmentControls();

    panelControlesDerecha.appendChild(Object.assign(document.createElement('hr'), { className: 'panel-divisor' }));
    panelControlesDerecha.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Complementos', className: 'subtitulo-controles' }));
    setupComplementosControls();

    // Mover la sección de fondos al panel derecho
    const controlesFondo = document.querySelector('.controles-fondo');
    const tituloFondos = document.querySelector('.titulo-fondos'); // Asumiendo que el título tiene esta clase
    if (controlesFondo) {
        panelControlesDerecha.appendChild(Object.assign(document.createElement('hr'), { className: 'panel-divisor' }));
        if (tituloFondos) {
            panelControlesDerecha.appendChild(tituloFondos);
        } else {
            panelControlesDerecha.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Fondos', className: 'subtitulo-controles' }));
        }
        panelControlesDerecha.appendChild(controlesFondo);
    }
    setupDraggableUI();
    setupHistory();
    registerServiceWorker();
}

window.onload = init;
