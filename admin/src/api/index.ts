import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器：注入 token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：适配新后端 koaLite 格式 {code, msg, data}
http.interceptors.response.use(
  (res) => {
    const body = res.data;
    // koaLite 统一格式：code=0 成功，非0业务失败
    if (body && typeof body.code !== 'undefined') {
      if (body.code === 0) {
        return body; // 返回 {code,msg,data}，页面取 .data
      }
      ElMessage.error(body.msg || '操作失败');
      return Promise.reject(body);
    }
    return body; // 兜底：非标准格式原样返回
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
      ElMessage.error('登录已过期，请重新登录');
    } else if (error.response?.status === 403) {
      ElMessage.error('权限不足');
    } else {
      const msg = error.response?.data?.msg || error.response?.data?.message || '请求失败';
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  },
);

export default http;
