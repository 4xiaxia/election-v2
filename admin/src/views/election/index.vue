<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">选举管理</h2>
      <p class="page-desc">点击表格中的选举名称，进入该选举的详情管理页（包含职位、候选人、公告、材料、通知）</p>
    </header>

    <div class="stat-cards">
      <div v-for="c in stats" :key="c.label" class="stat-card">
        <div class="stat-value">{{ c.value }}</div>
        <div class="stat-label">{{ c.label }}</div>
      </div>
    </div>

    <div class="list-panel">
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">＋ 新增选举</el-button>
        <el-input v-model="keyword" placeholder="搜索选举名称或村居..." clearable style="width:240px" />
        <span class="filter-hint">筛选锚点：elections.name / villages.name(关联)</span>
      </div>
      <el-table :data="filteredElections" highlight-current-row @row-click="handleSelect" row-class-name="clickable-row" v-loading="loading">
        <el-table-column prop="name" label="选举名称" min-width="220" show-overflow-tooltip>
          <template #header>选举名称<span class="field-hint">elections.name</span></template>
        </el-table-column>
        <el-table-column prop="village" label="村（社区）" width="120">
          <template #header>村（社区）<span class="field-hint">villages.name(关联)</span></template>
        </el-table-column>
        <el-table-column label="选举方式" width="120">
          <template #header>选举方式<span class="field-hint">elections.election_method</span></template>
          <template #default="{ row }"><el-tag effect="plain" type="warning">{{ row.electionMethod || row.election_method || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="date" label="选举日期" width="120">
          <template #header>选举日期<span class="field-hint">elections.election_end_date</span></template>
          <template #default="{ row }"><span class="num num-blue">{{ row.date }}</span></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #header>状态<span class="field-hint">elections.status</span></template>
          <template #default="{ row }"><el-tag effect="plain" :type="statusMap[row.status]?.type || 'info'">{{ statusMap[row.status]?.label || row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="handleEdit(row)">✏️ 编辑</el-button>
            <el-button type="success" link @click.stop="handleSelect(row)">📋 详情</el-button>
            <el-button type="danger" link @click.stop="handleDelete(row)">🗑️ 删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" top="5vh" :close-on-click-modal="false" class="election-dialog">
      <el-form :model="editForm" label-width="110px" class="dialog-form">
        <el-divider content-position="left"><span class="divider-title">基础信息</span></el-divider>
        <el-form-item label="选举名称" required>
          <el-input v-model="editForm.name" placeholder="如：凤凰社区2025年居委会换届选举" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="所属村(社区)" required>
            <el-select v-model="editForm.villageId" filterable :disabled="isVillageLocked" @change="onVillageChange" style="width:100%">
              <el-option v-for="v in villages" :key="v.id" :label="v.name" :value="v.id" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="选举方式" required>
            <el-select v-model="editForm.electionMethod" placeholder="请选择选举方式" style="width:100%">
              <el-option v-for="m in availableElectionMethods" :key="m.id" :label="m.name" :value="m.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间段">
            <el-input v-model="editForm.timeRange" placeholder="如：08:00-18:00" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="选举开始日期" required>
            <el-date-picker v-model="editForm.date" type="date" value-format="YYYY-MM-DD" placeholder="选举活动开始日" style="width:100%" />
          </el-form-item>
          <el-form-item label="选举结束日期">
            <el-date-picker v-model="editForm.electionEndDate" type="date" value-format="YYYY-MM-DD" placeholder="选举活动结束日（到点归档）" style="width:100%" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="选举地点">
            <el-input v-model="editForm.location" placeholder="如：凤凰社区党群服务中心" />
          </el-form-item>
          <el-form-item label="补充说明">
            <el-input v-model="editForm.description" placeholder="一句话补充（选填）" />
          </el-form-item>
        </div>
        <el-form-item label="活动内容">
          <div class="tiptap-wrapper">
            <bubble-menu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
              <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><strong>B</strong></button>
              <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"><em>I</em></button>
              <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }"><s>S</s></button>
              <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
              <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">H3</button>
              <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }">•</button>
              <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }">1.</button>
              <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }">"</button>
              <button @click="editor.chain().focus().setHorizontalRule().run()">—</button>
              <button @click="editor.chain().focus().undo().run()">↶</button>
              <button @click="editor.chain().focus().redo().run()">↷</button>
            </bubble-menu>
            <floating-menu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
              <button @click="addImage" title="插入图片">🖼️</button>
              <button @click="addLink" title="插入链接">🔗</button>
            </floating-menu>
            <editor-content :editor="editor" />
          </div>
          <div style="font-size:11px;color:#a8a29e;margin-top:4px">选举活动内容/细则（富文本），与公告内容独立</div>
        </el-form-item>

        <el-divider content-position="left"><span class="divider-title">选举程序时间节点</span></el-divider>
        <div class="time-hint">⏰ 按选举流程填写各阶段时间，系统将自动触发通知和状态流转。每个阶段都需要起止时间配对。</div>

        <div class="phase-block">
          <div class="phase-head"><span class="phase-tag phase-publish">发布</span> 定时发布（选填）</div>
          <el-form-item label="发布时间">
            <el-date-picker v-model="editForm.scheduledPublishAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="到时自动发布（选填·不填则保存草稿后手动发布）" default-time="08:00:00" style="width:100%" />
          </el-form-item>
        </div>

        <div class="phase-block">
          <div class="phase-head"><span class="phase-tag phase-enroll">报名期间</span> 候选人报名窗口（到截止时间锁定名单）</div>
          <div class="form-row">
            <el-form-item label="报名开始">
              <el-date-picker v-model="editForm.enrollStartAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="报名开始时间" default-time="08:00:00" style="width:100%" />
            </el-form-item>
            <el-form-item label="报名截止" required>
              <el-date-picker v-model="editForm.enrollEndAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="报名截止·锁定候选人名单" default-time="18:00:00" style="width:100%" />
            </el-form-item>
          </div>
        </div>

        <div class="phase-block">
          <div class="phase-head"><span class="phase-tag phase-publicity">公示期间</span> 候选人公示窗口</div>
          <div class="form-row">
            <el-form-item label="公示开始">
              <el-date-picker v-model="editForm.publicityStartAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="候选人公示开始" default-time="08:00:00" style="width:100%" />
            </el-form-item>
            <el-form-item label="公示结束">
              <el-date-picker v-model="editForm.publicityEndAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="候选人公示结束" default-time="18:00:00" style="width:100%" />
            </el-form-item>
          </div>
        </div>

        <div class="phase-block">
          <div class="phase-head"><span class="phase-tag phase-material">材料审核期间</span> 材料提交截止 + 审核窗口</div>
          <div class="form-row">
            <el-form-item label="材料截止" required>
              <el-date-picker v-model="editForm.deadlineAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="材料提交截止·到点锁定" default-time="18:00:00" style="width:100%" />
            </el-form-item>
            <el-form-item label="审核开始">
              <el-date-picker v-model="editForm.reviewStartAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="材料审核开始时间" default-time="08:00:00" style="width:100%" />
            </el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="审核结束">
              <el-date-picker v-model="editForm.reviewEndAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="审核结束·进入待选举" default-time="18:00:00" style="width:100%" />
            </el-form-item>
          </div>
        </div>

        <el-divider content-position="left"><span class="divider-title">短信通知（工作人员）</span></el-divider>
        <div class="time-hint">📱 短信通知对象是工作人员（非候选人），选举活动开始时自动发送。</div>
        <el-form-item label="接收号码">
          <el-input v-model="editForm.smsPhones" type="textarea" :rows="2" placeholder="多个手机号用逗号分隔，如：13800138000,13900139000（选填）" />
        </el-form-item>
        <el-form-item label="内容模板">
          <el-input v-model="editForm.smsTemplate" type="textarea" :rows="3" placeholder="可用变量：{name}姓名 {election}选举名称 {date}日期 {location}地点&#10;如：[{name}]同志，{election}将于{date}在{location}开始，请准时出席。" />
        </el-form-item>

        <div class="time-hint" style="margin-top:14px">
          ℹ️ 材料提交要求已移至「职位管理」中按职位独立编辑。每个职位可设置自己的材料明细，本页详情会按职位分组展示。
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button @click="handleSaveDraft" size="large">💾 保存草稿</el-button>
          <el-button type="primary" @click="handlePublish" size="large">📢 发布活动</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getElections, createElection, updateElection, updateElectionStatus, deleteElection, getVillagesAll, getElectionMethodMap, getPositions, getCandidates, getNotices, getMaterials } from '@/api/api';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import http from '@/api/index';

