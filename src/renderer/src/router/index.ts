import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
    { path: '/data', name: 'data-browser', component: () => import('../views/DataBrowserView.vue') },
    { path: '/live', name: 'live-monitor', component: () => import('../views/LiveMonitorView.vue') },
    {
      path: '/signal',
      name: 'signal-analysis',
      component: () => import('../views/SignalAnalysisView.vue')
    },
    {
      path: '/spectrum',
      name: 'spectrum-analysis',
      component: () => import('../views/SpectrumAnalysisView.vue')
    },
    {
      path: '/markers',
      name: 'marker-manager',
      component: () => import('../views/MarkerManagerView.vue')
    },
    {
      path: '/generator',
      name: 'data-generator',
      component: () => import('../views/DataGeneratorView.vue')
    },
    { path: '/tasks', name: 'task-manager', component: () => import('../views/TaskManagerView.vue') },
    { path: '/logs', name: 'log-viewer', component: () => import('../views/LogViewerView.vue') },
    {
      path: '/project-settings',
      name: 'project-settings',
      component: () => import('../views/ProjectSettingsView.vue')
    },
    {
      path: '/app-settings',
      name: 'app-settings',
      component: () => import('../views/ApplicationSettingsView.vue')
    }
  ]
})

export default router
