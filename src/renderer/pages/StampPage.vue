<script setup>
import DocumentPreviewCard from '../components/DocumentPreviewCard.vue';
import { useAppStore } from '../stores/app-store';

const appStore = useAppStore();
</script>

<template>
  <div class="page-grid page-grid-wide">
    <section class="panel card-stack">
      <div class="section-title-row">
        <div>
          <h2>印章资源</h2>
          <p>建议导入透明背景 PNG。实际画框与定位操作已整合到“文档生成工作台”页面。</p>
        </div>

      </div>

      <div class="info-box info-box-inline stamp-file-box">
        <span class="info-label">印章文件</span>
        <strong class="stamp-file-path">{{ appStore.stamp.imagePath || '未导入盖章图片' }}</strong>
        <button
          v-if="appStore.stamp.imagePath"
          type="button"
          class="stamp-file-remove-btn"
          title="删除印章文件"
          aria-label="删除印章文件"
          @click="appStore.clearStampFile"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v7h-2v-7Zm4 0h2v7h-2v-7ZM7 10h2v7H7v-7Zm-1 10h12l1-12H5l1 12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div class="field-grid two-columns">
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

      <label class="field-checkbox">
        <input v-model="appStore.stamp.randomizePosition" type="checkbox" />
        <span>盖章在框内随机位置显示，取消勾选则居中显示</span>
      </label>

      <div class="section-actions stamp-actions">
         <button class="primary-btn" @click="appStore.selectStampFile">导入盖章</button>
        <button class="primary-btn stamp-save-btn" @click="appStore.persistConfig">保存盖章配置</button>
      </div>
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
.stamp-file-box {
  grid-template-columns: 96px minmax(0, 1fr) auto;
}

.stamp-file-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.stamp-save-btn {
  padding: 4px 12px;
  align-self: flex-start;
  line-height: 1;
}
</style>
