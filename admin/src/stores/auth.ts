import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi } from '@/api/api';
import { pickLoginPayload } from '@/api/adapter';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  async function login(phone: string, password: string, role: string, villageId?: string) {
    const res: any = await loginApi(phone, password, role, villageId);
    const payload = pickLoginPayload(res);
    token.value = payload.token;
    user.value = payload.user;
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
    router.push('/dashboard');
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  return { token, user, login, logout };
});
