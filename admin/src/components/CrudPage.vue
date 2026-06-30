<template>
  <div class="crud-page">
    <header class="page-head">
      <h2 class="page-title">{{ config.title }}</h2>
      <p class="page-desc" v-if="config.desc">{{ config.desc }}</p>
    </header>

    <div class="toolbar" v-if="config.toolbar !== false">
      <el-button type="primary" @click="openAdd">{{ config.addLabel || '+ 新增' }}</el-button>
      <div class="toolbar-right">
        <slot name="toolbar" />
        <template v-for="f in (config.searchFields||[])" :key="f.field">
          <el-input v-if="!f.type||f.type==='text'" v-model="search[f.field]" :placeholder="f.placeholder||'搜索...'" clearable :style="f.style||'width:160px'" />
          <el-select v-else-if="f.type==='select'" v-model="search[f.field]" :placeholder="f.placeholder" clearable style="width:160px">
            <el-option v-for="o in f.options||[]" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </template>
      </div>
    </div>

    <slot name="header" />

    <el-table :data="filteredData" v-loading="loading" @selection-change="onSelect" row-class-name="clickable-row">
      <el-table-column v-if="config.selectable" type="selection" width="44" />
      <el-table-column v-if="config.showIndex" type="index" label="#" width="56" align="center" />
      <el-table-column v-for="col in config.columns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" :align="col.align||'left'" :show-overflow-tooltip="col.tooltip">
        <template #default="{ row }" v-if="col.render || col.tagMap || col.formatter">
          <span v-if="col.render">{{ col.render(row) }}</span>
          <span v-else-if="col.formatter">{{ col.formatter(row) }}</span>
          <el-tag v-else-if="col.tagMap" effect="plain" :type="(col.tagMap[row[col.prop]]||col.tagMap._default)?.type">
            {{ (col.tagMap[row[col.prop]]||col.tagMap._default)?.text||row[col.prop] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="config.showActions !== false" label="操作" :width="config.actionWidth||150" align="center" fixed="right">
        <template #default="{ row }">
          <slot name="actions" :row="row" :edit="()=>openEdit(row)" :remove="()=>handleDelete(row)">
            <el-button v-if="config.showEdit!==false" type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button v-if="config.showDelete!==false" type="danger" link @click="handleDelete(row)">删除</el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer-bar" v-if="config.showPagination !== false && total > (config.pageSize||15)">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchData" />
    </div>

    <el-dialog v-model="visible" :title="dialogTitle" :width="config.dialogWidth||'40%'" destroy-on-close>
      <slot name="form" :form="form" :isEdit="!!form.id">
        <!-- 默认表单：根据 formFields 自动渲染 -->
        <el-form :model="form" label-width="100px" v-if="config.formFields">
          <template v-for="f in config.formFields" :key="f.field">
            <el-form-item :label="f.label" :required="f.required">
              <el-input v-if="!f.type || f.type==='input'" v-model="form[f.field]" :placeholder="f.placeholder||''" />
              <el-input v-else-if="f.type==='password'" v-model="form[f.field]" type="password" show-password :placeholder="f.placeholder||''" />
              <el-input v-else-if="f.type==='textarea'" v-model="form[f.field]" type="textarea" :rows="f.rows||3" :placeholder="f.placeholder||''" />
              <el-input-number v-else-if="f.type==='number'" v-model="form[f.field]" :min="f.min||0" :max="f.max||9999" />
              <el-select v-else-if="f.type==='select'" v-model="form[f.field]" :placeholder="f.placeholder||'请选择'" style="width:100%">
                <el-option v-for="o in f.options||[]" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
              <el-date-picker v-else-if="f.type==='date'" v-model="form[f.field]" type="date" value-format="YYYY-MM-DD" :placeholder="f.placeholder||'选择日期'" style="width:100%" />
              <el-date-picker v-else-if="f.type==='datetime'" v-model="form[f.field]" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" :placeholder="f.placeholder||'选择时间'" style="width:100%" />
            </el-form-item>
          </template>
        </el-form>
      </slot>
      <template #footer>
        <el-button @click="visible=false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface ColDef { prop: string; label: string; width?: string; minWidth?: string; align?: string; tooltip?: boolean; render?: (row: any) => string; formatter?: (row: any) => string; tagMap?: Record<string, { type: string; text: string }> }
interface FilterDef { field: string; type?: string; placeholder?: string; style?: string; options?: { label: string; value: string }[] }
interface FormFieldDef { field: string; label: string; type?: 'input'|'password'|'textarea'|'number'|'select'|'date'|'datetime'; required?: boolean; placeholder?: string; options?: { label: string; value: string }[]; defaultValue?: any; rows?: number; min?: number; max?: number }

const props = defineProps<{
  config: {
    title: string; desc?: string; addLabel?: string;
    columns: ColDef[];
    api: { list: (params?: any) => Promise<any>; create: (data: any) => Promise<any>; update: (id: string, data: any) => Promise<any>; delete: (id: string) => Promise<any> };
    searchFields?: FilterDef[];
    formFields?: FormFieldDef[];
    showIndex?: boolean; showActions?: boolean; showEdit?: boolean; showDelete?: boolean;
    showPagination?: boolean; toolbar?: boolean; selectable?: boolean;
    dialogWidth?: string; pageSize?: number; actionWidth?: string;
  };
}>();

const emit = defineEmits(['selection-change', 'submitted']);

const loading = ref(false); const submitting = ref(false);
const visible = ref(false); const dialogTitle = ref('');
const tableData = ref<any[]>([]); const total = ref(0);
const page = ref(1); const pageSize = ref(props.config.pageSize || 15);
const search = reactive<Record<string, string>>({});
const selected = ref<any[]>([]);
const form = reactive<any>({});

onMounted(fetchData);

const filteredData = computed(() => {
  let data = tableData.value;
  for (const k of Object.keys(search)) {
    if (search[k]) {
      const kw = String(search[k]).toLowerCase();
      // 如果数据行没有该字段，说明是后端搜索参数，跳过客户端过滤
      if (data.length > 0 && data[0][k] === undefined) continue;
      data = data.filter((r: any) => String(r[k] || '').toLowerCase().includes(kw));
    }
  }
  return data;
});

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    for (const f of (props.config.searchFields || [])) { if (search[f.field]) params[f.field] = search[f.field]; }
    const res: any = await props.config.api.list(Object.keys(params).length === 2 ? undefined : params);
    // 兼容两种返回：① koaLite {data:{list,total}} ② 直接 {data:[...]} 数组
    const d = res?.data ?? res;
    if (Array.isArray(d)) {
      tableData.value = d;
      total.value = d.length;
    } else {
      tableData.value = d?.list || [];
      total.value = d?.total || 0;
    }
  } catch { ElMessage.error('加载列表失败'); }
  finally { loading.value = false; }
}

