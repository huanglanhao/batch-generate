<script setup>
import { useAppStore } from '../stores/app-store';

const appStore = useAppStore();
</script>

<template>
  <section class="panel card-stack">
    <div class="section-title-row">
      <div>
        <h2>导出记录</h2>
        <p>用于查看高清 PNG/JPG 批量导出结果与失败信息。</p>
      </div>
      <button class="secondary-btn" @click="appStore.openPath(appStore.outputDir)" :disabled="!appStore.outputDir">打开当前导出目录</button>
    </div>

    <div class="record-table" v-if="appStore.exportHistory.length">
      <div class="record-row record-head">
        <span>时间</span>
        <span>人数</span>
        <span>目录</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div class="record-row" v-for="item in appStore.exportHistory" :key="item.id">
        <span>{{ item.createdAt }}</span>
        <span>{{ item.successCount ?? item.totalCount }}/{{ item.totalCount }}</span>
        <span class="record-path">{{ item.outputDir }}</span>
        <span>
          <i class="status-dot" :class="item.status === 'success' ? 'ok' : 'pending'"></i>
          {{ item.status === 'success' ? '已完成' : (item.status === 'partial' ? '部分完成' : '待实现') }}
        </span>
        <span>
          <button class="text-btn" @click="appStore.openPath(item.outputDir)">打开目录</button>
        </span>
      </div>
    </div>

    <p class="empty-hint" v-else>当前还没有导出记录，可先在工作台配置模板和导入名单。</p>
  </section>
</template>
