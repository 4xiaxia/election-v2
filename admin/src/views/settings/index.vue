<template>
  <div class="page">
    <h2 class="page-title">配置管理</h2>

    <div class="section">
      <h3 class="section-title">📋 站点信息</h3>
      <div class="form-grid">
        <div class="form-item">
          <label>站点名称</label>
          <el-input v-model="form.siteName" size="small" placeholder="城厢区村居换届选举" />
        </div>
        <div class="form-item">
          <label>系统标题</label>
          <el-input v-model="form.siteTitle" size="small" placeholder="城厢区村居换届选举管理系统" />
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">🔑 微信小程序配置</h3>
      <div class="form-grid two-col">
        <div class="form-item">
          <label>AppID <span class="required">*</span></label>
          <el-input v-model="form.wxAppId" size="small" placeholder="wx..." />
        </div>
        <div class="form-item">
          <label>AppSecret <span class="required">*</span></label>
          <el-input v-model="form.wxAppSecret" size="small" type="password" show-password placeholder="密钥" />
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">🌐 服务器域名</h3>
      <div class="form-grid two-col">
        <div class="form-item">
          <label>request 合法域名</label>
          <el-input v-model="form.wxRequestDomain" size="small" placeholder="https://api.example.com" />
          <span class="help-text">小程序后台 → 开发管理 → 服务器域名 → request合法域名</span>
        </div>
        <div class="form-item">
          <label>uploadFile 合法域名</label>
          <el-input v-model="form.wxUploadDomain" size="small" placeholder="https://api.example.com" />
        </div>
        <div class="form-item">
          <label>服务器域名（完整）</label>
          <el-input v-model="form.wxServerDomain" size="small" placeholder="http://localhost:3001" />
          <span class="help-text">后端 API 基础地址，含协议+端口</span>
        </div>
        <div class="form-item">
          <label>业务域名</label>
          <el-input v-model="form.wxBizDomain" size="small" placeholder="https://cxq-election.gov.cn" />
          <span class="help-text">小程序后台 → 业务域名（H5跳转用）</span>
        </div>
      </div>
    </div>

    <!-- 短信配置（夏夏敲打：配置管理要配短信服务商/Key/签名） -->
    <div class="section">
      <h3 class="section-title">📱 短信服务配置</h3>
      <div class="form-grid two-col">
        <div class="form-item">
          <label>短信服务商</label>
          <el-select v-model="form.smsProvider" size="small" placeholder="选择服务商" style="width:100%">
            <el-option label="阿里云短信" value="aliyun" />
            <el-option label="腾讯云短信" value="tencent" />
            <el-option label="华为云短信" value="huawei" />
            <el-option label="其他（自定义）" value="other" />
          </el-select>
          <span class="help-text">规划书第97行：短信接口预留，服务商由甲方另行提供</span>
        </div>
        <div class="form-item">
          <label>短信签名</label>
          <el-input v-model="form.smsSignName" size="small" placeholder="如：城厢区村居换届选举" />
          <span class="help-text">需在短信服务商后台审核通过的签名</span>
        </div>
        <div class="form-item">
          <label>AccessKeyId</label>
          <el-input v-model="form.smsAccessKeyId" size="small" placeholder="短信 API AccessKeyId" />
        </div>
        <div class="form-item">
          <label>AccessKeySecret</label>
          <el-input v-model="form.smsAccessKeySecret" size="small" type="password" show-password placeholder="短信 API AccessKeySecret" />
        </div>
        <div class="form-item">
          <label>短信模板 Code</label>
          <el-input v-model="form.smsTemplateCode" size="small" placeholder="如：SMS_123456789" />
          <span class="help-text">需在短信服务商后台审核通过的模板编号</span>
        </div>
      </div>
      <div class="sms-tip">
        <strong>用途说明：</strong>短信用于通知工作人员（选举开始通知、逾期未到场催办）。
        配置后，选举活动编辑表单中的「短信通知」分区才能实际发送短信。
        未配置时短信功能仅记录日志，不影响其他功能。
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">📖 使用说明</h3>
      <div class="help-box">
        <p><strong>1. 移动端访问（H5 优先上线，同源小程序预留）：</strong></p>
        <ol>
          <li>移动端地址：本系统域名 + <code>/m</code>（如 <code>https://本系统域名/m</code>），免登录访问，村民微信内点链接即用。</li>
          <li>把该链接通过公告、短信或微信群发给村民即可，改完即生效。</li>
          <li>上方「服务器域名」填后端 API 基础地址（含协议+端口），移动端与后台共用同一后端。</li>
        </ol>
        <p><strong>2. 微信小程序配置（同源发布，二期上架时填写）：</strong></p>
        <ol>
          <li>登录 <a href="https://mp.weixin.qq.com" target="_blank">微信公众平台</a> → 开发管理 → 开发设置</li>
          <li>在「服务器域名」中填入上方配置的 request / uploadFile / downloadFile 域名</li>
          <li>在「业务域名」中填入业务域名</li>
          <li>回到本页面填入 AppID 和 AppSecret</li>
        </ol>
        <p class="help-text">注：一期仅 H5 端对村民开放，「AppID/业务域名」等字段保留是为同源小程序二期上架时使用，不影响 H5 体验。</p>
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" @click="handleSave" :loading="saving">💾 保存配置</el-button>
      <el-button @click="fetchData">🔄 重新加载</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getSettings, updateSettings } from '@/api/api';

