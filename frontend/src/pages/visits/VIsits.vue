<template>
  <div class="p-m-4">
    <Tabs value="table" @update:value="onTabChange">
      <TabList>
        <Tab value="table"
          ><i class="pi pi-list" style="margin-right: 6px" />{{ t('visits.tabs.table') }}</Tab
        >
        <Tab value="calendar"
          ><i class="pi pi-calendar" style="margin-right: 6px" />{{ t('visits.tabs.calendar') }}</Tab
        >
      </TabList>

      <TabPanels>
        <!-- ─── Tab 1: Table + Filters + Stats ─── -->
        <TabPanel value="table">
          <div class="filters-section">
            <h4>{{ t('visits.filters.title') }}</h4>
            <div class="filters-row">
              <template v-if="isAdmin">
                <div class="filter-item">
                  <label>{{ t('visits.filters.user') }}</label>
                  <Select
                    v-model="filters.userId"
                    :options="users"
                    optionLabel="email"
                    optionValue="_id"
                    :placeholder="t('visits.filters.allUsers')"
                    style="width: 200px"
                    showClear
                  />
                </div>
                <div class="filter-item">
                  <label>{{ t('visits.filters.trainer') }}</label>
                  <Select
                    v-model="filters.trainerId"
                    :options="trainers"
                    optionLabel="email"
                    optionValue="_id"
                    :placeholder="t('visits.filters.allTrainers')"
                    style="width: 200px"
                    showClear
                  />
                </div>
              </template>

              <template v-else-if="isTrainer">
                <div class="filter-item">
                  <label>{{ t('visits.filters.user') }}</label>
                  <Select
                    v-model="filters.userId"
                    :options="users"
                    optionLabel="email"
                    optionValue="_id"
                    :placeholder="t('visits.filters.allUsers')"
                    style="width: 200px"
                    showClear
                  />
                </div>
              </template>

              <template v-else-if="isUser">
                <div class="filter-item">
                  <label>{{ t('visits.filters.trainer') }}</label>
                  <Select
                    v-model="filters.trainerId"
                    :options="trainers"
                    optionLabel="email"
                    optionValue="_id"
                    :placeholder="t('visits.filters.allTrainers')"
                    style="width: 200px"
                    showClear
                  />
                </div>
              </template>

              <div class="filter-item">
                <label>{{ t('visits.filters.dateFrom') }}</label>
                <DatePicker
                  v-model="filters.dateFrom"
                  dateFormat="dd/mm/yy"
                  style="width: 150px"
                  showIcon
                />
              </div>
              <div class="filter-item">
                <label>{{ t('visits.filters.dateTo') }}</label>
                <DatePicker
                  v-model="filters.dateTo"
                  dateFormat="dd/mm/yy"
                  style="width: 150px"
                  showIcon
                />
              </div>
              <Button
                :label="t('visits.filters.clear')"
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
            <template v-if="isAdmin">
              <Column field="userId.email" :header="t('visits.columns.user')" sortable>
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
              <Column field="trainerId.email" :header="t('visits.columns.trainer')" sortable>
                <template #body="{ data }">
                  <span v-if="data.trainerId">{{ data.trainerId.email }}</span>
                  <span v-else class="no-trainer">{{ t('visits.noTrainer') }}</span>
                </template>
              </Column>
              <Column field="date" :header="t('visits.columns.date')" sortable>
                <template #body="{ data }">{{ formatDate(data.date) }}</template>
              </Column>
              <Column field="price" :header="t('visits.columns.price')" sortable>
                <template #body="{ data }">
                  <Tag
                    v-if="data.wasBalanceUsed"
                    severity="info"
                    :value="t('visits.balance')"
                  />
                  <span v-else-if="data.price" class="price-paid">{{
                    formatPrice(data.price)
                  }}</span>
                  <Tag v-else severity="secondary" :value="t('visits.free')" />
                </template>
              </Column>
              <Column field="notes" :header="t('visits.columns.notes')">
                <template #body="{ data }">
                  <span v-if="data.notes" class="notes-cell">{{ data.notes }}</span>
                  <span v-else class="no-notes">-</span>
                </template>
              </Column>
            </template>

            <template v-else-if="isTrainer">
              <Column field="date" :header="t('visits.columns.date')" sortable>
                <template #body="{ data }">{{ formatDate(data.date) }}</template>
              </Column>
              <Column field="userId.email" :header="t('visits.columns.user')" sortable>
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
              <Column field="price" :header="t('visits.columns.payment')" sortable>
                <template #body="{ data }">
                  <Tag
                    v-if="data.wasBalanceUsed"
                    severity="info"
                    :value="t('visits.balance')"
                  />
                  <span v-else-if="data.price" class="price-paid">{{
                    formatPrice(data.price)
                  }}</span>
                  <Tag v-else severity="secondary" :value="t('visits.free')" />
                </template>
              </Column>
            </template>

            <template v-else>
              <Column field="date" :header="t('visits.columns.date')" sortable>
                <template #body="{ data }">{{ formatDate(data.date) }}</template>
              </Column>
              <Column field="trainerId.email" :header="t('visits.columns.trainer')" sortable>
                <template #body="{ data }">
                  <span v-if="data.trainerId">{{ data.trainerId.email }}</span>
                  <span v-else class="no-trainer">{{ t('visits.noTrainer') }}</span>
                </template>
              </Column>
              <Column field="price" :header="t('visits.columns.payment')" sortable>
                <template #body="{ data }">
                  <Tag
                    v-if="data.wasBalanceUsed"
                    severity="success"
                    :value="t('visits.fromBalance')"
                  />
                  <span v-else-if="data.price" class="price-paid">
                    {{ t('visits.paid', { price: formatPrice(data.price) }) }}
                  </span>
                  <Tag v-else severity="secondary" :value="t('visits.free')" />
                </template>
              </Column>
            </template>

            <template #empty>
              <div class="empty-state"><p>{{ t('visits.empty') }}</p></div>
            </template>
          </DataTable>

          <div class="stats-section" v-if="stats">
            <h4>{{ t('visits.stats.title') }}</h4>
            <div class="stats-cards">
              <div class="stat-card">
                <span class="stat-label">{{ t('visits.stats.totalVisits') }}</span>
                <span class="stat-value">{{ stats.totalVisits }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">{{ t('visits.stats.balanceVisits') }}</span>
                <span class="stat-value">{{ stats.balanceVisits }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">{{ t('visits.stats.paidVisits') }}</span>
                <span class="stat-value">{{ stats.paidVisits }}</span>
              </div>
              <div class="stat-card" v-if="isAdmin || isTrainer">
                <span class="stat-label">{{ t('visits.stats.revenue') }}</span>
                <span class="stat-value">{{ formatPrice(stats.revenue) }}</span>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ─── Tab 2: Calendar ─── -->
        <TabPanel value="calendar">
          <VisitsCalendar
            ref="calendarRef"
            :visits="visits"
            :isAdmin="isAdmin"
            :isTrainer="isTrainer"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import api from '@/lib/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useUserStore } from '@/store/user';
import { useToast } from 'primevue/usetoast';
import { UserRole } from '@/constants/user';
import type { Visit, VisitStats } from '@/types/visit';
import VisitsCalendar from './VisitsCalendar.vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const userStore = useUserStore();
const toast = useToast();

const visits = ref<Visit[]>([]);
const loading = ref(false);
const users = ref<any[]>([]);
const trainers = ref<any[]>([]);
const stats = ref<VisitStats | null>(null);

const calendarRef = ref<InstanceType<typeof VisitsCalendar> | null>(null);

const onTabChange = (value: string | number) => {
  if (value === 'calendar') {
    nextTick(() => {
      calendarRef.value?.updateSize();
    });
  }
};

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
      params = {
        ...params,
        userId: filters.value.userId,
        trainerId: filters.value.trainerId,
      };
    } else if (isTrainer.value) {
      endpoint = `/visits/trainer/${userStore.currentUser?._id}`;
      params = { ...params, userId: filters.value.userId };
    } else {
      endpoint = '/visits/my';
      params = { ...params, trainerId: filters.value.trainerId };
    }

    const response = await api.get(endpoint, { params });
    visits.value = response.data.data || response.data;
  } catch (error) {
    console.error('Failed to load visits:', error);
    toast.add({
      severity: 'error',
      summary: t('visits.error.title'),
      detail: t('visits.error.load'),
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    let params: any = {};
    if (isTrainer.value) params.trainerId = userStore.currentUser?._id;
    else if (isUser.value) params.userId = userStore.currentUser?._id;
    const response = await api.get('/visits/stats', { params });
    stats.value = response.data.data;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadFilterOptions = async () => {
  try {
    if (isAdmin.value || isTrainer.value) {
      const usersResponse = await api.get('/users', {
        params: { role: UserRole.USER },
      });
      users.value = usersResponse.data;
    }
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
};

watch(
  () => filters.value,
  () => {
    loadVisits();
  },
  { deep: true },
);

const dateLocale = computed(() => locale.value === 'ru' ? 'ru-RU' : 'en-GB');

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(dateLocale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(
    price,
  );

onMounted(() => {
  loadVisits();
  loadStats();
  loadFilterOptions();
});
</script>

<style scoped lang="postcss">
/* ── Layout ── */
.p-m-4 {
  padding: 16px;

  @media (max-width: 480px) {
    padding: 10px;
  }
}

/* ── Filters ── */
.filters-section {
  margin-bottom: 20px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  & h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--gym-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.filters-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: 600px) {
    width: 100%;

    :deep(.p-select),
    :deep(.p-datepicker) {
      width: 100% !important;
    }
  }

  & label {
    font-weight: 500;
    font-size: 13px;
    color: var(--gym-text-muted);
  }
}

.clear-filters-btn {
  height: 42px;

  @media (max-width: 600px) {
    width: 100%;
  }
}

/* ── Table ── */
.visits-table {
  margin-top: 16px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.price-paid {
  color: #059669;
  font-weight: 500;
}

.no-trainer,
.no-notes {
  color: var(--gym-text-muted);
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
  color: var(--gym-text-muted);
}

/* ── Stats ── */
.stats-section {
  margin-top: 24px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  & h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--gym-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.stats-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px;
  background: var(--gym-surface);
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  flex: 1;
  min-width: 110px;

  & .stat-label {
    font-size: 12px;
    color: var(--gym-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  & .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--gym-dark);
  }
}
</style>
