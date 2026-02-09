<template>
  <div v-if="user" class="user-details">
    <h2>User Info</h2>
    <div><strong>ID:</strong> {{ user._id }}</div>
    <div><strong>Email:</strong> {{ user.email }}</div>
    <div v-if="user.avatarUrl">
      <img :src="user.avatarUrl" alt="avatar" class="user-avatar" />
    </div>
  </div>
  <div v-else-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/lib/api';

const route = useRoute();
const user = ref<any>(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    const res = await api.get(`/users/${id}`);
    user.value = res.data;
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to fetch user';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: 10px;
}
.user-details {
  padding: 2rem;
}
</style>
