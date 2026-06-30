<template>
  <div class="dashboard">
    <header class="page-head">
      <h2 class="page-title">首页概览</h2>
      <p class="page-desc">本次选举工作的整体状况与待办事项</p>
    </header>

    <!-- 统计卡片 -->
    <div class="stat-cards" v-loading="loading">
      <div v-for="c in stats" :key="c.label" class="stat-card">
        <div class="stat-value">{{ c.value }}</div>
        <div class="stat-label">{{ c.label }}</div>
      </div>
    </div>

    <!-- 待办看板 -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>待办事项 <em>({{ todos.length }})</em></h2>
      </div>
      <div class="todo-list">
        <div v-for="t in todos" :key="t.id" class="todo-item">
          <span class="todo-dot" :class="t.urgent ? 'dot-red' : 'dot-yellow'" />
          <span class="todo-text">{{ t.text }}</span>
          <span class="todo-time">{{ t.time }}</span>
          <el-button type="primary" link @click="$router.push(t.link)">前往处理</el-button>
        </div>
        <div v-if="!todos.length && !loading" class="empty">暂无待办事项</div>
      </div>
    </section>

    <!-- 最近公告 -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>最近公告</h2>
        <el-button link @click="$router.push('/notices')">查看更多</el-button>
      </div>
      <el-table :data="recentNotices" v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }"><el-tag effect="plain">{{ noticeTypeMap[row.type] || row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag effect="plain" :type="row.status === '已发布' ? 'success' : 'warning'">{{ statusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布日期" width="120">
          <template #default="{ row }">{{ (row.startTime || row.publishTime || '').slice(0,10) || '-' }}</template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getElections, getMaterials, getNotices } from '@/api/api';

const loading = ref(false);
const stats = ref([
  { label: '选举活动', value: '0' },
  { label: '进行中', value: '0' },
  { label: '待审核材料', value: '0' },
  { label: '已发布公告', value: '0' },
]);
const todos = ref<any[]>([]);
const recentNotices = ref<any[]>([]);

const noticeTypeMap: Record<string, string> = {
  '村民组通知': '村民组',
  '议事会通知': '议事会',
  '村监会通知': '村监会',
  '村务通知': '村务',
};
const statusMap: Record<string, string> = {
  published: '已发布', '已发布': '已发布',
  draft: '草稿', '草稿': '草稿',
  pending: '待发布', '待发布': '待发布',
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '1 天前';
  if (days < 7) return `${days} 天前`;
  return dateStr.slice(0, 10);
}

async function fetchData() {
  loading.value = true;
  try {
    const [electionsRes, materialsRes, noticesRes] = await Promise.all([
      getElections(), getMaterials(), getNotices({ page: 1, size: 5 }),
    ]);
    const elections = electionsRes.data?.list || [];
    const materials = materialsRes.data?.list || [];
    const notices = noticesRes.data?.list || [];

    stats.value = [
      { label: '选举活动', value: String(elections.length) },
      { label: '进行中', value: String(elections.filter((e: any) => e.status === 'in_progress' || e.status === '进行中').length) },
      { label: '待审核材料', value: String(materials.filter((m: any) => m.status === '待审核').length) },
      { label: '已发布公告', value: String(notices.filter((n: any) => n.status === '已发布' || n.status === 'published').length) },
    ];

    const pendingMaterials = materials
      .filter((m: any) => m.status === '待审核')
      .sort((a: any, b: any) => (b.submittedAt || b.date || '').localeCompare(a.submittedAt || a.date || ''))
      .slice(0, 8);
    todos.value = pendingMaterials.map((m: any, i: number) => ({
      id: m.id || i,
      text: `${m.candidateName || m.submitter || '匿名'} 提交了「${m.type || m.name}」待审核`,
      time: timeAgo(m.submittedAt || m.date),
      urgent: i < 2,
      link: '/election/' + (m.electionId || ''),
    }));

    recentNotices.value = notices.slice(0, 5);
  } finally { loading.value = false; }
}

onMounted(fetchData);
</script>

<style scoped>
.dashboard { max-width: 1200px; }
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
  padding: 18px;
  text-align: center;
}
.stat-value { font-family: 'Noto Serif SC', serif; font-size: 30px; font-weight: 700; color: var(--ink-blue); font-variant-numeric: tabular-nums; }
.stat-label { font-size: 12px; color: var(--ink-light); margin-top: 4px; letter-spacing: 0.5px; }

.block {
  background: var(--paper-card);
  border: 1px solid var(--line-light);
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}
.block-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line-light);
}
.block-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-black);
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.block-title em { font-family: 'Noto Sans SC', sans-serif; font-style: normal; font-weight: 400; color: var(--ink-light); font-size: 13px; }
.dot { width: 6px; height: 6px; background: var(--seal-red); border-radius: 50%; display: inline-block; }

.todo-list { padding: 4px 20px 12px; }
.todo-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--line-light);
  font-size: 13px;
}
.todo-item:last-child { border-bottom: none; }
.todo-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: var(--seal-red); }
.dot-yellow { background: var(--status-warn); }
.todo-text { flex: 1; color: var(--ink-gray); }
.todo-time { color: var(--ink-light); font-size: 12px; font-family: 'Courier New', monospace; }
.empty { padding: 32px 20px; text-align: center; color: var(--ink-light); font-size: 13px; }
</style>
