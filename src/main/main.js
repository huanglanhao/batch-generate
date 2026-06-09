const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const XLSX = require('xlsx');

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);
const IMPORT_TEMPLATE_FILE_NAME = 'template_name.xlsx';

// 开发环境把 Electron/Chromium 运行时目录放到项目内，避免当前环境对
// ~/Library/Application Support 的写入限制；生产环境继续使用标准的 ASCII 目录名。
const runtimeDataRoot = isDevelopment
  ? path.join(app.getAppPath(), '.runtime-data', 'user-data')
  : path.join(app.getPath('appData'), 'pdd-application-form');
fs.mkdirSync(runtimeDataRoot, { recursive: true });
app.setPath('userData', runtimeDataRoot);

if (isDevelopment) {
  app.commandLine.appendSwitch('no-sandbox');
}

const { getConfig, saveConfig, pushExportHistory } = require('./store');
const exportCaptureSessions = new Map();

function normalizeName(value) {
  return String(value || '').trim();
}

function getImageMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

function resolveImportTemplatePath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'templates', IMPORT_TEMPLATE_FILE_NAME)
    : path.join(app.getAppPath(), 'resources', 'templates', IMPORT_TEMPLATE_FILE_NAME);
}

async function readImageAsDataUrl(filePath) {
  if (!filePath) return null;
  const buffer = await fs.promises.readFile(filePath);
  const mimeType = getImageMimeType(filePath);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function downloadImportTemplate() {
  const sourcePath = resolveImportTemplatePath();
  await fs.promises.access(sourcePath, fs.constants.R_OK);
  const result = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('downloads'), IMPORT_TEMPLATE_FILE_NAME),
    filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }],
  });
  if (result.canceled || !result.filePath) return null;
  await fs.promises.copyFile(sourcePath, result.filePath);
  return result.filePath;
}

async function writeExportImages(payload = {}) {
  const outputDir = payload.outputDir;
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!outputDir) {
    throw new Error('缺少导出目录');
  }
  await fs.promises.mkdir(outputDir, { recursive: true });
  const writtenFiles = [];
  for (const item of items) {
    if (!item?.fileName || !item?.dataUrl) continue;
    const targetPath = path.join(outputDir, item.fileName);
    const base64 = String(item.dataUrl).replace(/^data:image\/jpeg;base64,/, '');
    await fs.promises.writeFile(targetPath, Buffer.from(base64, 'base64'));
    writtenFiles.push(targetPath);
  }
  return {
    outputDir,
    files: writtenFiles,
  };
}

function parseWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = (rows[0] || []).map((item) => normalizeName(item));
  const fallbackIndex = headers.findIndex(Boolean) >= 0 ? headers.findIndex(Boolean) : 0;
  const templateNameIndex = headers.findIndex((item) => ['template_name', 'Template_Name', 'TEMPLATE_NAME'].includes(item));
  const nameColumnIndex = headers.findIndex((item) => ['姓名', '名字', 'name', 'Name'].includes(item));
  const targetIndex = templateNameIndex >= 0 ? templateNameIndex : (nameColumnIndex >= 0 ? nameColumnIndex : fallbackIndex);
  const records = rows
    .slice(1)
    .map((row, index) => ({
      rowIndex: index + 2,
      name: normalizeName(row[targetIndex]),
    }))
    .filter((item) => item.name);

  return {
    filePath,
    sheetName: firstSheetName,
    headers,
    nameColumnIndex: targetIndex,
    matchedColumnName: headers[targetIndex] || '',
    totalRows: rows.length > 0 ? rows.length - 1 : 0,
    records,
  };
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1280,
    minHeight: 820,
    backgroundColor: '#eef3fb',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDevelopment) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await window.loadFile(path.join(__dirname, '../../dist/index.html'));
}

async function loadRendererRoute(window, routePath) {
  if (isDevelopment) {
    await window.loadURL(`${process.env.VITE_DEV_SERVER_URL}#${routePath}`);
    return;
  }

  await window.loadFile(path.join(__dirname, '../../dist/index.html'), {
    hash: routePath,
  });
}

