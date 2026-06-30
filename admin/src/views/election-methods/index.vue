<template>
  <div class="page">
    <h2 class="page-title">选举方式</h2>

    <div class="stat-cards">
      <div v-for="c in stats" :key="c.label" class="stat-card">
        <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
        <div class="stat-label">{{ c.label }}</div>
      </div>
    </div>

    <div class="method-layout">
      <div class="list-panel">
        <div class="toolbar">
          <el-button type="primary" size="small" @click="handleAdd">+ 新增选举方式</el-button>
          <el-radio-group v-model="filterStatus" size="small" @change="fetchData">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="待提交">待提交</el-radio-button>
            <el-radio-button value="已通过">已通过</el-radio-button>
            <el-radio-button value="已驳回">已驳回</el-radio-button>
          </el-radio-group>
        </div>
        <el-table :data="tableData" size="small" stripe border highlight-current-row @row-click="handleSelect" v-loading="loading">
          <el-table-column prop="name" label="选举方式" width="110" />
          <el-table-column prop="applicable" label="适用场景" min-width="160" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status==='已通过'?'success':row.status==='已驳回'?'danger':'warning'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approveDate" label="审批日期" width="100" />
        </el-table>
      </div>

      <div class="detail-panel" v-if="current">
        <div class="detail-header">
          <h3>{{ current.icon }} {{ current.name }}</h3>
          <el-tag size="small" :type="current.status==='已通过'?'success':current.status==='已驳回'?'danger':'warning'">{{ current.status }}</el-tag>
        </div>
        <el-form :model="editForm" label-width="80px" size="small">
          <el-form-item label="名称">
            <el-input v-model="editForm.name" />
          </el-form-item>
          <el-form-item label="说明">
            <el-input v-model="editForm.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="适用场景">
            <el-input v-model="editForm.applicable" />
          </el-form-item>
          <el-form-item label="图标">
            <el-input v-model="editForm.icon" style="width:80px" />
          </el-form-item>
          <el-form-item label="审批意见">
            <el-input v-model="editForm.approveOpinion" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="经办人">
            <el-input v-model="editForm.handler" />
          </el-form-item>
        </el-form>
        <div class="detail-actions">
          <el-button type="success" size="small" @click="handleApprove" :disabled="current.status==='已通过'">✅ 通过</el-button>
          <el-button type="danger" size="small" @click="handleReject" :disabled="current.status==='已驳回'">❌ 驳回</el-button>
          <el-button size="small" @click="handleSave">保存修改</el-button>
          <el-button type="danger" size="small" plain @click="handleDelete">删除</el-button>
        </div>
      </div>

      <div class="detail-empty" v-else>
        <p>请选择左侧选举方式查看详情</p>
      </div>
    </div>

    <el-dialog v-model="addDialog" title="新增选举方式" width="40%" destroy-on-close>
      <el-form :model="addForm" label-width="80px" size="small">
        <el-form-item label="名称" required>
          <el-input v-model="addForm.name" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="addForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="适用场景">
          <el-input v-model="addForm.applicable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialog=false">取消</el-button>
        <el-button type="primary" @click="handleAddSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getElectionMethods, createElectionMethod, updateElectionMethod, reviewElectionMethod, deleteElectionMethod } from '@/api/api';

const loading = ref(false);
const submitting = ref(false);
const filterStatus = ref('');
const tableData = ref<any[]>([]);
const current = ref<any>(null);
const editForm = reactive({ name: '', description: '', applicable: '', icon: '', approveOpinion: '', handler: '' });
const addDialog = ref(false);
const addForm = reactive({ name: '', description: '', applicable: '' });

const stats = ref([
  { label: '全部', value: '0', color: '#0d9488' },
  { label: '已通过', value: '0', color: '#16a34a' },
  { label: '待提交', value: '0', color: '#ca8a04' },
  { label: '已驳回', value: '0', color: '#dc2626' },
]);

async function fetchData() {
  loading.value = true;
  try {
    const res: any = await getElectionMethods({ status: filterStatus.value || undefined });
    const data = res.data || [];
    tableData.value = data;
    stats.value = [
      { label: '全部', value: String(data.length), color: '#0d9488' },
      { label: '已通过', value: String(data.filter((m: any) => m.status === '已通过').length), color: '#16a34a' },
      { label: '待提交', value: String(data.filter((m: any) => m.status === '待提交').length), color: '#ca8a04' },
      { label: '已驳回', value: String(data.filter((m: any) => m.status === '已驳回').length), color: '#dc2626' },
    ];
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false; }
}

onMounted(fetchData);

function handleSelect(row: any) {
  current.value = row;
  Object.assign(editForm, {
    name: row.name, description: row.description || '',
    applicable: row.applicable || '', icon: row.icon || '📋',
    approveOpinion: row.approveOpinion || '', handler: row.handler || '',
  });
}

async function handleApprove() {
  await reviewElectionMethod(current.value.id, {
    action: 'approve', approveOpinion: editForm.approveOpinion, handler: editForm.handler,
  });
  ElMessage.success('已通过');
  fetchData();
}

async function handleReject() {
  await reviewElectionMethod(current.value.id, {
    action: 'reject', approveOpinion: editForm.approveOpinion,
  });
  ElMessage.success('已驳回');
  current.value = null;
  fetchData();
}

async function handleSave() {
  await updateElectionMethod(current.value.id, editForm);
  ElMessage.success('保存成功');
  fetchData();
}

function handleAdd() {
  Object.assign(addForm, { name: '', description: '', applicable: '' });
  addDialog.value = true;
}

async function handleAddSubmit() {
  if (!addForm.name) { ElMessage.warning('请填写名称'); return; }
  submitting.value = true;
  try {
    await createElectionMethod(addForm);
    ElMessage.success('新增成功');
    addDialog.value = false;
    fetchData();
  } finally { submitting.value = false; }
}

async function handleDelete() {
  if (!current.value) return;
  if (!confirm(`确定删除「${current.value.name}」？`)) return;
  try {
    await deleteElectionMethod(current.value.id);
    ElMessage.success('已删除');
    current.value = null;
    fetchData();
  } catch { ElMessage.error('删除失败'); }
}
</script>

<style scoped>
.page { max-width: 1100px; }
.page-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
.stat-value { font-size: 22px; font-weight: 700; }
.stat-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
.method-layout { display: flex; gap: 16px; height: calc(100vh - 230px); }
.list-panel { width: 55%; overflow: auto; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.detail-panel {
  width: 45%; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 8px; overflow: auto; padding: 16px;
}
.detail-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;
}
.detail-header h3 { font-size: 14px; font-weight: 700; }
.detail-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
.detail-empty {
  width: 45%; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  color: #9ca3af; font-size: 13px;
}
</style>
