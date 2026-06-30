<template>
  <div class="m-notices">
    <!-- 三个 tab（照设计稿：最新公告/选举预告/历史公示） -->
    <div class="tabs">
      <div class="tab" :class="{ on: tab === 'latest' }" @click="tab = 'latest'">最新公告</div>
      <div class="tab" :class="{ on: tab === 'forecast' }" @click="tab = 'forecast'">选举预告</div>
      <div class="tab" :class="{ on: tab === 'history' }" @click="tab = 'history'">历史公示</div>
    </div>

    <!-- 最新公告 -->
    <div v-if="tab === 'latest'" class="list">
      <div class="card" v-for="n in latestNotices" :key="n.id" @click="openNotice(n)">
        <div class="card-head">
          <span class="tag">公告</span>
          <span class="card-title">{{ n.title }}</span>
        </div>
        <div class="time-box" v-if="n.startTime || n.endTime">
          <span class="time-label">⏰ 公示时间</span>
          <span class="time-val">{{ fmtDate(n.startTime) }} 至 {{ fmtDate(n.endTime) }}</span>
        </div>
      </div>
      <div v-if="!latestNotices.length" class="empty">暂无公告</div>
    </div>

    <!-- 选举预告 -->
    <div v-if="tab === 'forecast'" class="list">
      <div class="card" v-for="e in forecasts" :key="e.id">
        <div class="card-head">
          <span class="tag tag-slate">预告</span>
          <span class="card-title">{{ e.name }}</span>
        </div>
        <div class="f-line">⏰ {{ e.date }} {{ e.timeRange || '' }}</div>
        <div class="f-line">📍 {{ e.location || '以公告为准' }}</div>
        <div class="f-positions" v-if="e.positions && e.positions.length">
          <span class="pos-chip" v-for="(p, i) in e.positions" :key="i">{{ p }}</span>
        </div>
      </div>
      <div v-if="!forecasts.length" class="empty">暂无选举预告</div>
    </div>

    <!-- 历史公示 -->
    <div v-if="tab === 'history'" class="list">
      <div class="card" v-for="h in historyNotices" :key="h.id">
        <div class="card-head">
          <span class="tag tag-gray">{{ statusLabel(h.status) }}</span>
          <span class="card-title">{{ h.name }}</span>
        </div>
        <div class="f-line">🗓️ {{ h.date }}</div>
      </div>
      <div v-if="!historyNotices.length" class="empty">暂无历史公示</div>
    </div>

    <!-- 公告详情弹层 -->
    <div v-if="selected" class="modal-mask" @click.self="selected = null">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">{{ selected.title }}</span>
          <span class="modal-close" @click="selected = null">✕</span>
        </div>
        <div class="modal-time" v-if="selected.startTime || selected.endTime">
          ⏰ {{ fmtDate(selected.startTime) }} 至 {{ fmtDate(selected.endTime) }}
        </div>
        <div class="modal-body">{{ selected.content || '（无正文）' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { miniGetNotices, miniGetElections } from '@/api/api';

const tab = ref('latest');
const allNotices = ref<any[]>([]);
const elections = ref<any[]>([]);
const selected = ref<any>(null);

const latestNotices = computed(() =>
  allNotices.value.filter((n) => n.status === '已发布')
);
const forecasts = computed(() => elections.value.filter((e: any) => e.status !== 'completed'));
const historyNotices = computed(() => elections.value.filter((e: any) => e.status === 'completed'));

function fmtDate(t: string) {
  return t ? String(t).slice(0, 10) : '—';
}
function statusLabel(s: string) {
  const map: any = { completed: '已完成' };
  return map[s] || '已完成';
}
function openNotice(n: any) {
  selected.value = n;
}

onMounted(async () => {
  try {
    const r1: any = await miniGetNotices();
    allNotices.value = r1?.data || r1 || [];
  } catch (e) { /* 兜底 */ }
  try {
    const r2: any = await miniGetElections();
    elections.value = r2?.data || r2 || [];
  } catch (e) { /* 兜底 */ }
});
</script>

<style scoped>
.m-notices { max-width: 480px; margin: 0 auto; }
.tabs { display: flex; background: #fff; border-radius: 10px; padding: 4px; margin-bottom: 12px; }
.tab { flex: 1; text-align: center; padding: 8px 0; font-size: 12px; color: #64748b; border-radius: 8px; }
.tab.on { background: #0d9488; color: #fff; font-weight: 600; }
.list { display: flex; flex-direction: column; gap: 10px; }
.card { background: #fff; border-radius: 10px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.card-head { display: flex; align-items: flex-start; gap: 6px; }
.tag { flex-shrink: 0; font-size: 9px; background: #0d9488; color: #fff; padding: 2px 6px; border-radius: 4px; margin-top: 2px; }
.tag-slate { background: #64748b; }
.tag-gray { background: #9ca3af; }
.card-title { font-size: 12px; font-weight: 500; color: #1f2937; flex: 1; line-height: 1.5; }
.time-box { margin-top: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 8px; }
.time-label { font-size: 9px; color: #d97706; font-weight: 700; }
.time-val { font-size: 11px; color: #b45309; font-weight: 600; margin-left: 6px; }
.f-line { font-size: 11px; color: #64748b; margin-top: 5px; }
.f-positions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.pos-chip { font-size: 10px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 10px; }
.empty { text-align: center; padding: 40px; color: #a8a29e; font-size: 12px; }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 24px; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 440px; max-height: 80vh; overflow: auto; }
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px; border-bottom: 1px solid #f3f4f6; gap: 10px; }
.modal-title { font-size: 14px; font-weight: 700; color: #1f2937; line-height: 1.4; }
.modal-close { font-size: 16px; color: #9ca3af; flex-shrink: 0; cursor: pointer; }
.modal-time { padding: 8px 14px; font-size: 11px; color: #b45309; background: #fffbeb; }
.modal-body { padding: 14px; font-size: 13px; color: #374151; line-height: 1.7; white-space: pre-wrap; }
</style>
