<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import DocumentPreviewCard from '../components/DocumentPreviewCard.vue';
import { useAppStore } from '../stores/app-store';
import { DEFAULT_RICH_TEXT_CONTENT, EMPTY_RICH_TEXT_CONTENT } from '../utils/rich-text';

const appStore = useAppStore();
const previewCardRef = ref(null);
const selectedTemplatePreset = ref('login-phone');
const selectedFontFamily = ref(appStore.template.fontFamily);
const selectedFontSize = ref(String(appStore.template.fontSize));
const selectedTextColor = ref(appStore.template.textColor);
const selectedLineHeight = ref('1.2');
const selectedTextIndent = ref('0em');
const templateOptions = [
  { label: '登录手机号码修改申请书模版', value: 'login-phone' },
  { label: '空模版', value: 'blank' },
];
const templatePresetContentMap = {
  'login-phone': DEFAULT_RICH_TEXT_CONTENT,
  blank: EMPTY_RICH_TEXT_CONTENT,
};
const fontOptions = [
  { label: '苹方', value: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '国标仿宋', value: '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif' },
  { label: '黑体', value: '"SimHei", sans-serif' },
];

const fontSizeOptions = [
  { key: 'chuhao', label: '初号', value: '42' },
  { key: 'xiaochu', label: '小初', value: '36' },
  { key: 'yihao', label: '一号', value: '26' },
  { key: 'xiaoyi', label: '小一', value: '24' },
  { key: 'erhao', label: '二号', value: '22' },
  { key: 'xiaoer', label: '小二', value: '18' },
  { key: 'sanhao', label: '三号', value: '16' },
  { key: 'xiaosan', label: '小三', value: '15' },
  { key: 'sihao', label: '四号', value: '14' },
  { key: 'xiaosi', label: '小四', value: '12' },
  { key: 'wuhao', label: '五号', value: '10.5' },
  { key: 'xiaowu', label: '小五', value: '9' },
  { key: 'size-9', label: '9', value: '9' },
  { key: 'size-10', label: '10', value: '10' },
  { key: 'size-10_5', label: '10.5', value: '10.5' },
  { key: 'size-11', label: '11', value: '11' },
  { key: 'size-12', label: '12', value: '12' },
  { key: 'size-14', label: '14', value: '14' },
  { key: 'size-16', label: '16', value: '16' },
  { key: 'size-18', label: '18', value: '18' },
  { key: 'size-20', label: '20', value: '20' },
  { key: 'size-22', label: '22', value: '22' },
  { key: 'size-24', label: '24', value: '24' },
  { key: 'size-26', label: '26', value: '26' },
  { key: 'size-28', label: '28', value: '28' },
  { key: 'size-36', label: '36', value: '36' },
  { key: 'size-42', label: '42', value: '42' },
  { key: 'size-48', label: '48', value: '48' },
  { key: 'size-72', label: '72', value: '72' },
];
const lineHeightOptions = ['1.2', '1.4', '1.6', '1.8', '2'];
const textIndentOptions = [
  { label: '无缩进', value: '0em' },
  { label: '首行缩进 2 字', value: '2em' },
  { label: '首行缩进 4 字', value: '4em' },
];
const selectedFontSizeOptionKey = ref('');

function normalizeFontSizeValue(value) {
  const size = Math.round(Number(value || 0) * 10) / 10;
  if (!Number.isFinite(size) || size <= 0) return '';
  return Number.isInteger(size) ? String(size) : String(size);
}

function resolveFontSizeOptionKey(value) {
  const normalizedValue = normalizeFontSizeValue(value);
  const matchedOptions = fontSizeOptions.filter((item) => item.value === normalizedValue);
  return matchedOptions.find((item) => item.key.startsWith('size-'))?.key || matchedOptions[0]?.key || '';
}

function normalizeHexSegment(value) {
  return value.toString(16).padStart(2, '0');
}

