<template>
  <div class="ops-dashboard">
    <header class="top-line">
      <div>
        <h2>{{ unitName }}换届选举运营工作台</h2>
        <p>{{ electionName }} · 当前角色：{{ currentUser.role || '运营' }}</p>
      </div>
      <div class="today-line">
        今天是{{ todayText }}　{{ unitName }}　{{ currentUser.name || '经办人员' }}
      </div>
    </header>

    <section class="system-message">
      <strong>系统消息：</strong>
      <span>您当前有 {{ pendingCount }} 件事情未办理。</span>
      <el-button type="primary" link @click="goFirstTodo">前往处理</el-button>
    </section>

    <main class="workbench" v-loading="loading">
      <section class="panel timeline-panel">
        <div class="panel-head">
          <h3>活动日历</h3>
          <span>日期标记根据活动时间展示</span>
        </div>
        <div class="timeline-table">
          <div class="timeline-row timeline-title">
            <span>阶段</span>
            <span>日期</span>
            <span>天数</span>
            <span>核心工作</span>
            <span>状态</span>
          </div>
          <button
            v-for="stage in stages"
            :key="stage.name"
            class="timeline-row timeline-button"
            type="button"
            @click="goStage(stage.link)"
          >
            <span>{{ stage.name }}</span>
            <span>{{ stage.date }}</span>
            <span>{{ stage.days }}</span>
            <span>{{ stage.work }}</span>
            <em :class="['stage-state', stage.state]">{{ stateText(stage.state) }}</em>
          </button>
        </div>
      </section>

      <section class="panel notice-panel">
        <div class="panel-head">
          <h3>最新公告消息</h3>
          <el-button link type="primary" @click="$router.push('/notices')">查看公告</el-button>
        </div>
        <div class="notice-list">
          <button
            v-for="notice in recentNotices"
            :key="notice.id"
            class="notice-item"
            type="button"
            @click="$router.push('/notices')"
          >
            <span class="notice-title">{{ notice.title }}</span>
            <span class="notice-meta">{{ notice.status || '草稿' }} · {{ noticeDate(notice) }}</span>
          </button>
          <div v-if="!recentNotices.length && !loading" class="empty">暂无公告</div>
        </div>
      </section>

      <section class="panel archive-panel">
        <div class="panel-head">
          <h3>历届档案中心</h3>
          <span>文件、附件、模板、用户上传材料归档</span>
        </div>
        <div class="archive-actions">
          <button type="button" @click="$router.push('/archives')">
            <strong>{{ unitName }}换届选举档案</strong>
            <span>查看归档文件</span>
          </button>
          <button type="button" @click="$router.push('/materials')">
            <strong>工作材料上传</strong>
            <span>{{ pendingMaterialCount }} 件待审核</span>
          </button>
        </div>
      </section>

      <section class="panel positions-panel">
        <div class="panel-head">
          <h3>当前岗位一览</h3>
          <el-button link type="primary" @click="$router.push('/positions')">点击修改</el-button>
        </div>
        <el-table :data="positions" size="small">
          <el-table-column prop="name" label="岗位名称" min-width="120" />
          <el-table-column label="当前在任人" min-width="150">
            <template #default="{ row }">{{ row.current_holder || row.currentHolder || '-' }}</template>
          </el-table-column>
          <el-table-column label="联系方式" width="130">
            <template #default="{ row }">{{ row.contact || row.phone || '-' }}</template>
          </el-table-column>
          <el-table-column label="岗位状态" width="110">
            <template #default="{ row }">
              <el-tag effect="plain">{{ row.post_status || row.status || '待完善' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上位方式" width="120">
            <template #default="{ row }">{{ row.entry_method || row.method || '选举' }}</template>
          </el-table-column>
        </el-table>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getElection, getElections, getMaterials, getNotices, getPositions } from '@/api/api';

const router = useRouter();
const loading = ref(false);
const currentUser = ref<any>({});
const currentElection = ref<any>(null);
const recentNotices = ref<any[]>([]);
const materials = ref<any[]>([]);
const positions = ref<any[]>([]);

const todayText = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
const unitName = computed(() => currentElection.value?.villageName || currentElection.value?.village_name || currentElection.value?.village || '本村居');
const electionName = computed(() => currentElection.value?.name || '第十五届村（居）委会换届选举');
const pendingMaterialCount = computed(() => materials.value.filter((m: any) => ['待审核', 'pending'].includes(m.status)).length);
const draftNoticeCount = computed(() => recentNotices.value.filter((n: any) => ['草稿', 'draft', '待发布', 'pending'].includes(n.status)).length);
const pendingCount = computed(() => pendingMaterialCount.value + draftNoticeCount.value);

const stageLinkMap: Record<string, string> = {
  S1: '/election',
  S2: '/materials',
  S3: '/notices',
  S4: '/notices',
  S5: '/materials',
  S6: '/candidates',
  S7: '/candidates',
  S8: '/candidates',
  S9: '/notices',
  S10: '/election',
  S11: '/materials',
};

function parseElectionContent(content: any) {
  if (!content) return {};
  if (typeof content === 'object') return content;
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function toStageState(stageStatus: string) {
  if (['已完成', '已结束', 'done', 'completed'].includes(stageStatus)) return 'done';
  if (['进行中', 'active', 'in_progress'].includes(stageStatus)) return 'active';
  return 'waiting';
}

function fallbackStages() {
  const base = [
    ['前期准备', '10/15-10/16', '2天', '两委联席、代表会议、推选选委会、发1/2/3号公告', '/election'],
    ['选民登记', '10/17-10/21', '5天', '宣传发动、登记造册', '/materials'],
    ['名单公布', '10/22-10/26', '5天', '发4号公告、汇总选民名单、委托投票', '/notices'],
    ['调整解释', '10/27-10/29', '3天', '处理选民申诉', '/notices'],
    ['提名', '11/04-11/06', '3天', '初步候选人提名、资格审查、发7/8号公告', '/candidates'],
    ['资格审查', '11/10-11/16', '7天', '联审考察、发9号公告', '/candidates'],
    ['选举准备', '11/17-11/19', '3天', '发10-15号公告、培训、制票、布场', '/notices'],
    ['选举日', '11/20', '1天', '线下投票选举、发16号公告', '/election'],
  ];
  const activeIndex = pendingMaterialCount.value > 0 ? 1 : 4;
  return base.map(([name, date, days, work, link], index) => ({
    name,
    date,
    days,
    work,
    link,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'waiting',
  }));
}

const stages = computed(() => {
  const content = parseElectionContent(currentElection.value?.content);
  const timeline = Array.isArray(content.timeline) ? content.timeline : [];
  if (!timeline.length) return fallbackStages();

  return timeline.map((stage: any) => {
    const stageKey = stage.stageKey || stage.stage_key;
    const days = Number(stage.days);
    return {
      name: stage.stageName || stage.stage_name || stage.name || stageKey || '-',
      date: stage.dateRange || stage.date_range || stage.date || [stage.startDate, stage.endDate].filter(Boolean).join('-') || '-',
      days: Number.isFinite(days) ? `${days}天` : (stage.days || '-'),
      work: stage.work || '-',
      link: stageLinkMap[stageKey] || (stage.archiveOnly ? '/materials' : '/notices'),
      state: toStageState(stage.stageStatus || stage.stage_status || stage.status),
    };
  });
});

function stateText(state: string) {
  if (state === 'done') return '已结束';
  if (state === 'active') return '进行中';
  return '未开始';
}

function noticeDate(row: any) {
  return (row.publishTime || row.publish_time || row.startTime || row.created_at || '').slice(0, 10) || '-';
}

function goStage(link: string) {
  router.push(link);
}

function goFirstTodo() {
  if (pendingMaterialCount.value > 0) router.push('/materials');
  else if (draftNoticeCount.value > 0) router.push('/notices');
  else router.push('/election');
}

async function fetchData() {
  loading.value = true;
  try {
    try {
      currentUser.value = JSON.parse(localStorage.getItem('user') || '{}') || {};
    } catch {
      currentUser.value = {};
    }

    const electionsRes = await getElections({ page: 1, pageSize: 1 });
    const elections = electionsRes.data?.list || [];
    currentElection.value = elections[0] || null;
    const electionId = currentElection.value?.id;

    const [detailRes, noticesRes, materialsRes, positionsRes] = await Promise.all([
      electionId ? getElection(String(electionId)) : Promise.resolve({ data: null }),
      getNotices({ page: 1, pageSize: 6, electionId }),
      getMaterials({ page: 1, pageSize: 20, electionId }),
      electionId ? getPositions({ electionId }) : Promise.resolve({ data: { list: [] } }),
    ]);

    currentElection.value = detailRes.data || currentElection.value;
    recentNotices.value = noticesRes.data?.list || [];
    materials.value = materialsRes.data?.list || [];
    positions.value = positionsRes.data?.list || [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<style scoped>
.ops-dashboard {
  max-width: 1280px;
}

.top-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--ink-black);
}

.top-line h2 {
  margin: 0 0 6px;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 24px;
  color: var(--ink-black);
}

.top-line p,
.today-line {
  margin: 0;
  color: var(--ink-gray);
  font-size: 13px;
}

.system-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0;
  padding: 12px 16px;
  border: 1px solid var(--line-dark);
  background: var(--paper-card);
  color: var(--ink-black);
}

.workbench {
  display: grid;
  grid-template-columns: minmax(520px, 1.1fr) minmax(360px, 0.9fr);
  gap: 18px;
}

.panel {
  border: 1px solid var(--line-dark);
  background: var(--paper-card);
  min-width: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-light);
}

.panel-head h3 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 16px;
  color: var(--ink-black);
}

