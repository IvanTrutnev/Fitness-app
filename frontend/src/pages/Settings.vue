<template>
  <div class="settings-page">
    <Card class="settings-card">
      <template #title>{{ t('settings.profileInfo') }}</template>
      <template #content>
        <form @submit.prevent="updateSettings">
          <div class="field">
            <label>{{ t('settings.labels.avatar') }}</label>
            <div
              @click="triggerFileUpload"
              class="avatar-clickable avatar-section"
            >
              <img
                v-if="userStore.currentUser?.avatarUrl"
                :src="userStore.currentUser.avatarUrl"
                alt="User Avatar"
                class="user-avatar"
              />
              <div v-else class="no-avatar">
                <i
                  class="pi pi-camera"
                  style="font-size: 1.5rem; color: #6c757d"
                ></i>
                <span>{{ t('settings.clickToUpload') }}</span>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="onFileSelect"
                style="display: none"
              />
            </div>
          </div>

          <div class="field">
            <label for="username">{{ t('settings.labels.username') }}</label>
            <InputText
              id="username"
              v-model="form.username"
              :placeholder="t('settings.placeholders.username')"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="phone">{{ t('settings.labels.phone') }}</label>
            <InputText
              id="phone"
              v-model="form.phone"
              :placeholder="t('settings.placeholders.phone')"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="email">{{ t('settings.labels.email') }}</label>
            <InputText
              id="email"
              v-model="form.email"
              disabled
              class="w-full"
            />
            <small class="field-help">{{ t('settings.emailHelp') }}</small>
          </div>

          <div class="field">
            <Button
              type="submit"
              :label="t('settings.saveChanges')"
              :loading="isLoading"
              icon="pi pi-check"
              class="w-full"
            />
          </div>
        </form>
      </template>
    </Card>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import api from '@/lib/api';
import { useUserStore } from '@/store/user';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const toast = useToast();
const userStore = useUserStore();
const isLoading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  username: '',
  phone: '',
  email: '',
});

// Отслеживаем изменения в userStore.currentUser и заполняем форму
watch(
  () => userStore.currentUser,
  (userData) => {
    if (userData) {
      form.username = userData.username || '';
      form.phone = userData.phone || '';
      form.email = userData.email || '';
    }
  },
  { immediate: true },
);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const onFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await api.post('/users/upload-avatar', formData);
    userStore.updateUser(res.data.user);

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('settings.toast.avatarSuccess'),
      life: 3000,
    });
  } catch (err) {
    console.error('Avatar loading error', err);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('settings.toast.avatarError'),
      life: 3000,
    });
  }
};

const updateSettings = async () => {
  isLoading.value = true;

  try {
    const updateData: Record<string, any> = {};

    if (form.username.trim()) updateData.username = form.username.trim();
    if (form.phone.trim()) updateData.phone = form.phone.trim();

    const response = await api.patch('/users/settings', updateData);

    userStore.updateUser(response.data.user);

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('settings.toast.settingsSuccess'),
      life: 3000,
    });
  } catch (err: any) {
    console.error('Failed to update settings', err);

    const message =
      err.response?.data?.message || t('settings.toast.settingsError');
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: message,
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.settings-card {
  margin-top: 20px;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.field-help {
  color: #6b7280;
  margin-top: 5px;
}

.w-full {
  width: 100%;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.avatar-clickable {
  cursor: pointer;
  transition: opacity 0.2s;
}

.avatar-clickable:hover {
  opacity: 0.8;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #007bff;
}

.no-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e9ecef;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid #6c757d;
  font-size: 10px;
  color: #6c757d;
  text-align: center;
  gap: 5px;
}
</style>
