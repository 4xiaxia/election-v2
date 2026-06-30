import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';

// 角色权限矩阵：每个路由声明允许的角色列表
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '系统登录' },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '首页概览', roles: ['超级管理', '经办', '审核', '运营'] } },
      { path: 'villages', name: 'Villages', component: () => import('@/views/villages/index.vue'), meta: { title: '村居管理', roles: ['超级管理', '经办'] } },
      { path: 'election', name: 'Election', component: () => import('@/views/election/index.vue'), meta: { title: '选举管理', roles: ['超级管理', '经办', '审核', '运营'] } },
      { path: 'election/:id', name: 'ElectionDetail', component: () => import('@/views/election/detail.vue'), meta: { title: '选举详情', roles: ['超级管理', '经办', '审核', '运营'] } },
      { path: 'positions', name: 'Positions', component: () => import('@/views/positions/index.vue'), meta: { title: '职位管理', roles: ['超级管理', '经办'] } },
      { path: 'candidates', name: 'Candidates', component: () => import('@/views/candidates/index.vue'), meta: { title: '候选人管理', roles: ['超级管理', '经办', '审核', '运营'] } },
      { path: 'approvals', name: 'Approvals', component: () => import('@/views/approvals/index.vue'), meta: { title: '审批管理', roles: ['超级管理', '经办', '审核'] } },
      { path: 'materials', name: 'Materials', component: () => import('@/views/materials/index.vue'), meta: { title: '材料审核', roles: ['超级管理', '经办', '审核'] } },
      { path: 'notices', name: 'Notices', component: () => import('@/views/notices/index.vue'), meta: { title: '公告管理', roles: ['超级管理', '经办', '运营'] } },
      { path: 'notifications', name: 'Notifications', component: () => import('@/views/notifications/index.vue'), meta: { title: '通知设置', roles: ['超级管理', '经办', '运营'] } },
      { path: 'election-methods', name: 'ElectionMethods', component: () => import('@/views/election-methods/index.vue'), meta: { title: '选举方式', roles: ['超级管理', '经办'] } },
      { path: 'archives', name: 'Archives', component: () => import('@/views/archives/index.vue'), meta: { title: '历史归档', roles: ['超级管理', '经办', '运营'] } },
      { path: 'admins', name: 'Admins', component: () => import('@/views/admins/index.vue'), meta: { title: '系统人员', roles: ['超级管理'] } },
      { path: 'roles', name: 'Roles', component: () => import('@/views/roles/index.vue'), meta: { title: '角色权限', roles: ['超级管理'] } },
      { path: 'settings', name: 'Settings', component: () => import('@/views/settings/index.vue'), meta: { title: '系统设置', roles: ['超级管理'] } },
      { path: 'logs', name: 'Logs', component: () => import('@/views/logs/index.vue'), meta: { title: '操作日志', roles: ['超级管理', '经办'] } },
    ],
  },
  // ===== 移动端 H5（手机布局，无需登录） =====
  {
    path: '/m',
    component: () => import('@/views/mobile/Layout.vue'),
    children: [
      { path: '', name: 'MHome', component: () => import('@/views/mobile/Home.vue'), meta: { title: '选举助手' } },
      { path: 'notices', name: 'MNotices', component: () => import('@/views/mobile/Notices.vue'), meta: { title: '公告' } },
      { path: 'elections', name: 'MElections', component: () => import('@/views/mobile/Elections.vue'), meta: { title: '选举方式' } },
      { path: 'candidates', name: 'MCandidates', component: () => import('@/views/mobile/Candidates.vue'), meta: { title: '候选人' } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  // 移动端 H5 无需登录
  if (to.path.startsWith('/m')) { next(); return; }
  if (to.path !== '/login' && !token) {
    next('/login');
    return;
  }
  // 角色权限守卫
  if (to.meta.roles && token) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user?.role && !(to.meta.roles as string[]).includes(user.role)) {
        next('/dashboard');
        return;
      }
    } catch {}
  }
  next();
});

export default router;
