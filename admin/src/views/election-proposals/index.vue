<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">{{ isSuperAdmin ? '选举提案审批' : '提案审批' }}</h2>
      <p class="page-desc">{{ isSuperAdmin ? '审批各村提交的选举活动申请' : '向上级提交选举活动申请' }}</p>
    </header>

    <section class="block">
      <div class="toolbar">
        <el-button v-if="!isSuperAdmin" type="primary" @click="openCreateDialog">+ 新建申请</el-button>
        <el-input v-model="searchKeyword" placeholder="搜索标题或村居" style="width:240px" clearable @input="loadList" />
        <el-select v-if="isSuperAdmin" v-model="statusFilter" placeholder="状态筛选" style="width:140px" clearable @change="loadList">
          <el-option label="待审核" value="待审核" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="选举活动ID" width="80">
          <template #header>选举活动ID<span class="field-hint">materials.id</span></template>
        </el-table-column>
        <el-table-column prop="villageName" label="申请村居" width="140" v-if="isSuperAdmin">
          <template #header>申请村居<span class="field-hint">villages.name(关联)</span></template>
        </el-table-column>
        <el-table-column prop="applicantName" label="提交人" width="100">
          <template #header>提交人<span class="field-hint">materials.applicant_name</span></template>
        </el-table-column>
        <el-table-column label="提案内容" min-width="200">
          <template #header>提案内容<span class="field-hint">materials.items(JSON)</span></template>
          <template #default="{ row }">
            <div class="proposal-summary">{{ getProposalSummary(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #header>提交时间<span class="field-hint">materials.created_at</span></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #header>状态<span class="field-hint">materials.status</span></template>
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-button v-if="isSuperAdmin && row.status === '待审核'" type="success" link size="small" @click="approve(row)">通过</el-button>
            <el-button v-if="isSuperAdmin && row.status === '待审核'" type="danger" link size="small" @click="reject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 新建/查看详情弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" destroy-on-close>
      <el-form :model="form" label-width="100px" :disabled="dialogMode === 'view'">
        <el-form-item label="提案标题">
          <el-input v-model="form.title" placeholder="如：XX村2024年村委会换届选举申请" />
        </el-form-item>
        <el-form-item label="文本报告">
          <el-input v-model="form.reportContent" type="textarea" :rows="8" 
            placeholder="1. 召开第一场村民代表会议，传达上级换届精神...&#10;2. 召开第二场村民会议，推选选委会...&#10;3. 确定选举日、选民登记日..." />
        </el-form-item>
        <el-form-item label="附件材料">
          <div class="attachments-list">
            <div v-for="(att, idx) in form.attachments" :key="idx" class="attachment-item">
              <el-input v-model="att.name" placeholder="文件名" style="width:200px" />
              <el-select v-model="att.category" placeholder="分类" style="width:160px">
                <el-option label="会议记录" value="会议记录" />
                <el-option label="数额安排表" value="数额安排表" />
                <el-option label="候选人提名表" value="候选人提名表" />
                <el-option label="选举结果报告" value="选举结果报告" />
              </el-select>
              <el-upload
                v-if="dialogMode !== 'view'"
                action="/api/upload/saveFile"
                :show-file-list="false"
                :on-success="(resp, file) => onAttachmentUploaded(resp, file, idx)"
                :on-error="onAttachmentUploadError"
              >
                <el-button size="small" plain>{{ att.url ? '重新上传' : '上传文件' }}</el-button>
              </el-upload>
              <a v-if="att.url" :href="att.url" target="_blank" class="attachment-link">{{ att.name || '查看文件' }}</a>
              <span v-else class="archive-hint">提交后进入历史归档</span>
              <el-button type="danger" link @click="removeAttachment(idx)">删除</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addAttachment" v-if="dialogMode !== 'view'">+ 添加附件</el-button>
          </div>
        </el-form-item>
        <el-form-item label="状态" v-if="dialogMode === 'view'">
          <el-tag :type="getStatusType(form.status)">{{ form.status }}</el-tag>
        </el-form-item>
        <el-form-item label="驳回理由" v-if="dialogMode === 'view' && form.rejectReason">
          <div class="reject-reason">{{ form.rejectReason }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogMode === 'create'" type="primary" @click="submitProposal">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 驳回理由弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回理由" width="500px" destroy-on-close>
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入驳回理由" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getElectionProposals, createElectionProposal, reviewElectionProposal } from '@/api/api';

const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') || {} } catch { return {} }
})();
const isSuperAdmin = computed(() => currentUser.role === '超级管理');

const loading = ref(false);
const list = ref<any[]>([]);
const searchKeyword = ref('');
const statusFilter = ref('');

const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'view'>('create');
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新建选举申请' : '提案详情');
const form = ref({
  title: '',
  reportContent: '',
  attachments: [] as Array<{ name: string; url: string; category: string; archivePath?: string }>,
  status: '待审核',
  rejectReason: '',
});

const rejectDialogVisible = ref(false);
const rejectReason = ref('');
const pendingRejectRow = ref<any>(null);

onMounted(() => {
  loadList();
});

async function loadList() {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) params.status = statusFilter.value;
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    const res: any = await getElectionProposals(params);
    list.value = res.data?.list || res.list || [];
  } catch (err) {
    console.error(err);
    ElMessage.error('加载提案列表失败');
  } finally {
    loading.value = false;
  }
}

