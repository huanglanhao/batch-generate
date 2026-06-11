<script setup>
import { computed, ref, watch } from 'vue';
import DocumentPreviewCard from '../components/DocumentPreviewCard.vue';
import { useAppStore } from '../stores/app-store';
import {
  generateStampPreviewUrl,
  getOfficialSealTemplateUrl,
  getStampFontOptions,
  normalizeStampFontKey,
  normalizeStampText,
} from '../utils/stamp-generator';

const appStore = useAppStore();
const generatedStampContent = ref(appStore.stamp.content || '');
const selectedStampFontKey = ref(appStore.stamp.fontKey || 'electronic-seal');
const previewGeneratedStamp = ref(null);
const officialSealTemplateUrl = getOfficialSealTemplateUrl();
const stampFontOptions = getStampFontOptions();
const selectedStampFontLabel = computed(() => {
  const normalizedFontKey = normalizeStampFontKey(selectedStampFontKey.value);
  return stampFontOptions.find((option) => option.key === normalizedFontKey)?.label || '电子印章字体';
});

const stampFileLabel = computed(() => {
  if (appStore.stamp.source === 'generated' && appStore.stamp.previewUrl) {
    return '当前使用文字生成印章';
  }
  return appStore.stamp.imagePath || '未导入盖章图片';
});
const hasGeneratedPreview = computed(() => Boolean(previewGeneratedStamp.value?.previewUrl));

watch(
  () => appStore.stamp.content,
  (nextValue) => {
    if (!previewGeneratedStamp.value) {
      generatedStampContent.value = nextValue || '';
    }
  },
);

watch(
  () => appStore.stamp.fontKey,
  (nextValue) => {
    if (!previewGeneratedStamp.value) {
      selectedStampFontKey.value = normalizeStampFontKey(nextValue);
    }
  },
);

watch(selectedStampFontKey, async (nextValue, previousValue) => {
  if (!generatedStampContent.value || nextValue === previousValue) return;
  if (!previewGeneratedStamp.value) return;

  const normalizedText = normalizeStampText(generatedStampContent.value);
  const normalizedFontKey = normalizeStampFontKey(nextValue);
  previewGeneratedStamp.value = {
    content: normalizedText,
    fontKey: normalizedFontKey,
    previewUrl: await generateStampPreviewUrl({
      text: normalizedText,
      fontKey: normalizedFontKey,
    }),
  };
});

function handleRandomizePositionChange(event) {
  appStore.setStampRandomizePosition(event.target.checked);
}

async function handleSelectStampFile() {
  previewGeneratedStamp.value = null;
  await appStore.selectStampFile();
}

async function handleClearStamp() {
  previewGeneratedStamp.value = null;
  await appStore.clearStampFile();
}

async function handleGenerateStamp() {
  const normalizedText = normalizeStampText(generatedStampContent.value);
  if (!normalizedText) {
    window.alert('请输入盖章内容');
    return;
  }
  const normalizedFontKey = normalizeStampFontKey(selectedStampFontKey.value);
  previewGeneratedStamp.value = {
    content: normalizedText,
    fontKey: normalizedFontKey,
    previewUrl: await generateStampPreviewUrl({
      text: normalizedText,
      fontKey: normalizedFontKey,
    }),
  };
  selectedStampFontKey.value = normalizedFontKey;
  generatedStampContent.value = normalizedText;
}

async function handleSaveGeneratedStamp() {
  if (!previewGeneratedStamp.value?.previewUrl) {
    window.alert('请先生成盖章预览');
    return;
  }
  try {
    const filePath = await window.applicationFormApi.saveGeneratedStampImage({
      fileName: previewGeneratedStamp.value.content,
      dataUrl: previewGeneratedStamp.value.previewUrl,
    });
    if (!filePath) return;
    appStore.showNotification(`印章 PNG 已保存：${filePath}`);
  } catch (error) {
    window.alert(`保存生成印章失败：${error?.message || '未知错误'}`);
  }
}
</script>

