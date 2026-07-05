<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-brand">
        <div class="brand-logo">选</div>
        <h1>城厢区村居换届选举系统</h1>
        <p>Chengxiang District Election Management</p>
      </div>
    </div>
    <div class="login-right">
      <div class="login-form">
        <h2>系统登录</h2>
        <el-form ref="formRef" :model="form" :rules="rules" size="default">
          <!-- 身份选择：选了之后决定能看到的数据范围 -->
          <el-form-item prop="role">
            <el-select v-model="form.role" placeholder="请选择身份" style="width:100%" @change="onRoleChange">
              <el-option label="🔑 超级管理（全区数据）" value="超级管理" />
              <el-option label="📋 经办" value="经办" />
              <el-option label="✅ 审核" value="审核" />
              <el-option label="📢 运营" value="运营" />
            </el-select>
          </el-form-item>
          <!-- 村居选择：非超管必须选，进去后只看这个村的数据 -->
          <el-form-item v-if="needVillage" prop="villageId">
            <el-select v-model="form.villageId" placeholder="请选择所属村居" style="width:100%" filterable>
              <el-option v-for="v in villages" :key="v.id" :label="`${v.name}（${v.type}）`" :value="String(v.id)" />
            </el-select>
          </el-form-item>
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="手机号" prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="form.remember">记住密码</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">登 录</el-button>
          </el-form-item>
        </el-form>
        <p class="login-hint" v-if="needVillage">
          💡 选择所属村居后，登录进入系统将只显示该村的选举数据
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { getVillagesAll } from '@/api/api';

const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const villages = ref<any[]>([]);

const form = reactive({ role: '超级管理', phone: '', password: '', villageId: '', remember: false });

// 非超管才需要选村居
const needVillage = computed(() => form.role !== '超级管理');

function onRoleChange() { form.villageId = ''; }

onMounted(async () => {
  try {
    const res: any = await getVillagesAll();
    villages.value = res.data?.list || res.data || [];
  } catch {}
});

const rules = {
  role: [{ required: true, message: '请选择身份', trigger: 'change' }],
  villageId: [{ required: true, message: '请选择所属村居', trigger: 'change',
    validator: (_: any, v: any, cb: any) => {
      if (needVillage.value && !v) cb(new Error('请选择所属村居'));
      else cb();
    }
  }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式错误', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await authStore.login(form.phone, form.password, form.role, form.villageId || undefined);
      ElMessage.success('登录成功');
    } catch {
      // 错误已在拦截器中处理
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.login-page {
  height: 100vh; display: flex;
  background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%);
}
.login-left { flex: 1; display: flex; align-items: center; justify-content: center; }
.brand-logo {
  width: 80px; height: 80px; background: #0d9488; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 36px; font-weight: 700; margin: 0 auto 20px;
}
.login-brand h1 { font-size: 20px; font-weight: 700; color: #1f2937; text-align: center; }
.login-brand p  { font-size: 12px; color: #6b7280; margin-top: 4px; text-align: center; }
.login-right {
  width: 340px; background: #fff; display: flex; align-items: center;
  justify-content: center; box-shadow: -4px 0 20px rgba(0,0,0,.06);
}
.login-form { width: 260px; }
.login-form h2 { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 20px; }
.login-btn  { width: 100%; }
.login-hint { font-size: 11px; color: #6b7280; margin-top: 8px; line-height: 1.5; }
</style>
