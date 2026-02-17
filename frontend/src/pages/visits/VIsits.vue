<template>
  <div class="p-m-4">
    <h2>Visits</h2>

    <!-- Фильтры -->
    <div class="filters-section">
      <h4>Filters:</h4>
      <div class="filters-row">
        <!-- Admin sees all filters -->
        <template v-if="isAdmin">
          <div class="filter-item">
            <label>User:</label>
            <Select
              v-model="filters.userId"
              :options="users"
              optionLabel="email"
              optionValue="_id"
              placeholder="All users"
              style="width: 200px"
              showClear
            />
          </div>
          <div class="filter-item">
            <label>Trainer:</label>
            <Select
              v-model="filters.trainerId"
              :options="trainers"
              optionLabel="email"
              optionValue="_id"
              placeholder="All trainers"
              style="width: 200px"
              showClear
            />
          </div>
        </template>

        <!-- Trainer sees user and date filters -->
        <template v-else-if="isTrainer">
          <div class="filter-item">
            <label>User:</label>
            <Select
              v-model="filters.userId"
              :options="users"
              optionLabel="email"
              optionValue="_id"
              placeholder="All users"
              style="width: 200px"
              showClear
            />
          </div>
        </template>

        <!-- User sees trainer and date filters -->
        <template v-else-if="isUser">
          <div class="filter-item">
            <label>Trainer:</label>
            <Select
              v-model="filters.trainerId"
              :options="trainers"
              optionLabel="email"
              optionValue="_id"
              placeholder="All trainers"
              style="width: 200px"
              showClear
            />
          </div>
        </template>

        <!-- Date filters for everyone -->
        <div class="filter-item">
          <label>Date From:</label>
          <DatePicker
            v-model="filters.dateFrom"
            dateFormat="dd/mm/yy"
            style="width: 150px"
            showIcon
          />
        </div>
        <div class="filter-item">
          <label>Date To:</label>
          <DatePicker
            v-model="filters.dateTo"
            dateFormat="dd/mm/yy"
            style="width: 150px"
            showIcon
          />
        </div>
        <Button
          label="Clear"
          @click="clearFilters"
          outlined
          class="clear-filters-btn"
        />
      </div>
    </div>
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>

    <DataTable
      v-else
      :value="visits"
      :paginator="true"
      :rows="20"
      class="visits-table"
      sortable
      :loading="loading"
    >
      <!-- Admin columns -->
      <template v-if="isAdmin">
        <Column field="userId.email" header="User" sortable>
          <template #body="{ data }">
            <div class="user-cell">
              <img
                v-if="data.userId.avatarUrl"
                :src="data.userId.avatarUrl"
                alt="avatar"
                class="user-avatar"
              />
              <span>{{ data.userId.email }}</span>
            </div>
          </template>
        </Column>
        <Column field="trainerId.email" header="Trainer" sortable>
          <template #body="{ data }">
            <span v-if="data.trainerId">
              {{ data.trainerId.email }}
            </span>
            <span v-else class="no-trainer">No trainer</span>
          </template>
        </Column>
        <Column field="date" header="Date" sortable>
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>
        <Column field="price" header="Price" sortable>
          <template #body="{ data }">
            <span v-if="data.wasBalanceUsed" class="balance-used">
              <Tag severity="info" value="Balance" />
            </span>
            <span v-else-if="data.price" class="price-paid">
              {{ formatPrice(data.price) }}
            </span>
            <span v-else class="free-visit">
              <Tag severity="secondary" value="Free" />
            </span>
          </template>
        </Column>
        <Column field="notes" header="Notes">
          <template #body="{ data }">
            <span v-if="data.notes" class="notes-cell">{{ data.notes }}</span>
            <span v-else class="no-notes">-</span>
          </template>
        </Column>
      </template>

      <!-- Trainer columns -->
      <template v-else-if="isTrainer">
        <Column field="date" header="Date" sortable>
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>
        <Column field="userId.email" header="User" sortable>
          <template #body="{ data }">
            <div class="user-cell">
              <img
                v-if="data.userId.avatarUrl"
                :src="data.userId.avatarUrl"
                alt="avatar"
                class="user-avatar"
              />
              <span>{{ data.userId.email }}</span>
            </div>
          </template>
        </Column>
        <Column field="price" header="Payment" sortable>
          <template #body="{ data }">
            <span v-if="data.wasBalanceUsed" class="balance-used">
              <Tag severity="info" value="Balance" />
            </span>
            <span v-else-if="data.price" class="price-paid">
              {{ formatPrice(data.price) }}
            </span>
            <span v-else class="free-visit">
              <Tag severity="secondary" value="Free" />
            </span>
          </template>
        </Column>
      </template>

      <!-- User columns -->
      <template v-else>
        <Column field="date" header="Date" sortable>
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>
        <Column field="trainerId.email" header="Trainer" sortable>
          <template #body="{ data }">
            <span v-if="data.trainerId">
              {{ data.trainerId.email }}
            </span>
            <span v-else class="no-trainer">No trainer</span>
          </template>
        </Column>
        <Column field="price" header="Payment" sortable>
          <template #body="{ data }">
            <span v-if="data.wasBalanceUsed" class="balance-used">
              <Tag severity="success" value="From Balance" />
            </span>
            <span v-else-if="data.price" class="price-paid">
              Paid {{ formatPrice(data.price) }}
            </span>
            <span v-else class="free-visit">
              <Tag severity="secondary" value="Free" />
            </span>
          </template>
        </Column>
      </template>

      <!-- Empty state -->
      <template #empty>
        <div class="empty-state">
          <p>No visits found</p>
        </div>
      </template>
    </DataTable>

    <div class="stats-section" v-if="stats">
      <h4>Statistics</h4>
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-label">Total Visits</span>
          <span class="stat-value">{{ stats.totalVisits }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Balance Visits</span>
          <span class="stat-value">{{ stats.balanceVisits }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Paid Visits</span>
          <span class="stat-value">{{ stats.paidVisits }}</span>
        </div>
        <div class="stat-card" v-if="isAdmin || isTrainer">
          <span class="stat-label">Revenue</span>
          <span class="stat-value">{{ formatPrice(stats.revenue) }}</span>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/lib/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';
import { useUserStore } from '@/store/user';
import { useToast } from 'primevue/usetoast';
import { UserRole } from '@/constants/user';
import type { Visit, VisitStats } from '@/types/visit';

const userStore = useUserStore();
const toast = useToast();

const visits = ref<Visit[]>([]);
const loading = ref(false);
const users = ref<any[]>([]);
const trainers = ref<any[]>([]);
const stats = ref<VisitStats | null>(null);

// State for filters (admin)
const filters = ref<{
  userId: string | null;
  trainerId: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
}>({
  userId: null,
  trainerId: null,
  dateFrom: null,
  dateTo: null,
});

const isAdmin = computed(() => userStore.currentUser?.role === UserRole.ADMIN);
const isTrainer = computed(
  () => userStore.currentUser?.role === UserRole.TRAINER,
);
const isUser = computed(() => userStore.currentUser?.role === UserRole.USER);

const loadVisits = async () => {
  loading.value = true;
  try {
    let endpoint = '/visits';
    let params: any = {
      limit: 1000,
      dateFrom: filters.value.dateFrom?.toISOString(),
      dateTo: filters.value.dateTo?.toISOString(),
    };

    if (isAdmin.value) {
      // Admin sees all visits with filters
      params = {
        ...params,
        userId: filters.value.userId,
        trainerId: filters.value.trainerId,
      };
    } else if (isTrainer.value) {
      // Trainer sees visits to them with user filter
      endpoint = `/visits/trainer/${userStore.currentUser?._id}`;
      params = {
        ...params,
        userId: filters.value.userId, // Filter by user
      };
    } else {
      // User sees their own visits with trainer filter
      endpoint = '/visits/my';
      params = {
        ...params,
        trainerId: filters.value.trainerId, // Filter by trainer
      };
    }

    const response = await api.get(endpoint, { params });
    visits.value = response.data.data || response.data;
  } catch (error) {
    console.error('Failed to load visits:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load visits',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    let params: any = {};

    if (isTrainer.value) {
      params.trainerId = userStore.currentUser?._id;
    } else if (isUser.value) {
      params.userId = userStore.currentUser?._id;
    }

    const response = await api.get('/visits/stats', { params });
    stats.value = response.data.data;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadFilterOptions = async () => {
  try {
    // Load users for filter (admin and trainer need this)
    if (isAdmin.value || isTrainer.value) {
      const usersResponse = await api.get('/users', {
        params: { role: UserRole.USER },
      });
      users.value = usersResponse.data;
    }

    // Load trainers for filter (admin and user need this)
    if (isAdmin.value || isUser.value) {
      const trainersResponse = await api.get('/users', {
        params: { role: UserRole.TRAINER },
      });
      trainers.value = trainersResponse.data;
    }
  } catch (error) {
    console.error('Failed to load filter options:', error);
  }
};

const clearFilters = () => {
  filters.value = {
    userId: null,
    trainerId: null,
    dateFrom: null,
    dateTo: null,
  };
  // loadVisits will be called automatically by watcher
};

// Watch filters for automatic loading
watch(
  () => filters.value,
  () => {
    loadVisits();
  },
  { deep: true },
);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(price);
};

onMounted(() => {
  loadVisits();
  loadStats();
  loadFilterOptions();
});
</script>

<style scoped>
.visits-table {
  margin-top: 20px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
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
}

.filters-row {
  display: flex;
  gap: 20px;
  align-items: end;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}

.apply-filters-btn,
.clear-filters-btn {
  height: 42px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.balance-used {
  color: #2563eb;
  font-weight: 500;
}

.price-paid {
  color: #059669;
  font-weight: 500;
}

.free-visit {
  color: #6b7280;
}

.no-trainer,
.no-notes {
  color: #9ca3af;
  font-style: italic;
}

.notes-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.stats-section {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.stats-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.stats-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  min-width: 120px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #374151;
}
</style>
