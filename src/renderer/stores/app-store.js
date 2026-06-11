import { defineStore } from 'pinia';
import { buildUniqueExportFileName } from '../utils/document-template';
import { buildInitialRichTextContent, DEFAULT_RICH_TEXT_CONTENT, EMPTY_RICH_TEXT_CONTENT } from '../utils/rich-text';
import { generateStampPreviewUrl, normalizeStampFontKey, normalizeStampText } from '../utils/stamp-generator';

let notificationTimer = null;

function toSerializableObject(value) {
  return JSON.parse(JSON.stringify(value));
}

const DEFAULT_DOCUMENT_FONT_FAMILY = '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif';
const TEMPLATE_PRESETS = {
  'login-phone': {
    title: '登录手机号码修改申请书',
    contentHtml: DEFAULT_RICH_TEXT_CONTENT,
  },
  blank: {
    title: '空模版',
    contentHtml: EMPTY_RICH_TEXT_CONTENT,
  },
};
const LEGACY_TEMPLATE = {
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
  fontSize: 28,
  textColor: '#1f2937',
};
const PREVIOUS_TEMPLATE = {
  fontFamily: DEFAULT_DOCUMENT_FONT_FAMILY,
  fontSize: 18,
  textColor: '#111111',
};
const CURRENT_TEMPLATE = {
  fontFamily: DEFAULT_DOCUMENT_FONT_FAMILY,
  fontSize: 16,
  textColor: '#111111',
};
const DEFAULT_TEMPLATE = {
  title: '登录手机号码修改申请书',
  fontFamily: DEFAULT_DOCUMENT_FONT_FAMILY,
  fontSize: 18,
  textColor: '#111111',
  contentHtml: '{{name}}',
  textBox: {
    x: 160,
    y: 220,
    width: 320,
    height: 56,
  },
};

const LEGACY_STAMP_BOX = {
  x: 430,
  y: 470,
  width: 150,
  height: 150,
};
const PREVIOUS_STAMP_BOX = {
  x: 346,
  y: 360,
  width: 298,
  height: 308,
};
const CURRENT_STAMP_BOX = {
  x: 379,
  y: 269,
  width: 284,
  height: 284,
};
const DEFAULT_STAMP_BOX = {
  x: 379,
  y: 231,
  width: 284,
  height: 284,
};
const OLD_DEFAULT_STAMP_BOX = {
  x: 408,
  y: 332,
  width: 198,
  height: 198,
};
const DEFAULT_STAMP = {
  source: 'upload',
  imagePath: '',
  content: '',
  fontKey: 'electronic-seal',
  previewUrl: '',
  randomizePosition: false,
  randomSeedNonce: 0,
  box: { ...DEFAULT_STAMP_BOX },
};
const DEFAULT_EXPORT_SETTINGS = {
  format: 'png',
  width: 2480,
  height: 3508,
  jpegQuality: 100,
};

function isSameBox(box, targetBox) {
  return ['x', 'y', 'width', 'height'].every((key) => Number(box?.[key]) === Number(targetBox[key]));
}

function normalizeLoadedTemplate(template = {}) {
  const migratedContentHtml = typeof template.contentHtml === 'string' && template.contentHtml.trim()
    ? template.contentHtml
    : DEFAULT_TEMPLATE.contentHtml;
  const normalizedContentHtml = buildInitialRichTextContent(migratedContentHtml);
  const normalizedFontFamily = String(template.fontFamily || '').trim();
  return {
    ...DEFAULT_TEMPLATE,
    ...template,
    title: template.title === '批量申请书' ? DEFAULT_TEMPLATE.title : (template.title || DEFAULT_TEMPLATE.title),
    fontFamily:
      template.fontFamily === LEGACY_TEMPLATE.fontFamily
      || normalizedFontFamily === '"SimSun", serif'
      || normalizedFontFamily === 'SimSun, serif'
      || normalizedFontFamily === '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif'
      || normalizedFontFamily === 'CustomGuoBiaoFangSong, GBFangSong, FangSong GB2312, FangSong, STFangsong, serif'
      || normalizedFontFamily === '"GBSong", "STSong", "Songti SC", SimSun, serif'
      || normalizedFontFamily === 'GBSong, STSong, Songti SC, SimSun, serif'
      || normalizedFontFamily === '"STSong", "Songti SC", SimSun, serif'
      || normalizedFontFamily === 'STSong, Songti SC, SimSun, serif'
      || normalizedFontFamily === '"Songti SC", SimSun, STSong, serif'
      || normalizedFontFamily === 'Songti SC, SimSun, STSong, serif'
      || normalizedFontFamily === '"FangSong GB2312", FangSong, STFangsong, serif'
      || normalizedFontFamily === 'FangSong GB2312, FangSong, STFangsong, serif'
        ? DEFAULT_TEMPLATE.fontFamily
        : (template.fontFamily || DEFAULT_TEMPLATE.fontFamily),
    fontSize:
      (template.fontFamily === PREVIOUS_TEMPLATE.fontFamily
        && Number(template.fontSize) === PREVIOUS_TEMPLATE.fontSize
        && template.textColor === PREVIOUS_TEMPLATE.textColor)
      || (template.fontFamily === CURRENT_TEMPLATE.fontFamily
        && Number(template.fontSize) === CURRENT_TEMPLATE.fontSize
        && template.textColor === CURRENT_TEMPLATE.textColor)
      || Number(template.fontSize) === LEGACY_TEMPLATE.fontSize
        ? DEFAULT_TEMPLATE.fontSize
        : (Number(template.fontSize) || DEFAULT_TEMPLATE.fontSize),
    textColor: template.textColor === LEGACY_TEMPLATE.textColor ? DEFAULT_TEMPLATE.textColor : (template.textColor || DEFAULT_TEMPLATE.textColor),
    contentHtml: normalizedContentHtml,
    textBox: {
      ...DEFAULT_TEMPLATE.textBox,
      ...((template || {}).textBox || {}),
    },
  };
}

