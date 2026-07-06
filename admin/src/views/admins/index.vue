<template><CrudPage :config="c" /></template>
<script setup lang="ts">
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getRoles, getVillages } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';
import { ref, onMounted } from 'vue';

const roles = ref<any[]>([]);
const roleOptions = ref<{label: string; value: string}[]>([]);
const villageOptions = ref<{label: string; value: number}[]>([]);

onMounted(async () => {
  try {
    const res: any = await getRoles();
    roles.value = res.data || res || [];
    roleOptions.value = roles.value.map((r: any) => ({ label: r.name, value: r.name }));
  } catch {}
  
  try {
    const res: any = await getVillages();
    const villages = res.data?.list || res.list || res.data || [];
    villageOptions.value = villages.map((v: any) => ({ label: v.name, value: v.id }));
  } catch {}
});

const c = {
  title: '管理员', desc: '管理系统管理员账号（四档角色：超级管理/经办/审核/运营）',
  columns: [
    { prop: 'name', label: '姓名', minWidth: '120', fieldHint: 'users.name' },
    { prop: 'role', label: '角色', width: '120', fieldHint: 'users.role', tagMap: {
      '超级管理': { type: 'danger', text: '超级管理' },
      '经办': { type: 'warning', text: '经办' },
      '审核': { type: 'success', text: '审核' },
      '运营': { type: 'info', text: '运营' },
    } },
    { prop: 'villageName', label: '所属村居', width: '140', fieldHint: 'villages.name(关联)' },
    { prop: 'phone', label: '手机号', width: '140', fieldHint: 'users.phone' },
    { prop: 'lastLoginAt', label: '最近登录', width: '160', fieldHint: 'users.last_login_at' },
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
    { field: 'villageId', label: '所属村居', type: 'select', placeholder: '超级管理不绑定村居，其他角色必选',
      options: villageOptions },
    { field: 'password', label: '密码', type: 'password', placeholder: '新建必填，编辑留空不修改' },
    { field: 'phone', label: '手机号', placeholder: '输入手机号' },
  ],
  api: { list: getAdmins, create: createAdmin, update: updateAdmin, delete: deleteAdmin },
};
</script>
