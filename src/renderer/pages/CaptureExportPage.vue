<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DocumentPreviewCard from '../components/DocumentPreviewCard.vue';

const route = useRoute();
const previewCardRef = ref(null);
const captureViewportRef = ref(null);
const payload = ref(null);
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const captureSettings = computed(() => payload.value?.captureSettings || null);
const currentTileOffset = ref({ x: 0, y: 0 });
const enhanceTextForCapture = computed(() => Boolean(captureSettings.value?.enhanceTextForCapture));

const outputWidth = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.outputWidth) || Number(payload.value?.exportSettings?.width) || PAGE_WIDTH)));
const outputHeight = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.outputHeight) || Number(payload.value?.exportSettings?.height) || PAGE_HEIGHT)));
const renderWidth = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.renderWidth) || outputWidth.value)));
const renderHeight = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.renderHeight) || outputHeight.value)));
const viewportWidth = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.viewportWidth) || outputWidth.value)));
const viewportHeight = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.viewportHeight) || outputHeight.value)));
const renderScale = computed(() => Math.max(1, Number(captureSettings.value?.renderScale) || (renderWidth.value / outputWidth.value)));
const useTiledCapture = computed(() => Boolean(captureSettings.value?.useTiledCapture));
const tileColumns = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.tileColumns) || 1)));
const tileRows = computed(() => Math.max(1, Math.round(Number(captureSettings.value?.tileRows) || 1)));

const exportScale = computed(() => {
  if (captureSettings.value?.pageScale) {
    return Math.max(0.01, Number(captureSettings.value.pageScale) || 1);
  }
  const width = Math.max(PAGE_WIDTH, Math.round(Number(payload.value?.exportSettings?.width) || PAGE_WIDTH));
  return width / PAGE_WIDTH;
});

const captureRootStyle = computed(() => ({
  width: `${viewportWidth.value}px`,
  height: `${viewportHeight.value}px`,
}));

const captureStageStyle = computed(() => ({
  transform: `translate(${-currentTileOffset.value.x}px, ${-currentTileOffset.value.y}px)`,
}));

function strengthenCaptureTextColor(value) {
  const normalized = String(value || '').trim();
  if (/^#([0-9a-f]{6})$/i.test(normalized)) {
    return '#000000';
  }
  return normalized;
}

const captureTemplate = computed(() => {
  if (!payload.value?.template) return null;
  if (!enhanceTextForCapture.value) return payload.value.template;
  return {
    ...payload.value.template,
    textColor: strengthenCaptureTextColor(payload.value.template.textColor),
  };
});

