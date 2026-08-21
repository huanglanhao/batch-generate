<script setup>
import { computed, ref } from 'vue';
import { useAppStore } from '../stores/app-store';

const STATUS_LABELS = {
  matched: '已还原',
  alreadyFull: '已是完整号码',
  unmatched: '未匹配',
  ambiguous: '多个匹配',
  unrecognized: '无法识别',
};

const appStore = useAppStore();
const sourceFile = ref(null);
const targetFile = ref(null);
const previewRows = ref([]);
const summary = ref(null);
const exporting = ref(false);

const canExport = computed(() => Boolean(sourceFile.value?.filePath && targetFile.value?.filePath && previewRows.value.length));

function fileNameFromPath(filePath) {
  return String(filePath || '').split(/[/\\]/).pop() || '';
}

function statusLabel(status) {
  return STATUS_LABELS[status] || '无法识别';
}

function displayValue(row) {
  if (row.status === 'matched') return row.matched;
  return row.original;
}

async function refreshPreview() {
  if (!sourceFile.value?.filePath || !targetFile.value?.filePath) {
    previewRows.value = targetFile.value?.rows || [];
    summary.value = null;
    return;
  }

  const result = await window.applicationFormApi.analyzePhoneMatch({
    sourceFilePath: sourceFile.value.filePath,
    targetFilePath: targetFile.value.filePath,
  });
  previewRows.value = result.rows || [];
  summary.value = result.summary || null;
}

async function importSourceWorkbook() {
  try {
    const filePath = await window.applicationFormApi.selectExcelFile();
    if (!filePath) return;
    const parsed = await window.applicationFormApi.parsePhoneSourceWorkbook(filePath);
    sourceFile.value = {
      ...parsed,
      fileName: fileNameFromPath(parsed.filePath),
    };
    await refreshPreview();
    appStore.showNotification(`已导入 ${parsed.count} 个手机号`);
  } catch (error) {
    window.alert(`导入手机号表格失败：${error?.message || '未知错误'}`);
  }
}

async function importTargetWorkbook() {
  try {
    const filePath = await window.applicationFormApi.selectExcelFile();
    if (!filePath) return;
    const parsed = await window.applicationFormApi.parsePhoneTargetWorkbook(filePath);
    targetFile.value = {
      ...parsed,
      fileName: fileNameFromPath(parsed.filePath),
    };
    await refreshPreview();
    appStore.showNotification(`已识别 ${parsed.count} 条店铺手机号`);
  } catch (error) {
    window.alert(`导入匹配手机号表格失败：${error?.message || '未知错误'}`);
  }
}

async function exportMatchedWorkbook() {
  if (!canExport.value || exporting.value) return;
  exporting.value = true;
  try {
    const result = await window.applicationFormApi.exportMatchedPhoneWorkbook({
      sourceFilePath: sourceFile.value.filePath,
      targetFilePath: targetFile.value.filePath,
    });
    if (!result) return;
    previewRows.value = result.rows || previewRows.value;
    summary.value = result.summary || summary.value;
    appStore.showNotification(`已导出匹配结果，还原 ${result.summary?.matched || 0} 个手机号`);
  } catch (error) {
    window.alert(`导出匹配结果失败：${error?.message || '未知错误'}`);
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <section class="panel card-stack">
    <div class="section-title-row">
      <div>
        <h2>手机号匹配</h2>
        <p>导入完整手机号表后，再导入带星号的店铺手机号表。系统会按前三位和后四位还原「店铺手机号」，导出时仅替换该列。</p>
      </div>
      <div class="section-actions">
        <button class="primary-btn" type="button" @click="importSourceWorkbook">导入手机号表格</button>
        <button class="primary-btn" type="button" @click="importTargetWorkbook">导入匹配手机号表格</button>
        <button class="primary-btn" type="button" :disabled="!canExport || exporting" @click="exportMatchedWorkbook">
          {{ exporting ? '导出中...' : '导出匹配结果' }}
        </button>
      </div>
    </div>

    <div class="page-grid page-grid-wide">
      <div class="info-box">
        <span class="info-label">手机号表格</span>
        <strong>{{ sourceFile?.fileName || '未导入' }}</strong>
        <p>{{ sourceFile ? `已识别 ${sourceFile.count} 个完整手机号` : '参考仅含 11 位手机号的表格，可无表头。' }}</p>
      </div>
      <div class="info-box">
        <span class="info-label">匹配手机号表格</span>
        <strong>{{ targetFile?.fileName || '未导入' }}</strong>
        <p>
          {{ targetFile
            ? `已识别「${targetFile.columnName}」列，共 ${targetFile.count} 条`
            : '将识别表格中的「店铺手机号」列，例如 187****0983。' }}
        </p>
      </div>
    </div>

    <div v-if="summary" class="compact-info">
      <span class="pill">已还原 {{ summary.matched }}</span>
      <span class="pill">未匹配 {{ summary.unmatched }}</span>
      <span class="pill">多个匹配 {{ summary.ambiguous }}</span>
    </div>

    <div class="record-table match-result-table" v-if="previewRows.length">
      <div class="record-row record-head match-result-row">
        <span>行号</span>
        <span>原店铺手机号</span>
        <span>匹配结果</span>
        <span>状态</span>
      </div>
      <div class="record-row match-result-row" v-for="row in previewRows" :key="`${row.sheetName}-${row.rowIndex}`">
        <span>{{ row.rowIndex }}</span>
        <span>{{ row.original }}</span>
        <span>{{ displayValue(row) }}</span>
        <span>
          <i class="status-dot" :class="{
            ok: row.status === 'matched' || row.status === 'already-full',
            pending: row.status === 'ambiguous',
            warn: row.status === 'unmatched' || row.status === 'unrecognized',
          }"></i>
          {{ statusLabel(row.status) }}
        </span>
      </div>
    </div>

    <p class="empty-hint" v-else>请先导入手机号表格和匹配手机号表格，识别结果会显示在这里。</p>
  </section>
</template>

<style scoped>
.match-result-row {
  grid-template-columns: 80px 1fr 1fr 140px;
}
</style>
