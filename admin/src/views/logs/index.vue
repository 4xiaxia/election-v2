<template><CrudPage :config="c" :showActions="false" /></template>
<script setup lang="ts">
import { getOperationLogs } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';
const c = {
  title: '操作日志', desc: '查看系统操作记录（只读）',
  columns: [
    { prop: 'createdAt', label: '时间', width: '160', fieldHint: 'logs.created_at' },
    { prop: 'actorName', label: '操作人', width: '100', fieldHint: 'logs.actor_name' },
    { prop: 'action', label: '操作', width: '100', fieldHint: 'logs.action' },
    { prop: 'module', label: '模块', width: '120', fieldHint: 'logs.module' },
    { prop: 'detail', label: '详情', minWidth: '150', fieldHint: 'logs.detail' },
  ],
  api: { list: getOperationLogs, create: async()=>{}, update: async()=>{}, delete: async()=>{} },
  showPagination: true, toolbar: false,
};
</script>
