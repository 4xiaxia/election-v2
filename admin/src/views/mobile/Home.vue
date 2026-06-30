<template>
  <div class="m-home">
    <!-- 走马灯消息条（照设计稿·顶部） -->
    <div class="marquee" @click="goNotices">
      <span class="bell">🔔</span>
      <div class="marquee-wrap">
        <div class="marquee-text">{{ marqueeText }}</div>
      </div>
      <span class="more">查看 ›</span>
    </div>

    <!-- 横幅 -->
    <div class="banner">
      <div class="banner-sub">2025年村级组织换届</div>
      <div class="banner-main">依法选举 公正公开</div>
      <div class="banner-desc">城厢区2025年度村（居）民委员会换届选举工作</div>
    </div>

    <!-- 4宫格入口 -->
    <div class="grid">
      <div class="grid-item" v-for="m in menus" :key="m.label" @click="$router.push(m.path)">
        <div class="grid-icon" :class="m.cls">{{ m.icon }}</div>
        <span class="grid-label">{{ m.label }}</span>
      </div>
    </div>

    <!-- 最新公告 -->
    <div class="section">
      <div class="section-head">
        <span class="section-title">📢 最新公告</span>
        <span class="section-more" @click="goNotices">更多 ›</span>
      </div>
      <div v-if="notices.length" >
        <div class="notice-row" v-for="n in notices" :key="n.id" @click="goNotices">
          <span class="notice-tag">新</span>
          <span class="notice-title">{{ n.title }}</span>
          <span class="notice-date">{{ fmtDate(n.publishTime || n.startTime) }}</span>
        </div>
      </div>
      <div v-else class="empty-sm">暂无公告</div>
    </div>

    <!-- 近期选举预告 -->
    <div class="section">
      <div class="section-head"><span class="section-title">🔔 近期选举预告</span></div>
      <div v-if="topElection" class="forecast">
        <div class="forecast-name">{{ topElection.name }}</div>
        <div class="forecast-line">⏰ 选举时间：{{ topElection.date }} {{ topElection.timeRange || '' }}</div>
        <div class="forecast-line">📍 地点：{{ topElection.location || '以公告为准' }}</div>
        <div class="forecast-tip">参选时间请以公告为准</div>
      </div>
      <div v-else class="empty-sm">暂无选举预告</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { miniGetNotices, miniGetElections } from '@/api/api';

const router = useRouter();
const notices = ref<any[]>([]);
const elections = ref<any[]>([]);

const menus = [
  { icon: '📢', label: '公告通知', path: '/m/notices', cls: 'c-amber' },
  { icon: '🗳️', label: '选举方式', path: '/m/elections', cls: 'c-slate' },
  { icon: '👤', label: '候选人', path: '/m/candidates', cls: 'c-teal' },
  { icon: '📋', label: '材料提交', path: '/m/candidates', cls: 'c-rose' },
];

const topElection = computed(() => elections.value[0] || null);
const marqueeText = computed(() => {
  const titles = notices.value.slice(0, 3).map((n) => n.title);
  return titles.length ? titles.join(' — ') : '关于开展2025年村级组织换届选举工作的公告';
});

function fmtDate(t: string) {
  if (!t) return '';
  return String(t).slice(0, 10);
}
function goNotices() {
  router.push('/m/notices');
}

onMounted(async () => {
  try {
    const r1: any = await miniGetNotices();
    const list = r1?.data || r1 || [];
    notices.value = list.filter((n: any) => n.status === '已发布').slice(0, 3);
  } catch (e) { /* 兜底：失败不阻塞展示 */ }
  try {
    const r2: any = await miniGetElections();
    elections.value = (r2?.data || r2 || []).slice(0, 2);
  } catch (e) { /* 兜底 */ }
});
</script>

<style scoped>
.m-home { max-width: 480px; margin: 0 auto; }
.marquee { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 10px; margin-bottom: 12px; overflow: hidden; }
.bell { flex-shrink: 0; font-size: 12px; }
.marquee-wrap { flex: 1; overflow: hidden; }
.marquee-text { white-space: nowrap; font-size: 11px; color: #92400e; font-weight: 500; animation: marquee 15s linear infinite; }
@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
.more { flex-shrink: 0; font-size: 10px; color: #d97706; }
.banner { background: linear-gradient(135deg, #475569, #334155); padding: 18px 16px; border-radius: 12px; margin-bottom: 14px; color: #fff; }
.banner-sub { font-size: 12px; opacity: .8; }
.banner-main { font-size: 17px; font-weight: 700; margin-top: 4px; }
.banner-desc { font-size: 10px; margin-top: 4px; opacity: .7; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
.grid-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0; }
.grid-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
.c-amber { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.c-slate { background: linear-gradient(135deg, #94a3b8, #64748b); }
.c-teal { background: linear-gradient(135deg, #2dd4bf, #14b8a6); }
.c-rose { background: linear-gradient(135deg, #fb7185, #f43f5e); }
.grid-label { font-size: 11px; color: #475569; font-weight: 500; }
.section { background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.section-title { font-size: 13px; font-weight: 700; color: #1f2937; }
.section-more { font-size: 10px; color: #9ca3af; }
.notice-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.notice-tag { flex-shrink: 0; font-size: 9px; background: #14b8a6; color: #fff; padding: 1px 5px; border-radius: 4px; font-weight: 500; }
.notice-title { font-size: 12px; color: #334155; flex: 1; line-height: 1.4; }
.notice-date { flex-shrink: 0; font-size: 10px; color: #94a3b8; }
.forecast { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
.forecast-name { font-size: 12px; font-weight: 600; color: #1e293b; }
.forecast-line { font-size: 10px; color: #64748b; margin-top: 4px; }
.forecast-tip { font-size: 9px; color: #f59e0b; margin-top: 6px; font-weight: 500; }
.empty-sm { text-align: center; padding: 20px; color: #a8a29e; font-size: 12px; }
</style>
