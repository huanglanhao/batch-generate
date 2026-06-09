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
        <button class="primary-btn" @click="appStore.selectStampFile">导入盖章图片</button>
      </div>

      <div class="info-box info-box-inline">
        <span class="info-label">印章文件</span>
        <strong>{{ appStore.stamp.imagePath || '未导入盖章图片' }}</strong>
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

      <div class="section-actions">
        <button class="secondary-btn" @click="appStore.persistConfig">保存盖章配置</button>
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