function getProposalSummary(row: any) {
  try {
    return row.reportContent?.substring(0, 50) + '...' || '（无内容）';
  } catch {
    return '（无内容）';
  }
}

function getStatusType(status: string) {
  const map: any = { '待审核': 'warning', '已通过': 'success', '已驳回': 'danger' };
  return map[status] || 'info';
}

function openCreateDialog() {
  dialogMode.value = 'create';
  form.value = {
    title: '',
    reportContent: '',
    attachments: [],
    status: '待审核',
    rejectReason: '',
  };
  dialogVisible.value = true;
}

function viewDetail(row: any) {
  dialogMode.value = 'view';
  try {
    form.value = {
      title: row.title || '',
      reportContent: row.reportContent || '',
      attachments: row.attachments || [],
      status: row.status,
      rejectReason: row.rejectReason || '',
    };
  } catch {
    form.value = { title: '', reportContent: '', attachments: [], status: row.status, rejectReason: row.rejectReason || '' };
  }
  dialogVisible.value = true;
}

function addAttachment() {
  form.value.attachments.push({ name: '', url: '', category: '会议记录' });
}

function onAttachmentUploaded(resp: any, file: any, idx: number) {
  const att = form.value.attachments[idx];
  if (!att) return;
  att.name = att.name || resp?.data?.filename || file?.name || '';
  att.url = resp?.data?.url || '';
  ElMessage.success('附件已上传');
}

function onAttachmentUploadError() {
  ElMessage.error('附件上传失败');
}

function removeAttachment(idx: number) {
  form.value.attachments.splice(idx, 1);
}

async function submitProposal() {
  if (!form.value.title.trim() || !form.value.reportContent.trim()) {
    ElMessage.warning('请填写标题和文本报告');
    return;
  }
  const missingUpload = form.value.attachments.some((att) => !att.url);
  if (missingUpload) {
    ElMessage.warning('附件请先上传文件，不能手填或留空');
    return;
  }
  try {
    await createElectionProposal({
      villageId: currentUser.villageId || currentUser.village_id,
      title: form.value.title,
      reportContent: form.value.reportContent,
      attachments: form.value.attachments,
    });
    ElMessage.success('提案已提交，等待审批');
    dialogVisible.value = false;
    loadList();
  } catch (err) {
    console.error(err);
    ElMessage.error('提交失败');
  }
}

function approve(row: any) {
  ElMessage.confirm('确认通过该提案？', '提示', { type: 'warning' }).then(async () => {
    try {
      await reviewElectionProposal(row.id, { action: 'approve' });
      ElMessage.success('提案已通过');
      loadList();
    } catch {
      ElMessage.error('操作失败');
    }
  }).catch(() => {});
}

function reject(row: any) {
  pendingRejectRow.value = row;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回理由');
    return;
  }
  try {
    await reviewElectionProposal(pendingRejectRow.value.id, { action: 'reject', reason: rejectReason.value });
    ElMessage.success('提案已驳回');
    rejectDialogVisible.value = false;
    loadList();
  } catch {
    ElMessage.error('操作失败');
  }
}
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.proposal-summary { font-size: 13px; color: #666; line-height: 1.4; }
.attachments-list { display: flex; flex-direction: column; gap: 8px; }
.attachment-item { display: flex; gap: 8px; align-items: center; }
.attachment-link { color: #2563eb; font-size: 13px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.archive-hint { color: #a8a29e; font-size: 12px; }
.reject-reason { padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; color: #b91c1c; }
.field-hint { display:block; font-size:10px; color:#bbb; font-weight:400; font-family:Consolas,monospace; line-height:1.2; margin-top:2px; }
</style>
