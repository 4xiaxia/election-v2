<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">候选人管理</h2>
      <p class="page-desc">管理每场选举的候选人（来源：材料审核通过自动生成 + 本地导入），支持 Excel 导入导出</p>
    </header>

    <!-- 活动选择器（必选） -->
    <section class="block ctx-bar">
      <div class="ctx-left">
        <span class="ctx-label">当前选举</span>
        <el-select v-model="currentElectionId" placeholder="请先选择选举活动" style="width:260px" @change="onElectionChange">
          <el-option v-for="e in elections" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>
      <div class="ctx-info" v-if="ctxElection">
        <el-tag effect="plain">📅 {{ ctxElection.date }}</el-tag>
        <el-tag effect="plain">📍 {{ ctxElection.village }}</el-tag>
        <el-tag effect="plain">🗳️ {{ ctxElection.electionMethod }}</el-tag>
      </div>
    </section>

    <!-- 未选活动时的提示 -->
    <div v-if="!currentElectionId" class="empty-hint">
      <p class="empty-icon">👥</p>
      <p class="empty-text">请先选择选举活动</p>
      <p class="empty-sub">选择活动后可查看和管理该活动的候选人</p>
    </div>

    <!-- 选中活动后展示列表 -->
    <CrudPage v-else ref="crud" :config="crudConfig">
      <template #actions>
        <span class="dim">后端暂未开放编辑/删除</span>
      </template>
      <template #form="{ form }">
        <el-form-item label="所属选举"><el-input :value="ctxElection?.name || ''" disabled /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="参选职位" required>
          <el-select v-model="form.positionId" placeholder="请选择职位（关联职位管理）" style="width:100%" @change="onPositionChange">
            <el-option v-for="p in positions" :key="p.id" :label="`${p.name}（${p.quota}名）`" :value="p.id" />
          </el-select>
          <div v-if="selectedPosition" class="pos-desc">职责：{{ selectedPosition.duty || '未填写' }}</div>
        </el-form-item>
        <el-form-item v-if="selectedPosition && selectedPosition.materialRequirements?.length" label="需交材料">
          <div class="req-hint">
            <el-tag v-for="req in selectedPosition.materialRequirements" :key="req.id" size="small" effect="plain" class="req-tag">{{ req.name }}{{ req.required ? '' : '(选)' }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="所属村居">
          <el-select v-model="form.villageId" placeholder="请选择村居" style="width:100%" @change="onVillageChange">
            <el-option v-for="v in villages" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="政治面貌"><el-input v-model="form.politics" placeholder="如：中共党员/共青团员/群众" /></el-form-item>
        <el-form-item label="推荐方式">
          <el-select v-model="form.recommendType" placeholder="候选人怎么产生的" style="width:100%">
            <el-option label="村民自荐" value="村民自荐" />
            <el-option label="村委会推荐" value="村委会推荐" />
            <el-option label="联名推荐" value="联名推荐" />
            <el-option label="联名委托" value="联名委托" />
          </el-select>
        </el-form-item>
        <el-form-item label="个人简介"><el-input v-model="form.intro" type="textarea" :rows="3" placeholder="个人简介/参选意愿" /></el-form-item>
      </template>
    </CrudPage>

    <!-- 材料上下文弹窗：展示该候选人的材料要求、已提交、缺失项 -->
    <el-dialog v-model="materialCtxVisible" :title="`${materialCtxCandidate?.name || ''} 的材料上下文`" width="720px" destroy-on-close>
      <div v-loading="materialCtxLoading">
        <div v-if="materialCtx" class="ctx-summary">
          <el-tag :type="materialCtx.complete ? 'success' : 'warning'" effect="dark" size="large">
            {{ materialCtx.complete ? '材料齐全' : `缺 ${materialCtx.missing?.length || 0} 份必交材料` }}
          </el-tag>
          <span class="ctx-position">职位：{{ materialCtx.position || materialCtxCandidate?.position || '-' }}</span>
        </div>
        <div v-if="materialCtx?.requirements?.length" class="ctx-section">
          <h4>材料要求 <small>({{ materialCtx.requirements.length }} 项)</small></h4>
          <el-table :data="materialCtx.requirements" size="small" border>
            <el-table-column prop="name" label="材料项" min-width="140" />
            <el-table-column prop="required" label="是否必填" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small" effect="plain">{{ row.required ? '必填' : '选交' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="formats" label="格式要求" min-width="160">
              <template #default="{ row }">
                <span class="dim">{{ (row.formats || []).join('、') || '无' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="materialCtx?.submitted?.length" class="ctx-section">
          <h4>已提交材料 <small>({{ materialCtx.submitted.length }} 份)</small></h4>
          <el-table :data="materialCtx.submitted" size="small" border>
            <el-table-column prop="requirementName" label="对应要求" min-width="140" />
            <el-table-column prop="materialName" label="材料名称" min-width="140" />
            <el-table-column prop="status" label="审核状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已通过' ? 'success' : (row.status === '已驳回' ? 'danger' : 'info')" size="small" effect="plain">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="materialCtx?.missing?.length" class="ctx-section">
          <h4>缺失必填材料 <small>({{ materialCtx.missing.length }} 项)</small></h4>
          <el-alert type="warning" :closable="false" show-icon>
            <div class="missing-list">
              <el-tag v-for="m in materialCtx.missing" :key="m.requirementId" type="danger" effect="plain" size="small" class="missing-tag">{{ m.requirementName }}</el-tag>
            </div>
          </el-alert>
        </div>
        <el-empty v-else-if="materialCtx && !materialCtx.requirements?.length" description="该职位未设置材料要求" />
      </div>
      <template #footer>
        <el-button @click="materialCtxVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getElections, getCandidates, createCandidate, updateCandidate, getPositions, getVillages } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';

const elections = ref<any[]>([]);
const currentElectionId = ref('');
const ctxElection = computed(() => elections.value.find((e: any) => e.id === currentElectionId.value));
const crud = ref();
// 当前选举的职位列表（内链：候选人选职位 → 存 positionId）
const positions = ref<any[]>([]);
// 村居列表（内链：候选人选村居 → 存 villageId，文本冗余 village 同步赋值）
const villages = ref<any[]>([]);
const selectedPosition = computed(() => positions.value.find((p: any) => p.id === (crud.value?.form?.positionId)));

// 材料上下文弹窗
const materialCtxVisible = ref(false);
const materialCtxLoading = ref(false);
const materialCtx = ref<any>(null);
const materialCtxCandidate = ref<any>(null);

onMounted(async () => {
  const res: any = await getElections();
  elections.value = res.data?.list || [];
  // 拉取村居列表（供候选人下拉选 villageId）
  try {
    const vRes: any = await getVillages();
    villages.value = vRes.data?.list || [];
  } catch { villages.value = []; }
  // 自动选中第一个活动（优先进行中的）
  if (elections.value.length) {
    const active = elections.value.find((e: any) => e.status === 'in_progress') || elections.value[0];
    currentElectionId.value = active.id;
    onElectionChange();
  }
});

async function onElectionChange() {
  // 选了选举活动 → 拉该活动的职位列表（供候选人下拉选）
  if (currentElectionId.value) {
    try {
      const res: any = await getPositions({ electionId: currentElectionId.value });
      positions.value = (res.data?.list || []).map((p: any) => {
        p.materialRequirements = Array.isArray(p.materialRequirements) ? p.materialRequirements : (() => { try { return JSON.parse(p.materialRequirements || '[]') } catch { return [] } })()
        return p;
      });
    } catch { positions.value = []; }
  } else {
    positions.value = [];
  }
  (crud.value as any)?.refresh?.();
}

function onPositionChange() {
  // 内链：选职位 → 自动带出 position 文本（兼容老逻辑）+ 岗位说明展示
  const form = (crud.value as any)?.form;
  if (form && selectedPosition.value) {
    form.position = selectedPosition.value.name + '候选人';
  }
}

function onVillageChange() {
  // 内链：选村居 → villageId 绑定 value，同步赋值 village 文本（candidates 表 village 字段文本冗余，NOT NULL）
  const form = (crud.value as any)?.form;
  if (form) {
    const v = villages.value.find((x: any) => x.id === form.villageId);
    form.village = v ? v.name : '';
  }
}

const crudConfig = computed(() => ({
  title: '候选人管理',
  desc: ctxElection.value ? `${ctxElection.value.name} — 候选人列表` : '',
  addLabel: '+ 新增候选人',
  toolbar: userRole.value === '审核' ? false : undefined,
  columns: [
    { prop: 'name', label: '姓名', width: '100' },
    { prop: 'position', label: '参选职位', width: '140', formatter: (row: any) => {
      // 内链展示：有 positionId 显示关联职位名，否则显示 position 文本
      const p = positions.value.find((x: any) => x.id === row.positionId);
      return p ? p.name : (row.position || '-');
    } },
    { prop: 'source', label: '来源', width: '90', align: 'center' as const, tagMap: { 'material': { type: 'success', text: '材料晋升' }, 'import': { type: 'info', text: '导入' } } as any },
    { prop: 'village', label: '所属村居', width: '120' },
    { prop: 'recommendType', label: '推荐方式', width: '120', formatter: (row: any) => row.recommendType || '-' },
    { prop: 'phone', label: '手机号', width: '130' },
    { prop: 'politics', label: '政治面貌', width: '110', formatter: (row: any) => row.politics || '-' },
    { prop: 'status', label: '状态', width: '100', align: 'center' as const, tagMap: { '报名中': { type: 'warning', text: '报名中' }, '已公示': { type: 'primary', text: '已公示' }, '资格作废': { type: 'danger', text: '资格作废' } } as any },

  ],
  api: {
    list: async () => {
      const res: any = await getCandidates({ electionId: currentElectionId.value });
      return res;
    },
    create: async (data: any) => createCandidate({ ...data, electionId: currentElectionId.value, status: '待审核' }),
    update: (id: string, data: any) => updateCandidate(id, data),
    delete: async () => Promise.reject(new Error('当前后端暂未提供候选人删除接口')),
  },
  showEdit: false,
  showDelete: false,
}));

const userRole = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role || '';
  } catch {
    return '';
  }
});
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
.pos-desc { font-size: 12px; color: #78716c; margin-top: 4px; line-height: 1.4; }
.req-hint { display: flex; flex-wrap: wrap; gap: 4px; }
.req-tag { margin: 0; }

.ctx-summary { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--line-light, #e7e5e4); }
.ctx-position { font-size: 13px; color: var(--ink-gray, #57534e); }
.ctx-section { margin-bottom: 20px; }
.ctx-section h4 { font-size: 14px; font-weight: 600; margin: 0 0 10px; color: var(--ink-dark, #292524); }
.ctx-section h4 small { font-weight: 400; color: var(--ink-light, #a8a29e); }
.missing-list { display: flex; flex-wrap: wrap; gap: 6px; }
.missing-tag { margin: 0; }
</style>
