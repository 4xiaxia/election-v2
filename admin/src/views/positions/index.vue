<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">职位管理</h2>
      <p class="page-desc">管理每场选举的职位、岗位说明、材料提交要求（编辑主数据 · 选举管理那边只调用展示）</p>
    </header>

    <!-- 活动选择器（必选·夏夏层级铁律） -->
    <section class="block ctx-bar">
      <div class="ctx-left">
        <span class="ctx-label">当前选举</span>
        <el-select v-model="currentElectionId" placeholder="请先选择选举活动" style="width:260px" @change="onElectionChange">
          <el-option v-for="e in elections" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>
      <div class="ctx-info" v-if="ctxElection">
        <el-tag effect="plain">📅 {{ ctxElection.date }} {{ ctxElection.timeRange }}</el-tag>
        <el-tag effect="plain">📍 {{ ctxElection.village }}</el-tag>
        <el-tag effect="plain">🗳️ {{ ctxElection.electionMethod }}</el-tag>
      </div>
    </section>

    <!-- 未选活动时的提示 -->
    <div v-if="!currentElectionId" class="empty-hint">
      <p class="empty-icon">📋</p>
      <p class="empty-text">请先选择选举活动</p>
      <p class="empty-sub">选择活动后可查看和管理该活动的职位</p>
    </div>

    <!-- 选中活动后展示列表 -->
    <CrudPage v-else ref="crud" :config="crudConfig">
      <template #toolbar>
        <el-button type="success" plain :disabled="!currentElectionId" @click="openGenerateDialog">
          一键生成岗位
        </el-button>
      </template>

      <template #form="{ form }">
        <el-form-item label="所属选举">
          <el-input :value="ctxElection?.name || ''" disabled />
        </el-form-item>
        <el-form-item label="职位名称" required><el-input v-model="form.name" placeholder="如：主任/副主任/委员" /></el-form-item>

        <el-divider content-position="left"><span class="divider-title">岗位说明</span></el-divider>
        <el-form-item label="职责概述">
          <el-input v-model="form.duty" type="textarea" :rows="3" placeholder="该岗位的主要职责（一句话概述，如：主持居委会全面工作）" />
        </el-form-item>

        <el-divider content-position="left"><span class="divider-title">材料提交要求</span></el-divider>
        <div class="time-hint">📎 该职位候选人需提交的材料明细。每项含名称、必填、接受格式、说明。选举管理那边只调用展示，不再编辑。</div>
        <div class="material-reqs">
          <div class="req-item" v-for="(req, i) in form.materialRequirements" :key="i">
            <div class="req-row">
              <el-input v-model="req.name" placeholder="材料名称（如：身份证复印件）" style="width:200px" />
              <el-switch v-model="req.required" active-text="必填" inactive-text="选填" />
              <el-select v-model="req.formats" multiple placeholder="接受格式（可多选）" style="width:220px">
                <el-option label="PDF 文件" value=".pdf" />
                <el-option label="图片 (JPG/PNG)" value=".jpg,.png" />
                <el-option label="Word 文档" value=".doc,.docx" />
                <el-option label="纯文本输入（手填）" value="__text__" />
              </el-select>
              <el-input v-model="req.description" placeholder="说明（选填）" style="width:160px" />
              <el-button type="danger" link @click="form.materialRequirements.splice(i,1)" :disabled="form.materialRequirements.length<=1">删除</el-button>
            </div>
            <!-- 示例图：用 element-plus 成熟 el-upload，接现成 /api/upload（自动加水印） -->
            <div class="req-sample">
              <span class="sample-label">📷 示例图（选填·给村民看该交什么样的）</span>
              <el-upload
                :action="UPLOAD_URL"
                :headers="uploadHeaders"
                :show-file-list="false"
                accept="image/*"
                :on-success="(resp) => onSampleSuccess(req, resp)"
                :before-upload="beforeSampleUpload"
              >
                <div v-if="req.sampleImage" class="sample-thumb">
                  <img :src="resolveUrl(req.sampleImage)" alt="示例图" />
                  <span class="sample-replace">点击更换</span>
                </div>
                <el-button v-else size="small" plain>上传示例图</el-button>
              </el-upload>
              <el-button v-if="req.sampleImage" type="danger" link size="small" @click="req.sampleImage = ''">移除</el-button>
            </div>
          </div>
          <el-button type="primary" link @click="addMaterialReq(form)">+ 添加材料项</el-button>
        </div>

        <el-form-item label="应选名额" required><el-input-number v-model="form.quota" :min="1" :max="99" /></el-form-item>
        <el-form-item label="展示排序">
          <el-input-number v-model="form.sortWeight" :min="1" :max="99" />
          <span class="form-tip">数字越小越靠前（如 1主任 / 2副主任 / 3委员），村民端按此排序。</span>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </template>

      <!-- 职位行关联入口（夏夏草图：查看材料要求 + 已收材料） -->
      <template #actions="{ row, edit, remove }">
        <el-button type="primary" link @click="showReqs(row)">材料要求({{ (row.materialRequirements||[]).length }})</el-button>
        <el-button type="success" link @click="goMaterials(row)">已收材料</el-button>
        <el-button type="primary" link @click="edit">编辑</el-button>
        <el-button type="danger" link @click="remove">删除</el-button>
      </template>
    </CrudPage>

    <el-dialog v-model="generateDialog" title="生成主任/副主任/委员" width="420px">
      <el-form :model="generateForm" label-width="96px">
        <el-form-item label="村居类型">
          <el-select v-model="generateForm.orgType" style="width:100%" @change="onGenerateOrgTypeChange">
            <el-option label="行政村 / 村委会" value="village" />
            <el-option label="社区 / 居委会" value="community" />
          </el-select>
        </el-form-item>
        <el-form-item label="班子人数">
          <el-select v-model="generateForm.committeeSize" style="width:100%" @change="onGenerateCommitteeSizeChange">
            <el-option v-for="n in generateSizeOptions" :key="n" :label="`${n} 人`" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="副主任数">
          <el-input-number v-model="generateForm.deputyCount" :min="0" :max="generateDeputyMax" />
        </el-form-item>
      </el-form>
      <p class="generate-tip">只生成一期竞选岗位，不删除旧岗位；已有主任/副主任/委员时后端会阻止重复生成。</p>
      <template #footer>
        <el-button @click="generateDialog=false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGeneratePositions">生成</el-button>
      </template>
    </el-dialog>

    <!-- 材料要求预览弹窗（关联小程序前端候选人提交时看到的明细） -->
    <el-dialog v-model="reqDialog" :title="`${reqRow?.name || ''} — 材料提交要求`" width="560px">
      <p class="req-tip">📱 这是该职位候选人在小程序端报名时，需要按项提交的材料明细。</p>
      <el-table :data="reqRow?.materialRequirements || []" size="small" border>
        <el-table-column type="index" label="#" width="44" />
        <el-table-column prop="name" label="材料名称" min-width="160" />
        <el-table-column label="必填" width="70" align="center">
          <template #default="{ row: r }">
            <el-tag :type="r.required ? 'danger' : 'info'" effect="plain" size="small">{{ r.required ? '必填' : '选填' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接受格式" min-width="140">
          <template #default="{ row: r }">{{ fmtFormats(r.formats) }}</template>
        </el-table-column>
        <el-table-column label="示例图" width="80" align="center">
          <template #default="{ row: r }">
            <el-image
              v-if="r.sampleImage"
              :src="resolveUrl(r.sampleImage)"
              :preview-src-list="[resolveUrl(r.sampleImage)]"
              :preview-teleported="true"
              fit="cover"
              style="width:40px;height:40px;border-radius:4px;cursor:pointer"
            />
            <span v-else class="no-sample">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
      </el-table>
      <el-empty v-if="!(reqRow?.materialRequirements || []).length" description="该职位还没设置材料要求，请在「编辑」里添加" :image-size="80" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { getElections, getPositions, createPosition, updatePosition, deletePosition, generatePositions } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';

const router = useRouter();
const elections = ref<any[]>([]);
const currentElectionId = ref('');
const ctxElection = computed(() => elections.value.find((e: any) => e.id === currentElectionId.value));

type GenerateOrgType = 'village' | 'community';
const generateDialog = ref(false);
const generating = ref(false);
const generateForm = ref<{ orgType: GenerateOrgType; committeeSize: number; deputyCount: number }>({
  orgType: 'village',
  committeeSize: 3,
  deputyCount: 0,
});
const generateSizeOptions = computed(() => generateForm.value.orgType === 'community' ? [5, 7, 9] : [3, 5, 7]);
const generateDeputyMax = computed(() => Math.min(2, Math.max(0, generateForm.value.committeeSize - 2)));

function inferOrgType(): GenerateOrgType {
  const e = ctxElection.value || {};
  const raw = String(e.orgType ?? e.unitType ?? e.type ?? e.villageType ?? e.electionType ?? e.election_type ?? '').toLowerCase();
  return raw.includes('community') || raw.includes('居') || raw.includes('社区') ? 'community' : 'village';
}

function defaultDeputyCount(orgType: GenerateOrgType, committeeSize: number) {
  return orgType === 'village' && committeeSize === 3 ? 0 : 1;
}

function resetGenerateForm() {
  const orgType = inferOrgType();
  const committeeSize = orgType === 'community' ? 5 : 3;
  generateForm.value = {
    orgType,
    committeeSize,
    deputyCount: defaultDeputyCount(orgType, committeeSize),
  };
}

function onGenerateOrgTypeChange() {
  const committeeSize = generateForm.value.orgType === 'community' ? 5 : 3;
  generateForm.value.committeeSize = committeeSize;
  generateForm.value.deputyCount = defaultDeputyCount(generateForm.value.orgType, committeeSize);
}

function onGenerateCommitteeSizeChange() {
  generateForm.value.deputyCount = defaultDeputyCount(generateForm.value.orgType, generateForm.value.committeeSize);
}

function openGenerateDialog() {
  if (!currentElectionId.value) {
    ElMessage.warning('请先选择选举活动');
    return;
  }
  resetGenerateForm();
  generateDialog.value = true;
}

async function handleGeneratePositions() {
  if (!currentElectionId.value) return;
  generating.value = true;
  try {
    await generatePositions({
      electionId: currentElectionId.value,
      orgType: generateForm.value.orgType,
      committeeSize: generateForm.value.committeeSize,
      deputyCount: generateForm.value.deputyCount,
    });
    ElMessage.success('岗位生成成功');
    generateDialog.value = false;
    (crud.value as any)?.refresh?.();
  } catch (err: any) {
    ElMessage.error(err?.msg || err?.message || '岗位生成失败');
  } finally {
    generating.value = false;
  }
}

// 时间格式化：只取 日期+时分，没值显示占位
function fmt(t: string) {
  if (!t) return '未设';
  return String(t).replace('T', ' ').slice(0, 16);
}
// 格式数组 → 中文标签
function fmtFormats(formats: any): string {
  const arr = Array.isArray(formats) ? formats : [];
  if (!arr.length) return '不限';
  const map: Record<string, string> = { '.pdf': 'PDF', '.jpg,.png': '图片', '.doc,.docx': 'Word', '__text__': '手填文本' };
  return arr.map((f: string) => map[f] || f).join(' / ');
}

// 材料要求预览弹窗
const reqDialog = ref(false);
const reqRow = ref<any>(null);
function showReqs(row: any) { reqRow.value = row; reqDialog.value = true; }
// 跳转到材料审核页，带上活动+职位上下文，看该职位已收材料
function goMaterials(row: any) {
  router.push({ path: '/materials', query: { electionId: currentElectionId.value, positionId: row.id } });
}

onMounted(async () => {
  const res: any = await getElections();
  elections.value = res.data?.list || [];
  // 自动选中第一个活动（优先进行中的，否则取第一个）
  if (elections.value.length) {
    const active = elections.value.find((e: any) => e.status === 'in_progress') || elections.value[0];
    currentElectionId.value = active.id;
    onElectionChange();
  }
});

function onElectionChange() {
  (crud.value as any)?.refresh?.();
}

function newReqId() { return 'req' + Date.now() + Math.random().toString(36).slice(2, 6); }
function addMaterialReq(form: any) {
  form.materialRequirements.push({ id: newReqId(), name: '', required: true, formats: [], description: '', sampleImage: '' });
}

// ===== 材料示例图上传（用 element-plus el-upload 接现成 upload-v2，不手搓）=====
const UPLOAD_URL = '/api/upload/saveFile';
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` }));
function beforeSampleUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  const under5M = file.size / 1024 / 1024 < 5;
  if (!isImage) { ElMessage.error('示例图只能是图片格式'); return false; }
  if (!under5M) { ElMessage.error('示例图不能超过 5MB'); return false; }
  return true;
}
function onSampleSuccess(req: any, resp: any) {
  req.sampleImage = resp?.data?.url || resp?.url || '';
  ElMessage.success('示例图已上传');
}
// 拼出可访问的图片地址（后端返回 /uploads/xxx 相对路径）
function resolveUrl(u: string) {
  if (!u) return '';
  return u.startsWith('http') ? u : u;
}

const crud = ref();

const crudConfig = computed(() => ({
  title: '职位管理',
  desc: ctxElection.value ? `${ctxElection.value.name} — 职位设置` : '',
  addLabel: '+ 新增职位',
  columns: [
    { prop: 'name', label: '职位名称', minWidth: '110' },
    { prop: 'quota', label: '应选名额', width: '90', align: 'center' as const,
      render: (row: any) => `${row.quota || 0} 位` },
    { prop: 'duty', label: '职责概述', minWidth: '180', tooltip: true },
    { prop: '_enroll', label: '报名时间', minWidth: '180',
      render: () => {
        const e = ctxElection.value;
        if (!e?.enrollStartAt && !e?.enrollEndAt) return '— 活动未设报名时间';
        return `${fmt(e.enrollStartAt)} ~ ${fmt(e.enrollEndAt)}`;
      } },
    { prop: 'electedCandidates', label: '当选人', minWidth: '120',
      render: (row: any) => {
        const arr = Array.isArray(row.electedCandidates) ? row.electedCandidates : [];
        return arr.length ? arr.join('、') : '— 未公布';
      } },
    { prop: 'enabled', label: '状态', width: '70', align: 'center' as const, tagMap: { 1: { type: 'success', text: '启用' }, 0: { type: 'info', text: '停用' } } as any },
  ],
  api: {
    list: async () => {
      const res: any = await getPositions({ electionId: currentElectionId.value });
      // 规范化：确保 materialRequirements / electedCandidates 是数组
      const list = res.data?.list || [];
      list.forEach((p: any) => {
        const materialRequirements = p.materialRequirements ?? p.material_requirements;
        const electedCandidates = p.electedCandidates ?? p.elected_candidates;
        p.materialRequirements = Array.isArray(materialRequirements) ? materialRequirements : (() => {
          try { return JSON.parse(materialRequirements || '[]'); } catch { return []; }
        })();
        p.electedCandidates = Array.isArray(electedCandidates) ? electedCandidates : (() => {
          try { return JSON.parse(electedCandidates || '[]'); } catch { return []; }
        })();
      });
      return res;
    },
    create: async (data: any) => {
      return createPosition({
        ...data,
        electionId: currentElectionId.value,
        materialRequirements: JSON.stringify(data.materialRequirements || []),
      });
    },
    update: (id: string, data: any) => {
      const payload = { ...data };
      if (Array.isArray(payload.materialRequirements)) {
        payload.materialRequirements = JSON.stringify(payload.materialRequirements);
      }
      return updatePosition(id, payload);
    },
    delete: (id: string) => deletePosition(id),
  },
  // 新建时的默认值（CrudPage 会调 defaultForm）
  defaultForm: () => ({
    name: '',
    duty: '',
    quota: 1,
    sortWeight: 99,
    materialRequirements: [{ id: newReqId(), name: '', required: true, formats: [], description: '', sampleImage: '' }],
    enabled: 1,
  }),
}));
</script>

<style scoped>
.ctx-bar { background: var(--paper-card, #fff); border: 1px solid var(--line-light, #e7e5e4); border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ctx-left { display: flex; align-items: center; gap: 10px; }
.ctx-label { font-size: 13px; color: var(--ink-gray, #57534e); white-space: nowrap; }
.ctx-info { display: flex; gap: 6px; flex-wrap: wrap; }
.empty-hint { text-align: center; padding: 60px 20px; color: var(--ink-light, #a8a29e); }
.empty-icon { font-size: 48px; margin: 0 0 12px; }
.empty-text { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: var(--ink-gray, #57534e); }
.empty-sub { font-size: 13px; margin: 0; }
.divider-title { font-family: 'Noto Serif SC', serif; font-size: 13px; font-weight: 600; color: var(--ink-blue, #1e3a8a); }
.time-hint { font-size: 12px; color: var(--ink-light, #a8a29e); background: var(--paper-bg, #fafaf9); padding: 8px 12px; border-radius: 4px; margin-bottom: 14px; line-height: 1.6; }
.req-list-edit { width: 100%; }
.req-line { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.material-reqs { padding-left: 0; margin-bottom: 8px; }
.req-item { margin-bottom: 8px; }
.req-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.req-sample { display: flex; align-items: center; gap: 10px; margin: 6px 0 10px 4px; padding-left: 4px; border-left: 2px solid var(--line-light, #e7e5e4); }
.sample-label { font-size: 12px; color: var(--ink-light, #a8a29e); }
.sample-thumb { position: relative; width: 72px; height: 72px; border: 1px solid var(--line-light, #e7e5e4); border-radius: 4px; overflow: hidden; cursor: pointer; }
.sample-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sample-replace { position: absolute; left: 0; right: 0; bottom: 0; font-size: 10px; text-align: center; color: #fff; background: rgba(0,0,0,.5); padding: 1px 0; }
.req-tip { font-size: 12px; color: var(--ink-light, #a8a29e); background: var(--paper-bg, #fafaf9); padding: 8px 12px; border-radius: 4px; margin: 0 0 12px; line-height: 1.6; }
.form-tip { display: block; font-size: 12px; color: var(--ink-light, #a8a29e); line-height: 1.5; margin-top: 4px; }
</style>
