<template>
  <div class="detail-page" v-loading="loading">

    <!-- ===== 现代·页头 ===== -->
    <header class="page-header" v-if="election">
      <div class="header-left">
        <div class="header-title-row">
          <h1 class="header-title">{{ election.name }}</h1>
          <el-tag :type="statusMap[election.status]?.type||'info'" effect="plain" round>
            {{ statusMap[election.status]?.label||election.status }}
          </el-tag>
        </div>
        <div class="header-meta">
          <span><i>编号</i>{{ election.id }}</span>
          <span><i>选举日</i>{{ election.electionEndDate || '未设' }}</span>
          <span><i>村居</i>{{ election.village }}</span>
          <span><i>类型</i>{{ election.electionType }}</span>
          <span><i>方式</i>{{ election.electionMethod }}</span>
        </div>
        <!-- 完整时间链（选举程序法定节点） -->
        <div class="header-timeline" v-if="election.enrollStartAt || election.enrollEndAt || election.publicityStartAt || election.publicityEndAt || election.scheduledPublishAt || election.reviewEndAt">
          <span class="tl-item" v-if="election.scheduledPublishAt" :class="tlClass(election.scheduledPublishAt)">
            <i>发布</i>{{ fmt(election.scheduledPublishAt) }}
          </span>
          <span class="tl-arrow" v-if="election.scheduledPublishAt && election.enrollStartAt">→</span>
          <span class="tl-item" v-if="election.enrollStartAt" :class="tlClass(election.enrollStartAt)">
            <i>报名开始</i>{{ fmt(election.enrollStartAt) }}
          </span>
          <span class="tl-arrow" v-if="election.enrollStartAt && election.enrollEndAt">→</span>
          <span class="tl-item" v-if="election.enrollEndAt" :class="tlClass(election.enrollEndAt)">
            <i>报名截止</i>{{ fmt(election.enrollEndAt) }}
          </span>
          <span class="tl-arrow" v-if="election.enrollEndAt && election.reviewEndAt">→</span>
          <span class="tl-item" v-if="election.reviewEndAt" :class="tlClass(election.reviewEndAt)">
            <i>材料审核截止</i>{{ fmt(election.reviewEndAt) }}
          </span>
          <span class="tl-arrow" v-if="election.reviewEndAt && election.publicityStartAt">→</span>
          <span class="tl-item" v-if="election.publicityStartAt" :class="tlClass(election.publicityStartAt)">
            <i>公示开始</i>{{ fmt(election.publicityStartAt) }}
          </span>
          <span class="tl-arrow" v-if="election.publicityStartAt && election.publicityEndAt">→</span>
          <span class="tl-item" v-if="election.publicityEndAt" :class="tlClass(election.publicityEndAt)">
            <i>公示结束</i>{{ fmt(election.publicityEndAt) }}
          </span>
          <span class="tl-arrow" v-if="election.publicityEndAt && election.electionEndDate">→</span>
          <span class="tl-item tl-election-day" v-if="election.electionEndDate">
            <i>选举日</i>{{ election.electionEndDate }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="$router.push('/election')" plain>返回</el-button>
        <el-button type="primary" @click="editElection">编辑本选举</el-button>
      </div>
    </header>

    <p class="page-hint">下方是本次选举的全部关联数据，按顺序查看与操作。</p>

    <!-- ===== 职位 ===== -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>本次选举职位 <em>({{ positions.length }})</em></h2>
        <el-button type="primary" @click="addPosition">新增职位</el-button>
      </div>
      <el-table :data="positions" row-class-name="clickable-row">
        <el-table-column prop="name" label="职位名称" width="140" />
        <el-table-column prop="quota" label="应选名额" width="100" align="center" />
        <el-table-column label="已收材料" width="110" align="center">
          <template #default="{ row }"><span class="num num-blue">{{ posSubmissions[row.id]||0 }}</span><span class="unit"> 份</span></template>
        </el-table-column>
        <el-table-column label="已通过候选人" width="130" align="center">
          <template #default="{ row }"><span class="num num-red">{{ posCandidates[row.id]||0 }}</span><span class="unit"> 人</span></template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="info" link @click="viewPositionDetail(row)">📋 岗位说明</el-button>
            <el-button type="primary" link @click="editPosition(row)">编辑</el-button>
            <el-button type="danger" link @click="delPosition(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!positions.length" class="empty">暂无职位，点击右上「新增职位」添加</div>
    </section>

    <!-- ===== 候选人 ===== -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>候选人 <em>({{ candidates.length }})</em></h2>
        <el-button type="primary" @click="addCandidate">新增候选人</el-button>
      </div>
      <el-table :data="candidates" :row-class-name="candidateRowClass" @row-click="onCandidateClick" highlight-current-row>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="position" label="竞选职位" width="140" />
        <el-table-column prop="village" label="所属村居" width="110" />
        <el-table-column prop="status" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status==='已通过'?'success':row.status==='待审核'?'warning':'info'" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="row.status==='待审核'" type="success" link @click="approveCandidate(row)">通过</el-button>
            <span v-else class="dim">-</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!candidates.length" class="empty">暂无候选人，可「新增候选人」或「导入 Excel」</div>
    </section>

    <!-- ===== 公告 ===== -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>本活动公告 <em>({{ notices.length }})</em></h2>
        <el-button type="primary" @click="addNotice">发布新公告</el-button>
      </div>
      <el-table :data="notices" row-class-name="clickable-row">
        <el-table-column prop="title" label="公告标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="90" />
        <el-table-column prop="startTime" label="开始" width="110" />
        <el-table-column prop="endTime" label="截止" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status==='已发布'?'success':'info'" effect="plain">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="editNotice(row)">编辑</el-button>
            <el-button v-if="row.status!=='已发布'" type="success" link @click="publishNotice(row)">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!notices.length" class="empty">暂无公告，点击「发布新公告」</div>
    </section>

    <!-- ===== 材料提交要求（按职位分组）===== -->
    <section class="block" v-if="positions.length">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>材料提交要求（按职位）</h2>
        <el-button @click="goToPositions" plain>去职位管理编辑</el-button>
      </div>
      <div class="pos-reqs">
        <div class="pos-req-group" v-for="pos in positions" :key="pos.id">
          <div class="pos-req-head">
            <span class="pos-req-name">{{ pos.name }}</span>
            <span class="pos-req-quota">应选 {{ pos.quota }} 名</span>
            <span class="pos-req-count" v-if="posReqs(pos).length">{{ posReqs(pos).length }} 项材料</span>
            <span class="pos-req-count empty-count" v-else>未设置材料要求</span>
          </div>
          <ul class="req-list" v-if="posReqs(pos).length">
            <li v-for="(r, i) in posReqs(pos)" :key="i">
              <span class="req-no">{{ String(i+1).padStart(2,'0') }}</span>
              <span class="req-name">{{ r.name }}</span>
              <span class="req-required" :class="{'req-required-yes': r.required}">{{ r.required ? '必交' : '选交' }}</span>
              <span class="req-fmt">{{ (r.formats||[]).join(' / ') }}</span>
              <span class="req-note" v-if="r.description">— {{ r.description }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ===== 材料明细 ===== -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>材料明细 <em>({{ filteredMaterials.length }} 份)</em></h2>
        <div v-if="selectedCandidate" class="filter-bar">
          <span class="filter-text">当前查看：<strong>{{ selectedCandidate.name }}</strong> 的材料</span>
          <el-button type="primary" link @click="clearCandidateFilter">显示全部</el-button>
        </div>
      </div>
      <el-table :data="filteredMaterials" :row-class-name="materialRowClass">
        <el-table-column label="候选人" width="100">
          <template #default="{ row }">{{ row.candidateName || row.applicantName || row.submitter || '-' }}</template>
        </el-table-column>
        <el-table-column label="材料项" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.requirementName || row.type || row.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="内容/附件" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.textContent" class="text-content">📝 {{ row.textContent }}</span>
            <el-button v-else-if="row.fileUrl" type="primary" link @click="viewMaterial(row)">查看附件</el-button>
            <span v-else class="dim">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="提交时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status==='已通过'?'success':row.status==='已驳回'?'danger':'warning'" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewMaterial(row)">查看</el-button>
            <el-button v-if="row.status!=='已通过' && row.status!=='已驳回'" type="success" link @click="approveMaterial(row)">通过</el-button>
            <el-button v-if="row.status!=='已通过' && row.status!=='已驳回'" type="danger" link @click="rejectMaterial(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!materials.length" class="empty">暂无材料提交，候选人在小程序端提交后将于此显示</div>
    </section>

    <!-- ===== 通知 ===== -->
    <section class="block">
      <div class="block-head">
        <h2 class="block-title"><span class="dot"></span>通知记录 <em>({{ notifications.length }} 条)</em></h2>
        <el-button type="primary" @click="sendNotify">发送通知</el-button>
      </div>
      <el-table :data="notifications">
        <el-table-column prop="title" label="通知标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="target" label="发送范围" width="160" show-overflow-tooltip />
        <el-table-column label="发送时间" width="160">
          <template #default="{ row }">{{ row.date ? String(row.date).slice(0,16).replace('T',' ') : '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status==='已发送'?'success':'info'" effect="plain">{{ row.status }}</el-tag></template>
        </el-table-column>
      </el-table>
      <div v-if="!notifications.length" class="empty">暂无通知，点击「发送通知」给村民/候选人发送</div>
    </section>

  </div>

  <!-- 材料预览弹窗 -->
  <el-dialog v-model="previewVisible" :title="previewItem?.fileName || '材料附件'" width="70%" destroy-on-close>
    <div v-if="previewItem" class="preview-body">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="候选人">{{ previewItem.candidateName || previewItem.submitter || '-' }}</el-descriptions-item>
        <el-descriptions-item label="材料类型">{{ previewItem.type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ previewItem.submittedAt || previewItem.date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="previewItem.status==='已通过'?'success':previewItem.status==='已驳回'?'danger':'warning'" effect="plain">{{ previewItem.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="previewItem.rejectionReason" label="驳回原因" :span="2">
          <span style="color: var(--seal-red)">{{ previewItem.rejectionReason }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <div class="preview-files">
        <h4 class="preview-h">附件</h4>
        <div v-if="previewItem.fileUrls && previewItem.fileUrls.length" class="file-list">
          <div v-for="(u, i) in previewItem.fileUrls" :key="i" class="file-row">
            <span class="file-no">{{ String(i+1).padStart(2,'0') }}</span>
            <span class="file-name">{{ previewItem.fileName || '附件' + (i+1) }}</span>
            <a :href="u" target="_blank" class="file-link">在新窗口打开</a>
            <span v-if="/\.(jpg|jpeg|png|gif)$/i.test(u)" class="file-tag">图片</span>
            <span v-else-if="/\.pdf/i.test(u)" class="file-tag">PDF</span>
            <span v-else class="file-tag">文件</span>
          </div>
        </div>
        <div v-else class="empty">未上传附件</div>
        <div v-if="previewItem.fileUrl && /\.(jpg|jpeg|png|gif)$/i.test(previewItem.fileUrl)" class="preview-image">
          <img :src="previewItem.fileUrl" alt="附件预览" />
        </div>
        <div v-else-if="previewItem.fileUrl && /\.pdf/i.test(previewItem.fileUrl)" class="preview-pdf">
          <iframe :src="previewItem.fileUrl" width="100%" height="500" frameborder="0"></iframe>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- 岗位说明弹窗 -->
  <el-dialog v-model="positionDetailVisible" :title="positionDetail?.name ? `${positionDetail.name} — 岗位说明` : '岗位说明'" width="600px" destroy-on-close>
    <div v-if="positionDetail" class="pos-detail-body">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="职位名称">{{ positionDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="应选名额">{{ positionDetail.quota }} 名</el-descriptions-item>
        <el-descriptions-item label="职责概述">
          <span v-if="positionDetail.duty" class="pos-duty">{{ positionDetail.duty }}</span>
          <span v-else class="dim">未填写</span>
        </el-descriptions-item>
        <el-descriptions-item label="任职要求">
          <ul v-if="positionDetailQualifications.length" class="qual-list">
            <li v-for="(q, i) in positionDetailQualifications" :key="i">{{ q }}</li>
          </ul>
          <span v-else class="dim">未填写</span>
        </el-descriptions-item>
        <el-descriptions-item label="其他说明">
          <span v-if="positionDetail.remark">{{ positionDetail.remark }}</span>
          <span v-else class="dim">未填写</span>
        </el-descriptions-item>
        <el-descriptions-item label="材料提交要求">
          <ul v-if="posReqs(positionDetail).length" class="qual-list">
            <li v-for="(r, i) in posReqs(positionDetail)" :key="i">
              <strong>{{ r.name }}</strong>
              <el-tag v-if="r.required" type="danger" size="small" effect="plain" style="margin-left:6px">必交</el-tag>
              <el-tag v-else type="info" size="small" effect="plain" style="margin-left:6px">选交</el-tag>
              <span class="dim" style="margin-left:6px">{{ (r.formats||[]).join(' / ') }}</span>
            </li>
          </ul>
          <span v-else class="dim">未设置材料要求</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>

  <!-- 职位编辑弹窗 -->
  <el-dialog v-model="posEditVisible" :title="posEditForm.id ? '编辑职位' : '新增职位'" width="640px" top="5vh" :close-on-click-modal="false" destroy-on-close>
    <el-form :model="posEditForm" label-width="100px" class="dialog-form">
      <el-form-item label="职位名称" required><el-input v-model="posEditForm.name" placeholder="如：主任/副主任/委员" /></el-form-item>
      <el-divider content-position="left"><span class="divider-title">岗位说明</span></el-divider>
      <el-form-item label="职责概述">
        <el-input v-model="posEditForm.duty" type="textarea" :rows="3" placeholder="该岗位的主要职责（一句话概述）" />
      </el-form-item>
      <el-form-item label="任职要求">
        <div class="req-list-edit">
          <div class="req-line" v-for="(_q, i) in posEditForm.qualifications" :key="i">
            <el-input v-model="posEditForm.qualifications[i]" placeholder="如：年满18周岁 / 中共党员 / 大专以上学历" />
            <el-button type="danger" link @click="posEditForm.qualifications.splice(i,1)" :disabled="posEditForm.qualifications.length<=1">删除</el-button>
          </div>
          <el-button type="primary" link @click="posEditForm.qualifications.push('')">+ 添加任职要求</el-button>
        </div>
      </el-form-item>
      <el-form-item label="其他说明">
        <el-input v-model="posEditForm.remark" type="textarea" :rows="2" placeholder="任期、薪酬、工作地点等（选填）" />
      </el-form-item>
      <el-divider content-position="left"><span class="divider-title">材料提交要求</span></el-divider>
      <div class="material-reqs">
        <div class="req-item" v-for="(req, i) in posEditForm.materialRequirements" :key="i">
          <div class="req-row">
            <el-input v-model="req.name" placeholder="材料名称" style="width:180px" />
            <el-switch v-model="req.required" active-text="必填" inactive-text="选填" />
            <el-select v-model="req.formats" multiple placeholder="格式" style="width:200px">
              <el-option label="PDF 文件" value=".pdf" />
              <el-option label="图片 (JPG/PNG)" value=".jpg,.png" />
              <el-option label="Word 文档" value=".doc,.docx" />
              <el-option label="纯文本输入" value="__text__" />
            </el-select>
            <el-button type="danger" link @click="posEditForm.materialRequirements.splice(i,1)" :disabled="posEditForm.materialRequirements.length<=1">删除</el-button>
          </div>
        </div>
        <el-button type="primary" link @click="posEditForm.materialRequirements.push({id:'req'+Date.now()+Math.random().toString(36).slice(2,6),name:'',required:true,formats:[],description:''})">+ 添加材料项</el-button>
      </div>
      <el-form-item label="应选名额" required><el-input-number v-model="posEditForm.quota" :min="1" :max="99" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="posEditVisible = false">取消</el-button>
      <el-button type="primary" @click="savePosition">保存</el-button>
    </template>
  </el-dialog>

  <!-- 候选人编辑弹窗 -->
  <el-dialog v-model="candEditVisible" :title="candEditForm.id ? '编辑候选人' : '新增候选人'" width="640px" top="5vh" :close-on-click-modal="false" destroy-on-close>
    <el-form :model="candEditForm" label-width="100px" class="dialog-form">
      <div class="form-row">
        <el-form-item label="姓名" required><el-input v-model="candEditForm.name" /></el-form-item>
        <el-form-item label="竞选职位">
          <el-select v-model="candEditForm.positionId" placeholder="选择职位" style="width:100%" @change="onCandPosChange">
            <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
      </div>
      <div class="form-row">
        <el-form-item label="所属村居"><el-input v-model="candEditForm.village" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="candEditForm.phone" /></el-form-item>
      </div>
      <div class="form-row">
        <el-form-item label="性别"><el-input v-model="candEditForm.gender" /></el-form-item>
        <el-form-item label="年龄"><el-input-number v-model="candEditForm.age" :min="18" :max="120" /></el-form-item>
      </div>
      <div class="form-row">
        <el-form-item label="政治面貌"><el-input v-model="candEditForm.party" /></el-form-item>
        <el-form-item label="学历"><el-input v-model="candEditForm.education" /></el-form-item>
      </div>
      <el-form-item label="竞选纲领"><el-input v-model="candEditForm.platform" type="textarea" :rows="2" /></el-form-item>
      <el-form-item label="简介"><el-input v-model="candEditForm.intro" type="textarea" :rows="2" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="candEditVisible = false">取消</el-button>
      <el-button type="primary" @click="saveCandidate">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// ===== 略·业务逻辑保持不变（与上一版一致）=====
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getElections, updateElection,
  getPositions, createPosition, updatePosition, deletePosition,
  getCandidates, createCandidate, updateCandidate,
  getMaterials, reviewMaterial,
  getNotices, createNotice, updateNotice, deleteNotice, publishNotice as pubNotice,
  getNotifications, createNotification,
} from '@/api/api';

const route = useRoute();
const router = useRouter();
const electionId = computed(() => route.params.id as string);

const loading = ref(false);
const election = ref<any>(null);
const positions = ref<any[]>([]);
const candidates = ref<any[]>([]);
const notices = ref<any[]>([]);
const materials = ref<any[]>([]);
const notifications = ref<any[]>([]);
const previewVisible = ref(false);
const previewItem = ref<any>(null);
const positionDetailVisible = ref(false);
const positionDetail = ref<any>(null);
const posSubmissions = ref<Record<string, number>>({});
const posCandidates = ref<Record<string, number>>({});

const statusMap: Record<string, any> = {
  'draft':          { type: 'info',    label: '草稿' },
  'pending_review': { type: 'warning', label: '待审批' },
  'pending':        { type: 'warning', label: '待发布' },
  'in_progress':    { type: 'warning', label: '进行中' },
  'under_review':   { type: 'primary', label: '材料审核中' },
  'ready':          { type: 'primary', label: '待选举' },
  'completed':      { type: 'success', label: '已完成' },
  'cancelled':      { type: 'danger',  label: '已取消' },
};

// 候选人下钻：选中的候选人 → 材料列表过滤
const selectedCandidate = ref<any>(null);
const filteredMaterials = computed(() => {
  if (!selectedCandidate.value) return materials.value;
  return materials.value.filter((m: any) => m.candidateId === selectedCandidate.value.id || m.submitter === selectedCandidate.value.name);
});

// 时间提醒：逾期标红
function materialRowClass({ row }: any) {
  if (!election.value?.deadlineAt || !row.submittedAt) return '';
  if (new Date(row.submittedAt) > new Date(election.value.deadlineAt)) return 'row-overdue';
  return '';
}
// 候选人行高亮
function candidateRowClass({ row }: any) {
  return selectedCandidate.value?.id === row.id ? 'row-selected' : 'clickable-row';
}
function onCandidateClick(row: any) {
  selectedCandidate.value = selectedCandidate.value?.id === row.id ? null : row;
}
function clearCandidateFilter() {
  selectedCandidate.value = null;
}

// 时间链：格式化 + 逾期/当前判断
function fmt(t: string) {
  if (!t) return '-';
  return t.slice(0, 16).replace('T', ' ');
}
function tlClass(t: string) {
  if (!t) return '';
  const now = Date.now();
  const target = new Date(t).getTime();
  if (target < now) return 'tl-past';      // 已过
  if (target - now < 3 * 24 * 3600 * 1000) return 'tl-soon'; // 3天内即将到
  return '';
}

async function loadAll() {
  loading.value = true;
  try {
    const el = await getElections({ id: electionId.value });
    election.value = (el.data?.list || []).find((e: any) => e.id === electionId.value) || el.data?.list?.[0];
    const [p, c, n, m, nt] = await Promise.all([
      getPositions({ electionId: electionId.value }),
      getCandidates({ electionId: electionId.value }),
      getNotices({ electionId: electionId.value }),
      getMaterials({ electionId: electionId.value }),
      getNotifications({ electionId: electionId.value }),
    ]);
    positions.value = p.data?.list || [];
    candidates.value = c.data?.list || [];
    notices.value = n.data?.list || [];
    materials.value = m.data?.list || [];
    notifications.value = nt.data?.list || [];
    // 统计每个职位的提交数/通过候选人数（用 positionId 做 key）
    posSubmissions.value = {};
    posCandidates.value = {};
    materials.value.forEach((x: any) => {
      if (x.positionId) posSubmissions.value[x.positionId] = (posSubmissions.value[x.positionId] || 0) + 1;
    });
    candidates.value.forEach((x: any) => {
      if (x.positionId && x.status === '已通过') {
        posCandidates.value[x.positionId] = (posCandidates.value[x.positionId] || 0) + 1;
      }
    });
  } finally {
    loading.value = false;
  }
}

async function editElection() {
  // 跳回选举管理列表，带 edit query 自动打开编辑弹窗
  router.push({ path: '/election', query: { edit: electionId.value } });
}

// ===== 职位弹窗 =====
const posEditVisible = ref(false);
const posEditForm = reactive<any>({
  id: '', name: '', duty: '', qualifications: [''], remark: '', quota: 1,
  materialRequirements: [{ id: '', name: '', required: true, formats: [], description: '' }],
});
function newReqId() { return 'req' + Date.now() + Math.random().toString(36).slice(2, 6); }

function addPosition() {
  Object.assign(posEditForm, {
    id: '', name: '', duty: '', qualifications: [''], remark: '', quota: 1,
    materialRequirements: [{ id: newReqId(), name: '', required: true, formats: [], description: '' }],
  });
  posEditVisible.value = true;
}
function editPosition(row: any) {
  // 规范化 qualifications / materialRequirements 为数组
  let quals = row.qualifications;
  if (typeof quals === 'string') { try { quals = JSON.parse(quals || '[]'); } catch { quals = []; } }
  if (!Array.isArray(quals)) quals = [];
  let reqs = row.materialRequirements;
  if (typeof reqs === 'string') { try { reqs = JSON.parse(reqs || '[]'); } catch { reqs = []; } }
  if (!Array.isArray(reqs)) reqs = [];
  Object.assign(posEditForm, {
    id: row.id || '', name: row.name || '', duty: row.duty || '',
    qualifications: quals.length ? [...quals] : [''],
    remark: row.remark || '', quota: row.quota || 1,
    materialRequirements: reqs.length ? reqs.map((r: any) => ({ ...r })) : [{ id: newReqId(), name: '', required: true, formats: [], description: '' }],
  });
  posEditVisible.value = true;
}
async function savePosition() {
  if (!posEditForm.name?.trim()) { ElMessage.warning('请填写职位名称'); return; }
  try {
    const payload = {
      ...posEditForm,
      electionId: electionId.value,
      electionName: election.value?.name || '',
      qualifications: JSON.stringify(posEditForm.qualifications.filter((q: string) => q?.trim())),
      materialRequirements: JSON.stringify(posEditForm.materialRequirements.filter((r: any) => r.name?.trim())),
    };
    if (posEditForm.id) {
      await updatePosition(posEditForm.id, payload);
      ElMessage.success('职位已更新');
    } else {
      await createPosition(payload);
      ElMessage.success('职位已新增');
    }
    posEditVisible.value = false;
    loadAll();
  } catch (err: any) { ElMessage.error(err?.message || '保存失败'); }
}
function delPosition(row: any) {
  ElMessageBox.confirm(`确定删除职位「${row.name}」？`, '提示', { type: 'warning' })
    .then(async () => { await deletePosition(row.id); ElMessage.success('已删除'); loadAll(); })
    .catch(() => {});
}

// ===== 候选人弹窗 =====
const candEditVisible = ref(false);
const candEditForm = reactive<any>({
  id: '', name: '', positionId: '', position: '', village: '', phone: '',
  gender: '', age: 30, party: '', education: '', platform: '', intro: '',
});
function addCandidate() {
  Object.assign(candEditForm, {
    id: '', name: '', positionId: '', position: '', village: election.value?.village || '', phone: '',
    gender: '', age: 30, party: '', education: '', platform: '', intro: '',
  });
  candEditVisible.value = true;
}
function editCandidate(row: any) {
  Object.assign(candEditForm, {
    id: row.id || '', name: row.name || '', positionId: row.positionId || '', position: row.position || '',
    village: row.village || '', phone: row.phone || '', gender: row.gender || '',
    age: row.age || 30, party: row.party || '', education: row.education || '',
    platform: row.platform || '', intro: row.intro || '',
  });
  candEditVisible.value = true;
}
function onCandPosChange(posId: string) {
  const p = positions.value.find((x: any) => x.id === posId);
  if (p) candEditForm.position = p.name;
}
async function saveCandidate() {
  if (!candEditForm.name?.trim()) { ElMessage.warning('请填写姓名'); return; }
  try {
    const payload = { ...candEditForm, electionId: electionId.value };
    if (candEditForm.id) {
      await updateCandidate(candEditForm.id, payload);
      ElMessage.success('候选人已更新');
    } else {
      await createCandidate(payload);
      ElMessage.success('候选人已新增');
    }
    candEditVisible.value = false;
    loadAll();
  } catch (err: any) { ElMessage.error(err?.message || '保存失败'); }
}
async function approveCandidate(row: any) {
  await updateCandidate(row.id, { status: '已通过' }); ElMessage.success('已通过'); loadAll();
}
function viewMaterial(row: any) { previewItem.value = row; previewVisible.value = true; }
async function approveMaterial(row: any) { await reviewMaterial(row.id, { action: 'approve' }); ElMessage.success('已通过'); loadAll(); }
async function rejectMaterial(row: any) { const { value: reason } = await ElMessageBox.prompt('驳回原因（必填）', '驳回材料', { confirmButtonText: '驳回', type: 'warning', inputType: 'textarea' }); if (!reason) return; await reviewMaterial(row.id, { action: 'reject', reason }); ElMessage.success('已驳回，原因已推送至小程序'); loadAll(); }
function addNotice() { ElMessage.info('新增公告（待实现：富文本+附件+定时+置顶）'); }
function editNotice(row: any) { ElMessage.info('编辑公告: ' + row.title); }
async function publishNotice(row: any) { await ElMessageBox.confirm('确定发布？'); const r: any = await pubNotice(row.id); if (r.ok) { ElMessage.success('已发布'); loadAll(); } }
function sendNotify() { ElMessage.info('发送通知（待实现：按手机号/村居/角色定向 + 即时/定时）'); }

// ===== D015：岗位说明 + 材料要求（按职位分组）=====
// 取职位的材料要求（兼容老数据：优先 materialRequirements，回退 materialRequirementIds + elections.materialRequirements）
function posReqs(pos: any): any[] {
  if (!pos) return [];
  // 新链路：positions.materialRequirements
  let reqs = pos.materialRequirements;
  if (typeof reqs === 'string') { try { reqs = JSON.parse(reqs || '[]'); } catch { reqs = []; } }
  if (!Array.isArray(reqs)) reqs = [];
  if (reqs.length) return reqs;
  // 老链路兜底：positions.materialRequirementIds → elections.materialRequirements
  let ids = pos.materialRequirementIds;
  if (typeof ids === 'string') { try { ids = JSON.parse(ids || '[]'); } catch { ids = []; } }
  if (Array.isArray(ids) && ids.length && election.value?.materialRequirements) {
    let allReqs = election.value.materialRequirements;
    if (typeof allReqs === 'string') { try { allReqs = JSON.parse(allReqs); } catch { allReqs = []; } }
    const reqMap: any = {};
    allReqs.forEach((r: any) => { if (r.id) reqMap[r.id] = r; });
    return ids.map((id: string) => reqMap[id]).filter(Boolean);
  }
  return [];
}

const positionDetailQualifications = computed<string[]>(() => {
  if (!positionDetail.value) return [];
  let quals = positionDetail.value.qualifications;
  if (typeof quals === 'string') { try { quals = JSON.parse(quals || '[]'); } catch { quals = []; } }
  return Array.isArray(quals) ? quals.filter((q: any) => q && String(q).trim()) : [];
});

function viewPositionDetail(row: any) {
  positionDetail.value = row;
  positionDetailVisible.value = true;
}

function goToPositions() {
  router.push('/positions');
}

onMounted(loadAll);
</script>

<style scoped>
/* ===== 现代·书香文人 v1·调整版 ===== */
.detail-page {
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--paper);
}

/* ===== 页头：现代感 + 宋体只做标题 ===== */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  padding: 24px 0 20px;
  border-bottom: 1px solid var(--line-light);
  margin-bottom: 24px;
}
.header-left { flex: 1; min-width: 0; }
.header-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.header-title {
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--ink-black);
  letter-spacing: 1px;
  margin: 0;
  line-height: 1.4;
}
.header-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--ink-light);
}
.header-meta span { display: inline-flex; align-items: baseline; gap: 4px; }
.header-meta i {
  font-style: normal;
  color: var(--ink-light);
  font-size: 12px;
  margin-right: 2px;
}
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.page-hint {
  font-size: 12px;
  color: var(--ink-light);
  margin: 0 0 20px;
  letter-spacing: 0.5px;
}

/* ===== 区块：现代感 + 左侧细红点 ===== */
.block {
  background: var(--paper-card);
  border: 1px solid var(--line-light);
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}
.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line-light);
}
.block-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-black);
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
}
.block-title em {
  font-family: 'Noto Sans SC', sans-serif;
  font-style: normal;
  font-weight: 400;
  color: var(--ink-light);
  font-size: 13px;
}
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--seal-red);
  border-radius: 50%;
}

