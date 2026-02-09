<template>
  <div class="p-m-4">
    <h2>Users</h2>

    <!-- Фильтры -->
    <div class="filters-section">
      <h4>Filter by Role:</h4>
      <div class="role-filters">
        <Dropdown
          v-model="selectedRole"
          :options="roleOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="All (Users & Trainers)"
          @change="loadUsers"
          style="width: 200px"
        />
        <Button
          label="Clear Filter"
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
      <Column field="_id" header="ID"></Column>
      <Column field="email" header="Email"></Column>
      <Column field="role" header="Role">
        <template #body="{ data }">
          <Tag :value="data.role" :severity="getRoleSeverity(data.role)" />
        </template>
      </Column>
      <Column header="Balance">
        <template #body="{ data }">
          <div v-if="data.activeBalance" class="balance-info">
            <div class="visits">{{ data.activeBalance.visits }} visits</div>
            <div
              class="due-date"
              :class="{ expired: data.activeBalance.isExpired }"
            >
              {{ formatDate(data.activeBalance.dueDate) }}
            </div>
            <Tag
              v-if="data.activeBalance.isExpired"
              value="Expired"
              severity="danger"
              size="small"
            />
          </div>
          <span v-else class="no-balance">-</span>
        </template>
      </Column>
      <Column header="Avatar">
        <template #body="{ data }">
          <img
            v-if="data.avatarUrl"
            :src="data.avatarUrl"
            alt="avatar"
            class="user-avatar"
          />
        </template>
      </Column>
      <Column header="Actions" v-if="isAdmin">
        <template #body="{ data }">
          <Button
            v-if="data.role === UserRole.USER"
            icon="pi pi-plus"
            label="Add Balance"
            size="small"
            outlined
            @click.stop="openAddBalanceDialog(data)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Add Balance Dialog -->
    <AddBalanceDialog
      v-model:visible="showBalanceDialog"
      :user="selectedUser"
      :loading="isSubmittingBalance"
      @submit="submitBalance"
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
import { UserRole } from '@/constants/user';
import { useUserStore } from '@/store/user';
import { useToast } from 'primevue/usetoast';
import type { BalanceForm } from '@/types/balance';

const users = ref([]);
const selectedRole = ref<string | null>(null);
const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

// Balance dialog state
const showBalanceDialog = ref(false);
const selectedUser = ref<any>(null);
const isSubmittingBalance = ref(false);

const isAdmin = computed(() => {
  return userStore.currentUser?.role === UserRole.ADMIN;
});

const roleOptions = [
  { label: 'User', value: UserRole.USER },
  { label: 'Trainer', value: UserRole.TRAINER },
];

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const openAddBalanceDialog = (user: any) => {
  selectedUser.value = user;
  showBalanceDialog.value = true;
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
      summary: 'Success',
      detail: `Balance added to ${selectedUser.value.email}`,
      life: 3000,
    });

    showBalanceDialog.value = false;
    // Reload users list to show updated balance
    loadUsers();
  } catch (error) {
    console.error('Failed to add balance:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add balance',
      life: 3000,
    });
  } finally {
    isSubmittingBalance.value = false;
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
</style>
