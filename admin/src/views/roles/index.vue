<template><CrudPage :config="c" /></template>
<script setup lang="ts">
import { getRoles, createRole, updateRole, deleteRole } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';
const c = {
  title: '角色管理', desc: '管理系统角色及权限',
  columns: [
    { prop: 'name', label: '角色名', minWidth: '140' },
    { prop: 'description', label: '描述', minWidth: '200' },
    { prop: 'count', label: '人数', width: '80', align: 'center' },
  ],
  formFields: [
    { field: 'name', label: '角色名', required: true, placeholder: '输入角色名称' },
    { field: 'description', label: '描述', type: 'textarea', placeholder: '角色职责描述' },
  ],
  api: { list: getRoles, create: createRole, update: updateRole, delete: deleteRole },
};
</script>
