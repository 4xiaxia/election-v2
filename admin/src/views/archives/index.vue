<template>
  <CrudPage :config="c" @selection-change="onSelect">
    <template #toolbar>
      <el-button type="primary" :disabled="!selected.length" @click="exportSelected">导出选中 ({{ selected.length }})</el-button>
      <el-button @click="exportFull">导出综合台账</el-button>
    </template>
  </CrudPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getArchives, createArchive, updateArchive, deleteArchive, exportArchives, exportFullArchives } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';

const selected = ref<any[]>([]);
function onSelect(rows: any[]) { selected.value = rows; }

const c = {
  title: '历史归档',
  desc: '管理历年选举档案，可按年份/类型筛选，导出 Excel 台账',
  addLabel: '+ 新增档案',
  columns: [
    { prop: 'name', label: '档案名称', minWidth: '240' },
    { prop: 'year', label: '年份', width: '100', render: (r: any) => r.year },
    { prop: 'type', label: '类型', width: '100', tagMap: { election: { type: 'primary', text: '选举' }, candidate: { type: 'success', text: '候选' }, material: { type: 'info', text: '材料' } } },
    { prop: 'fileCount', label: '文件数', width: '90', align: 'center' },
    { prop: 'date', label: '归档日期', width: '130' },
  ],
  api: { list: getArchives, create: createArchive, update: updateArchive, delete: deleteArchive },
  searchFields: [
    { field: 'year', type: 'select', placeholder: '年份', options: [
      { label: '2025', value: '2025' }, { label: '2022', value: '2022' }, { label: '2019', value: '2019' }, { label: '2016', value: '2016' },
    ]},
    { field: 'type', type: 'select', placeholder: '类型', options: [
      { label: '选举', value: 'election' }, { label: '候选', value: 'candidate' }, { label: '材料', value: 'material' },
    ]},
    { field: 'keyword', placeholder: '搜索档案名...' },
  ],
  selectable: true,
  showIndex: true,
  dialogWidth: '40%',
};

function downloadBlob(blob: any, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

async function exportSelected() {
  try {
    const year = selected.value[0]?.year;
    const blob: any = await exportArchives({ year });
    downloadBlob(blob, `归档台账${year ? '_' + year : ''}_${new Date().toISOString().slice(0,10)}.xlsx`);
    ElMessage.success(`已导出 ${selected.value.length} 条`);
  } catch (err: any) { ElMessage.error(err?.message || '导出失败'); }
}

async function exportFull() {
  try {
    const blob: any = await exportFullArchives();
    downloadBlob(blob, `综合台账_${new Date().toISOString().slice(0,10)}.xlsx`);
    ElMessage.success('已导出综合台账（含档案/选举/候选人/材料/公告 5 个 Sheet）');
  } catch (err: any) { ElMessage.error(err?.message || '导出失败'); }
}
</script>