.panel-head span {
  color: var(--ink-light);
  font-size: 12px;
}

.timeline-table {
  padding: 10px 14px 16px;
}

.timeline-row {
  display: grid;
  grid-template-columns: 82px 100px 58px minmax(220px, 1fr) 70px;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 38px;
  border: 0;
  border-bottom: 1px dashed var(--line-dark);
  background: transparent;
  color: var(--ink-gray);
  font: inherit;
  text-align: left;
}

.timeline-title {
  min-height: 28px;
  color: var(--ink-light);
  font-size: 12px;
}

.timeline-button {
  cursor: pointer;
}

.timeline-button:hover {
  background: rgba(47, 111, 71, 0.06);
}

.stage-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  border-radius: 999px;
  font-style: normal;
  font-size: 12px;
  border: 1px solid var(--line-light);
}

.stage-state.done {
  color: var(--seal-red);
  background: rgba(198, 40, 40, 0.08);
}

.stage-state.active {
  color: var(--ink-blue);
  background: rgba(25, 118, 210, 0.08);
}

.stage-state.waiting {
  color: var(--ink-light);
  background: var(--paper-bg);
}

.notice-list {
  padding: 12px 16px 16px;
}

.notice-item {
  display: block;
  width: 100%;
  padding: 12px 0;
  border: 0;
  border-bottom: 1px dashed var(--line-light);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.notice-title {
  display: block;
  color: var(--ink-blue);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-meta {
  display: block;
  margin-top: 4px;
  color: var(--ink-light);
  font-size: 12px;
}

.archive-panel,
.positions-panel {
  grid-column: span 1;
}

.archive-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.archive-actions button {
  min-height: 88px;
  border: 1px solid var(--line-dark);
  background: var(--paper-bg);
  color: var(--ink-black);
  text-align: left;
  padding: 14px;
  cursor: pointer;
}

.archive-actions button:hover {
  border-color: var(--ink-blue);
}

.archive-actions strong,
.archive-actions span {
  display: block;
}

.archive-actions span {
  margin-top: 8px;
  color: var(--ink-light);
  font-size: 12px;
}

.positions-panel {
  grid-column: 1 / -1;
}

.empty {
  padding: 28px 0;
  text-align: center;
  color: var(--ink-light);
  font-size: 13px;
}

@media (max-width: 980px) {
  .top-line,
  .system-message {
    display: block;
  }

  .today-line {
    margin-top: 8px;
  }

  .workbench,
  .archive-actions {
    grid-template-columns: 1fr;
  }

  .timeline-row {
    grid-template-columns: 72px 88px 48px minmax(120px, 1fr);
  }

  .timeline-row > :last-child {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>
