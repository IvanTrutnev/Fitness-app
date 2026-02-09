<template>
  <template v-if="!userStore.isLoading">
    <router-view />
    <Toast />
  </template>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Toast from 'primevue/toast';

const authStore = useAuthStore();
const userStore = useUserStore();

onMounted(async () => {
  if (authStore.token && authStore.token) {
    try {
      await userStore.fetchCurrentUser();
    } catch (err) {
      console.error('Failed to load user data on app start', err);
    }
  }
});

watch(
  () => authStore.token,
  async (token) => {
    if (token) {
      try {
        await userStore.fetchCurrentUser();
      } catch (err) {
        console.error('Failed to load user data after login', err);
      }
    } else {
      userStore.clearUser();
    }
  },
);
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