function normalizeColorValue(value) {
  const normalized = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toLowerCase();
  const rgbMatch = normalized.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (!rgbMatch) return '';
  const [red, green, blue] = rgbMatch.slice(1, 4).map((item) => Math.max(0, Math.min(255, Number(item))));
  return `#${normalizeHexSegment(red)}${normalizeHexSegment(green)}${normalizeHexSegment(blue)}`;
}

function normalizeLineHeightValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const ratio = Math.round(Number.parseFloat(normalized) * 10) / 10;
  if (!Number.isFinite(ratio) || ratio <= 0) return '';
  return Number.isInteger(ratio) ? String(ratio) : String(ratio);
}

function resolveFontFamilyOptionValue(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('customguobiaofangsong') || normalized.includes('gbfangsong') || normalized.includes('fangsong')) {
    return '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif';
  }
  if (normalized.includes('simhei')) {
    return '"SimHei", sans-serif';
  }
  if (normalized.includes('pingfang sc')) {
    return '"PingFang SC", "Microsoft YaHei", sans-serif';
  }
  if (normalized.includes('microsoft yahei')) {
    return '"Microsoft YaHei", sans-serif';
  }
  return '';
}

function resolveTemplatePreset(title, contentHtml) {
  if (title === '空模版' || contentHtml === EMPTY_RICH_TEXT_CONTENT) {
    return 'blank';
  }
  return 'login-phone';
}

selectedFontSizeOptionKey.value = resolveFontSizeOptionKey(appStore.template.fontSize);
selectedTemplatePreset.value = resolveTemplatePreset(appStore.template.title, appStore.template.contentHtml);

function requestSelectionStyleSync() {
  nextTick(() => {
    requestAnimationFrame(() => {
      previewCardRef.value?.syncSelectionStyle?.();
    });
  });
}

watch(
  () => [appStore.template.fontFamily, appStore.template.fontSize, appStore.template.textColor],
  ([fontFamily, fontSize, textColor]) => {
    selectedFontFamily.value = fontFamily;
    selectedFontSize.value = normalizeFontSizeValue(fontSize);
    selectedFontSizeOptionKey.value = resolveFontSizeOptionKey(fontSize);
    selectedTextColor.value = textColor;
    requestSelectionStyleSync();
  },
);

watch(
  () => [appStore.template.title, appStore.template.contentHtml],
  ([title, contentHtml]) => {
    selectedTemplatePreset.value = resolveTemplatePreset(title, contentHtml);
  },
  { immediate: true },
);

onMounted(() => {
  requestSelectionStyleSync();
});

function applyDrawnBox(payload) {
  appStore.moveBox(payload.type, payload.box);
}

function applyFontFamily(event) {
  const value = event.target.value;
  selectedFontFamily.value = value;
  previewCardRef.value?.applyTextStyle({ fontFamily: value });
}

function applyFontSize(event) {
  const option = fontSizeOptions.find((item) => item.key === event.target.value);
  if (!option) return;
  selectedFontSizeOptionKey.value = option.key;
  selectedFontSize.value = option.value;
  previewCardRef.value?.applyTextStyle({ fontSize: `${option.value}px` });
}

function applyTextColor(event) {
  const value = event.target.value;
  selectedTextColor.value = value;
  previewCardRef.value?.applyTextStyle({ color: value });
}

function syncSelectionStyle(style = {}) {
  if (style.fontSize) {
    selectedFontSize.value = normalizeFontSizeValue(style.fontSize);
    selectedFontSizeOptionKey.value = resolveFontSizeOptionKey(style.fontSize);
  }
  if (style.fontFamily) {
    const resolvedFontFamily = resolveFontFamilyOptionValue(style.fontFamily);
    if (resolvedFontFamily) {
      selectedFontFamily.value = resolvedFontFamily;
    }
  }
  if (style.textColor) {
    const resolvedColor = normalizeColorValue(style.textColor);
    if (resolvedColor) {
      selectedTextColor.value = resolvedColor;
    }
  }
  if (style.lineHeight) {
    const resolvedLineHeight = normalizeLineHeightValue(style.lineHeight);
    if (resolvedLineHeight) {
      selectedLineHeight.value = resolvedLineHeight;
    }
  }
}