function onSelect(rows: any[]) { selected.value = rows; emit('selection-change', rows); }

function openAdd() {
  dialogTitle.value = `新增${props.config.title.replace('管理','').replace('设置','')}`;
  const obj: any = {};
  // defaultForm 优先（用于自定义插槽表单的复杂默认值，如数组/对象）
  if (typeof (props.config as any).defaultForm === 'function') {
    Object.assign(form, (props.config as any).defaultForm());
  } else {
    // 用 formFields 初始化（优先），否则用 columns
    const fields = props.config.formFields || props.config.columns.map(c => ({ field: c.prop }));
    for (const f of fields) { if (f.field && f.field !== 'id') obj[f.field] = (f as any).defaultValue ?? ''; }
    Object.assign(form, obj);
  }
  visible.value = true;
}
function openEdit(row: any) {
  dialogTitle.value = '编辑';
  Object.assign(form, { ...row });
  visible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  try {
    if (form.id) {
      const { id, ...rest } = form;
      const data: any = {};
      for (const k of Object.keys(rest)) { if (rest[k] !== '' && rest[k] !== undefined) data[k] = rest[k]; }
      await props.config.api.update(id, data);
      ElMessage.success('更新成功');
    } else {
      await props.config.api.create({ ...form });
      ElMessage.success('新增成功');
    }
    visible.value = false;
    emit('submitted');
    fetchData();
  } catch (err: any) { ElMessage.error(err?.response?.data?.message || err?.message || '保存失败'); }
  finally { submitting.value = false; }
}

function handleDelete(row: any) {
  ElMessageBox.confirm(`确定删除「${row.name||row.title||row.id}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await props.config.api.delete(row.id);
      ElMessage.success('删除成功');
      fetchData();
    }).catch(() => {});
}

for (const f of (props.config.searchFields || [])) { watch(() => search[f.field], fetchData); }

defineExpose({ refresh: fetchData, selected, tableData, form });
</script>

<style scoped>
.crud-page { max-width: 1200px; }
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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.footer-bar { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
