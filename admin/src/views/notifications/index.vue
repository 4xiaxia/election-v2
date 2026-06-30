<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">通知设置</h2>
      <p class="page-desc">按选举、按村居、按角色、按手机号定向发送通知，支持即时与定时</p>
    </header>

    <section class="block ctx-bar">
      <div class="ctx-left">
        <span class="ctx-label">当前选举</span>
        <el-select v-model="currentElectionId" placeholder="选择选举活动（必选）" @change="onElectionChange" style="width:240px">
          <el-option v-for="e in elections" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>
      <div class="ctx-info" v-if="ctxElection">
        <el-tag effect="plain">📅 {{ ctxElection.date }} {{ ctxElection.timeRange }}</el-tag>
        <el-tag effect="plain">📍 {{ ctxElection.village }}</el-tag>
        <el-tag effect="plain" type="warning">截止 {{ ctxElection.deadlineAt || ctxElection.date }} 前有效</el-tag>
      </div>
    </section>

    <!-- 未选活动时的提示 -->
    <div v-if="!currentElectionId" class="empty-hint">
      <p class="empty-icon">📨</p>
      <p class="empty-text">请先选择选举活动</p>
      <p class="empty-sub">选择活动后可查看和管理该活动的通知</p>
    </div>

    <template v-else>
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleSend">发送通知</el-button>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="filterType" @change="fetchNotifications">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="审核通知">审核</el-radio-button>
          <el-radio-button value="系统通知">系统</el-radio-button>
          <el-radio-button value="选举通知">选举</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table :data="tableData" v-loading="loading">
      <el-table-column prop="title" label="通知标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }"><el-tag effect="plain">{{ row.type }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="target" label="接收对象" min-width="160" show-overflow-tooltip />
      <el-table-column label="发送方式" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.sendMode==='定时'" effect="plain" type="warning">定时</el-tag>
          <el-tag v-else effect="plain" type="info">即时</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="定时发送时间" width="180">
        <template #default="{ row }"><span v-if="row.scheduledAt" class="num num-blue">{{ row.scheduledAt }}</span><span v-else class="dim">-</span></template>
      </el-table-column>
      <el-table-column prop="createdAt" label="发送时间" width="160">
        <template #default="{ row }">{{ (row.createdAt || '').slice(0, 16).replace('T', ' ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status==='已发送'?'success':row.status==='待发送'?'warning':'info'" effect="plain">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    </template>

    <!-- 发送通知弹窗 -->
    <el-dialog v-model="dialogVisible" title="发送通知" width="55%" destroy-on-close>
      <el-form :model="sendForm" label-width="100px">
        <el-form-item label="所属选举"><el-input :value="ctxElection?.name || '未选择'" disabled /></el-form-item>
        <el-form-item label="通知标题" required><el-input v-model="sendForm.title" placeholder="如：2025 选举材料提交提醒" /></el-form-item>
        <el-form-item label="通知类型" required>
          <el-select v-model="sendForm.type" style="width:100%">
            <el-option label="系统通知" value="系统通知" />
            <el-option label="审核通知" value="审核通知" />
            <el-option label="选举通知" value="选举通知" />
          </el-select>
        </el-form-item>

        <el-form-item label="接收对象" required>
          <div class="target-block">
            <el-radio-group v-model="sendForm.targetType" class="target-types">
              <el-radio-button value="all">全体</el-radio-button>
              <el-radio-button value="phone">按手机号</el-radio-button>
              <el-radio-button value="village">按村居</el-radio-button>
              <el-radio-button value="role">按角色</el-radio-button>
              <el-radio-button value="person">指定人员</el-radio-button>
            </el-radio-group>
            <el-input v-if="sendForm.targetType==='phone'" v-model="sendForm.phones" placeholder="多个手机号用逗号分隔，如 13800138000,13900139000" />
            <el-select v-else-if="sendForm.targetType==='village'" v-model="sendForm.targetVillage" placeholder="选择村居" style="width:100%" @change="(val: any) => { sendForm.targetVillageName = villages.find(v => v.id === val)?.name || ''; }">
              <el-option v-for="v in villages" :key="v.id" :label="v.name" :value="v.id" />
            </el-select>
            <!-- TODO: targetRole 当前 DB 存 name 文本，未来应改 roleId -->
            <el-select v-else-if="sendForm.targetType==='role'" v-model="sendForm.targetRole" placeholder="选择角色" style="width:100%">
              <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.name" />
            </el-select>
            <el-select v-else-if="sendForm.targetType==='person'" v-model="sendForm.userId" placeholder="选择人员" filterable style="width:100%" @change="(val: any) => { sendForm.target = admins.find(a => a.id === val)?.name || ''; }">
              <el-option v-for="a in admins" :key="a.id" :label="a.name" :value="a.id" />
            </el-select>
            <div v-else class="dim" style="margin-top:4px">将向本选举所有相关人员发送</div>
          </div>
        </el-form-item>

        <el-form-item label="发送方式" required>
          <el-radio-group v-model="sendForm.sendMode">
            <el-radio-button value="即时">即时发送</el-radio-button>
            <el-radio-button value="定时">定时发送</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="sendForm.sendMode==='定时'" label="定时时间" required>
          <el-date-picker v-model="sendForm.scheduledAt" type="datetime" placeholder="选择发送时间" style="width:100%" />
        </el-form-item>

        <el-form-item label="通知内容" required>
          <el-input v-model="sendForm.content" type="textarea" :rows="4" placeholder="如：您参选的本届选举活动将于 X 日开始，请准时参加。" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmSend">
          {{ sendForm.sendMode === '定时' ? '排定定时发送' : '立即发送' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看弹窗 -->
    <el-dialog v-model="viewVisible" :title="currentItem?.title" width="55%">
      <div v-if="currentItem" class="view-body">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="类型">{{ currentItem.type }}</el-descriptions-item>
          <el-descriptions-item label="接收对象">{{ currentItem.target }}</el-descriptions-item>
          <el-descriptions-item label="发送方式">{{ currentItem.sendMode || '即时' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentItem.scheduledAt" label="定时发送时间">{{ currentItem.scheduledAt }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentItem.status }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ currentItem.date }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">{{ currentItem.content }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getNotifications, createNotification, getElections, getVillages } from '@/api/api';

const loading = ref(false);
const submitting = ref(false);
const filterType = ref('');
const tableData = ref<any[]>([]);
const elections = ref<any[]>([]);
const villages = ref<any[]>([]);
const roles = ref<any[]>([
  { id: '超级管理', name: '超级管理' },
  { id: '经办', name: '经办' },
  { id: '审核', name: '审核' },
  { id: '运营', name: '运营' },
]);
const admins = ref<any[]>([]);      // 系统人员模块未迁移，先不阻塞通知列表加载
const currentElectionId = ref('');
const dialogVisible = ref(false);
const viewVisible = ref(false);
const currentItem = ref<any>(null);

const ctxElection = computed(() => elections.value.find((e: any) => e.id === currentElectionId.value));

const sendForm = reactive({
  title: '', type: '系统通知',
  targetType: 'all', target: '', phones: '', targetVillage: '', targetVillageName: '', targetRole: '',
  userId: '',          // 指定人员时存 admin.id（铁律2：引用字段绑 Id）
  sendMode: '即时', scheduledAt: '',
  content: '',
});

/* —— 加载选举列表、村居列表、角色列表、管理员列表（仅一次） —— */
async function loadMeta() {
  try {
    const [eleRes, vilRes] = await Promise.all([getElections(), getVillages()]);
    elections.value = eleRes.data?.list || [];
    villages.value = vilRes.data?.list || [];
    // 自动选中第一个活动（优先进行中的）
    if (elections.value.length) {
      const active = elections.value.find((e: any) => e.status === 'in_progress') || elections.value[0];
      currentElectionId.value = active.id;
      onElectionChange();
    }
  } catch { ElMessage.error('加载选举活动失败'); }
}

/* —— 加载通知列表（带 electionId 传给 API） —— */
async function fetchNotifications() {
  if (!currentElectionId.value) { tableData.value = []; return; }
  loading.value = true;
  try {
    const params: any = { electionId: currentElectionId.value };
    if (filterType.value) params.type = filterType.value;
    const res: any = await getNotifications(params);
    tableData.value = res.data?.list || [];
  } catch { ElMessage.error('加载失败'); }
  finally { loading.value = false; }
}

function onElectionChange() {
  fetchNotifications();
}

onMounted(loadMeta);

function handleSend() {
  if (!currentElectionId.value) { ElMessage.warning('请先选择选举活动'); return; }
  Object.assign(sendForm, { title: '', type: '系统通知', targetType: 'all', target: '', phones: '', targetVillage: '', targetVillageName: '', targetRole: '', userId: '', sendMode: '即时', scheduledAt: '', content: '' });
  dialogVisible.value = true;
}

async function handleConfirmSend() {
  if (!currentElectionId.value) { ElMessage.warning('请先选择选举活动'); return; }
  if (!sendForm.title || !sendForm.content) { ElMessage.warning('请填写标题和内容'); return; }
  if (sendForm.targetType === 'phone' && !sendForm.phones) { ElMessage.warning('请填写手机号'); return; }
  if (sendForm.sendMode === '定时' && !sendForm.scheduledAt) { ElMessage.warning('请选择定时时间'); return; }
  submitting.value = true;
  try {
    await createNotification({ ...sendForm, electionId: currentElectionId.value });
    ElMessage.success(sendForm.sendMode === '定时' ? '已排定定时发送' : '已发送');
    dialogVisible.value = false;
    fetchNotifications();
  } catch (err: any) { ElMessage.error(err?.message || '发送失败'); }
  finally { submitting.value = false; }
}

function handleView(row: any) { currentItem.value = row; viewVisible.value = true; }
</script>

<style scoped>
.page { max-width: 1200px; }
.page-head { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--line-light); }
.page-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 20px; font-weight: 600; color: var(--ink-black);
  margin: 0 0 4px; display: flex; align-items: center; gap: 10px;
}
.page-title::before { content:''; display:inline-block; width:6px; height:16px; background: var(--seal-red); border-radius: 0 2px 2px 0; }
.page-desc { font-size: 13px; color: var(--ink-light); margin: 0; }

.block {
  background: var(--paper-card);
  border: 1px solid var(--line-light);
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}

.ctx-bar { padding: 14px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.ctx-left { display: flex; align-items: center; gap: 10px; }
.ctx-label { font-family: 'Noto Serif SC', serif; font-size: 13px; font-weight: 600; color: var(--ink-blue); }
.ctx-info { display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto; }

.toolbar { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; flex-wrap: wrap; gap: 8px; }
.toolbar-left, .toolbar-right { display: flex; gap: 8px; }

.target-block { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.target-types { margin-bottom: 4px; }

.view-body { padding: 0 8px; }
.dim { color: var(--ink-light); font-size: 12px; }
.num { font-family: 'Noto Serif SC', serif; font-variant-numeric: tabular-nums; }
.num-blue { color: var(--ink-blue); font-weight: 600; }

/* 空状态提示 */
.empty-hint {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-light);
}
.empty-icon { font-size: 40px; margin: 0 0 12px; }
.empty-text { font-size: 16px; font-weight: 600; color: var(--ink-black); margin: 0 0 6px; }
.empty-sub { font-size: 13px; margin: 0; }
</style>
