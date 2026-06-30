<template>
  <div class="login-container">
    <div class="background-decor">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <h2>后台管理系统</h2>
        <p>权限与配置中心</p>
      </div>
      <el-form 
        ref="loginForm" 
        :model="form" 
        :rules="rules" 
        label-width="0" 
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入账号/手机号" 
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock" 
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="login-btn" 
            size="large" 
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <span>默认管理员: admin / admin</span>
      </div>
    </div>
  </div>
</template>

<script>
import { login } from '../../api/user';
import { ElMessage } from 'element-plus';

export default {
  name: 'SignIn',
  data() {
    return {
      loading: false,
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) return;
        
        this.loading = true;
        try {
          const res = await login({
            username: this.form.username,
            password: this.form.password // 明文发送，后端统一 md5 处理
          });
          
          if (res && res.code === 0) {
            ElMessage.success('登录成功');
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('nickName', res.data.nickName);
            localStorage.setItem('roleId', res.data.roleId);
            this.$router.push('/home/index');
          }
        } catch (error) {
          console.error(error);
        } finally {
          this.loading = false;
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at 10% 20%, rgb(4, 159, 108) 0%, rgb(194, 254, 113) 90.1%);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', 'Outfit', sans-serif;
}

.background-decor {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
  }
  
  .circle-1 {
    width: 400px;
    height: 400px;
    background: #00f2fe;
    top: -100px;
    left: -100px;
    animation: float 10s ease-in-out infinite alternate;
  }
  
  .circle-2 {
    width: 500px;
    height: 500px;
    background: #4facfe;
    bottom: -150px;
    right: -150px;
    animation: float 12s ease-in-out infinite alternate-reverse;
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(50px, 50px) scale(1.1);
  }
}

.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
  z-index: 10;
  text-align: center;
  box-sizing: border-box;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
}

.login-header {
  margin-bottom: 40px;
  
  h2 {
    font-size: 28px;
    color: #1d3557;
    margin: 0 0 10px 0;
    font-weight: 700;
    letter-spacing: 1px;
  }
  
  p {
    font-size: 14px;
    color: #457b9d;
    margin: 0;
    font-weight: 500;
  }
}

.login-form {
  :deep(.el-input) {
    --el-input-border-radius: 12px;
    --el-input-hover-border-color: #049f6c;
    --el-input-focus-border-color: #049f6c;
    margin-bottom: 8px;
    
    .el-input__wrapper {
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset;
      transition: all 0.3s;
      
      &.is-focus, &:hover {
        box-shadow: 0 0 0 1px #049f6c inset;
      }
    }
  }
}

.login-btn {
  width: 100%;
  border-radius: 12px;
  background: linear-gradient(135deg, #049f6c 0%, #028054 100%);
  border: none;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 4px;
  box-shadow: 0 4px 15px rgba(4, 159, 108, 0.3);
  transition: all 0.3s;
  
  &:hover {
    background: linear-gradient(135deg, #05af77 0%, #03905e 100%);
    box-shadow: 0 6px 20px rgba(4, 159, 108, 0.45);
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.login-footer {
  margin-top: 24px;
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.5);
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
}
</style>
