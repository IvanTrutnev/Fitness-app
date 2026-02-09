<template>
  <div class="card flex flex-col items-center gap-6">
    <FileUpload
      mode="basic"
      @select="onFileSelect"
      customUpload
      auto
      severity="secondary"
      class="p-button-outlined"
    />
    <img
      v-if="src"
      :src="src"
      alt="Image"
      height="200"
      width="200"
      class="shadow-md rounded-xl w-full sm:w-64"
      style="filter: grayscale(100%)"
    />
  </div>
</template>

<script setup>
import FileUpload from 'primevue/fileupload';
import { ref } from 'vue';

import api from '@/lib/api';

const emit = defineEmits(['avatar-uploaded']);

const src = ref(null);

async function onFileSelect(event) {
  const file = event.files[0];

  // Показываем превью сразу
  const reader = new FileReader();
  reader.onload = (e) => {
    src.value = e.target.result;
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await api.post('/users/upload-avatar', formData);
    src.value = res.data.user.avatarUrl;
    emit('avatar-uploaded', res.data.user);
  } catch (err) {
    console.error('Avatar loading error', err);
  }
}
</script>
