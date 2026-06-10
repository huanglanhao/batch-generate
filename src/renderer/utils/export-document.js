import { buildRichTextDataUrl } from './rich-text';
import { getScaledStampRect } from './stamp-layout';

const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;
const PAGE_EDITOR_BOX = {
  x: 0,
  y: 0,
  width: SHEET_WIDTH,
  height: SHEET_HEIGHT,
};

function scaleBox(box, scaleX, scaleY = scaleX) {
  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  };
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function drawStampBoxBorder(ctx, box) {
  const borderWidth = 2;
  const left = box.x + borderWidth / 2;
  const top = box.y + borderWidth / 2;
  const right = box.x + box.width - borderWidth / 2;
  const bottom = box.y + box.height - borderWidth / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = borderWidth;

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.moveTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.setLineDash([16, 8]);
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.moveTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.restore();
}

function normalizeExportFormat(format = 'png') {
  return String(format || '').trim().toLowerCase() === 'jpg' ? 'jpeg' : 'png';
}

function normalizeJpegQuality(quality = 100) {
  const normalized = Math.max(0, Math.min(100, Math.round(Number(quality) || 100)));
  return normalized / 100;
}

export async function renderDocumentPageToDataUrl({
  pageName,
  pageNumber = 1,
  template,
  stamp,
  format = 'png',
  width = 2480,
  height = 3508,
  jpegQuality = 100,
}) {
  const exportWidth = Math.max(SHEET_WIDTH, Math.round(Number(width) || 2480));
  const exportHeight = Math.max(SHEET_HEIGHT, Math.round(Number(height) || 3508));
  const scaleX = exportWidth / SHEET_WIDTH;
  const scaleY = exportHeight / SHEET_HEIGHT;
  const renderScale = scaleX;
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = exportWidth;
  exportCanvas.height = exportHeight;

  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.fillStyle = '#ffffff';
  exportCtx.fillRect(0, 0, exportWidth, exportHeight);

  const richTextImage = await loadImage(
    buildRichTextDataUrl({
      contentHtml: template.contentHtml,
      pageName,
      box: PAGE_EDITOR_BOX,
      defaultFontFamily: template.fontFamily,
      defaultFontSize: template.fontSize,
      defaultTextColor: template.textColor,
      renderScale,
    }),
  );
  exportCtx.imageSmoothingEnabled = true;
  exportCtx.imageSmoothingQuality = 'high';
  exportCtx.drawImage(richTextImage, 0, 0, exportWidth, exportHeight);

  const scaledStampBox = scaleBox(stamp.box, scaleX, scaleY);
  drawStampBoxBorder(exportCtx, scaledStampBox);

  if (stamp.previewUrl) {
    const stampImage = await loadImage(stamp.previewUrl);
    const drawRect = getScaledStampRect(scaledStampBox, stampImage, {
      randomizePosition: Boolean(stamp.randomizePosition),
      seed: `${pageName || 'page'}:${pageNumber}:${stamp.randomSeedNonce || 0}`,
    });
    exportCtx.drawImage(stampImage, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
  }

  const normalizedFormat = normalizeExportFormat(format);
  if (normalizedFormat === 'png') {
    return exportCanvas.toDataURL('image/png');
  }
  return exportCanvas.toDataURL('image/jpeg', normalizeJpegQuality(jpegQuality));
}
