<template><CrudPage :config="c" /></template>
<script setup lang="ts">
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getRoles } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';
import { ref, onMounted } from 'vue';

const roles = ref<any[]>([]);
const roleOptions = ref<{label: string; value: string}[]>([]);

onMounted(async () => {
  try {
    const res: any = await getRoles();
    roles.value = res.data || res || [];
    roleOptions.value = roles.value.map((r: any) => ({ label: r.name, value: r.name }));
  } catch {}
});

const c = {
  title: '管理员', desc: '管理系统管理员账号（四档角色：超级管理/经办/审核/运营）',
  columns: [
    { prop: 'name', label: '姓名', minWidth: '120' },
    { prop: 'role', label: '角色', width: '120', tagMap: {
      '超级管理': { type: 'danger', text: '超级管理' },
      '经办': { type: 'warning', text: '经办' },
      '审核': { type: 'success', text: '审核' },
      '运营': { type: 'info', text: '运营' },
    } },
    { prop: 'phone', label: '手机号', width: '140' },
    { prop: 'lastLoginAt', label: '最近登录', width: '160' },
  ],
  formFields: [
    { field: 'name', label: '姓名', required: true, placeholder: '输入姓名' },
    { field: 'role', label: '角色', type: 'select', required: true, placeholder: '选择角色',
      options: [
        { label: '超级管理', value: '超级管理' },
        { label: '经办', value: '经办' },
        { label: '审核', value: '审核' },
        { label: '运营', value: '运营' },
      ] },
    { field: 'password', label: '密码', type: 'password', placeholder: '新建必填，编辑留空不修改' },
    { field: 'phone', label: '手机号', placeholder: '输入手机号' },
  ],
  api: { list: getAdmins, create: createAdmin, update: updateAdmin, delete: deleteAdmin },
};
</script>
