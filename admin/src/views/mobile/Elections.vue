<template>
  <div class="m-elections">
    <!-- 法定4种选举方式（接真实 election_methods 接口，不用设计稿的错误内容） -->
    <div class="sec-label">本届选举方式</div>
    <div class="method" v-for="(m, i) in methods" :key="m.id" :style="{ borderLeftColor: colors[i % colors.length] }">
      <div class="m-head">
        <span class="m-icon">{{ m.icon || '🗳️' }}</span>
        <span class="m-name">{{ m.name }}</span>
        <span class="m-status" v-if="m.status">{{ m.status }}</span>
      </div>
      <div class="m-desc" v-if="m.description">{{ m.description }}</div>
      <div class="m-apply" v-if="m.applicable" :style="{ color: colors[i % colors.length] }">✅ {{ m.applicable }}</div>
    </div>
    <div v-if="!methods.length" class="empty">暂无选举方式数据</div>

    <!-- 选举流程（照设计稿，但顺序按《选举规程》：审核在前公示在后） -->
    <div class="flow-card">
      <div class="flow-title">📋 选举流程</div>
      <div class="flow-step" v-for="(s, i) in flowSteps" :key="i">
        <div class="step-num">{{ i + 1 }}</div>
        <span class="step-text">{{ s }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { miniGetElectionMethods } from '@/api/api';

const methods = ref<any[]>([]);
const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];
// 流程顺序遵《村民委员会选举规程》：提名→资格审查(审核)→公布候选人名单(公示)→投票→公布结果
const flowSteps = [
  '成立村民选举委员会',
  '选民登记',
  '提名候选人',
  '候选人资格审查',
  '公布候选人名单（公示）',
  '投票选举',
  '公布结果·归档',
];

onMounted(async () => {
  try {
    const r: any = await miniGetElectionMethods();
    methods.value = r?.methods || r?.data || r || [];
  } catch (e) { /* 兜底 */ }
});
</script>

<style scoped>
.m-elections { max-width: 480px; margin: 0 auto; }
.sec-label { font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
.method { background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 10px; border-left: 3px solid #22c55e; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.m-head { display: flex; align-items: center; gap: 8px; }
.m-icon { font-size: 18px; }
.m-name { font-size: 13px; font-weight: 700; color: #1f2937; flex: 1; }
.m-status { font-size: 10px; color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 10px; }
.m-desc { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.6; }
.m-apply { font-size: 10px; margin-top: 8px; background: #f8fafc; padding: 4px 8px; border-radius: 4px; }
.flow-card { background: #fff; border-radius: 10px; padding: 12px; margin-top: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.flow-title { font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
.flow-step { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.step-num { width: 20px; height: 20px; border-radius: 50%; background: #475569; color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-text { font-size: 11px; color: #374151; }
.empty { text-align: center; padding: 40px; color: #a8a29e; font-size: 12px; }
</style>
