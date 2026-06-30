<template>
  <div class="sidebar">
    <el-menu :default-active="currentRoute" router class="sidebar-menu">
      <div class="sidebar-head">选举工作台</div>
      <div class="sidebar-role">
        <el-tag effect="plain" size="small">{{ userRole }}</el-tag>
      </div>

      <el-menu-item index="/dashboard" v-if="canSee('dashboard')"><el-icon><HomeFilled /></el-icon><span>首页概览</span></el-menu-item>

      <!-- 一、选举前的基础准备 -->
      <el-menu-item-group title="基础准备" v-if="canSee('villages')">
        <el-menu-item index="/villages" v-if="canSee('villages')"><el-icon><Location /></el-icon><span>村居管理</span></el-menu-item>
      </el-menu-item-group>

      <!-- 二、选举办理主流程 -->
      <el-menu-item-group title="选举办理">
        <el-menu-item index="/election" v-if="canSee('election')"><el-icon><Tickets /></el-icon><span>选举管理</span></el-menu-item>
        <el-menu-item index="/positions" v-if="canSee('positions')"><el-icon><Postcard /></el-icon><span>职位管理</span></el-menu-item>
        <el-menu-item index="/materials" v-if="canSee('materials')"><el-icon><Document /></el-icon><span>材料审核</span></el-menu-item>
        <el-menu-item index="/candidates" v-if="canSee('candidates')"><el-icon><User /></el-icon><span>候选人管理</span></el-menu-item>
        <el-menu-item index="/approvals" v-if="canSee('approvals')"><el-icon><CircleCheck /></el-icon><span>审批管理</span></el-menu-item>
        <el-menu-item index="/notices" v-if="canSee('notices')"><el-icon><Bell /></el-icon><span>公告管理</span></el-menu-item>
        <el-menu-item index="/notifications" v-if="canSee('notifications')"><el-icon><ChatLineRound /></el-icon><span>通知设置</span></el-menu-item>
      </el-menu-item-group>

      <!-- 三、选举完成后的归档 -->
      <el-menu-item-group title="收尾归档" v-if="canSee('archives')">
        <el-menu-item index="/archives"><el-icon><Box /></el-icon><span>历史归档</span></el-menu-item>
      </el-menu-item-group>

      <!-- 四、系统管理 -->
      <el-menu-item-group title="系统管理" v-if="canSee('admins') || canSee('roles') || canSee('settings') || canSee('logs')">
        <el-menu-item index="/admins" v-if="canSee('admins')"><el-icon><UserFilled /></el-icon><span>系统人员</span></el-menu-item>
        <el-menu-item index="/roles" v-if="canSee('roles')"><el-icon><Key /></el-icon><span>角色权限</span></el-menu-item>
        <el-menu-item index="/settings" v-if="canSee('settings')"><el-icon><Setting /></el-icon><span>系统设置</span></el-menu-item>
        <el-menu-item index="/logs" v-if="canSee('logs')"><el-icon><List /></el-icon><span>操作日志</span></el-menu-item>
      </el-menu-item-group>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { HomeFilled, Location, Tickets, Postcard, User, Document, Bell, UserFilled, Setting, ChatLineRound, Box, List, Key, CircleCheck } from '@element-plus/icons-vue';

const route = useRoute();

// 角色 → 可见菜单映射
const roleMenuMap: Record<string, string[]> = {
  '超级管理': ['dashboard', 'villages', 'election', 'positions', 'materials', 'candidates', 'approvals', 'notices', 'notifications'],
  '经办': ['dashboard', 'villages', 'election', 'positions', 'materials', 'candidates', 'approvals', 'notices', 'notifications'],
  '审核': ['dashboard', 'election', 'materials', 'candidates', 'approvals', 'notices'],
  '运营': ['dashboard', 'election', 'candidates', 'notices', 'notifications'],
};

const userRole = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role || '经办';
  } catch { return '经办'; }
});

function canSee(menuKey: string): boolean {
  const allowed = roleMenuMap[userRole.value];
  if (!allowed) return false;
  return allowed.includes(menuKey);
}

const currentRoute = computed(() => {
  const p = route.path;
  if (p.startsWith('/election/')) return '/election';
  if (p.startsWith('/election')) return '/election';
  if (p.startsWith('/notices')) return '/notices';
  if (p.startsWith('/notifications')) return '/notifications';
  if (p.startsWith('/villages')) return '/villages';
  if (p.startsWith('/positions')) return '/positions';
  if (p.startsWith('/candidates')) return '/candidates';
  if (p.startsWith('/approvals')) return '/approvals';
  if (p.startsWith('/materials')) return '/materials';
  if (p.startsWith('/admins')) return '/admins';
  if (p.startsWith('/settings')) return '/settings';
  if (p.startsWith('/election-methods')) return '/election-methods';
  if (p.startsWith('/archives')) return '/archives';
  if (p.startsWith('/logs')) return '/logs';
  if (p.startsWith('/roles')) return '/roles';
  return '/' + p.split('/')[1];
});
</script>

<style scoped>
.sidebar {
  width: 200px;
  border-right: 1px solid var(--line-light);
  flex-shrink: 0;
  overflow-y: auto;
  background: var(--paper-card);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
}
.sidebar-head {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--seal-red);
  padding: 20px 20px 8px;
  letter-spacing: 4px;
  border-bottom: 2px solid var(--seal-red);
  margin-bottom: 4px;
  text-align: center;
}
.sidebar-role {
  text-align: center;
  padding: 6px 0 10px;
  border-bottom: 1px solid var(--line-light);
  margin-bottom: 8px;
}
.sidebar-menu { border-right: none; }
.sidebar-menu :deep(.el-menu-item) { font-size: 13px; height: 38px; line-height: 38px; }
.sidebar-menu :deep(.el-sub-menu__title) { font-size: 13px; height: 38px; line-height: 38px; font-weight: 600; }
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #fef9e7 !important;
  color: var(--seal-red) !important;
  font-weight: 600 !important;
  border-right: 3px solid var(--seal-red) !important;
}
.sidebar-menu :deep(.el-sub-menu .el-menu-item) { font-size: 12px; padding-left: 40px !important; min-width: 0; }
.sidebar-menu :deep(.el-sub-menu .el-menu-item.is-active) { font-weight: 600; }
</style>
