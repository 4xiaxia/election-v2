<template>
  <div class="page">
    <header class="page-head">
      <h2 class="page-title">公告管理</h2>
      <p class="page-desc">发布和管理选举公告、预告、公示</p>
    </header>

    <!-- 活动选择器（必选） -->
    <section class="block ctx-bar">
      <div class="ctx-left">
        <span class="ctx-label">当前选举</span>
        <el-select v-model="currentElectionId" placeholder="选择选举活动" style="width:240px" @change="onElectionChange">
          <el-option v-for="e in elections" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>
      <div class="ctx-info" v-if="ctxElection">
        <el-tag effect="plain">📅 {{ ctxElection.date }} {{ ctxElection.timeRange }}</el-tag>
        <el-tag effect="plain">📍 {{ ctxElection.village }}</el-tag>
      </div>
      <el-button
        v-if="currentElectionId"
        type="primary"
        plain
        @click="openTemplateDrawer"
      >📝 从模板生成公告</el-button>
    </section>

    <!-- 未选活动时的提示 -->
    <div v-if="!currentElectionId" class="empty-hint">
      <p class="empty-icon">📋</p>
      <p class="empty-text">请先选择选举活动</p>
      <p class="empty-sub">选择活动后可查看和管理该活动的公告</p>
    </div>

    <!-- 选中活动后展示列表 -->
    <CrudPage v-else ref="crud" :config="c">
      <template #actions="{ row, edit, remove }">
        <el-button type="primary" link @click="edit">编辑</el-button>
        <el-button v-if="row.status!=='已发布'" type="success" link @click="handlePublish(row)">发布</el-button>
        <el-button type="danger" link @click="remove">删除</el-button>
      </template>
      <template #form="{ form, isEdit }">
        <el-form-item label="所属选举">
          <el-input :value="ctxElection?.name || ''" disabled />
        </el-form-item>
        <el-form-item label="标题" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type" style="width:100%"><el-option label="村民组通知" value="村民组通知" /><el-option label="议事会通知" value="议事会通知" /><el-option label="村监会通知" value="村监会通知" /><el-option label="村务通知" value="村务通知" /></el-select></el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="form.startTime" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="form.endTime" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="内容">
          <div class="tiptap-wrapper">
            <bubble-menu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
              <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><strong>B</strong></button>
              <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"><em>I</em></button>
              <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }"><s>S</s></button>
              <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
              <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">H3</button>
              <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }">•</button>
              <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }">1.</button>
              <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }">"</button>
              <button @click="editor.chain().focus().setHorizontalRule().run()">—</button>
              <button @click="editor.chain().focus().undo().run()">↶</button>
              <button @click="editor.chain().focus().redo().run()">↷</button>
            </bubble-menu>
            <floating-menu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
              <button @click="addImage" title="插入图片">🖼️</button>
              <button @click="addLink" title="插入链接">🔗</button>
            </floating-menu>
            <editor-content :editor="editor" />
          </div>
        </el-form-item>
      </template>
    </CrudPage>

    <!-- 18公告填空模板抽屉 -->
    <NoticeTemplateDrawer
      ref="tplDrawer"
      :election-id="currentElectionId"
      @saved="crud?.refresh()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getNotices, createNotice, updateNotice, deleteNotice, publishNotice, getElections } from '@/api/api';
import CrudPage from '@/components/CrudPage.vue';
import NoticeTemplateDrawer from './NoticeTemplateDrawer.vue';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import http from '@/api/index';

const crud = ref();

// Tiptap 富文本编辑器
const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Image,
    Placeholder.configure({ placeholder: '请输入公告内容...' }),
  ],
  content: '',
});

// 编辑器内容变化 → 写回 form.content
watch(editor, (ed) => {
  if (ed) {
    ed.on('update', () => {
      const f = crud.value?.form;
      if (f) f.content = ed.getHTML();
    });
  }
});

// CrudPage 弹窗打开/编辑时 → 同步 form.content 到编辑器
watch(() => crud.value?.form?.id, () => {
  if (editor.value && crud.value?.form) {
    editor.value.commands.setContent(crud.value.form.content || '');
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// 插入图片
async function addImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res: any = await http.post('/upload/saveFile', fd);
      editor.value?.chain().focus().setImage({ src: res.data.url }).run();
    } catch { ElMessage.error('图片上传失败'); }
  };
  input.click();
}

