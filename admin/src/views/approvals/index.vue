<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">审批管理</h2>
      <p class="page-desc">三层审批台：材料齐全性(报名中) → 经办初审 → 领导终审</p>
    </header>

    <!-- 活动选择器 + 统计卡片 -->
    <section class="block ctx-bar">
      <div class="ctx-left">
        <span class="ctx-label">当前选举</span>
        <el-select v-model="currentElectionId" placeholder="请先选择选举活动" style="width:260px" @change="onElectionChange">
          <el-option v-for="e in elections" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>
      <div v-if="currentElectionId" class="stat-cards">
        <div class="stat-card pending-material" @click="activeTab = 'material'">
          <div class="stat-num">{{ pendingMaterials.length }}</div>
          <div class="stat-label">待经办 · 材料齐全性</div>
        </div>
        <div class="stat-card pending-first" @click="activeTab = 'first'">
          <div class="stat-num">{{ pendingFirstReview.length }}</div>
          <div class="stat-label">待经办 · 候选初审</div>
        </div>
        <div class="stat-card pending-final" @click="activeTab = 'final'">
          <div class="stat-num">{{ pendingFinalReview.length }}</div>
          <div class="stat-label">待审核 · 领导终审</div>
        </div>
      </div>
      <div class="ctx-info" v-if="ctxElection">
        <el-tag effect="plain">📅 {{ ctxElection.date }}</el-tag>
        <el-tag effect="plain" :type="isDeadlineNear ? 'warning' : 'info'">⏰ 材料截止 {{ deadlineText }}</el-tag>
      </div>
    </section>

    <!-- 未选活动时的提示 -->
    <div v-if="!currentElectionId" class="empty-hint">
      <p class="empty-icon">📋</p>
      <p class="empty-text">请先选择选举活动</p>
      <p class="empty-sub">选择活动后可查看待审批汇总</p>
    </div>

    <!-- 审批工作台 -->
    <section v-else class="block approval-workbench">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: 材料齐全性（报名中阶段） -->
        <el-tab-pane name="material">
          <template #label>
            <span class="tab-label">
              <el-badge :value="pendingMaterials.length" :hidden="!pendingMaterials.length" class="approval-badge">材料齐全性</el-badge>
            </span>
          </template>
          <div class="tab-head">
            <h3 class="block-title">材料齐全性检查 <em>(报名中·按报名人聚合)</em></h3>
            <el-button type="primary" plain size="small" :loading="loading" @click="loadData">刷新</el-button>
          </div>
          <el-table :data="pendingMaterials" v-loading="loading" size="small">
            <el-table-column label="报名人" width="110">
              <template #default="{ row }">
                <div class="applicant-name">{{ row.name }}</div>
                <div class="applicant-phone">{{ row.phone }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="position" label="参选职位" width="120" />
            <el-table-column label="齐全性" min-width="260">
              <template #default="{ row }">
                <div class="completeness-bar">
                  <el-tag v-for="r in row.requirements" :key="r.id" size="small" effect="plain" class="check-tag"
                    :type="isSubmitted(row, r.id) ? 'success' : (r.required ? 'danger' : 'info')">
                    {{ r.name }}{{ r.required ? '' : '(选)' }}
                  </el-tag>
                </div>
                <div class="completeness-stats">
                  <span>已交 <strong class="num-ok">{{ row.submittedCount }}</strong></span>
                  <span>缺失 <strong :class="row.missingCount > 0 ? 'num-miss' : 'num-ok'">{{ row.missingCount }}</strong></span>
                  <el-tag :type="row.complete ? 'success' : 'danger'" effect="dark" size="small">{{ row.complete ? '齐全' : '不齐' }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link size="small" @click="approveMaterials(row)">通过</el-button>
                <el-button type="danger" link size="small" @click="rejectMaterials(row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!pendingMaterials.length && !loading" description="暂无待审核材料" />
        </el-tab-pane>

        <!-- Tab 2: 经办初审（候选人内容质量审核） -->
        <el-tab-pane name="first">
          <template #label>
            <span class="tab-label">
              <el-badge :value="pendingFirstReview.length" :hidden="!pendingFirstReview.length" class="approval-badge">经办初审</el-badge>
            </span>
          </template>
          <div class="tab-head">
            <h3 class="block-title">候选人初审 <em>(经办人·审核内容质量)</em></h3>
            <el-button type="primary" plain size="small" :loading="loading" @click="loadData">刷新</el-button>
          </div>
          <el-table :data="pendingFirstReview" v-loading="loading" size="small">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="position" label="参选职位" width="140" />
            <el-table-column prop="village" label="所属村居" width="120" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="source" label="来源" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.source === 'material' ? 'success' : 'info'" size="small" effect="plain">{{ row.source === 'material' ? '材料晋升' : '导入' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="intro" label="简介" min-width="160">
              <template #default="{ row }">{{ row.intro || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link size="small" @click="firstReviewApprove(row)">通过</el-button>
                <el-button type="danger" link size="small" @click="firstReviewReject(row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!pendingFirstReview.length && !loading" description="暂无待初审候选人" />
        </el-tab-pane>

        <!-- Tab 3: 领导终审 -->
        <el-tab-pane name="final">
          <template #label>
            <span class="tab-label">
              <el-badge :value="pendingFinalReview.length" :hidden="!pendingFinalReview.length" class="approval-badge">领导终审</el-badge>
            </span>
          </template>
          <div class="tab-head">
            <h3 class="block-title">领导终审 <em>(审核人/超管·拍板)</em></h3>
            <el-button type="primary" plain size="small" :loading="loading" @click="loadData">刷新</el-button>
          </div>
          <el-table :data="pendingFinalReview" v-loading="loading" size="small">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="position" label="参选职位" width="140" />
            <el-table-column prop="village" label="所属村居" width="120" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column label="经办人" width="100">
              <template #default="{ row }">{{ adminMap[row.handlerId] || '-' }}</template>
            </el-table-column>
            <el-table-column prop="reviewComment" label="初审意见" min-width="140">
              <template #default="{ row }">{{ row.reviewComment || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link size="small" @click="finalApprove(row)">通过</el-button>
                <el-button type="danger" link size="small" @click="finalReject(row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!pendingFinalReview.length && !loading" description="暂无待终审候选人" />
        </el-tab-pane>
      </el-tabs>
    </section>

    <!-- 驳回原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="500px" destroy-on-close>
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 初审通过弹窗：审核意见 -->
    <el-dialog v-model="firstApproveDialogVisible" title="初审通过" width="480px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="审核意见">
          <el-input v-model="firstApproveForm.reviewComment" type="textarea" :rows="3" placeholder="可选：填写初审意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="firstApproveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmFirstApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 终审通过弹窗：经办人/展示/通知/审核意见 -->
    <el-dialog v-model="approveDialogVisible" title="终审通过" width="520px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="经办人">
          <el-select v-model="approveForm.handlerId" placeholder="选择经办人" style="width:100%" clearable>
            <el-option v-for="u in adminUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="approveForm.reviewComment" type="textarea" :rows="3" placeholder="可选：填写终审意见" />
        </el-form-item>
        <el-form-item label="小程序展示">
          <el-switch v-model="approveForm.isShow" :active-value="1" :inactive-value="0" />
          <span class="switch-hint">{{ approveForm.isShow === 1 ? '通过后在小程序端展示' : '不在小程序端展示' }}</span>
        </el-form-item>
        <el-form-item label="结果通知">
          <el-switch v-model="approveForm.notifyResult" :active-value="1" :inactive-value="0" />
          <span class="switch-hint">{{ approveForm.notifyResult === 1 ? '审批结果将通知候选人' : '不发送通知' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmFinalApprove">确认通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getElections, getPositions, getMaterials, getCandidates, reviewMaterial, updateCandidate } from '@/api/api'

// 选举上下文
const elections = ref([])
const currentElectionId = ref('')
const ctxElection = computed(() => elections.value.find(e => e.id === currentElectionId.value))
const deadlineText = computed(() => ctxElection.value?.deadlineAt ? ctxElection.value.deadlineAt.slice(0, 10) : '未设置')
const isDeadlineNear = computed(() => {
  if (!ctxElection.value?.deadlineAt) return false
  const d = new Date(ctxElection.value.deadlineAt)
  const now = new Date()
  const diff = d - now
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
})

// 职位
const positions = ref([])

// 管理员模块尚未迁移到 koaLite，审批页先用当前登录人兜底，避免打旧 /admin/admins。
const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') || {} } catch { return {} }
})()
const adminUsers = ref(currentUser.id ? [currentUser] : [])
const adminMap = computed(() => {
  const map = {}
  adminUsers.value.forEach(u => { map[u.id] = u.name })
  return map
})

// 审批台
const activeTab = ref('material')
const loading = ref(false)
const pendingMaterials = ref([])
const pendingFirstReview = ref([])
const pendingFinalReview = ref([])

// 驳回弹窗
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const pendingReject = ref(null)

// 初审通过弹窗
const firstApproveDialogVisible = ref(false)
const firstApproveForm = ref({ reviewComment: '' })
const pendingFirstApproveRow = ref(null)

// 终审通过弹窗
const approveDialogVisible = ref(false)
const approveForm = ref({ handlerId: '', reviewComment: '', isShow: 1, notifyResult: 0 })
const pendingFinalApproveRow = ref(null)

onMounted(async () => {
  try {
    const eRes = await getElections()
    elections.value = eRes.data?.list || []
    if (elections.value.length) {
      const active = elections.value.find(e => e.status === 'in_progress') || elections.value[0]
      currentElectionId.value = active.id
      await onElectionChange()
    }
  } catch {
    ElMessage.error('加载选举活动失败')
  }
})

async function onElectionChange() {
  if (!currentElectionId.value) return
  try {
    const posRes = await getPositions({ electionId: currentElectionId.value })
    const allPos = posRes.data?.list || []
    positions.value = allPos.filter(p => p.electionId === currentElectionId.value).map(p => {
      // 后端 parsePositionRow 已解析为数组，兼容字符串兜底
      p.materialRequirements = Array.isArray(p.materialRequirements) 
        ? p.materialRequirements 
        : (() => { try { return JSON.parse(p.materialRequirements || '[]') } catch { return [] } })()
      return p
    })
  } catch {
    ElMessage.error('加载职位失败')
    positions.value = []
  }
  await loadData()
}

async function loadData() {
  if (!currentElectionId.value) return
  loading.value = true
  try {
    const [matRes, candRes] = await Promise.all([
      getMaterials({ electionId: currentElectionId.value }),
      getCandidates({ electionId: currentElectionId.value })
    ])
    const allMaterials = matRes.data?.list || []
    const allCandidates = candRes.data?.list || []

    // ===== Tab1: 材料齐全性 — 按报名人聚合 status='待审核' 的材料 =====
    const groupMap = new Map()
    for (const m of allMaterials.filter(x => x.status === '待审核')) {
      const key = `${m.applicantName}|${m.applicantPhone}|${m.positionId}`
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          name: m.applicantName,
          phone: m.applicantPhone,
          positionId: m.positionId,
          position: positions.value.find(p => p.id === m.positionId)?.name || '-',
          materials: []
        })
      }
      groupMap.get(key).materials.push(m)
    }
    pendingMaterials.value = Array.from(groupMap.values()).map(a => {
      const pos = positions.value.find(p => p.id === a.positionId)
      let requirements = Array.isArray(pos?.materialRequirements) ? pos.materialRequirements : []
      if (!requirements.length && pos?.materialRequirements && typeof pos.materialRequirements === 'string') {
        try { requirements = JSON.parse(pos.materialRequirements) } catch { requirements = [] }
      }
      const submittedReqIds = a.materials.map(m => m.requirementId)
      const requiredIds = requirements.filter(r => r.required).map(r => r.id)
      const submittedCount = submittedReqIds.length
      const missingCount = requiredIds.filter(rid => !submittedReqIds.includes(rid)).length
      const complete = missingCount === 0
      return { ...a, requirements, submittedCount, missingCount, complete }
    })

    // ===== Tab2: 经办初审 — status='待初审' 的候选人 =====
    pendingFirstReview.value = allCandidates.filter(c => c.status === '待初审')

    // ===== Tab3: 领导终审 — status='待终审' 的候选人 =====
    pendingFinalReview.value = allCandidates.filter(c => c.status === '待终审')
  } catch (err) {
    console.error(err)
    ElMessage.error('加载审批数据失败')
  } finally {
    loading.value = false
  }
}

