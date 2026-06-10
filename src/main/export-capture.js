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

  if (platform === 'win32') {
    return {
      outputWidth,
      outputHeight,
      viewportWidth: outputWidth,
      viewportHeight: outputHeight,
      pageScale: outputWidth / PAGE_WIDTH,
      fitScale: 1,
      useOffscreen: true,
    };
  }

  return {
    outputWidth,
    outputHeight,
    viewportWidth: outputWidth,
    viewportHeight: outputHeight,
    pageScale: outputWidth / PAGE_WIDTH,
    fitScale: 1,
    useOffscreen: false,
  };
}

module.exports = {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  DEFAULT_EXPORT_WIDTH,
  DEFAULT_EXPORT_HEIGHT,
  resolveCaptureLayout,
};
