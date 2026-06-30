<template>
  <div class="layout">
    <TopBar />
    <div class="layout-body">
      <Sidebar />
      <div class="layout-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TopBar from './TopBar.vue';
import Sidebar from './Sidebar.vue';
</script>

<style scoped>
.layout { height: 100vh; display: flex; flex-direction: column; }
.layout-body { flex: 1; display: flex; overflow: hidden; }
.layout-content { flex: 1; overflow: auto; padding: 16px; }
</style>