/* ===== 数字 ===== */
.num {
  font-family: 'Noto Serif SC', 'KaiTi', 'STKaiti', serif;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.num-blue { color: var(--ink-blue); }
.num-red { color: var(--seal-red); }
.unit { font-size: 12px; color: var(--ink-light); }
.dim { color: var(--ink-light); font-size: 12px; }
.text-content { color: var(--ink-blue); white-space: pre-wrap; word-break: break-all; }

/* ===== 空状态 ===== */
.empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--ink-light);
  font-size: 13px;
  background: #fafaf9;
}

/* ===== 材料要求列表 ===== */
.req-list {
  list-style: none;
  margin: 0;
  padding: 8px 20px 14px;
}
.req-list li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line-light);
  font-size: 13px;
}
.req-list li:last-child { border-bottom: none; }
.req-no {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--seal-red);
  font-size: 13px;
  min-width: 22px;
  text-align: right;
}
.req-name {
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  color: var(--ink-black);
  min-width: 120px;
}
.req-required {
  font-size: 11px;
  padding: 1px 6px;
  border: 1px solid var(--ink-light);
  color: var(--ink-light);
  letter-spacing: 1px;
}
.req-required-yes {
  border-color: var(--seal-red);
  color: var(--seal-red);
  background: #fef2f2;
}
.req-fmt {
  color: var(--ink-gray);
  font-size: 12px;
  font-family: 'Courier New', monospace;
}
.req-note {
  color: var(--ink-light);
  font-size: 12px;
  font-style: italic;
}