function syncEditorContent(html) {
  appStore.updateTemplateContent(html);
}

async function persistEditorContent(html) {
  await appStore.persistTemplateContent(html);
}

async function applyTemplatePreset(presetKey) {
  if (appStore.template.contentHtml === templatePresetContentMap[presetKey]) return;
  selectedTemplatePreset.value = presetKey;
  await appStore.applyTemplatePreset(presetKey);
  requestSelectionStyleSync();
}

function handleTemplatePresetChange(event) {
  applyTemplatePreset(event.target.value);
}

function insertNameVariable() {
  previewCardRef.value?.insertVariableToken('name');
}

function applyTextAlignment(alignment) {
  previewCardRef.value?.applyTextAlignment(alignment);
}

function toggleTextFormat(format) {
  previewCardRef.value?.toggleTextFormat(format);
}

function applyLineHeight(event) {
  selectedLineHeight.value = event.target.value;
  previewCardRef.value?.applyParagraphFormatting({ lineHeight: selectedLineHeight.value });
}

function applyTextIndent(event) {
  selectedTextIndent.value = event.target.value;
  previewCardRef.value?.applyParagraphFormatting({ textIndent: selectedTextIndent.value });
}

async function handleExportFormatChange(event) {
  appStore.exportSettings.format = event.target.value === 'png' ? 'png' : 'jpg';
  await appStore.persistConfig();
}
</script>

