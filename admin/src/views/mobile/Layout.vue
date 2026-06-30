<template>
  <div class="m-layout">
    <header class="m-header">
      <span class="m-title">{{ route.meta.title || '选举助手' }}</span>
    </header>
    <main class="m-body">
      <router-view />
    </main>
    <nav class="m-tabs">
      <router-link v-for="t in tabs" :key="t.path" :to="t.path" class="m-tab" active-class="m-tab-active">
        <span class="m-tab-icon">{{ t.icon }}</span>
        <span class="m-tab-label">{{ t.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const tabs = [
  { icon:'🏠', label:'首页', path:'/m' },
  { icon:'📋', label:'公告', path:'/m/notices' },
  { icon:'🗳️', label:'选举', path:'/m/elections' },
  { icon:'👤', label:'候选人', path:'/m/candidates' },
];
</script>

<style scoped>
.m-layout { min-height:100vh; background:#f5f5f5; padding-bottom:56px }
.m-header { position:sticky; top:0; z-index:99; background:linear-gradient(135deg,#0d9488,#14b8a6); padding:12px 16px; text-align:center }
.m-title { font-size:16px; font-weight:700; color:#fff }
.m-body { padding:12px; min-height:calc(100vh - 108px) }
.m-tabs { position:fixed; bottom:0; left:0; right:0; height:52px; background:#fff; border-top:1px solid #e5e7eb; display:flex; justify-content:space-around; align-items:center; z-index:99 }
.m-tab { display:flex; flex-direction:column; align-items:center; gap:2px; text-decoration:none; color:#9ca3af; font-size:10px }
.m-tab-active { color:#0d9488 }
.m-tab-icon { font-size:20px }
.m-tab-label { font-size:10px }
</style>
