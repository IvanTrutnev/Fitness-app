<template>
  <div class="p-m-4">
    <h2>{{ t('users.title') }}</h2>

    <div class="filters-section">
      <h4>{{ t('users.filterByRole') }}</h4>
      <div class="role-filters">
        <Dropdown
          v-model="selectedRole"
          :options="roleOptions"
          optionLabel="label"
          optionValue="value"
          :placeholder="t('users.allRoles')"
          @change="loadUsers"
          style="width: 200px"
        />
        <Button
          :label="t('users.clearFilter')"
          @click="clearFilter"
          outlined
          size="small"
          v-if="selectedRole"
        />
      </div>
    </div>

    <DataTable
      :value="users"
      :paginator="true"
      :rows="10"
      @rowClick="onRowClick"
      style="cursor: pointer"
    >
      <Column field="_id" :header="t('users.columns.id')"></Column>
      <Column field="email" :header="t('users.columns.email')"></Column>
      <Column field="role" :header="t('users.columns.role')">
        <template #body="{ data }">
          <Tag :value="data.role" :severity="getRoleSeverity(data.role)" />
        </template>
      </Column>
      <Column :header="t('users.columns.balance')">
        <template #body="{ data }">
          <div v-if="data.activeBalance" class="balance-info">
            <div class="visits">{{ t('users.visitsCount', { n: data.activeBalance.visits }) }}</div>
            <div
              class="due-date"
              :class="{ expired: data.activeBalance.isExpired }"
            >
              {{ formatDate(data.activeBalance.dueDate) }}
            </div>
            <Tag
              v-if="data.activeBalance.isExpired"
              :value="t('users.expired')"
              severity="danger"
              size="small"
            />
          </div>
          <span v-else class="no-balance">-</span>
        </template>
      </Column>
      <Column :header="t('users.columns.avatar')">
        <template #body="{ data }">
          <img
            v-if="data.avatarUrl"
            :src="data.avatarUrl"
            alt="avatar"
            class="user-avatar"
          />
        </template>
      </Column>
      <Column :header="t('users.columns.actions')" v-if="isAdmin">
        <template #body="{ data }">
          <div class="actions-buttons">
            <Button
              v-if="data.role === UserRole.USER"
              icon="pi pi-plus"
              :label="t('users.addBalance')"
              size="small"
              outlined
              @click.stop="openAddBalanceDialog(data)"
            />
            <Button
              v-if="data.role === UserRole.USER"
              icon="pi pi-calendar-plus"
              :label="t('users.addVisit')"
              size="small"
              outlined
              severity="secondary"
              @click.stop="openAddVisitDialog(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <AddBalanceDialog
      v-model:visible="showBalanceDialog"
      :user="selectedUser"
      :loading="isSubmittingBalance"
      @submit="submitBalance"
    />

    <AddVisitDialog
      v-model:visible="showVisitDialog"
      :user="selectedUserForVisit"
      :loading="isSubmittingVisit"
      @submit="submitVisit"
    />

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/lib/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import AddBalanceDialog from '@/components/AddBalanceDialog.vue';
import AddVisitDialog from '@/components/AddVisitDialog.vue';
import { UserRole } from '@/constants/user';
import { useUserStore } from '@/store/user';
import { useToast } from 'primevue/usetoast';
import type { BalanceForm } from '@/types/balance';
import type { VisitForm } from '@/types/visit';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const users = ref([]);
const selectedRole = ref<string | null>(null);
const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const showBalanceDialog = ref(false);
const selectedUser = ref<any>(null);
const isSubmittingBalance = ref(false);

const showVisitDialog = ref(false);
const selectedUserForVisit = ref<any>(null);
const isSubmittingVisit = ref(false);

const isAdmin = computed(() => {
  return userStore.currentUser?.role === UserRole.ADMIN;
});

const roleOptions = computed(() => [
  { label: t('users.roleUser'), value: UserRole.USER },
  { label: t('users.roleTrainer'), value: UserRole.TRAINER },
]);

import type { DataTableRowClickEvent } from 'primevue/datatable';

const onRowClick = (event: DataTableRowClickEvent) => {
  const user = event.data;
  if (user && user._id) {
    router.push({ name: 'User', params: { id: user._id } });
  }
};

const loadUsers = async () => {
  try {
    if (selectedRole.value) {
      const res = await api.get('/users', {
        params: { role: selectedRole.value },
      });
      users.value = res.data;
    } else {
      const res = await api.get('/users');
      users.value = res.data.filter(
        (user: any) =>
          user.role === UserRole.USER || user.role === UserRole.TRAINER,
      );
    }
  } catch (err) {
    console.error('Failed to fetch users', err);
  }
};

const clearFilter = () => {
  selectedRole.value = null;
  loadUsers();
};

const getRoleSeverity = (role: string) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'danger';
    case UserRole.TRAINER:
      return 'warning';
    case UserRole.USER:
      return 'success';
    default:
      return 'info';
  }
};

const dateLocale = computed(() => locale.value === 'ru' ? 'ru-RU' : 'en-GB');

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(dateLocale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const openAddBalanceDialog = (user: any) => {
  selectedUser.value = user;
  showBalanceDialog.value = true;
};

const openAddVisitDialog = (user: any) => {
  selectedUserForVisit.value = user;
  showVisitDialog.value = true;
};

const submitBalance = async (form: BalanceForm) => {
  if (!selectedUser.value) return;

  isSubmittingBalance.value = true;

  try {
    await api.post('/balance', {
      userId: selectedUser.value._id,
      visits: form.visits,
      dueDate: form.dueDate.toISOString(),
      price: form.price,
      notes: form.notes,
    });

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('users.toast.balanceAdded', { email: selectedUser.value.email }),
      life: 3000,
    });

    showBalanceDialog.value = false;
    loadUsers();
  } catch (error) {
    console.error('Failed to add balance:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('users.toast.balanceError'),
      life: 3000,
    });
  } finally {
    isSubmittingBalance.value = false;
  }
};

const submitVisit = async (form: VisitForm) => {
  if (!selectedUserForVisit.value) return;

  isSubmittingVisit.value = true;

  try {
    await api.post('/visits', {
      userId: form.userId,
      trainerId: form.trainerId,
      date: form.date.toISOString(),
      price: form.price,
      notes: form.notes,
      useBalance: form.useBalance,
    });

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('users.toast.visitAdded', { email: selectedUserForVisit.value.email }),
      life: 3000,
    });

    showVisitDialog.value = false;
    if (form.useBalance) {
      loadUsers();
    }
  } catch (error) {
    console.error('Failed to add visit:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('users.toast.visitError'),
      life: 3000,
    });
  } finally {
    isSubmittingVisit.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.filters-section {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.filters-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.role-filters {
  display: flex;
  gap: 15px;
  align-items: center;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
}

.visits {
  font-weight: 600;
  color: #2563eb;
}

.due-date {
  color: #6b7280;
  font-size: 0.75rem;
}

.due-date.expired {
  color: #dc2626;
  font-weight: 500;
}

.no-balance {
  color: #9ca3af;
  font-style: italic;
}

.actions-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