const saving = ref(false);
const form = reactive<Record<string, string>>({
  siteName: '',
  siteTitle: '',
  wxAppId: '',
  wxAppSecret: '',
  wxServerDomain: '',
  wxRequestDomain: '',
  wxUploadDomain: '',
  wxBizDomain: '',
  // 短信配置
  smsProvider: '',
  smsAccessKeyId: '',
  smsAccessKeySecret: '',
  smsSignName: '',
  smsTemplateCode: '',
});

async function fetchData() {
  try {
    const res: any = await getSettings();
    if (res && typeof res === 'object') {
      Object.keys(form).forEach(k => {
        if (res[k] !== undefined) { (form as any)[k] = res[k]; }
      });
    }
  } catch {
    ElMessage.error('加载配置失败');
  }
}

onMounted(fetchData);

async function handleSave() {
  saving.value = true;
  try {
    await updateSettings({ ...form });
    ElMessage.success('配置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.page { max-width: 900px; }
.page-title { font-size: 16px; font-weight: 700; margin-bottom: 20px; }

.section {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 16px; margin-bottom: 16px;
}
.section-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; }

.form-grid { display: grid; gap: 12px; }
.form-grid.two-col { grid-template-columns: 1fr 1fr; }

.form-item { display: flex; flex-direction: column; gap: 2px; }
.form-item label { font-size: 12px; color: #6b7280; font-weight: 500; }
.required { color: #ef4444; }
.help-text { font-size: 11px; color: #9ca3af; }

.help-box {
  font-size: 12px; color: #4b5563; line-height: 1.8;
  background: #f9fafb; border-radius: 6px; padding: 12px;
}
.help-box p { margin-bottom: 8px; }
.help-box ol { padding-left: 20px; margin-bottom: 8px; }
.help-box a { color: #0d9488; }
.help-box pre {
  background: #1f2937; color: #f3f4f6; border-radius: 4px;
  padding: 8px; font-size: 11px; margin-bottom: 8px; overflow-x: auto;
}
.help-box code { font-family: monospace; }

.actions { display: flex; gap: 8px; margin-top: 8px; }

.sms-tip {
  margin-top: 12px; padding: 10px 12px; border-radius: 6px;
  background: #fef3c7; border-left: 3px solid #f59e0b;
  font-size: 12px; color: #92400e; line-height: 1.6;
}
.sms-tip strong { color: #78350f; }
</style>
