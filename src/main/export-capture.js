const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const DEFAULT_EXPORT_WIDTH = 2480;
const DEFAULT_EXPORT_HEIGHT = 3508;
const WINDOWS_PNG_SUPERSAMPLE_SCALE = 2;
const WINDOWS_JPG_SUPERSAMPLE_SCALE = 1.5;

function normalizeDimension(value, fallback, minValue) {
  return Math.max(minValue, Math.round(Number(value) || fallback));
}

function resolveCaptureLayout(exportSettings = {}, platform = process.platform, workAreaSize = {}) {
  const outputWidth = normalizeDimension(exportSettings.width, DEFAULT_EXPORT_WIDTH, PAGE_WIDTH);
  const outputHeight = normalizeDimension(exportSettings.height, DEFAULT_EXPORT_HEIGHT, PAGE_HEIGHT);
  const normalizedFormat = String(exportSettings.format || 'png').trim().toLowerCase();

  if (platform === 'win32') {
    const supersampleScale = normalizedFormat === 'png' ? WINDOWS_PNG_SUPERSAMPLE_SCALE : WINDOWS_JPG_SUPERSAMPLE_SCALE;
    const availableWidth = Math.max(1, Math.round(Number(workAreaSize?.width) || 0));
    const availableHeight = Math.max(1, Math.round(Number(workAreaSize?.height) || 0));
    const renderWidth = Math.max(outputWidth, Math.round(outputWidth * supersampleScale));
    const renderHeight = Math.max(outputHeight, Math.round(outputHeight * supersampleScale));
    const viewportWidth = Math.min(renderWidth, availableWidth);
    const viewportHeight = Math.min(renderHeight, availableHeight);
    return {
      outputWidth,
      outputHeight,
      renderWidth,
      renderHeight,
      viewportWidth,
      viewportHeight,
      pageScale: renderWidth / PAGE_WIDTH,
      fitScale: 1,
      useOffscreen: false,
      renderScale: renderWidth / outputWidth,
      useTiledCapture: renderWidth > viewportWidth || renderHeight > viewportHeight,
      tileColumns: Math.max(1, Math.ceil(renderWidth / viewportWidth)),
      tileRows: Math.max(1, Math.ceil(renderHeight / viewportHeight)),
    };
  }

  return {
    outputWidth,
    outputHeight,
    renderWidth: outputWidth,
    renderHeight: outputHeight,
    viewportWidth: outputWidth,
    viewportHeight: outputHeight,
    pageScale: outputWidth / PAGE_WIDTH,
    fitScale: 1,
    useOffscreen: false,
    renderScale: 1,
    useTiledCapture: false,
    tileColumns: 1,
    tileRows: 1,
  };
}

module.exports = {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  DEFAULT_EXPORT_WIDTH,
  DEFAULT_EXPORT_HEIGHT,
  WINDOWS_PNG_SUPERSAMPLE_SCALE,
  WINDOWS_JPG_SUPERSAMPLE_SCALE,
  resolveCaptureLayout,
};
