<template>
  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-logo">选</div>
      <span class="topbar-title">城厢区村居换届选举管理系统</span>
    </div>
    <div class="topbar-right">
      <el-badge :value="3" class="topbar-badge">
        <el-icon :size="16"><Bell /></el-icon>
      </el-badge>
      <span class="topbar-user">管理员</span>
      <el-avatar :size="28" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue';
</script>

<style scoped>
.topbar {
  height: 48px; background: #fff; border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 8px; }
.topbar-logo {
  width: 28px; height: 28px; background: #0d9488; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700;
}
.topbar-title { font-size: 12px; font-weight: 700; color: #374151; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.topbar-badge { cursor: pointer; }
.topbar-user { font-size: 12px; color: #6b7280; }
</style>