const router = useRouter();
const route = useRoute();

const keyword = ref('');
const dialogVisible = ref(false);
const loading = ref(false);
const elections = ref<any[]>([]);
const villages = ref<any[]>([]);
const electionMethods = ref<any[]>([]);
const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') || {}; } catch { return {}; }
})();
const isSuperAdmin = computed(() => currentUser.role === '超级管理');
const isVillageLocked = computed(() => !isSuperAdmin.value);
const lockedVillageId = computed(() => String(currentUser.villageId ?? currentUser.village_id ?? ''));

const stats = ref([
  { label: '选举活动', value: '0' }, { label: '进行中', value: '0' },
  { label: '待开始', value: '0' }, { label: '已完成', value: '0' },
]);

const editForm = reactive({
  id: '', name: '', village: '', villageId: '',
  date: '', timeRange: '', location: '',
  electionType: '村委会选举', electionMethod: '',
  description: '',
  content: '',                              // 选举活动内容/细则（富文本，≠ 公告内容）
  scheduledPublishAt: '',
  enrollStartAt: '', enrollEndAt: '',
  publicityStartAt: '', publicityEndAt: '',
  deadlineAt: '', reviewStartAt: '', reviewEndAt: '', electionEndDate: '',
  smsPhones: '', smsTemplate: '',
});
const availableElectionMethods = computed(() => electionMethods.value.filter((m: any) => m.type === editForm.electionType));

