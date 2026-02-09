import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';
import type { User, UserWithBalance } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<UserWithBalance | null>(null);
  const isLoading = ref(false);
  let fetchPromise: Promise<any> | null = null;

  const fetchCurrentUser = async () => {
    if (fetchPromise) {
      return fetchPromise;
    }

    if (currentUser.value) {
      return currentUser.value;
    }

    isLoading.value = true;
    fetchPromise = api
      .get('/users/current')
      .then((res) => {
        currentUser.value = res.data;
        return res.data;
      })
      .catch((err) => {
        console.error('Failed to fetch current user', err);
        currentUser.value = null;
        throw err;
      })
      .finally(() => {
        isLoading.value = false;
        fetchPromise = null;
      });

    return fetchPromise;
  };

  const updateUser = (userData: Partial<User>) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...userData };
    }
  };

  const clearUser = () => {
    currentUser.value = null;
  };

  return {
    currentUser,
    isLoading,
    fetchCurrentUser,
    updateUser,
    clearUser,
  };
});
