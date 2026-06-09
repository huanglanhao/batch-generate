<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle']);
const route = useRoute();
const items = [
  { to: '/workspace', label: '工作台', desc: '导表与模板' },
  { to: '/stamp', label: '盖章', desc: '位置与样式' },
  { to: '/exports', label: '记录', desc: '导出批次' },
];

const activePath = computed(() => route.path);
const toggleLabel = computed(() => (props.collapsed ? '展开左侧目录' : '收起左侧目录'));
</script>

<template>
  <aside class="sidebar-shell" :class="{ 'is-collapsed': collapsed }">
    <button
      type="button"
      class="sidebar-toggle"
      :aria-label="toggleLabel"
      :title="toggleLabel"
      @click="emit('toggle')"
    >
      <svg
        viewBox="0 0 16 16"
        class="sidebar-toggle-icon"
        :class="{ 'is-collapsed': collapsed }"
        aria-hidden="true"
      >
        <path
          d="M10.5 3.5L6 8l4.5 4.5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
        />
      </svg>
    </button>

    <div class="brand-block" :class="{ 'is-collapsed': collapsed }">
      <template v-if="collapsed">
        <p class="brand-mark">BG</p>
        <p class="brand-mini">申</p>
      </template>
      <template v-else>
        <p class="brand-mark">Batch Generator</p>
        <h2>统一申请书生成器</h2>
        <p class="brand-desc">
          批量生成申请模版，简单便捷、提高工作效率。
        </p>
      </template>
    </div>

    <nav class="nav-list">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{
          'is-active': activePath === item.to,
          'is-collapsed': collapsed,
        }"
        :title="collapsed ? item.label : ''"
      >
        <span class="nav-badge">{{ item.label.slice(0, 1) }}</span>
        <span v-if="!collapsed" class="nav-copy">
          <span class="nav-title">{{ item.label }}</span>
          <span class="nav-desc">{{ item.desc }}</span>
        </span>
      </RouterLink>
    </nav>
  </aside>
</template>
