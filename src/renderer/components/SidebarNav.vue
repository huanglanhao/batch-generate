<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import appLogo from '../assets/logo/logo.png';
import { useAppStore } from '../stores/app-store';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle']);
const appStore = useAppStore();
const route = useRoute();
const items = [
  { to: '/workspace', label: '工作台', desc: '导表与模板' },
  { to: '/stamp', label: '盖章', desc: '位置与样式' },
  { to: '/exports', label: '记录', desc: '导出批次' },
];

const activePath = computed(() => route.path);
const toggleLabel = computed(() => (props.collapsed ? '展开左侧目录' : '收起左侧目录'));
const versionLabel = computed(() => {
  const version = String(appStore.meta?.version || '').trim();
  return version ? `v${version}` : '';
});
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

    <div v-if="!collapsed" class="brand-block">
      <p class="brand-mark">Batch Generator</p>
      <h2>批量申请书生成器</h2>
      <p class="brand-desc">
        批量生成申请模版，简单便捷、提高工作效率。
      </p>
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

    <footer v-if="versionLabel" class="sidebar-version" :class="{ 'is-collapsed': collapsed }">
      <span v-if="!collapsed" class="sidebar-version-label">当前版本</span>
      <strong>{{ versionLabel }}</strong>
    </footer>
  </aside>
</template>