/* ===== 材料要求按职位分组 ===== */
.pos-reqs { padding: 12px 20px; }
.pos-req-group {
  padding: 12px 0;
  border-bottom: 1px dashed var(--line-light);
}
.pos-req-group:last-child { border-bottom: none; }
.pos-req-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}
.pos-req-name {
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink-black);
}
.pos-req-quota {
  font-size: 12px;
  color: var(--ink-blue);
}
.pos-req-count {
  font-size: 12px;
  color: var(--ink-gray);
  padding: 1px 8px;
  background: #eff6ff;
  border-radius: 2px;
}
.pos-req-count.empty-count {
  color: var(--ink-light);
  background: #f5f5f4;
}
.pos-req-group .req-list {
  padding: 0 0 0 12px;
  border-left: 2px solid var(--line-light);
}

/* ===== 岗位说明弹窗 ===== */
.pos-detail-body { padding: 0 8px; }
.pos-duty { white-space: pre-wrap; line-height: 1.7; }
.qual-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.qual-list li {
  padding: 4px 0 4px 16px;
  position: relative;
  font-size: 13px;
  line-height: 1.6;
}
.qual-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: var(--seal-red);
  font-weight: 700;
}

/* ===== 预览弹窗 ===== */
.preview-body { padding: 0 8px; }
.preview-h {
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-blue);
  margin: 20px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--seal-red);
}
.preview-files { margin-top: 8px; }
.file-list { display: flex; flex-direction: column; gap: 6px; }
.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fafaf9;
  border: 1px solid var(--line-light);
  font-size: 13px;
}
.file-no { font-family: 'Courier New', monospace; color: var(--seal-red); font-weight: 700; min-width: 22px; }
.file-name { flex: 1; color: var(--ink-black); }
.file-link { color: var(--ink-blue); font-size: 12px; }
.file-link:hover { text-decoration: underline; }
.file-tag { font-size: 11px; padding: 2px 8px; background: #fef9e7; color: var(--ink-blue); border: 1px solid var(--ink-blue); }
.preview-image { margin-top: 12px; text-align: center; }
.preview-image img { max-width: 100%; max-height: 600px; border: 1px solid var(--line-light); }
.preview-pdf { margin-top: 12px; }

/* ===== Element Plus 表格微调（去掉粗框） ===== */
.block :deep(.el-table) {
  --el-table-border-color: var(--line-light);
  --el-table-header-bg-color: #fafaf9;
  border: none;
}
.block :deep(.el-table th.el-table__cell) {
  background: #fafaf9 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  color: var(--ink-black) !important;
  border-bottom: 1px solid var(--line-normal) !important;
}
.block :deep(.el-table td.el-table__cell) {
  font-size: 13px !important;
  color: var(--ink-gray) !important;
  border-bottom: 1px solid var(--line-light) !important;
}
.block :deep(.el-table::before),
.block :deep(.el-table--border::after) { display: none; }

/* ===== 候选人选中行高亮 ===== */
.block :deep(.row-selected) {
  background: #eff6ff !important;
}
.block :deep(.row-selected td) {
  background: #eff6ff !important;
}

/* ===== 材料逾期标红 ===== */
.block :deep(.row-overdue) {
  background: #fef2f2 !important;
}
.block :deep(.row-overdue td) {
  background: #fef2f2 !important;
}

/* ===== 材料过滤提示条 ===== */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-blue);
}
.filter-text strong {
  color: var(--seal-red);
}