function normalizeTemplatePresetKey(presetKey) {
  return Object.hasOwn(TEMPLATE_PRESETS, presetKey) ? presetKey : 'login-phone';
}

function normalizeLoadedStamp(stamp = {}) {
  const normalizedContent = normalizeStampText(stamp.content);
  const normalizedSource = stamp.source === 'generated'
    ? 'generated'
    : (stamp.imagePath ? 'upload' : (normalizedContent ? 'generated' : 'upload'));
  return {
    ...DEFAULT_STAMP,
    ...stamp,
    source: normalizedSource,
    randomSeedNonce: Math.max(0, Number(stamp.randomSeedNonce) || 0),
    content: normalizedContent,
    fontKey: normalizeStampFontKey(stamp.fontKey),
    box: isSameBox(stamp.box, LEGACY_STAMP_BOX)
      || isSameBox(stamp.box, PREVIOUS_STAMP_BOX)
      || isSameBox(stamp.box, CURRENT_STAMP_BOX)
      || isSameBox(stamp.box, OLD_DEFAULT_STAMP_BOX)
      ? { ...DEFAULT_STAMP.box }
      : {
          ...DEFAULT_STAMP.box,
          ...((stamp || {}).box || {}),
        },
  };
}

function buildBootstrapTemplate(template = {}) {
  const normalizedTemplate = normalizeLoadedTemplate(template);
  return {
    ...normalizedTemplate,
    fontFamily: DEFAULT_TEMPLATE.fontFamily,
    fontSize: DEFAULT_TEMPLATE.fontSize,
    textColor: DEFAULT_TEMPLATE.textColor,
    textBox: { ...normalizedTemplate.textBox },
  };
}

function buildBootstrapStamp(stamp = {}) {
  const normalizedStamp = normalizeLoadedStamp(stamp);
  return {
    ...DEFAULT_STAMP,
    source: normalizedStamp.source,
    imagePath: normalizedStamp.imagePath || DEFAULT_STAMP.imagePath,
    content: normalizedStamp.content || DEFAULT_STAMP.content,
    fontKey: normalizedStamp.fontKey || DEFAULT_STAMP.fontKey,
    previewUrl: '',
    randomizePosition: Boolean(normalizedStamp.randomizePosition),
    randomSeedNonce: Math.max(0, Number(normalizedStamp.randomSeedNonce) || 0),
    box: { ...DEFAULT_STAMP.box },
  };
}

function normalizeLoadedExportSettings(exportSettings = {}) {
  return {
    format: String(exportSettings.format || DEFAULT_EXPORT_SETTINGS.format).trim().toLowerCase() === 'png' ? 'png' : 'jpg',
    width: Math.max(794, Math.round(Number(exportSettings.width) || DEFAULT_EXPORT_SETTINGS.width)),
    height: Math.max(1123, Math.round(Number(exportSettings.height) || DEFAULT_EXPORT_SETTINGS.height)),
    jpegQuality: Math.max(0, Math.min(100, Math.round(Number(exportSettings.jpegQuality) || DEFAULT_EXPORT_SETTINGS.jpegQuality))),
  };
}