<template>
  <div class="page-grid page-grid-wide">
    <section class="panel card-stack">
      <div class="section-title-row">
        <div>
          <h2>印章资源</h2>
          <p class="stamp-resource-desc">建议导入透明背景 PNG。实际画框与定位操作已整合到“文档生成工作台”页面。</p>
        </div>

      </div>

      <div class="info-box info-box-inline stamp-file-box">
        <span class="info-label">印章文件</span>
        <strong class="stamp-file-path">{{ stampFileLabel }}</strong>
        <button
          v-if="appStore.stamp.previewUrl || appStore.stamp.imagePath"
          type="button"
          class="stamp-file-remove-btn"
          title="清空当前印章"
          aria-label="清空当前印章"
          @click="handleClearStamp"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v7h-2v-7Zm4 0h2v7h-2v-7ZM7 10h2v7H7v-7Zm-1 10h12l1-12H5l1 12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <section class="stamp-config-card">
        <div class="stamp-generator-header">
          <div>
            <h3>盖章配置</h3>
            <p>单独设置印章在页面中的显示位置、尺寸与导入资源。</p>
          </div>
        </div>

        <div class="field-grid two-columns stamp-config-grid">
          <label class="field-item">
            <span>X 坐标</span>
            <input v-model.number="appStore.stamp.box.x" type="number" />
          </label>
          <label class="field-item">
            <span>Y 坐标</span>
            <input v-model.number="appStore.stamp.box.y" type="number" />
          </label>
          <label class="field-item">
            <span>宽度</span>
            <input v-model.number="appStore.stamp.box.width" type="number" />
          </label>
          <label class="field-item">
            <span>高度</span>
            <input v-model.number="appStore.stamp.box.height" type="number" />
          </label>
        </div>

        <label class="field-checkbox stamp-config-checkbox">
          <input
            :checked="appStore.stamp.randomizePosition"
            type="checkbox"
            @change="handleRandomizePositionChange"
          />
          <span>盖章在框内随机位置显示，取消勾选则居中显示</span>
        </label>

        <div class="section-actions stamp-actions">
          <button class="primary-btn" @click="handleSelectStampFile">导入盖章</button>
          <button class="primary-btn stamp-save-btn" @click="appStore.persistConfig">保存盖章配置</button>
        </div>
      </section>

      <section class="stamp-generator-card">
        <div class="stamp-generator-header">
          <div>
            <h3>盖章生成</h3>
            <p>输入企业名称后，可直接生成环绕五角星的电子印章。</p>
          </div>
          <span class="stamp-source-pill">
            {{ hasGeneratedPreview ? '当前为本地预览' : (appStore.stamp.source === 'generated' ? '当前使用生成印章' : '当前使用导入印章') }}
          </span>
        </div>

        <label class="field-item stamp-generator-input">
          <span>盖章内容</span>
          <input
            v-model.trim="generatedStampContent"
            type="text"
            placeholder="请输入盖章内容，例如：中山XX电子商务有限公司"
          />
        </label>

        <label class="field-item stamp-font-field">
          <span>盖章字体</span>
          <div class="stamp-font-select-wrap">
            <select v-model="selectedStampFontKey" class="stamp-font-select">
              <option
                v-for="option in stampFontOptions"
                :key="option.key"
                :value="option.key"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </label>

        <div class="stamp-template-preview-card">
          <span class="stamp-template-label">{{ hasGeneratedPreview ? '本地预览' : '原始模版' }}</span>
          <span v-if="hasGeneratedPreview" class="stamp-template-meta">当前字体：{{ selectedStampFontLabel }}</span>
          <img
            :src="previewGeneratedStamp?.previewUrl || officialSealTemplateUrl"
            :alt="hasGeneratedPreview ? '本地预览生成印章' : '电子印章模版'"
          />
        </div>

        <div class="section-actions stamp-generate-actions">
          <button class="primary-btn" @click="handleGenerateStamp">生成盖章</button>
          <button class="primary-btn stamp-preview-save-btn" :disabled="!hasGeneratedPreview" @click="handleSaveGeneratedStamp">导出PNG印章</button>
        </div>
      </section>
    </section>

    <DocumentPreviewCard
      :page-name="appStore.records[0]?.name || '示例名称'"
      :page-number="1"
      :template="appStore.template"
      :stamp="appStore.stamp"
      :scale="0.62"
      show-rulers
    />
  </div>