// Tiptap 富文本编辑器
const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Image,
    Placeholder.configure({ placeholder: '请输入选举活动内容/细则...' }),
  ],
  content: '',
});

// 同步 editForm.content → editor
watch(() => editForm.content, (val) => {
  if (editor.value && editor.value.getHTML() !== (val || '')) {
    editor.value.commands.setContent(val || '');
  }
});

// 同步 editor → editForm.content
watch(editor, (ed) => {
  if (ed) {
    ed.on('update', () => {
      editForm.content = ed.getHTML();
    });
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// 插入图片（调用已有上传接口）
async function addImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res: any = await http.post('/upload/saveFile', fd);
      editor.value?.chain().focus().setImage({ src: res.data.url }).run();
    } catch { ElMessage.error('图片上传失败'); }
  };
  input.click();
}

// 插入链接
function addLink() {
  const url = window.prompt('输入链接地址：');
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run();
  }
}

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '待发布', type: 'warning' },
  in_progress: { label: '进行中', type: 'success' },
  under_review: { label: '材料审核中', type: 'warning' },
  ready: { label: '待选举', type: 'success' },
  completed: { label: '已完成', type: 'info' },
  cancelled: { label: '已取消', type: 'danger' },
};

function normalizeElection(row: any) {
  return {
    ...row,
    villageId: row.villageId ?? row.village_id ?? '',
    village: row.village ?? row.village_name ?? '',
    electionType: row.electionType ?? row.election_type ?? '村委会选举',
    electionMethod: row.electionMethod ?? row.election_method ?? '',
    enrollStartAt: row.enrollStartAt ?? row.enroll_start_at ?? '',
    enrollEndAt: row.enrollEndAt ?? row.enroll_end_at ?? '',
    createdAt: row.createdAt ?? row.created_at ?? '',
  };
}

const filteredElections = computed(() => {
  if (!keyword.value) return elections.value;
  const kw = keyword.value.toLowerCase();
  return elections.value.filter((e: any) => (e.name||'').toLowerCase().includes(kw) || (e.village||'').toLowerCase().includes(kw));
});

function inferElectionType(village: any) {
  const typeText = String(village?.type || village?.name || '');
  return typeText.includes('居委') || typeText.includes('社区') ? '居委会选举' : '村委会选举';
}