export const useAppStore = defineStore('application-form', {
  state: () => ({
    meta: null,
    template: { ...DEFAULT_TEMPLATE, textBox: { ...DEFAULT_TEMPLATE.textBox } },
    stamp: { ...DEFAULT_STAMP, box: { ...DEFAULT_STAMP.box } },
    outputDir: '',
    exportSettings: { ...DEFAULT_EXPORT_SETTINGS },
    exportHistory: [],
    workbookPath: '',
    records: [],
    matchedColumnName: '',
    activePageIndex: 0,
    drawMode: 'none',
    exporting: false,
    notification: {
      visible: false,
      message: '',
      type: 'success',
    },
  }),
  getters: {
    currentRecord(state) {
      return state.records[state.activePageIndex] || null;
    },
    totalPages(state) {
      return state.records.length;
    },
  },
  actions: {
    async bootstrap() {
      const [meta, config] = await Promise.all([
        window.applicationFormApi.getAppMeta(),
        window.applicationFormApi.loadConfig(),
      ]);
      this.meta = meta;
      this.template = buildBootstrapTemplate(config.template || {});
      this.stamp = buildBootstrapStamp(config.stamp || {});
      await this.refreshStampPreview();
      this.outputDir = config.outputDir || '';
      this.exportSettings = normalizeLoadedExportSettings(config.exportSettings || {});
      this.exportHistory = Array.isArray(config.exportHistory) ? config.exportHistory : [];
    },
    async persistConfig() {
      const currentTemplate = normalizeLoadedTemplate(toSerializableObject(this.template));
      const currentExportSettings = normalizeLoadedExportSettings(toSerializableObject(this.exportSettings));
      const config = await window.applicationFormApi.saveConfig({
        template: toSerializableObject(this.template),
        stamp: {
          source: this.stamp.source,
          imagePath: this.stamp.imagePath,
          content: this.stamp.content,
          fontKey: this.stamp.fontKey,
          randomizePosition: Boolean(this.stamp.randomizePosition),
          randomSeedNonce: Math.max(0, Number(this.stamp.randomSeedNonce) || 0),
          box: toSerializableObject(this.stamp.box),
        },
        outputDir: this.outputDir,
        exportSettings: currentExportSettings,
      });
      this.template = {
        ...currentTemplate,
        textBox: {
          ...currentTemplate.textBox,
          ...((config.template || {}).textBox || {}),
        },
      };
      this.stamp = {
        ...normalizeLoadedStamp(config.stamp || {}),
        previewUrl: this.stamp.previewUrl,
      };
      this.outputDir = config.outputDir || '';
      this.exportSettings = normalizeLoadedExportSettings(config.exportSettings || currentExportSettings);
    },
    async importWorkbook() {
      const filePath = await window.applicationFormApi.selectExcelFile();
      if (!filePath) return;
      const workbook = await window.applicationFormApi.parseWorkbook(filePath);
      this.workbookPath = workbook.filePath;
      this.records = workbook.records || [];
      this.matchedColumnName = workbook.matchedColumnName || '';
      this.activePageIndex = 0;
    },
    async downloadImportTemplate() {
      try {
        const filePath = await window.applicationFormApi.downloadImportTemplate();
        if (!filePath) return;
        this.showNotification('导入模板下载成功');
      } catch (error) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(`下载导入模板失败：${error?.message || '未知错误'}`);
        }
      }
    },
    async selectStampFile() {
      const filePath = await window.applicationFormApi.selectStampFile();
      if (!filePath) return;
      this.stamp.source = 'upload';
      this.stamp.imagePath = filePath;
      this.stamp.previewUrl = '';
      await this.refreshStampPreview();
      await this.persistConfig();
    },
    async clearStampFile() {
      if (!this.stamp.imagePath && !this.stamp.previewUrl) return;
      this.stamp.source = 'upload';
      this.stamp.imagePath = '';
      this.stamp.previewUrl = '';
      await this.persistConfig();
    },
    async generateStampByText(text, fontKey = this.stamp.fontKey) {
      const normalizedText = normalizeStampText(text);
      if (!normalizedText) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('请输入盖章内容');
        }
        return false;
      }

      return {
        content: normalizedText,
        fontKey: normalizeStampFontKey(fontKey),
        previewUrl: await generateStampPreviewUrl({
          text: normalizedText,
          fontKey,
        }),
      };
    },
    async saveGeneratedStamp(text, previewUrl = '', fontKey = this.stamp.fontKey) {
      const normalizedText = normalizeStampText(text);
      const normalizedFontKey = normalizeStampFontKey(fontKey);
      if (!normalizedText) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('请输入盖章内容');
        }
        return false;
      }

      this.stamp.source = 'generated';
      this.stamp.content = normalizedText;
      this.stamp.fontKey = normalizedFontKey;
      this.stamp.imagePath = '';
      this.stamp.previewUrl = previewUrl || (await generateStampPreviewUrl({
        text: normalizedText,
        fontKey: normalizedFontKey,
      }));
      await this.persistConfig();
      return true;
    },
    async selectOutputDir() {
      const outputDir = await window.applicationFormApi.selectOutputDir();
      if (!outputDir) return;
      this.outputDir = outputDir;
      await this.persistConfig();
    },
    async createMockExportRecord() {
      const record = {
        id: `batch-${Date.now()}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        totalCount: this.records.length || 1,
        outputDir: this.outputDir || '待选择导出目录',
        status: this.outputDir ? 'success' : 'pending',
      };
      this.exportHistory = await window.applicationFormApi.pushExportHistory(record);
    },
    async exportDocuments() {
      if (!this.records.length || this.exporting) return;

      const outputDir = await window.applicationFormApi.selectOutputDir();
      if (!outputDir) return;
      this.outputDir = outputDir;

      this.exporting = true;

      try {
        const items = [];
        const usedNameMap = new Map();
        const exportSettings = normalizeLoadedExportSettings(toSerializableObject(this.exportSettings));
        for (let index = 0; index < this.records.length; index += 1) {
          const record = this.records[index];
          let dataUrl = '';
          try {
            dataUrl = await window.applicationFormApi.capturePreviewPage({
              pageName: record.name,
              pageNumber: index + 1,
              template: toSerializableObject(this.template),
              stamp: toSerializableObject(this.stamp),
              exportSettings,
            });
          } catch (error) {
            throw new Error(`capturePreviewPage: ${error?.message || '未知错误'}`);
          }
          items.push({
            fileName: buildUniqueExportFileName(record.name, usedNameMap, exportSettings.format),
            dataUrl,
          });
        }

        const result = await window.applicationFormApi.writeExportImages({
          outputDir: this.outputDir,
          items,
        });

        await this.persistConfig();

        const record = {
          id: `batch-${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
          totalCount: this.records.length,
          successCount: result.files.length,
          failedCount: Math.max(0, this.records.length - result.files.length),
          outputDir: result.outputDir,
          format: exportSettings.format,
          status: result.files.length === this.records.length ? 'success' : 'partial',
        };
        this.exportHistory = await window.applicationFormApi.pushExportHistory(record);
      } catch (error) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(`导出 ${this.exportSettings.format.toUpperCase()} 失败：${error?.message || '未知错误'}`);
        }
      } finally {
        this.exporting = false;
      }
    },
    async openPath(targetPath) {
      if (!targetPath) return;
      await window.applicationFormApi.openPath(targetPath);
    },
    showNotification(message, type = 'success') {
      this.notification = {
        visible: true,
        message,
        type,
      };
      if (notificationTimer) {
        clearTimeout(notificationTimer);
      }
      notificationTimer = window.setTimeout(() => {
        this.dismissNotification();
      }, 2400);
    },
    dismissNotification() {
      this.notification.visible = false;
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
      }
    },
    selectPage(index) {
      this.activePageIndex = index;
    },
    setDrawMode(mode) {
      this.drawMode = this.drawMode === mode ? 'none' : mode;
    },
    updateTemplateContent(contentHtml) {
      this.template.contentHtml = buildInitialRichTextContent(contentHtml);
    },
    async persistTemplateContent(contentHtml) {
      this.updateTemplateContent(contentHtml);
      await this.persistConfig();
    },
    async applyTemplatePreset(presetKey) {
      const normalizedPresetKey = normalizeTemplatePresetKey(presetKey);
      const preset = TEMPLATE_PRESETS[normalizedPresetKey];
      this.template = {
        ...this.template,
        title: preset.title,
        contentHtml: preset.contentHtml,
      };
      await this.persistConfig();
    },
    async updateTextBox(box) {
      this.template.textBox = {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
      this.drawMode = 'none';
      await this.persistConfig();
    },
    async updateStampBox(box) {
      this.stamp.box = {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
      this.drawMode = 'none';
      await this.persistConfig();
    },
    setStampRandomizePosition(enabled) {
      const nextEnabled = Boolean(enabled);
      if (nextEnabled && !this.stamp.randomizePosition) {
        this.stamp.randomSeedNonce = Math.max(0, Number(this.stamp.randomSeedNonce) || 0) + 1;
      }
      this.stamp.randomizePosition = nextEnabled;
    },
    async refreshStampPreview() {
      if (this.stamp.source === 'generated' && this.stamp.content) {
        this.stamp.previewUrl = await generateStampPreviewUrl({
          text: this.stamp.content,
          fontKey: this.stamp.fontKey,
        });
        return;
      }
      if (this.stamp.imagePath) {
        this.stamp.previewUrl = (await window.applicationFormApi.readImageAsDataUrl(this.stamp.imagePath)) || '';
        return;
      }
      this.stamp.previewUrl = '';
    },
    async moveBox(type, box) {
      if (type === 'text-box') {
        await this.updateTextBox(box);
        return;
      }
      if (type === 'stamp-box') {
        await this.updateStampBox(box);
      }
    },
  },
});

export {
  buildBootstrapStamp,
  buildBootstrapTemplate,
};
