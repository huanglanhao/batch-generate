<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DocumentPreviewCard from '../components/DocumentPreviewCard.vue';

const route = useRoute();
const previewCardRef = ref(null);
const payload = ref(null);
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const captureSettings = computed(() => payload.value?.captureSettings || null);

const exportScale = computed(() => {
  if (captureSettings.value?.pageScale) {
    return Math.max(0.01, Number(captureSettings.value.pageScale) || 1);
  }
  const width = Math.max(PAGE_WIDTH, Math.round(Number(payload.value?.exportSettings?.width) || PAGE_WIDTH));
  return width / PAGE_WIDTH;
});

const captureRootStyle = computed(() => ({
  width: `${Math.max(1, Math.round(Number(captureSettings.value?.viewportWidth) || Number(payload.value?.exportSettings?.width) || PAGE_WIDTH))}px`,
  height: `${Math.max(1, Math.round(Number(captureSettings.value?.viewportHeight) || Number(payload.value?.exportSettings?.height) || PAGE_HEIGHT))}px`,
}));

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

    await nextTick();
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await previewCardRef.value?.waitForCaptureReady?.();
    const rect = previewCardRef.value?.getPageSurfaceBounds?.();
    if (!rect) {
      throw new Error('未找到导出预览区域');
    }

    let dataUrl = '';
    try {
      dataUrl = await window.applicationFormApi.captureCurrentWindowRegion({
        rect,
        format: payload.value?.exportSettings?.format || 'png',
        quality: payload.value?.exportSettings?.jpegQuality || 100,
        targetWidth: Math.max(1, Math.round(Number(captureSettings.value?.outputWidth) || Number(payload.value?.exportSettings?.width) || rect.width)),
        targetHeight: Math.max(1, Math.round(Number(captureSettings.value?.outputHeight) || Number(payload.value?.exportSettings?.height) || rect.height)),
      });
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
  <section class="capture-export-root" :style="captureRootStyle">
    <DocumentPreviewCard
      v-if="payload"
      ref="previewCardRef"
      :page-name="payload.pageName"
      :page-number="payload.pageNumber || 1"
      :template="payload.template"
      :stamp="payload.stamp"
      :scale="exportScale"
      :capture-mode="true"
    />
  </section>
</template>

<style scoped>
.capture-export-root {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: hidden;
  background: #ffffff;
}
</style>
