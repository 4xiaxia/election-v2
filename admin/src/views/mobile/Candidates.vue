<template>
  <div class="m-candidates">
    <!-- 选举切换（横向滚动） -->
    <div class="elec-tabs" v-if="elections.length">
      <button
        v-for="e in elections"
        :key="e.id"
        class="elec-tab"
        :class="{ on: activeElection === e.id }"
        @click="switchElection(e.id)"
      >{{ e.name }}</button>
    </div>

    <!-- 职位筛选 -->
    <div class="filters">
      <span
        v-for="f in filters"
        :key="f"
        class="filter"
        :class="{ on: activeFilter === f }"
        @click="activeFilter = f"
      >{{ f }}</span>
    </div>

    <!-- 候选人卡片列表 -->
    <div class="list">
      <div class="card" v-for="c in filteredCandidates" :key="c.id" @click="selected = c">
        <div class="avatar">{{ c.name?.charAt(0) }}</div>
        <div class="info">
          <div class="name-row">
            <span class="name">{{ c.name }}</span>
            <span class="pos-tag">{{ c.position }}</span>
          </div>
          <div class="sub">{{ c.village }}<span v-if="c.party"> · {{ c.party }}</span></div>
          <div class="intro" v-if="c.intro">{{ c.intro }}</div>
        </div>
      </div>
      <div v-if="!filteredCandidates.length" class="empty">该选举暂无公示候选人</div>
    </div>

    <!-- 候选人详情弹层 -->
    <div v-if="selected" class="modal-mask" @click.self="selected = null">
      <div class="modal">
        <div class="modal-top">
          <div class="modal-avatar">{{ selected.name?.charAt(0) }}</div>
          <div>
            <div class="modal-name">{{ selected.name }}</div>
            <div class="modal-pos">{{ selected.position }} · {{ selected.village }}</div>
          </div>
          <span class="modal-close" @click="selected = null">✕</span>
        </div>
        <div class="modal-meta">
          <span v-if="selected.gender">{{ selected.gender }}</span>
          <span v-if="selected.age">{{ selected.age }}岁</span>
          <span v-if="selected.party">{{ selected.party }}</span>
          <span v-if="selected.education">{{ selected.education }}</span>
        </div>
        <div class="modal-sec" v-if="selected.platform">
          <div class="sec-title">竞选纲领</div>
          <div class="sec-body">{{ selected.platform }}</div>
        </div>
        <div class="modal-sec" v-if="selected.career">
          <div class="sec-title">主要履历</div>
          <div class="sec-body">{{ selected.career }}</div>
        </div>
        <div class="modal-sec" v-if="pledgeList.length">
          <div class="sec-title">承诺事项</div>
          <div class="pledge" v-for="(p, i) in pledgeList" :key="i">{{ i + 1 }}. {{ p }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { miniGetElections, miniGetCandidates } from '@/api/api';

const elections = ref<any[]>([]);
const candidates = ref<any[]>([]);
const activeElection = ref('');
const activeFilter = ref('全部');
const selected = ref<any>(null);
const filters = ['全部', '主任', '副主任', '委员'];

const filteredCandidates = computed(() => {
  if (activeFilter.value === '全部') return candidates.value;
  return candidates.value.filter((c) => (c.position || '').includes(activeFilter.value));
});

// 承诺事项可能是 JSON 字符串或数组
const pledgeList = computed(() => {
  const p = selected.value?.pledges;
  if (!p) return [];
  if (Array.isArray(p)) return p;
  try { const arr = JSON.parse(p); return Array.isArray(arr) ? arr : []; } catch { return []; }
});

async function loadCandidates(electionId: string) {
  try {
    const res: any = await miniGetCandidates(electionId);
    candidates.value = res?.data || res || [];
  } catch (e) { candidates.value = []; }
}
function switchElection(id: string) {
  activeElection.value = id;
  activeFilter.value = '全部';
  loadCandidates(id);
}

onMounted(async () => {
  try {
    const r: any = await miniGetElections();
    elections.value = r?.data || r || [];
    if (elections.value.length) {
      activeElection.value = elections.value[0].id;
      await loadCandidates(activeElection.value);
    }
  } catch (e) { /* 兜底 */ }
});
</script>

<style scoped>
.m-candidates { max-width: 480px; margin: 0 auto; }
.elec-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; }
.elec-tab { flex-shrink: 0; font-size: 11px; padding: 6px 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff; color: #475569; white-space: nowrap; }
.elec-tab.on { background: #0d9488; color: #fff; border-color: #0d9488; font-weight: 600; }
.filters { display: flex; gap: 6px; margin-bottom: 12px; }
.filter { font-size: 11px; padding: 4px 12px; border-radius: 14px; background: #fff; color: #64748b; }
.filter.on { background: #134e4a; color: #fff; font-weight: 600; }
.list { display: flex; flex-direction: column; gap: 10px; }
.card { background: #fff; border-radius: 10px; padding: 12px; display: flex; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #2dd4bf, #14b8a6); color: #fff; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.info { flex: 1; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 8px; }
.name { font-size: 14px; font-weight: 600; color: #1f2937; }
.pos-tag { font-size: 10px; background: #f0fdfa; color: #0d9488; padding: 2px 8px; border-radius: 10px; }
.sub { font-size: 11px; color: #94a3b8; margin-top: 3px; }
.intro { font-size: 11px; color: #64748b; margin-top: 5px; line-height: 1.5; }
.empty { text-align: center; padding: 40px; color: #a8a29e; font-size: 12px; }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 24px; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 440px; max-height: 82vh; overflow: auto; }
.modal-top { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid #f3f4f6; position: relative; }
.modal-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #2dd4bf, #14b8a6); color: #fff; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-name { font-size: 16px; font-weight: 700; color: #1f2937; }
.modal-pos { font-size: 12px; color: #64748b; margin-top: 3px; }
.modal-close { position: absolute; top: 14px; right: 14px; font-size: 16px; color: #9ca3af; cursor: pointer; }
.modal-meta { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px; }
.modal-meta span { font-size: 11px; background: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 10px; }
.modal-sec { padding: 12px 16px; border-top: 1px solid #f8fafc; }
.sec-title { font-size: 12px; font-weight: 700; color: #0d9488; margin-bottom: 6px; }
.sec-body { font-size: 13px; color: #374151; line-height: 1.7; white-space: pre-wrap; }
.pledge { font-size: 13px; color: #374151; line-height: 1.7; }
</style>
