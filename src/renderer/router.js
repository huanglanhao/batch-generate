import { createRouter, createWebHashHistory } from 'vue-router';
import WorkspacePage from './pages/WorkspacePage.vue';
import StampPage from './pages/StampPage.vue';
import ExportsPage from './pages/ExportsPage.vue';
import CaptureExportPage from './pages/CaptureExportPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/workspace' },
    { path: '/workspace', component: WorkspacePage },
    { path: '/stamp', component: StampPage },
    { path: '/exports', component: ExportsPage },
    { path: '/capture-export', component: CaptureExportPage, meta: { captureLayout: true, skipBootstrap: true } },
  ],
});

export default router;