function isSubmitted(row, requirementId) {
  return row.materials.some(m => m.requirementId === requirementId)
}

// ===== Tab1: 材料操作 =====
async function approveMaterials(row) {
  try {
    for (const m of row.materials) {
      await reviewMaterial(m.id, { action: 'approve' })
    }
    ElMessage.success('材料初审通过，已自动生成候选人（待初审）')
    await loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

function rejectMaterials(row) {
  pendingReject.value = { type: 'material', row }
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

// ===== Tab2: 经办初审 =====
function firstReviewApprove(row) {
  pendingFirstApproveRow.value = row
  firstApproveForm.value = { reviewComment: row.reviewComment || '' }
  firstApproveDialogVisible.value = true
}

async function confirmFirstApprove() {
  const row = pendingFirstApproveRow.value
  if (!row) return
  try {
    await updateCandidate(row.id, {
      status: '待终审',
      reviewComment: firstApproveForm.value.reviewComment,
      reviewedAt: new Date().toISOString()
    })
    ElMessage.success('初审通过，已提交领导终审')
    firstApproveDialogVisible.value = false
    await loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

function firstReviewReject(row) {
  pendingReject.value = { type: 'firstReview', row }
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

// ===== Tab3: 领导终审 =====
function finalApprove(row) {
  pendingFinalApproveRow.value = row
  approveForm.value = {
    handlerId: row.handlerId || '',
    reviewComment: row.reviewComment || '',
    isShow: row.isShow !== undefined ? row.isShow : 1,
    notifyResult: row.notifyResult !== undefined ? row.notifyResult : 0
  }
  approveDialogVisible.value = true
}

async function confirmFinalApprove() {
  const row = pendingFinalApproveRow.value
  if (!row) return
  try {
    await updateCandidate(row.id, {
      status: '已通过',
      handlerId: approveForm.value.handlerId,
      reviewComment: approveForm.value.reviewComment,
      isShow: approveForm.value.isShow,
      notifyResult: approveForm.value.notifyResult,
      reviewedAt: new Date().toISOString()
    })
    ElMessage.success('终审通过')
    approveDialogVisible.value = false
    await loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

function finalReject(row) {
  pendingReject.value = { type: 'finalReview', row }
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

// ===== 统一驳回确认 =====
async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const { type, row } = pendingReject.value
  try {
    if (type === 'material') {
      for (const m of row.materials) {
        await reviewMaterial(m.id, { action: 'reject', reason: rejectReason.value })
      }
      ElMessage.success('材料已驳回，小程序端将提示"材料缺失，请补齐"')
    } else if (type === 'firstReview') {
      await updateCandidate(row.id, {
        status: '已初审驳回',
        reviewComment: rejectReason.value,
        reviewedAt: new Date().toISOString()
      })
      ElMessage.success('候选人初审已驳回')
    } else if (type === 'finalReview') {
      await updateCandidate(row.id, {
        status: '已终审驳回',
        reviewComment: rejectReason.value,
        reviewedAt: new Date().toISOString()
      })
      ElMessage.success('候选人终审已驳回')
    }
    rejectDialogVisible.value = false
    await loadData()
  } catch {
    ElMessage.error('驳回失败')
  }
}
</script>

<style scoped>
.ctx-bar { background: var(--paper-card, #fff); border: 1px solid var(--line-light, #e7e5e4); border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ctx-left { display: flex; align-items: center; gap: 10px; }
.ctx-label { font-size: 13px; color: var(--ink-gray, #57534e); white-space: nowrap; }
.ctx-info { display: flex; gap: 6px; flex-wrap: wrap; }

.stat-cards { display: flex; gap: 12px; }
.stat-card { min-width: 130px; padding: 10px 16px; border-radius: 4px; cursor: pointer; transition: transform 0.1s; border: 1px solid transparent; }
.stat-card:hover { transform: translateY(-1px); }
.stat-card.pending-material { background: #fff7ed; border-color: #fdba74; }
.stat-card.pending-first { background: #fef9c3; border-color: #fde047; }
.stat-card.pending-final { background: #eff6ff; border-color: #93c5fd; }
.stat-num { font-size: 22px; font-weight: 700; line-height: 1; }
.stat-card.pending-material .stat-num { color: #c2410c; }
.stat-card.pending-first .stat-num { color: #a16207; }
.stat-card.pending-final .stat-num { color: #1d4ed8; }
.stat-label { font-size: 12px; color: var(--ink-gray, #57534e); margin-top: 4px; }

.empty-hint { text-align: center; padding: 60px 20px; color: var(--ink-light, #a8a29e); }
.empty-icon { font-size: 48px; margin: 0 0 12px; }
.empty-text { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: var(--ink-gray, #57534e); }
.empty-sub { font-size: 13px; margin: 0; }

.approval-workbench { padding: 0; }
.tab-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.block-title { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 600; margin: 0; }
.block-title em { font-style: normal; font-size: 13px; color: var(--ink-light, #a8a29e); font-weight: 400; }

.applicant-name { font-size: 14px; font-weight: 600; color: var(--ink-dark, #292524); }
.applicant-phone { font-size: 12px; color: var(--ink-light, #a8a29e); margin-top: 2px; }
.completeness-bar { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.check-tag { margin: 0; }
.completeness-stats { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--ink-gray, #57534e); }
.num-ok { color: #16a34a; font-weight: 600; }
.num-miss { color: #dc2626; font-weight: 600; }

.switch-hint { font-size: 12px; color: var(--ink-light, #a8a29e); margin-left: 8px; }

:deep(.approval-badge .el-badge__content) { margin-left: 4px; }
</style>
