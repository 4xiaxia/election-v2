<template>
  <el-drawer
    v-model="visible"
    title="📝 从模板生成公告"
    size="72%"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <div class="tpl-layout">
      <!-- 左栏：选模板 + 填空 -->
      <div class="tpl-left">
        <el-form label-width="92px" label-position="right">
          <el-form-item label="归属类型">
            <el-radio-group v-model="orgType" @change="doPreview">
              <el-radio-button label="village">村委会</el-radio-button>
              <el-radio-button label="community">居委会</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择公告">
            <el-select
              v-model="currentSeq"
              placeholder="18种法定公告，选一种"
              style="width:100%"
              filterable
              @change="onSelectTemplate"
            >
              <el-option
                v-for="t in list"
                :key="t.seq"
                :label="`${t.docNo}. ${t.name}`"
                :value="t.seq"
              >
                <span>{{ t.docNo }}. {{ t.name }}</span>
                <el-tag
                  size="small"
                  :type="catTag(t.category)"
                  effect="plain"
                  style="margin-left:8px"
                >{{ t.category }}</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>

        <el-divider v-if="currentSeq" content-position="left">填空</el-divider>

        <el-form
          v-if="currentSeq"
          label-width="92px"
          label-position="top"
          class="fill-form"
        >
          <el-form-item
            v-for="f in allFields"
            :key="f.key"
            :label="f.label"
          >
            <el-input
              v-model="fieldValues[f.key]"
              :placeholder="`例：${f.example || ''}`"
              clearable
              @input="debouncedPreview"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 右栏：实时预览 -->
      <div class="tpl-right">
        <div class="preview-head">
          <span class="preview-label">实时预览</span>
          <el-tag v-if="preview?.docNo" size="small" effect="plain">文号 {{ preview.docNo }}</el-tag>
        </div>
        <div v-if="!currentSeq" class="preview-empty">
          <p class="pe-icon">📄</p>
          <p>选一种公告后，左侧填空，这里实时出稿</p>
        </div>
        <div v-else class="preview-paper">
          <h3 class="preview-title">{{ preview?.title || preview?.name || '' }}</h3>
          <pre class="preview-body">{{ preview?.content || '生成中…' }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <span class="foot-hint">未填的空会留成「____」，可保存草稿后再补</span>
        <div>
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="saving" :disabled="!currentSeq" @click="handleSave">
            保存为草稿
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getNoticeTemplates, generateNotice } from '@/api/api';

const props = defineProps<{ electionId?: string }>();
const emit = defineEmits<{ (e: 'saved'): void }>();

const visible = ref(false);
const list = ref<any[]>([]);
const commonFields = ref<any[]>([]);
const currentSeq = ref<number | ''>('');
const currentTemplate = ref<any>(null);
const orgType = ref<'village' | 'community'>('village');
const fieldValues = ref<Record<string, any>>({});
const preview = ref<any>(null);
const saving = ref(false);

// 通用字段（镇/村/届次/落款）+ 当前模板专属字段
const allFields = computed(() => {
  const own = currentTemplate.value?.fields || [];
  const ownKeys = new Set(own.map((f: any) => f.key));
  // 通用字段在前，去掉与专属重复的
  const commons = commonFields.value.filter((f: any) => !ownKeys.has(f.key));
  return [...commons, ...own];
});

function catTag(cat: string) {
  return cat === '主线' ? 'danger' : cat === '配套' ? 'warning' : 'info';
}

// 打开抽屉：拉模板清单
async function onOpen() {
  try {
    const res: any = await getNoticeTemplates();
    const data = res.data || res;
    commonFields.value = data.commonFields || [];
    list.value = data.list || [];
  } catch {
    ElMessage.error('加载公告模板失败');
  }
}

// 选中某模板：拉单模板详情（含 fields），重置填空
async function onSelectTemplate(seq: number) {
  try {
    const res: any = await getNoticeTemplates(seq);
    const data = res.data || res;
    commonFields.value = data.commonFields || commonFields.value;
    currentTemplate.value = data.template;
    // 用 example 预填，方便甲方看效果
    const vals: Record<string, any> = {};
    for (const f of allFields.value) vals[f.key] = f.example || '';
    fieldValues.value = vals;
    await doPreview();
  } catch {
    ElMessage.error('加载模板详情失败');
  }
}

// 实时预览（save=false）
async function doPreview() {
  if (!currentSeq.value) return;
  try {
    const res: any = await generateNotice({
      seq: Number(currentSeq.value),
      orgType: orgType.value,
      fields: { ...fieldValues.value },
      save: false,
    });
    preview.value = res.data || res;
  } catch {
    /* 预览失败静默，避免打字时弹窗刷屏 */
  }
}

// 输入防抖预览
let timer: any = null;
function debouncedPreview() {
  clearTimeout(timer);
  timer = setTimeout(doPreview, 300);
}

// 保存草稿（save=true）
async function handleSave() {
  if (!currentSeq.value) return;
  saving.value = true;
  try {
    const res: any = await generateNotice({
      seq: Number(currentSeq.value),
      orgType: orgType.value,
      fields: { ...fieldValues.value },
      save: true,
      electionId: props.electionId,
    });
    if ((res.code === 0 || res.data) ) {
      ElMessage.success('已保存为草稿');
      visible.value = false;
      emit('saved');
    }
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

// 暴露给父组件打开
function open() {
  currentSeq.value = '';
  currentTemplate.value = null;
  preview.value = null;
  fieldValues.value = {};
  visible.value = true;
}
defineExpose({ open });
</script>

<style scoped>
.tpl-layout { display: flex; gap: 20px; height: 100%; }
.tpl-left { flex: 0 0 42%; overflow-y: auto; padding-right: 6px; }
.tpl-right { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.fill-form :deep(.el-form-item) { margin-bottom: 14px; }

.preview-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.preview-label { font-family: 'Noto Serif SC', serif; font-weight: 600; color: var(--ink-blue, #1e3a8a); }
.preview-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink-light, #999); }
.pe-icon { font-size: 40px; margin: 0 0 10px; }

.preview-paper {
  flex: 1; overflow-y: auto;
  background: #fff;
  border: 1px solid var(--line-light, #e7e5e4);
  border-radius: 4px;
  padding: 28px 32px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.preview-title {
  text-align: center;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px; font-weight: 700;
  margin: 0 0 20px; color: var(--ink-black, #222);
}
.preview-body {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px; line-height: 2;
  white-space: pre-wrap; word-break: break-word;
  margin: 0; color: #333;
}
.drawer-footer { display: flex; align-items: center; justify-content: space-between; }
.foot-hint { font-size: 12px; color: var(--ink-light, #999); }
</style>

