<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>Profile</h2>
    </div>

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
            <span>Click to upload</span>
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
          <p><strong>Email:</strong> {{ currentUser.email }}</p>
          <p>
            <strong>Username:</strong> {{ currentUser.username || 'Not set' }}
          </p>
          <p><strong>Phone:</strong> {{ currentUser.phone || 'Not set' }}</p>
          <p><strong>ID:</strong> {{ currentUser._id }}</p>
          <p v-if="currentUser.role === UserRole.USER">
            <strong>Balance:</strong>
            {{
              currentUser.activeBalance
                ? currentUser.activeBalance.visits
                : 'No active balance'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Загрузка документов -->
    <div class="documents-section">
      <h3>Documents</h3>

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
          :chooseLabel="
            isUploadingDocument ? 'Uploading...' : 'Upload Document'
          "
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

      <p v-else class="no-documents">No documents uploaded yet.</p>
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
      summary: 'Success',
      detail: 'Avatar updated successfully',
      life: 3000,
    });
  } catch (err) {
    console.error('Avatar loading error', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to upload avatar',
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
      summary: 'Error',
      detail: 'Failed to load documents',
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
      summary: 'Success',
      detail: 'Document uploaded successfully',
      life: 3000,
    });

    await loadDocuments();
  } catch (err) {
    console.error('Document upload error', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to upload document',
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
      summary: 'Success',
      detail: 'Document deleted successfully',
      life: 3000,
    });

    await loadDocuments();
  } catch (err) {
    console.error('Document delete error', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete document',
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

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 30px;
}

.profile-content {
  margin-bottom: 30px;
}

.user-info {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.avatar-section {
  flex-shrink: 0;
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

.user-details {
  flex: 1;
}

.user-details p {
  margin: 8px 0;
  font-size: 16px;
}

.documents-section {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.documents-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-btn {
  width: 100%;
}

.documents-list {
  max-height: 400px;
  overflow-y: auto;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: box-shadow 0.2s;
}

.document-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.document-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.document-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  color: #007bff;
}

.document-details {
  flex: 1;
}

.document-name {
  margin: 0;
  font-weight: 500;
  color: #333;
}

.document-meta {
  color: #666;
  margin-top: 4px;
}

.document-actions {
  display: flex;
  gap: 8px;
}

.no-documents {
  text-align: center;
  color: #666;
  margin: 20px 0;
  font-style: italic;
}
</style>
