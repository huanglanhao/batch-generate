const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('applicationFormApi', {
  getAppMeta: () => ipcRenderer.invoke('app:get-meta'),
  downloadImportTemplate: () => ipcRenderer.invoke('template:download-import'),
  selectExcelFile: () => ipcRenderer.invoke('dialog:select-excel'),
  selectStampFile: () => ipcRenderer.invoke('dialog:select-stamp'),
  selectOutputDir: () => ipcRenderer.invoke('dialog:select-output-dir'),
  parseWorkbook: (filePath) => ipcRenderer.invoke('workbook:parse', filePath),
  readImageAsDataUrl: (filePath) => ipcRenderer.invoke('asset:read-image-data-url', filePath),
  saveGeneratedStampImage: (payload) => ipcRenderer.invoke('asset:save-generated-stamp-image', payload),
  writeExportImages: (payload) => ipcRenderer.invoke('exports:write-images', payload),
  capturePreviewPage: (payload) => ipcRenderer.invoke('exports:capture-preview-page', payload),
  getExportCapturePayload: (token) => ipcRenderer.invoke('exports:get-capture-payload', token),
  finishExportCapture: (payload) => ipcRenderer.invoke('exports:finish-capture', payload),
  failExportCapture: (payload) => ipcRenderer.invoke('exports:fail-capture', payload),
  captureCurrentWindowRegion: (payload) => ipcRenderer.invoke('window:capture-current-region', payload),
  loadConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (payload) => ipcRenderer.invoke('config:save', payload),
  pushExportHistory: (payload) => ipcRenderer.invoke('exports:push-history', payload),
  openPath: (targetPath) => ipcRenderer.invoke('shell:open-path', targetPath),
});
