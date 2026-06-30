<template>
  <CrudPage :config="c" />
</template>

<script setup lang="ts">
import { getVillages, createVillage, updateVillage, deleteVillage } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';

const c = {
  title: '村居管理',
  desc: '管理城厢区下辖的村（社区）',
  columns: [
    { prop: 'name', label: '名称', minWidth: '160' },
    { prop: 'type', label: '类型', width: '100', tagMap: { '村委会': { type: 'warning', text: '村委会' }, '居委会': { type: 'success', text: '居委会' } } },
  ],
  api: { list: getVillages, create: createVillage, update: updateVillage, delete: deleteVillage },
  searchFields: [
    { field: 'type', type: 'select', placeholder: '类型', options: [{ label: '村委会', value: '村委会' }, { label: '居委会', value: '居委会' }] },
  ],
  formFields: [
    { field: 'name', label: '村居名称', type: 'input', required: true, placeholder: '如：龙桥社区' },
    { field: 'type', label: '类型', type: 'select', required: true, options: [{ label: '村委会', value: '村委会' }, { label: '居委会', value: '居委会' }], defaultValue: '村委会' },
  ],
};
</script>
