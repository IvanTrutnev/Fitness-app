import { defineStore } from 'pinia';
import api from '@/lib/api'; // ← наш инстанс

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
  }),

  actions: {
    async login(email: string, password: string) {
      try {
        const res = await api.post('/auth/login', { email, password });
        this.token = res.data.accessToken;
        localStorage.setItem('token', this.token);
        localStorage.setItem('refreshToken', res.data.refreshToken); // 👈
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async register(email: string, password: string) {
      try {
        await api.post('/auth/register', { email, password });
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },

    logout() {
      this.token = '';
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
  },
});
