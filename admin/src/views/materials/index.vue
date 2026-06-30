<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">材料审核（漏斗页1）</h2>
      <p class="page-desc">双层漏斗：系统初筛自动过滤 → 人工审核决策 → 必填齐全自动晋升候选人</p>
    </header>

    <!-- 活动选择器 + 筛选轴 -->
    <section class="block ctx-bar">
      <div class="ctx-left">
        <span class="ctx-label">当前选举</span>
        <el-select v-model="currentElectionId" placeholder="请先选择选举活动" style="width:260px" @change="onElectionChange">
          <el-option v-for="e in elections" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>
      <div class="ctx-filters" v-if="currentElectionId">
        <el-select v-model="filterPositionId" placeholder="全部职位" clearable style="width:160px" @change="loadApplicants">
          <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-select v-model="viewMode" placeholder="视图" style="width:140px" @change="loadApplicants">
          <el-option label="仅系统通过" value="system_pass" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-switch v-model="autoMode" active-text="全自动模式" inactive-text="人工审核" @change="onAutoModeChange" />
      </div>
      <div class="ctx-info" v-if="ctxElection">
        <el-tag effect="plain">📅 {{ ctxElection.date }}</el-tag>
        <el-tag effect="plain" :type="ctxElection.deadlineAt && new Date(ctxElection.deadlineAt) < new Date() ? 'danger' : 'info'">
          ⏰ 材料截止 {{ ctxElection.deadlineAt ? ctxElection.deadlineAt.slice(0,10) : '未设置' }}
        </el-tag>
      </div>
    </section>

    <!-- 未选活动时的提示 -->
    <div v-if="!currentElectionId" class="empty-hint">
      <p class="empty-icon">📎</p>
      <p class="empty-text">请先选择选举活动</p>
      <p class="empty-sub">选择活动后可查看和管理该活动的材料提交</p>
    </div>

    <!-- 漏斗页1：一行=一个报名人（按姓名+手机+职位聚合） -->
    <section v-if="currentElectionId" class="block" style="margin-top:16px">
      <div class="block-head">
        <h3 class="block-title">报名人材料审核 <em>({{ applicantList.length }} 人)</em></h3>
        <div class="block-actions">
          <el-tag v-if="autoMode" type="warning" effect="dark">🤖 全自动模式：系统初筛=最终结果</el-tag>
          <el-button type="primary" plain size="small" @click="loadApplicants" :loading="loading">刷新</el-button>
        </div>
      </div>

      <el-table :data="applicantList" v-loading="loading" size="small" :row-class-name="applicantRowClass">
        <el-table-column label="报名人" width="100">
          <template #default="{ row }">
            <div class="applicant-name">{{ row.name }}</div>
            <div class="applicant-phone">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="position" label="参选职位" width="120" />
        <el-table-column label="系统初筛" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.systemReview === 'pass' ? 'success' : 'danger'" effect="plain" size="small">
              {{ row.systemReview === 'pass' ? '✓ 通过' : '✗ 驳回' }}
            </el-tag>
            <div v-if="row.systemReview === 'reject'" class="system-reason">{{ row.systemRejectReason }}</div>
          </template>
        </el-table-column>
        <el-table-column label="齐全性看板" min-width="280">
          <template #default="{ row }">
            <div class="completeness-bar">
              <el-tag v-for="r in row.requirements" :key="r.id" size="small" effect="plain" class="check-tag"
                :type="isApplicantSubmitted(row, r.id) ? 'success' : (r.required ? 'danger' : 'info')">
                {{ r.name }}{{ r.required ? '' : '(选)' }}
              </el-tag>
            </div>
            <div class="completeness-stats">
              <span class="stat-item">已交 <strong class="num-ok">{{ row.submittedCount }}</strong></span>
              <span class="stat-item">缺失 <strong :class="row.missingCount > 0 ? 'num-miss' : 'num-ok'">{{ row.missingCount }}</strong></span>
              <el-tag :type="row.complete ? 'success' : 'danger'" effect="dark" size="small">{{ row.complete ? '齐全' : '不齐' }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="人工审核" width="120" align="center">
          <template #default="{ row }">
            <div v-if="autoMode" class="auto-mode-hint">🤖 自动</div>
            <div v-else-if="row.manualReview === 'pending'">
              <el-button type="success" link size="small" @click="manualReview(row, 'approve')">通过</el-button>
              <el-button type="danger" link size="small" @click="manualReview(row, 'reject')">驳回</el-button>
            </div>
            <el-tag v-else :type="row.manualReview === 'approved' ? 'success' : 'danger'" effect="plain" size="small">
              {{ row.manualReview === 'approved' ? '✓ 通过' : '✗ 驳回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewApplicantDetails(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="`${detailApplicant?.name} 的材料详情`" width="900px">
      <div v-if="detailApplicant" class="applicant-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-row"><span class="label">姓名:</span> {{ detailApplicant.name }}</div>
          <div class="detail-row"><span class="label">手机号:</span> {{ detailApplicant.phone }}</div>
          <div class="detail-row"><span class="label">参选职位:</span> {{ detailApplicant.position }}</div>
        </div>
        <div class="detail-section">
          <h4>审核状态</h4>
          <div class="detail-row">
            <span class="label">系统初筛:</span>
            <el-tag :type="detailApplicant.systemReview === 'pass' ? 'success' : 'danger'" size="small">
              {{ detailApplicant.systemReview === 'pass' ? '通过' : '驳回' }}
            </el-tag>
            <span v-if="detailApplicant.systemReview === 'reject'" class="reject-reason">原因：{{ detailApplicant.systemRejectReason }}</span>
          </div>
          <div class="detail-row">
            <span class="label">人工审核:</span>
            <el-tag v-if="detailApplicant.manualReview === 'pending'" type="info" size="small">待审</el-tag>
            <el-tag v-else :type="detailApplicant.manualReview === 'approved' ? 'success' : 'danger'" size="small">
              {{ detailApplicant.manualReview === 'approved' ? '通过' : '驳回' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-section">
          <h4>材料明细</h4>
          <el-table :data="detailApplicant.materials" size="small" style="margin-top:12px">
            <el-table-column prop="requirementName" label="材料项" width="140" />
            <el-table-column label="提交内容" min-width="200">
              <template #default="{ row }">
                <span v-if="row.textContent">📝 {{ row.textContent }}</span>
                <a v-else-if="row.filePath" :href="`${apiBase}${row.filePath}`" target="_blank" class="file-link">📄 {{ row.name || '附件' }}</a>
                <span v-else class="dim">未提交</span>
              </template>
            </el-table-column>
            <el-table-column prop="submittedAt" label="提交时间" width="160" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已通过' ? 'success' : (row.status === '已驳回' ? 'danger' : 'info')" size="small" effect="plain">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rejectionReason" label="驳回原因" min-width="160">
              <template #default="{ row }">
                <span v-if="row.rejectionReason" class="reject-reason">{{ row.rejectionReason }}</span>
                <span v-else class="dim">-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 驳回原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="500px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getElections, getPositions, getMaterials, reviewMaterial } from '@/api/api'

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// ========== 选举活动上下文 ==========
const elections = ref([])
const currentElectionId = ref('')
const ctxElection = computed(() => elections.value.find(e => e.id === currentElectionId.value))

// ========== 筛选轴 ==========
const positions = ref([])
const filterPositionId = ref('') // 职位筛选
const viewMode = ref('system_pass') // 视图模式: system_pass(默认) | all
const autoMode = ref(false) // 全自动开关

// ========== 报名人聚合列表 ==========
const loading = ref(false)
const applicantList = ref([]) // 一行=一个报名人(按姓名+手机+职位聚合)

// ========== 详情弹窗 ==========
const detailVisible = ref(false)
const detailApplicant = ref(null)

// ========== 驳回弹窗 ==========
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const pendingRejectApplicant = ref(null)

// ========== 生命周期 ==========
onMounted(async () => {
  try {
    const eRes = await getElections()
    elections.value = eRes.data?.list || []
    if (elections.value.length) {
      // 优先选中进行中的活动，否则取第一个
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
  // 加载职位列表
  try {
    const posRes = await getPositions({ electionId: currentElectionId.value })
    positions.value = posRes.data?.list || []
  } catch {
    ElMessage.error('加载职位失败')
  }
  // 加载报名人聚合列表
  await loadApplicants()
}

// ========== 核心：聚合报名人 ==========
async function loadApplicants() {
  if (!currentElectionId.value) return
  loading.value = true
  try {
    // 1. 获取该活动的所有材料
    const matRes = await getMaterials({ electionId: currentElectionId.value })
    const electionMaterials = matRes.data?.list || []

    // 2. 按 applicantName + applicantPhone + positionId 聚合
    const groupMap = new Map()
    for (const m of electionMaterials) {
      const key = `${m.applicantName}|${m.applicantPhone}|${m.positionId}`
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          name: m.applicantName,
          phone: m.applicantPhone,
          positionId: m.positionId,
          position: positions.value.find(p => p.id === m.positionId)?.name || '-',
          materials: [],
          systemReview: 'pending', // pending | pass | reject
          systemRejectReason: '',
          manualReview: 'pending' // pending | approved | rejected
        })
      }
      groupMap.get(key).materials.push(m)
    }

    let list = Array.from(groupMap.values())

    // 3. 计算齐全性 + 系统初筛状态
    for (const applicant of list) {
      const pos = positions.value.find(p => p.id === applicant.positionId)
      let requirements = []
      if (Array.isArray(pos?.materialRequirements)) {
        requirements = pos.materialRequirements
      } else {
        try { requirements = JSON.parse(pos?.materialRequirements || '[]') } catch {}
      }
      applicant.requirements = requirements

      // 已提交的材料requirementId集合
      const submittedReqIds = applicant.materials.map(m => m.requirementId)
      const requiredIds = requirements.filter(r => r.required).map(r => r.id)
      applicant.submittedCount = submittedReqIds.length
      applicant.missingCount = requiredIds.filter(rid => !submittedReqIds.includes(rid)).length
      applicant.complete = applicant.missingCount === 0

      // 系统初筛逻辑：必填材料齐全→pass, 否则→reject
      if (applicant.complete) {
        applicant.systemReview = 'pass'
      } else {
        applicant.systemReview = 'reject'
        applicant.systemRejectReason = `缺失必填材料${applicant.missingCount}项`
      }

      // 人工审核状态：按该报名人+职位下全部材料综合判断
      const statuses = applicant.materials.map(m => m.status)
      if (statuses.every(s => s === '已通过')) {
        applicant.manualReview = 'approved'
      } else if (statuses.some(s => s === '已驳回')) {
        applicant.manualReview = 'rejected'
      } else {
        applicant.manualReview = 'pending'
      }
    }

    // 4. 视图过滤
    if (filterPositionId.value) {
      list = list.filter(a => a.positionId === filterPositionId.value)
    }
    if (viewMode.value === 'system_pass') {
      list = list.filter(a => a.systemReview === 'pass')
    }

    applicantList.value = list
  } catch (err) {
    console.error(err)
    ElMessage.error('加载报名人失败')
  } finally {
    loading.value = false
  }
}

// ========== 辅助函数 ==========
function isApplicantSubmitted(applicant, requirementId) {
  return applicant.materials.some(m => m.requirementId === requirementId)
}

function applicantRowClass({ row }) {
  // 可根据状态加样式
  return ''
}

async function onAutoModeChange() {
  if (autoMode.value) {
    ElMessage.info('🤖 已开启全自动模式：系统初筛结果=最终结果')
  } else {
    ElMessage.info('已切回人工审核模式')
  }
  await loadApplicants()
}

// ========== 人工审核 ==========
async function manualReview(applicant, action) {
  if (action === 'reject') {
    // 打开驳回弹窗
    pendingRejectApplicant.value = applicant
    rejectReason.value = ''
    rejectDialogVisible.value = true
    return
  }

  // 通过：批量更新该报名人的所有材料为已通过
  try {
    for (const mat of applicant.materials) {
      await reviewMaterial(mat.id, { action: 'approve' })
    }
    ElMessage.success('已通过，将自动生成候选人（若必填材料齐全）')
    await loadApplicants()
  } catch {
    ElMessage.error('审核失败')
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  try {
    // 批量驳回该报名人的所有材料
    for (const mat of pendingRejectApplicant.value.materials) {
      await reviewMaterial(mat.id, { action: 'reject', reason: rejectReason.value })
    }
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    await loadApplicants()
  } catch {
    ElMessage.error('驳回失败')
  }
}

// ========== 查看详情 ==========
function viewApplicantDetails(applicant) {
  detailApplicant.value = applicant
  detailVisible.value = true
}
</script>

<style scoped>
/* 上下文栏 */
.ctx-bar { background: var(--paper-card, #fff); border: 1px solid var(--line-light, #e7e5e4); border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ctx-left { display: flex; align-items: center; gap: 10px; }
.ctx-label { font-size: 13px; color: var(--ink-gray, #57534e); white-space: nowrap; }
.ctx-filters { display: flex; align-items: center; gap: 10px; }
.ctx-info { display: flex; gap: 6px; flex-wrap: wrap; }

/* 空状态 */
.empty-hint { text-align: center; padding: 60px 20px; color: var(--ink-light, #a8a29e); }
.empty-icon { font-size: 48px; margin: 0 0 12px; }
.empty-text { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: var(--ink-gray, #57534e); }
.empty-sub { font-size: 13px; margin: 0; }

/* 块容器 */
.block { background: var(--paper-card, #fff); border: 1px solid var(--line-light, #e7e5e4); border-radius: 4px; padding: 16px; }
.block-head { margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
.block-title { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 600; margin: 0; }
.block-title em { font-style: normal; font-size: 13px; color: var(--ink-light, #a8a29e); font-weight: 400; }
.block-actions { display: flex; align-items: center; gap: 8px; }

/* 表格内容 */
.applicant-name { font-size: 14px; font-weight: 600; color: var(--ink-dark, #292524); }
.applicant-phone { font-size: 12px; color: var(--ink-light, #a8a29e); margin-top: 2px; }
.system-reason { font-size: 11px; color: var(--ink-light, #a8a29e); margin-top: 4px; }
.auto-mode-hint { font-size: 12px; color: var(--ink-light, #a8a29e); }

/* 齐全性看板 */
.completeness-bar { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.check-tag { margin: 0; }
.completeness-stats { display: flex; align-items: center; gap: 12px; font-size: 12px; }
.stat-item { color: var(--ink-gray, #57534e); }
.num-ok { color: #16a34a; font-weight: 600; }
.num-miss { color: #dc2626; font-weight: 600; }

/* 详情弹窗 */
.applicant-detail { }
.detail-section { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--line-light, #e7e5e4); }
.detail-section:last-child { border-bottom: none; }
.detail-section h4 { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--ink-dark, #292524); }
.detail-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.detail-row .label { font-weight: 600; color: var(--ink-gray, #57534e); min-width: 80px; }
.reject-reason { color: var(--ink-light, #a8a29e); margin-left: 8px; }
.file-link { color: var(--ink-blue, #1e3a8a); text-decoration: none; }
.file-link:hover { text-decoration: underline; }
.dim { color: var(--ink-light, #a8a29e); font-size: 12px; }
</style>