</template>

<style scoped>
.page-grid-wide {
  grid-template-columns: minmax(100px, 1fr) minmax(0, 1fr);
}

.card-stack {
  gap: 16px;
}

.field-grid.two-columns {
  gap: 12px;
}

.field-item {
  gap: 6px;
}

.field-item span {
  font-size: 13px;
}

.field-item input {
  padding: 10px 14px;
  font-size: 13px;
}

.stamp-file-box {
  padding: 12px 14px;
  grid-template-columns: 96px minmax(0, 1fr) auto;
}

.stamp-generator-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(92, 116, 180, 0.12);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(242, 247, 255, 0.92));
}

.stamp-config-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(92, 116, 180, 0.12);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(242, 247, 255, 0.92));
}

.stamp-generator-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stamp-generator-header h3 {
  margin: 0 0 2px;
  font-size: 15px;
  color: #1f2a44;
}

.stamp-generator-header p {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: #6a7592;
}

.stamp-resource-desc {
  font-size: 11px;
  line-height: 1.45;
}

.stamp-source-pill {
  flex: none;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(59, 93, 201, 0.12);
  color: #3b5dc9;
  font-size: 11px;
  font-weight: 600;
}

.stamp-generator-input input {
  min-height: 42px;
}

.stamp-font-field {
  gap: 8px;
}

.stamp-font-select-wrap {
  position: relative;
}

.stamp-font-select-wrap::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 16px;
  width: 8px;
  height: 8px;
  border-right: 2px solid #5470c6;
  border-bottom: 2px solid #5470c6;
  pointer-events: none;
  transform: translateY(-65%) rotate(45deg);
}

.stamp-font-select {
  width: 100%;
  min-height: 44px;
  padding: 0 40px 0 14px;
  border: 1px solid rgba(76, 99, 155, 0.2);
  border-radius: 14px;
  appearance: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 246, 255, 0.95));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 10px 24px rgba(59, 93, 201, 0.1);
  color: #1f2a44;
  font-size: 13px;
  font-weight: 600;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.stamp-font-select:hover {
  border-color: rgba(59, 93, 201, 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 14px 28px rgba(59, 93, 201, 0.14);
}

.stamp-font-select:focus {
  outline: none;
  border-color: rgba(50, 88, 214, 0.62);
  box-shadow:
    0 0 0 4px rgba(50, 88, 214, 0.12),
    0 14px 28px rgba(59, 93, 201, 0.16);
}

.stamp-template-preview-card {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 10px;
  border: 1px solid rgba(92, 116, 180, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.stamp-template-label {
  font-size: 11px;
  font-weight: 600;
  color: #51607d;
}

.stamp-template-meta {
  font-size: 10px;
  color: #7d8aa6;
}

.stamp-template-preview-card img {
  width: 152px;
  height: 152px;
  object-fit: contain;
}

.stamp-file-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.stamp-file-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(225, 82, 82, 0.24);
  border-radius: 10px;
  background: rgba(225, 82, 82, 0.08);
  color: #d14343;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.stamp-file-remove-btn:hover {
  background: rgba(225, 82, 82, 0.16);
  transform: translateY(-1px);
}

.stamp-file-remove-btn svg {
  width: 16px;
  height: 16px;
}

.stamp-actions {
  align-items: flex-start;
}

.stamp-config-grid {
  margin-top: 4px;
}

.stamp-actions .primary-btn,
.stamp-generate-actions .primary-btn {
  min-height: 32px;
  padding: 6px 14px;
  font-size: 13px;
  border-radius: 12px;
}

.stamp-generate-actions {
  justify-content: flex-start;
  gap: 10px;
}

.stamp-preview-save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.stamp-save-btn {
  padding: 4px 12px;
  align-self: flex-start;
  line-height: 1;
}

.field-checkbox {
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
}

.stamp-config-checkbox {
  margin-top: 0;
}
</style>