<template>
  <section class="workspace-studio">
    <div class="studio-toolbar panel">
      <div class="toolbar-group">
        <label class="toolbar-field">
          <span>字体</span>
          <select :value="selectedFontFamily" @change="applyFontFamily">
            <option v-for="item in fontOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>

        <label class="toolbar-field">
          <span>字号</span>
          <div class="toolbar-size-actions">
            <select :value="selectedFontSizeOptionKey" @change="applyFontSize">
              <option v-for="item in fontSizeOptions" :key="item.key" :value="item.key">{{ item.label }}</option>
            </select>
          </div>
        </label>

        <label class="toolbar-field toolbar-color-field">
          <span>字体颜色</span>
          <input :value="selectedTextColor" type="color" @change="applyTextColor" />
        </label>

        <label class="toolbar-field">
          <span>行高</span>
          <select :value="selectedLineHeight" @change="applyLineHeight">
            <option v-for="item in lineHeightOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="toolbar-field">
          <span>首行缩进</span>
          <select :value="selectedTextIndent" @change="applyTextIndent">
            <option v-for="item in textIndentOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <div class="toolbar-field toolbar-align-field">
          <span>文本对齐</span>
          <div class="toolbar-align-actions">
            <button type="button" class="secondary-btn toolbar-align-btn" title="左对齐" @click="applyTextAlignment('left')">
              <span class="toolbar-align-icon is-left" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <button type="button" class="secondary-btn toolbar-align-btn" title="居中" @click="applyTextAlignment('center')">
              <span class="toolbar-align-icon is-center" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <button type="button" class="secondary-btn toolbar-align-btn" title="右对齐" @click="applyTextAlignment('right')">
              <span class="toolbar-align-icon is-right" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <button type="button" class="secondary-btn toolbar-align-btn" title="两端对齐" @click="applyTextAlignment('justify')">
              <span class="toolbar-align-icon is-justify" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        <div class="toolbar-field toolbar-format-field">
          <span>文本样式</span>
          <div class="toolbar-format-actions">
            <button type="button" class="secondary-btn toolbar-format-btn" title="加粗" @click="toggleTextFormat('bold')">
              <span class="toolbar-format-icon is-bold" aria-hidden="true">B</span>
            </button>
            <button type="button" class="secondary-btn toolbar-format-btn" title="斜体" @click="toggleTextFormat('italic')">
              <span class="toolbar-format-icon is-italic" aria-hidden="true">I</span>
            </button>
            <button type="button" class="secondary-btn toolbar-format-btn" title="下划线" @click="toggleTextFormat('underline')">
              <span class="toolbar-format-icon is-underline" aria-hidden="true">U</span>
            </button>
          </div>
        </div>

        <div class="toolbar-actions">
          <label class="toolbar-field">
            <span>导出格式</span>
            <select :value="appStore.exportSettings.format" @change="handleExportFormatChange">
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <button class="secondary-btn toolbar-action-btn" :class="{ 'is-tool-active': appStore.drawMode === 'stamp-box' }" @click="appStore.setDrawMode('stamp-box')">
            盖章位置
          </button>
          <button class="secondary-btn toolbar-action-btn" @click="insertNameVariable">插入名称</button>
          <button class="primary-btn toolbar-action-btn" @click="appStore.importWorkbook">导入名称</button>
          <button class="primary-btn toolbar-action-btn" @click="appStore.selectStampFile">导入盖章</button>
          <button class="primary-btn toolbar-action-btn" :disabled="appStore.exporting || !appStore.records.length" @click="appStore.exportDocuments">
            {{ appStore.exporting ? '导出中...' : `导出 ${appStore.exportSettings.format.toUpperCase()}` }}
          </button>
        </div>
      </div>
    </div>

    <div class="workspace-shell">
      <aside class="page-strip panel">
        <div class="page-strip-header">
          <h2>页数</h2>
          <span>{{ appStore.totalPages || 0 }} 页</span>
        </div>

        <div class="page-strip-list" v-if="appStore.records.length">
          <button
            v-for="(record, index) in appStore.records"
            :key="record.rowIndex + record.name"
            class="page-thumb-card"
            :class="{ 'is-active': appStore.activePageIndex === index }"
            @click="appStore.selectPage(index)"
          >
            <DocumentPreviewCard
              :page-name="record.name"
              :page-number="index + 1"
              :template="appStore.template"
              :stamp="appStore.stamp"
              :scale="0.16"
              :active="appStore.activePageIndex === index"
            />
            <span class="page-thumb-index">{{ index + 1 }}</span>
          </button>
        </div>

        <p class="empty-hint" v-else>
          导入后这里会按 `template_name` 列每一行生成一页。
          <button type="button" class="text-btn" @click="appStore.downloadImportTemplate">点击下载导入模版</button>
        </p>
      </aside>

      <section class="editor-stage panel">
        <div class="editor-stage-header">
          <label class="template-switcher">
            <span class="template-switcher-label">模版</span>
            <select class="template-switcher-select" :value="selectedTemplatePreset" @change="handleTemplatePresetChange">
              <option v-for="item in templateOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <div class="editor-stage-meta">
            <span class="pill">当前页：{{ appStore.activePageIndex + 1 }}</span>
            <span class="pill" v-if="appStore.currentRecord">{{ appStore.currentRecord.name }}</span>
          </div>
        </div>

        <div class="editor-canvas-wrap">
          <DocumentPreviewCard
            ref="previewCardRef"
            :page-name="appStore.currentRecord?.name || ''"
            :page-number="appStore.activePageIndex + 1"
            :template="appStore.template"
            :stamp="appStore.stamp"
            :scale="0.80"
            show-rulers
            :draw-mode="appStore.drawMode"
            interactive
            @box-drawn="applyDrawnBox"
            @content-updated="syncEditorContent"
            @content-persist="persistEditorContent"
            @selection-style-change="syncSelectionStyle"
          />
        </div>
      </section>
    </div>
  </section>
</template>