function syncElectionMethod() {
  const allowed = electionMethods.value.filter((m: any) => m.type === editForm.electionType);
  if (!allowed.some((m: any) => m.name === editForm.electionMethod)) {
    editForm.electionMethod = allowed[0]?.name || '';
  }
}

function onVillageChange(villageId: string | number) {
  const v = villages.value.find((item: any) => String(item.id) === String(villageId));
  if (!v) return;
  editForm.villageId = v.id;
  editForm.village = v.name;
  editForm.electionType = inferElectionType(v);
  syncElectionMethod();
}

function applyLockedVillage() {
  if (isSuperAdmin.value || !lockedVillageId.value) return;
  onVillageChange(lockedVillageId.value);
}

async function fetchData() {
  loading.value = true;
  try {
    const [eleRes, vilRes, emRes] = await Promise.all([
      getElections(), getVillagesAll(), getElectionMethodMap(),
    ]);
    elections.value = (eleRes.data?.list || []).map(normalizeElection);
    villages.value = Array.isArray(vilRes.data) ? vilRes.data : (vilRes.data?.list || []);
    electionMethods.value = Object.entries(emRes.data || {}).flatMap(([type, methods]: any) =>
      (methods || []).map((method: string) => ({ id: `${type}:${method}`, type, name: method }))
    );
    applyLockedVillage();
    stats.value = [
      { label: '选举活动', value: String(elections.value.length) },
      { label: '进行中', value: String(elections.value.filter((e:any) => e.status === 'in_progress').length) },
      { label: '待开始', value: String(elections.value.filter((e:any) => e.status === 'pending').length) },
      { label: '已完成', value: String(elections.value.filter((e:any) => e.status === 'completed').length) },
    ];
  } finally { loading.value = false; }
}

onMounted(fetchData);

// 支持从详情页跳回并自动打开编辑弹窗（?edit=<id>）
onMounted(async () => {
  const editId = route.query.edit as string;
  if (editId) {
    // 等 fetchData 拿到 elections 后再 populate
    await fetchData();
    const row = elections.value.find((e: any) => e.id === editId);
    if (row) { populateForm(row); dialogVisible.value = true; }
    // 清掉 query，避免刷新又弹
    router.replace({ path: '/election', query: {} });
  }
});

function handleSelect(row: any) { router.push('/election/' + row.id); }
function handleEdit(row: any) { populateForm(row); dialogVisible.value = true; }

const dialogTitle = computed(() => editForm.id ? `编辑选举 — ${editForm.name || '(未命名)'}` : '新建选举活动');

function populateForm(row: any) {
  Object.assign(editForm, {
    id: row.id || '', name: row.name || '', village: row.village || '',
    villageId: row.villageId || '', date: row.date || '',
    timeRange: row.timeRange || '', location: row.location || '',
    electionType: row.electionType || '村委会选举', electionMethod: row.electionMethod || row.electionMethodName || '',
    description: row.description || '',
    content: row.content || '',
    scheduledPublishAt: row.scheduledPublishAt || '',
    enrollStartAt: row.enrollStartAt || '', enrollEndAt: row.enrollEndAt || '',
    publicityStartAt: row.publicityStartAt || '', publicityEndAt: row.publicityEndAt || '',
    deadlineAt: row.deadlineAt || '', reviewStartAt: row.reviewStartAt || '', reviewEndAt: row.reviewEndAt || '', electionEndDate: row.electionEndDate || '',
    smsPhones: row.smsPhones || '', smsTemplate: row.smsTemplate || '',
  });
}

function handleAdd() {
  Object.assign(editForm, {
    id: '', name: '', village: '', villageId: '',
    date: '', timeRange: '08:00-18:00', location: '',
    electionType: '村委会选举', electionMethod: '', description: '',
    content: '',
    scheduledPublishAt: '',
    enrollStartAt: '', enrollEndAt: '',
    publicityStartAt: '', publicityEndAt: '',
    deadlineAt: '', reviewStartAt: '', reviewEndAt: '', electionEndDate: '',
    smsPhones: '', smsTemplate: '',
  });
  applyLockedVillage();
  dialogVisible.value = true;
}

async function handleSaveDraft() { await save('pending', '草稿已保存'); }
async function handlePublish() { await save('in_progress', '已发布'); }