function normalizeJpegQuality(quality = 100) {
  const normalized = Math.max(0, Math.min(100, Math.round(Number(quality) || 100)));
  return normalized / 100;
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function getCaptureViewportBounds() {
  const rect = captureViewportRef.value?.getBoundingClientRect();
  if (!rect) return null;
  return {
    x: Math.round(rect.left + window.scrollX),
    y: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

async function waitForCaptureReady() {
  await nextTick();
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await previewCardRef.value?.waitForCaptureReady?.();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function captureViewportRegion({ format, quality, targetWidth, targetHeight }) {
  await waitForCaptureReady();
  const rect = getCaptureViewportBounds();
  if (!rect) {
    throw new Error('未找到导出预览区域');
  }
  return window.applicationFormApi.captureCurrentWindowRegion({
    rect,
    format,
    quality,
    targetWidth,
    targetHeight,
  });
}

async function capturePreviewByTiles() {
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth.value;
  canvas.height = outputHeight.value;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < tileRows.value; row += 1) {
    for (let column = 0; column < tileColumns.value; column += 1) {
      const tileX = column * viewportWidth.value;
      const tileY = row * viewportHeight.value;
      const tileWidth = Math.min(viewportWidth.value, renderWidth.value - tileX);
      const tileHeight = Math.min(viewportHeight.value, renderHeight.value - tileY);
      currentTileOffset.value = { x: tileX, y: tileY };

      const tileDataUrl = await captureViewportRegion({
        format: 'png',
        quality: 100,
        targetWidth: viewportWidth.value,
        targetHeight: viewportHeight.value,
      });
      const tileImage = await loadImage(tileDataUrl);
      context.drawImage(
        tileImage,
        0,
        0,
        tileWidth,
        tileHeight,
        tileX / renderScale.value,
        tileY / renderScale.value,
        tileWidth / renderScale.value,
        tileHeight / renderScale.value,
      );
    }
  }

  currentTileOffset.value = { x: 0, y: 0 };
  const exportFormat = String(payload.value?.exportSettings?.format || 'png').trim().toLowerCase();
  if (exportFormat === 'png') {
    return canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', normalizeJpegQuality(payload.value?.exportSettings?.jpegQuality || 100));
}

async function capturePreview() {
  const token = String(route.query.token || '');
  if (!token) {
    await window.applicationFormApi.failExportCapture({ token, error: '缺少导出会话令牌' });
    return;
  }

  try {
    try {
      payload.value = await window.applicationFormApi.getExportCapturePayload(token);
    } catch (error) {
      throw new Error(`getExportCapturePayload: ${error?.message || '未知错误'}`);
    }
    if (!payload.value) {
      throw new Error('未找到导出数据');
    }

    let dataUrl = '';
    try {
      currentTileOffset.value = { x: 0, y: 0 };
      if (useTiledCapture.value) {
        dataUrl = await capturePreviewByTiles();
      } else {
        dataUrl = await captureViewportRegion({
          format: payload.value?.exportSettings?.format || 'png',
          quality: payload.value?.exportSettings?.jpegQuality || 100,
          targetWidth: outputWidth.value,
          targetHeight: outputHeight.value,
        });
      }
    } catch (error) {
      throw new Error(`captureCurrentWindowRegion: ${error?.message || '未知错误'}`);
    }

    try {
      await window.applicationFormApi.finishExportCapture({
        token,
        dataUrl,
      });
    } catch (error) {
      throw new Error(`finishExportCapture: ${error?.message || '未知错误'}`);
    }
  } catch (error) {
    try {
      await window.applicationFormApi.failExportCapture({
        token,
        error: error?.message || '导出截图失败',
      });
    } catch {
      // Ignore secondary failures while surfacing the primary error.
    }
  }
}

onMounted(async () => {
  await capturePreview();
});
</script>

<template>
  <section class="capture-export-root" :class="{ 'is-windows-text-enhanced': enhanceTextForCapture }" :style="captureRootStyle">
    <div ref="captureViewportRef" class="capture-export-viewport">
      <div class="capture-export-stage" :style="captureStageStyle">
        <DocumentPreviewCard
          v-if="payload"
          ref="previewCardRef"
          :page-name="payload.pageName"
          :page-number="payload.pageNumber || 1"
          :template="captureTemplate || payload.template"
          :stamp="payload.stamp"
          :scale="exportScale"
          :capture-mode="true"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.capture-export-root {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: #ffffff;
}

.capture-export-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
}

.capture-export-stage {
  width: fit-content;
  height: fit-content;
}

.capture-export-root.is-windows-text-enhanced :deep(.document-page-editor-content) {
  font-weight: 500;
  text-rendering: geometricPrecision;
  color: #000000 !important;
}

.capture-export-root.is-windows-text-enhanced :deep(.document-page-editor-content div),
.capture-export-root.is-windows-text-enhanced :deep(.document-page-editor-content span) {
  color: #000000 !important;
  text-shadow: 0 0 0.15px currentColor;
  -webkit-text-stroke: 0.15px currentColor;
}

.capture-export-root.is-windows-text-enhanced :deep(.document-page-editor-content strong),
.capture-export-root.is-windows-text-enhanced :deep(.document-page-editor-content b) {
  font-weight: 700;
}
</style>