// 插入链接
function addLink() {
  const url = window.prompt('输入链接地址：');
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run();
  }
}

/* —— 活动选择器 —— */
const elections = ref<any[]>([]);
const currentElectionId = ref('');
const ctxElection = computed(() => elections.value.find((e: any) => e.id === currentElectionId.value));

onMounted(async () => {
  try {
    const res: any = await getElections();
    elections.value = res.data?.list || [];
    // 自动选中第一个活动（优先进行中的）
    if (elections.value.length) {
      const active = elections.value.find((e: any) => e.status === 'in_progress') || elections.value[0];
      currentElectionId.value = active.id;
      onElectionChange();
    }
  } catch { ElMessage.error('加载选举活动失败'); }
});

function onElectionChange() {
  crud.value?.refresh();
}

/* —— 填空模板抽屉 —— */
const tplDrawer = ref();
function openTemplateDrawer() {
  tplDrawer.value?.open();
}

async function handlePublish(row: any) {
  await ElMessageBox.confirm('确定发布此公告？', '提示', { type: 'info' });
  const res: any = await publishNotice(row.id);
  if (res && res.code === 0) { ElMessage.success('发布成功'); crud.value?.refresh(); }
}

/* —— CrudPage 配置 —— */
const c = {
  title: '公告管理', desc: '',
  columns: [
    { prop: 'title', label: '标题', minWidth: '200', fieldHint: 'notices.title' },
    { prop: 'type', label: '类型', width: '110', fieldHint: 'notices.type', tagMap: { '村民组通知': { type: 'primary', text: '村民组' }, '议事会通知': { type: 'success', text: '议事会' }, '村监会通知': { type: 'warning', text: '村监会' }, '村务通知': { type: 'info', text: '村务' } } },
    { prop: 'startTime', label: '开始', width: '110', fieldHint: 'notices.start_time' },
    { prop: 'endTime', label: '结束', width: '110', fieldHint: 'notices.end_time' },
    { prop: 'status', label: '状态', width: '90', fieldHint: 'notices.status', tagMap: { '已发布': { type: 'success', text: '已发布' }, '草稿': { type: 'info', text: '草稿' }, '待发布': { type: 'warning', text: '待发布' }, '已下架': { type: 'danger', text: '已下架' } } },
  ],
  api: {
    list: (params?: any) => getNotices(params),
    create: (data: any) => createNotice({ ...data, electionId: currentElectionId.value }),
    update: (id: string, data: any) => updateNotice(id, { ...data, electionId: currentElectionId.value }),
    delete: deleteNotice,
  },
  searchFields: [{ field: 'keyword', placeholder: '搜索公告...' }],
  dialogWidth: '55%',
};
</script>

<style scoped>
.page-head { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--line-light); }
.page-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 20px; font-weight: 600;
  color: var(--ink-black); margin: 0 0 4px;
  display: flex; align-items: center; gap: 10px;
}
.page-title::before { content:''; display:inline-block; width:6px; height:16px; background: var(--seal-red); border-radius: 0 2px 2px 0; }
.page-desc { font-size: 13px; color: var(--ink-light); margin: 0; }

/* 活动选择器 */
.block {
  background: var(--paper-card, #faf8f5);
  border: 1px solid var(--line-light, #e7e5e4);
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}
.ctx-bar { padding: 14px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.ctx-left { display: flex; align-items: center; gap: 10px; }
.ctx-label { font-family: 'Noto Serif SC', serif; font-size: 13px; font-weight: 600; color: var(--ink-blue, #1e3a8a); }
.ctx-info { display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto; }

/* 空状态提示 */
.empty-hint {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-light, #999);
}
.empty-icon { font-size: 40px; margin: 0 0 12px; }
.empty-text { font-size: 16px; font-weight: 600; color: var(--ink-black, #333); margin: 0 0 6px; }
.empty-sub { font-size: 13px; margin: 0; }
</style>