async function save(targetStatus: string, msg: string) {
  if (!editForm.name || !editForm.villageId) { ElMessage.warning('请填写选举名称和所属村居'); return; }
  if (!editForm.village) onVillageChange(editForm.villageId);
  syncElectionMethod();
  const method = electionMethods.value.find((m: any) => m.name === editForm.electionMethod);
  const data: any = {
    ...editForm,
    villageId: editForm.villageId,
    electionType: method?.type || editForm.electionType,
    electionMethod: method?.name || editForm.electionMethod,
  };
  // status 不通过通用 PUT 传，必须走专用状态机接口
  delete data.status;
  try {
    if (editForm.id) { 
      await updateElection(editForm.id, data);
      // 状态变更走专用接口（白名单校验）
      await updateElectionStatus(editForm.id, targetStatus);
    } else { 
      const res: any = await createElection(data);
      if (res?.data?.id) {
        editForm.id = res.data.id;
        // 新建默认为 pending，如果目标是 in_progress 则额外变更
        if (targetStatus !== 'pending') {
          await updateElectionStatus(res.data.id, targetStatus);
        }
      }
    }
    ElMessage.success(msg);
    if (targetStatus === 'in_progress') dialogVisible.value = false;
    fetchData();
  } catch (err: any) { ElMessage.error(err?.message || '保存失败'); }
}

async function handleDelete(row: any) {
  ElMessageBox.confirm(`确定删除「${row.name}」？删除后该选举下的职位/候选人/材料将失去关联。`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteElection(row.id);
      ElMessage.success('已删除');
      if (editForm.id === row.id) dialogVisible.value = false;
      fetchData();
    }).catch(() => {});
}
</script>

<style scoped>
.page { max-width: 1400px; }
.page-head { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--line-light); }
.page-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink-black);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-title::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 16px;
  background: var(--seal-red);
  border-radius: 0 2px 2px 0;
}
.page-desc { font-size: 13px; color: var(--ink-light); margin: 0; }

.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card {
  background: var(--paper-card);
  border: 1px solid var(--line-light);
  border-radius: 4px;
  padding: 16px;
  text-align: center;
}
.stat-value { font-family: 'Noto Serif SC', serif; font-size: 28px; font-weight: 700; color: var(--ink-blue); font-variant-numeric: tabular-nums; }
.stat-label { font-size: 12px; color: var(--ink-light); margin-top: 4px; letter-spacing: 0.5px; }

.list-panel { width: 100%; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; gap: 8px; }
.filter-hint { font-size: 11px; color: #a8a29e; font-family: Consolas, monospace; }
.field-hint { display:block; font-size:10px; color:#bbb; font-weight:400; font-family:Consolas,monospace; line-height:1.2; margin-top:2px; }

.dialog-form { max-height: 70vh; overflow-y: auto; padding-right: 8px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.divider-title { font-family: 'Noto Serif SC', serif; font-size: 13px; font-weight: 600; color: var(--ink-blue); }
.time-hint { font-size: 12px; color: var(--ink-light); background: var(--paper-bg, #fafaf9); padding: 8px 12px; border-radius: 4px; margin-bottom: 14px; line-height: 1.6; }
.phase-block { margin-bottom: 16px; padding: 12px 14px; border: 1px solid var(--line-light, #e7e5e4); border-radius: 4px; background: var(--paper-bg, #fafaf9); }
.phase-head { font-size: 13px; font-weight: 600; color: var(--ink-normal, #57534e); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.phase-tag { display: inline-block; padding: 2px 8px; border-radius: 2px; font-size: 12px; color: #fff; font-weight: 500; }
.phase-publish { background: #6b7280; }
.phase-enroll { background: var(--ink-blue, #1e3a8a); }
.phase-publicity { background: #7c3aed; }
.phase-material { background: var(--seal-red, #b91c1c); }
.material-reqs { padding-left: 0; }
.req-item { margin-bottom: 8px; }
.req-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.num { font-family: 'Noto Serif SC', serif; font-variant-numeric: tabular-nums; }
.num-blue { color: var(--ink-blue); font-weight: 600; }
</style>
