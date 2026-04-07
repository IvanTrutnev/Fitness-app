<template>
  <div class="profile-container">
    <div class="profile-content" v-if="currentUser">
      <div class="user-info">
        <div @click="triggerFileUpload" class="avatar-clickable avatar-section">
          <img
            v-if="currentUser.avatarUrl"
            :src="currentUser.avatarUrl"
            alt="User Avatar"
            class="user-avatar"
          />
          <div v-else class="no-avatar">
            <i
              class="pi pi-camera"
              style="font-size: 1.5rem; color: #6c757d"
            ></i>
            <span>{{ t('profile.clickToUpload') }}</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="onFileSelect"
            style="display: none"
          />
        </div>

        <div class="user-details">
          <p><strong>{{ t('profile.labels.email') }}</strong> {{ currentUser.email }}</p>
          <p>
            <strong>{{ t('profile.labels.username') }}</strong> {{ currentUser.username || t('profile.notSet') }}
          </p>
          <p><strong>{{ t('profile.labels.phone') }}</strong> {{ currentUser.phone || t('profile.notSet') }}</p>
          <p><strong>{{ t('profile.labels.id') }}</strong> {{ currentUser._id }}</p>
          <p v-if="currentUser.role === UserRole.USER">
            <strong>{{ t('profile.labels.balance') }}</strong>
            {{
              currentUser.activeBalance
                ? currentUser.activeBalance.visits
                : t('profile.noBalance')
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Загрузка документов -->
    <div class="documents-section">
      <h3>{{ t('profile.documents') }}</h3>

      <div class="upload-section">
        <FileUpload
          mode="basic"
          @select="onDocumentSelect"
          :multiple="false"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
          :maxFileSize="10000000"
          customUpload
          auto
          :disabled="isUploadingDocument"
          :chooseLabel="isUploadingDocument ? t('profile.uploading') : t('profile.uploadDocument')"
          class="upload-btn"
        />
      </div>

      <!-- Список документов -->
      <div class="documents-list" v-if="documents.length > 0">
        <div
          v-for="document in documents"
          :key="document._id"
          class="document-item"
        >
          <div class="document-info">
            <i
              :class="getDocumentIcon(document.mimeType)"
              class="document-icon"
            ></i>
            <div class="document-details">
              <p class="document-name">{{ document.originalName }}</p>
              <small class="document-meta">
                {{ formatFileSize(document.size) }} •
                {{ formatDate(document.uploadDate) }}
              </small>
            </div>
          </div>
          <div class="document-actions">
            <Button
              icon="pi pi-download"
              severity="secondary"
              text
              @click="downloadDocument(document)"
              v-tooltip.top="'Download'"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              @click="deleteDocument(document._id)"
              v-tooltip.top="'Delete'"
            />
          </div>
        </div>
      </div>

      <p v-else class="no-documents">{{ t('profile.noDocuments') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '@/store/user';
import api from '@/lib/api';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import { UserRole } from '@/constants/user';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Document {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  uploadDate: string;
}

const userStore = useUserStore();
const toast = useToast();
const fileInput = ref<HTMLInputElement | null>(null);
const documents = ref<Document[]>([]);
const isUploadingDocument = ref(false);

const currentUser = computed(() => userStore.currentUser);

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
      detail: t('profile.toast.avatarSuccess'),
      life: 3000,
    });
  } catch (err) {
    console.error('Avatar loading error', err);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('profile.toast.avatarError'),
      life: 3000,
    });
  }
};

// Логика для документов
const loadDocuments = async () => {
  try {
    const res = await api.get('/users/documents');
    documents.value = res.data;
  } catch (err) {
    console.error('Failed to load documents', err);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('profile.toast.docLoadError'),
      life: 3000,
    });
  }
};

const onDocumentSelect = async (event: any) => {
  const file = event.files[0];
  if (!file) return;

  isUploadingDocument.value = true;

  const formData = new FormData();
  formData.append('document', file);

  try {
    await api.post('/users/upload-document', formData);

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.toast.docSuccess'),
      life: 3000,
    });

    await loadDocuments();
  } catch (err) {
    console.error('Document upload error', err);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('profile.toast.docError'),
      life: 3000,
    });
  } finally {
    isUploadingDocument.value = false;
  }
};

const deleteDocument = async (documentId: string) => {
  try {
    await api.delete(`/users/documents/${documentId}`);

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.toast.docDeleteSuccess'),
      life: 3000,
    });

    await loadDocuments();
  } catch (err) {
    console.error('Document delete error', err);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('profile.toast.docDeleteError'),
      life: 3000,
    });
  }
};

const downloadDocument = (document: Document) => {
  window.open(document.url, '_blank');
};

const getDocumentIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return 'pi pi-file-pdf';
  if (mimeType.includes('word') || mimeType.includes('document'))
    return 'pi pi-file-word';
  if (mimeType.includes('excel') || mimeType.includes('sheet'))
    return 'pi pi-file-excel';
  if (mimeType.includes('image')) return 'pi pi-image';
  if (mimeType.includes('text')) return 'pi pi-file';
  return 'pi pi-file';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  loadDocuments();
});
</script>

<style scoped lang="postcss">
.profile-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;

  @media (max-width: 480px) {
    padding: 12px;
  }
}

.profile-header {
  margin-bottom: 24px;
}

.profile-content {
  margin-bottom: 24px;
}

.user-info {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
    padding: 16px;
  }
}

.avatar-section {
  flex-shrink: 0;
}

.avatar-clickable {
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--gym-accent);
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
  border: 3px solid var(--gym-text-muted);
  font-size: 10px;
  color: var(--gym-text-muted);
  text-align: center;
  gap: 5px;
}

.user-details {
  flex: 1;
  min-width: 0;

  & p {
    margin: 8px 0;
    font-size: 15px;
    word-break: break-word;
    color: var(--gym-dark);

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
}

.documents-section {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    padding: 14px;
  }

  & h3 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--gym-dark);
    font-size: 16px;
    font-weight: 600;
  }
}

.upload-section {
  margin-bottom: 16px;
}

.upload-btn {
  width: 100%;
}

.documents-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--gym-surface);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: box-shadow 0.2s;
  gap: 8px;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
}

.document-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.document-icon {
  font-size: 1.4rem;
  margin-right: 10px;
  flex-shrink: 0;
  color: var(--gym-accent);
}

.document-details {
  flex: 1;
  min-width: 0;
}

.document-name {
  margin: 0;
  font-weight: 500;
  color: var(--gym-dark);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  color: var(--gym-text-muted);
  font-size: 12px;
  margin-top: 2px;
  display: block;
}

.document-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.no-documents {
  text-align: center;
  color: var(--gym-text-muted);
  margin: 20px 0;
  font-style: italic;
  font-size: 14px;
}
</style>
