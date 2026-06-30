import axios from 'axios';
import { useAppStore } from '../store/app'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import router from '../router/index'
import proxyApi from '../dev.js'

const { api } = proxyApi

// 防抖提示，避免重复弹出相同消息
let messageTimer = null
let lastMessage = ''
function antiShake(msg, type = 'error') {
  if (msg === lastMessage && messageTimer) return
  lastMessage = msg
  clearTimeout(messageTimer)
  ElMessage[type](msg)
  messageTimer = setTimeout(() => {
    lastMessage = ''
    messageTimer = null
  }, 2000)
}

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 添加请求取消逻辑
    const appStore = useAppStore()
    const source = axios.CancelToken.source()
    config.cancelToken = source.token
    appStore.addCancel(() => source.cancel('Route change'))

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    const res = response?.data
    const code = res?.code
    
    // 如果返回的 code 是 0，表示成功
    if (code === 0) {
      return res
    }
    
    // 处理未授权错误
    if (code === 1003) {
      handleLogout('登录已过期，请重新登录')
      return false
    }

    // 其他业务错误
    if (res?.msg) {
      antiShake(res.msg)
    }
    return false
  },
  (error) => {
    if (axios.isCancel(error)) return false

    const status = error.response?.status
    const data = error.response?.data
    
    if (status === 401 || status === 403) {
      handleLogout('登录已过期，请重新登录')
    } else if (status === 429) {
      antiShake('请求过于频繁，请稍后再试')
    } else if (status === 500) {
      antiShake('服务器内部错误')
    } else {
      antiShake(data?.msg || error.message || '网络请求失败')
    }
    return false
  }
);

// 处理退出登录并跳转
function handleLogout(msg) {
  const userStore = useUserStore()
  userStore.logout()
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('nickName')
  localStorage.removeItem('roleId')
  antiShake(msg)
  
  if (router.currentRoute.value?.name === 'login') return
  
  const redirect = router.currentRoute.value?.fullPath
  setTimeout(() => {
    router.replace({ path: '/login', query: { redirect } })
  }, 1500)
}

export default axios