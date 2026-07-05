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
  desc: '管理历年换届归档材料（scope=archive），按阶段/材料编号上传',
  addLabel: '+ 上传归档材料',
  columns: [
    { prop: 'stage_key',   label: '阶段',     width: '120' },
    { prop: 'material_no', label: '材料编号', width: '120' },
    { prop: 'applicant_name', label: '上报人', width: '100' },
    { prop: 'file_url',    label: '文件链接', minWidth: '200',
      render: (r: any) => r.file_url
        ? `<a href="${r.file_url}" target="_blank" class="el-link el-link--primary">查看文件</a>`
        : '—'
    },
    { prop: 'status',      label: '状态',     width: '90',
      tagMap: { '待审核': { type: 'warning', text: '待审核' }, '通过': { type: 'success', text: '已通过' }, '驳回': { type: 'danger', text: '已驳回' } }
    },
    { prop: 'created_at',  label: '上传时间', width: '150' },
  ],
  api: { list: getArchives, create: createArchive, update: updateArchive, delete: deleteArchive },
  searchFields: [
    { field: 'electionId', placeholder: '换届ID' },
    { field: 'stageKey',   placeholder: '阶段 key，如 S1' },
    { field: 'materialNo', placeholder: '材料编号，如 材料1' },
    { field: 'status', type: 'select', placeholder: '状态', options: [
      { label: '待审核', value: '待审核' }, { label: '通过', value: '通过' }, { label: '驳回', value: '驳回' },
    ]},
  ],
  formFields: [
    { field: 'electionId',   label: '换届ID',   required: true, placeholder: '例：1' },
    { field: 'stageKey',     label: '阶段Key',  required: true, placeholder: '例：S1' },
    { field: 'materialNo',   label: '材料编号', required: true, placeholder: '例：材料1' },
    { field: 'fileUrl',      label: '文件URL',  required: true, placeholder: 'https://...' },
    { field: 'applicantName', label: '上报人姓名', placeholder: '可选' },
    { field: 'applicantPhone', label: '上报人手机', placeholder: '可选' },
  ],
  selectable: true,
  showIndex: true,
  dialogWidth: '480px',
};

function downloadBlob(blob: any, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

async function exportSelected() {
  try {
    const electionId = selected.value[0]?.election_id;
    const blob: any = await exportArchives({ electionId });
    downloadBlob(blob, `归档台账${electionId ? '_' + electionId : ''}_${new Date().toISOString().slice(0,10)}.xlsx`);
    ElMessage.success(`已导出 ${selected.value.length} 条`);
  } catch (err: any) { ElMessage.error(err?.message || '导出失败'); }
}

async function exportFull() {
  try {
    const blob: any = await exportFullArchives();
    downloadBlob(blob, `综合台账_${new Date().toISOString().slice(0,10)}.xlsx`);
    ElMessage.success('已导出综合台账');
  } catch (err: any) { ElMessage.error(err?.message || '导出失败'); }
}
</script>
