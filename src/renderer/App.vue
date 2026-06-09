<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useRoute } from 'vue-router';
import SidebarNav from './components/SidebarNav.vue';
import { useAppStore } from './stores/app-store';

const SIDEBAR_COLLAPSE_STORAGE_KEY = 'pdd-app-form-sidebar-collapsed';

const appStore = useAppStore();
const route = useRoute();
const isCaptureLayout = computed(() => Boolean(route.meta?.captureLayout));
const isSidebarCollapsed = ref(false);

onMounted(() => {
  const savedSidebarState = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
  isSidebarCollapsed.value = savedSidebarState === 'true';
  if (!route.meta?.skipBootstrap) {
    appStore.bootstrap();
  }
});

watch(isSidebarCollapsed, (value) => {
  window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(value));
});

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}
</script>

<template>
  <div
    class="app-shell"
    :class="{
      'is-capture-layout': isCaptureLayout,
      'is-sidebar-collapsed': isSidebarCollapsed && !isCaptureLayout,
    }"
  >
    <SidebarNav
      v-if="!isCaptureLayout"
      :collapsed="isSidebarCollapsed"
      @toggle="toggleSidebar"
    />
    <main class="content-shell" :class="{ 'is-capture-layout': isCaptureLayout }">
      <RouterView />
    </main>
    <transition name="top-notice">
      <div
        v-if="appStore.notification.visible && !isCaptureLayout"
        class="top-notice"
        :class="`is-${appStore.notification.type}`"
      >
        {{ appStore.notification.message }}
      </div>
    </transition>
  </div>
</template>