/* ===== 时间提醒：逾期红色 ===== */
.text-danger {
  color: var(--seal-red) !important;
  font-weight: 600;
}

/* ===== 选举程序时间链（页头下方） ===== */
.header-timeline {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fafaf9;
  border: 1px solid var(--line-light);
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: 'Noto Sans SC', sans-serif;
}
.tl-item {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 3px;
  background: #fff;
  border: 1px solid var(--line-light);
  color: var(--ink-gray);
}
.tl-item i {
  font-style: normal;
  color: var(--ink-light);
  font-size: 11px;
}
.tl-past {
  opacity: 0.55;
  text-decoration: line-through;
}
.tl-soon {
  border-color: var(--seal-red);
  color: var(--seal-red);
  background: #fef2f2;
  font-weight: 600;
}
.tl-election-day {
  border-color: var(--ink-blue);
  color: var(--ink-blue);
  background: #eff6ff;
  font-weight: 600;
}
.tl-arrow {
  color: var(--ink-light);
  font-size: 11px;
}

/* ===== 弹窗表单通用 ===== */
.dialog-form { max-height: 70vh; overflow-y: auto; padding-right: 8px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.divider-title { font-family: 'Noto Serif SC', serif; font-size: 13px; font-weight: 600; color: var(--ink-blue); }
.req-list-edit { width: 100%; }
.req-line { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.material-reqs { margin-bottom: 8px; }
.req-item { margin-bottom: 8px; }
.req-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
</style>
