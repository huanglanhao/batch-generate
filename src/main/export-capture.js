const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const DEFAULT_EXPORT_WIDTH = 2480;
const DEFAULT_EXPORT_HEIGHT = 3508;

function normalizeDimension(value, fallback, minValue) {
  return Math.max(minValue, Math.round(Number(value) || fallback));
}

function resolveCaptureLayout(exportSettings = {}, platform = process.platform, workAreaSize = {}) {
  const outputWidth = normalizeDimension(exportSettings.width, DEFAULT_EXPORT_WIDTH, PAGE_WIDTH);
  const outputHeight = normalizeDimension(exportSettings.height, DEFAULT_EXPORT_HEIGHT, PAGE_HEIGHT);

  let fitScale = 1;
  if (platform === 'win32') {
    const availableWidth = Math.max(1, Math.round(Number(workAreaSize?.width) || 0));
    const availableHeight = Math.max(1, Math.round(Number(workAreaSize?.height) || 0));
    if (availableWidth > 0 && availableHeight > 0) {
      fitScale = Math.min(1, availableWidth / outputWidth, availableHeight / outputHeight);
    }
  }

  const viewportWidth = Math.max(1, Math.round(outputWidth * fitScale));
  const viewportHeight = Math.max(1, Math.round(outputHeight * fitScale));

  return {
    outputWidth,
    outputHeight,
    viewportWidth,
    viewportHeight,
    pageScale: (outputWidth / PAGE_WIDTH) * fitScale,
    fitScale,
  };
}

module.exports = {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  DEFAULT_EXPORT_WIDTH,
  DEFAULT_EXPORT_HEIGHT,
  resolveCaptureLayout,
};
