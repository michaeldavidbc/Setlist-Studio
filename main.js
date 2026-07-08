const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

function createWindow() {
  // Crea la ventana del navegador.
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Habilitar contextIsolation es crucial para la seguridad y para que el preload script funcione correctamente.
      contextIsolation: true,
    },
  });

  // y carga el index.html de la aplicación.
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:open-excel-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }],
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

ipcMain.handle('excel:read-file', (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const workbook = XLSX.read(data, { type: 'buffer' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rows.length > 0 && typeof rows[0][0] === 'string' && rows[0][0].toLowerCase().includes('nombre')) {
      rows.shift();
    }

    const nuevasCanciones = rows
      .map((row) => {
        const nombreCancion = row[0] ? row[0].toString().trim() : null;
        if (!nombreCancion) return null;

        const esFavorito = row[1] ? row[1].toString().trim() === '*' : false;
        return { nombre: nombreCancion.toUpperCase(), favorito: esFavorito };
      })
      .filter(Boolean);

    return nuevasCanciones;
  } catch (error) {
    console.error('Error al leer el archivo en el proceso principal:', error);
    throw error;
  }
});

ipcMain.handle('excel:save-file', async (event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar Catálogo de Canciones',
    defaultPath: 'catalogo_canciones_actualizado.xlsx',
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
  });

  if (canceled || !filePath) {
    return { success: false, message: 'Guardado cancelado.' };
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{ wch: 40 }, { wch: 10 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');
  XLSX.writeFile(workbook, filePath);
  return { success: true, message: 'Archivo guardado correctamente.' };
});