async function createExportCaptureWindow(token) {
  const window = new BrowserWindow({
    show: false,
    width: 794,
    height: 1123,
    useContentSize: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    backgroundColor: '#ffffff',
    paintWhenInitiallyHidden: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await loadRendererRoute(window, `/capture-export?token=${encodeURIComponent(token)}`);
  return window;
}

app.whenReady().then(async () => {
  ipcMain.handle('app:get-meta', () => ({
    version: app.getVersion(),
    isDevelopment,
  }));

  ipcMain.handle('dialog:select-excel', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel 文件', extensions: ['xlsx', 'xls', 'csv'] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:select-stamp', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:select-output-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('template:download-import', async () => downloadImportTemplate());
  ipcMain.handle('workbook:parse', async (_, filePath) => parseWorkbook(filePath));
  ipcMain.handle('asset:read-image-data-url', async (_, filePath) => readImageAsDataUrl(filePath));
  ipcMain.handle('exports:write-images', async (_, payload) => writeExportImages(payload));
  ipcMain.handle('exports:capture-preview-page', async (_, payload) => {
    const token = randomUUID();
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        const session = exportCaptureSessions.get(token);
        exportCaptureSessions.delete(token);
        session?.window?.destroy();
        reject(new Error('导出预览截图超时'));
      }, 20000);

      try {
        exportCaptureSessions.set(token, {
          payload,
          resolve: (dataUrl) => {
            clearTimeout(timeout);
            resolve(dataUrl);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
          window: null,
        });

        const captureWindow = await createExportCaptureWindow(token);
        const session = exportCaptureSessions.get(token);
        if (!session) {
          captureWindow.destroy();
          reject(new Error('导出会话已失效'));
          return;
        }

        session.window = captureWindow;
        captureWindow.on('closed', () => {
          const activeSession = exportCaptureSessions.get(token);
          if (!activeSession) return;
          exportCaptureSessions.delete(token);
          activeSession.reject(new Error('导出截图窗口已关闭'));
        });
      } catch (error) {
        clearTimeout(timeout);
        exportCaptureSessions.delete(token);
        reject(error);
      }
    });
  });
  ipcMain.handle('exports:get-capture-payload', (_, token) => {
    return exportCaptureSessions.get(token)?.payload || null;
  });
  ipcMain.handle('exports:finish-capture', async (_, payload = {}) => {
    const session = exportCaptureSessions.get(payload.token);
    if (!session) return false;
    exportCaptureSessions.delete(payload.token);
    session.resolve(payload.dataUrl || '');
    session.window?.destroy();
    return true;
  });
  ipcMain.handle('exports:fail-capture', async (_, payload = {}) => {
    const session = exportCaptureSessions.get(payload.token);
    if (!session) return false;
    exportCaptureSessions.delete(payload.token);
    session.reject(new Error(payload.error || '导出截图失败'));
    session.window?.destroy();
    return true;
  });
  ipcMain.handle('window:capture-current-region', async (event, payload = {}) => {
    const rect = payload.rect || {};
    const x = Math.max(0, Math.round(Number(rect.x) || 0));
    const y = Math.max(0, Math.round(Number(rect.y) || 0));
    const width = Math.max(1, Math.round(Number(rect.width) || 0));
    const height = Math.max(1, Math.round(Number(rect.height) || 0));
    const quality = Math.max(0, Math.min(100, Math.round(Number(payload.quality) || 100)));
    const image = await event.sender.capturePage({ x, y, width, height });
    return `data:image/jpeg;base64,${image.toJPEG(quality).toString('base64')}`;
  });
  ipcMain.handle('config:get', () => getConfig());
  ipcMain.handle('config:save', (_, payload) => saveConfig(payload));
  ipcMain.handle('exports:push-history', (_, payload) => pushExportHistory(payload));
  ipcMain.handle('shell:open-path', async (_, targetPath) => shell.openPath(targetPath));

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
