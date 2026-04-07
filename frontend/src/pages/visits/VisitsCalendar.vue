<template>
  <div>
    <div class="calendar-wrapper">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

  <Dialog
    :visible="showEventDialog"
    @update:visible="showEventDialog = $event"
    modal
    :header="t('calendar.visitDetails')"
    :style="{ width: '420px' }"
    :draggable="false"
  >
    <div v-if="selectedVisit" class="event-detail">
      <div class="event-detail-row">
        <span class="event-detail-label">{{ t('calendar.date') }}</span>
        <span>{{ formatDate(selectedVisit.date) }}</span>
      </div>
      <div class="event-detail-row" v-if="selectedVisit.userId?.email">
        <span class="event-detail-label">{{ t('calendar.user') }}</span>
        <div class="user-cell">
          <img
            v-if="selectedVisit.userId.avatarUrl"
            :src="selectedVisit.userId.avatarUrl"
            alt="avatar"
            class="user-avatar"
          />
          <span>{{ selectedVisit.userId.email }}</span>
        </div>
      </div>
      <div class="event-detail-row">
        <span class="event-detail-label">{{ t('calendar.trainer') }}</span>
        <span v-if="selectedVisit.trainerId">{{ selectedVisit.trainerId.email }}</span>
        <span v-else class="no-trainer">{{ t('calendar.noTrainer') }}</span>
      </div>
      <div class="event-detail-row">
        <span class="event-detail-label">{{ t('calendar.payment') }}</span>
        <Tag v-if="selectedVisit.wasBalanceUsed" severity="info" :value="t('calendar.balance')" />
        <span v-else-if="selectedVisit.price" class="price-paid">{{
          formatPrice(selectedVisit.price)
        }}</span>
        <Tag v-else severity="secondary" :value="t('calendar.free')" />
      </div>
      <div class="event-detail-row" v-if="selectedVisit.notes">
        <span class="event-detail-label">{{ t('calendar.notes') }}</span>
        <span>{{ selectedVisit.notes }}</span>
      </div>
    </div>
  </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import type { Visit } from '@/types/visit';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps<{
  visits: Visit[];
  isAdmin: boolean;
  isTrainer: boolean;
}>();

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const showEventDialog = ref(false);
const selectedVisit = ref<Visit | null>(null);

const updateSize = () => {
  calendarRef.value?.getApi().updateSize();
};

defineExpose({ updateSize });

const calendarEvents = computed(() =>
  props.visits.map((v) => {
    const label =
      props.isAdmin || props.isTrainer
        ? (v.userId?.email ?? t('calendar.visit'))
        : (v.trainerId?.email ?? t('calendar.training'));

    const color = v.wasBalanceUsed
      ? '#3b82f6'
      : v.price
        ? '#10b981'
        : '#6b7280';

    return {
      id: v._id,
      title: label,
      start: v.date,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { visit: v },
    };
  }),
);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: calendarEvents.value,
  eventClick: (info: EventClickArg) => {
    selectedVisit.value = info.event.extendedProps.visit as Visit;
    showEventDialog.value = true;
  },
  height: 'auto',
  locale: locale.value,
}));

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
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(price);
</script>

<style scoped lang="postcss">
/* ── Calendar ── */
.calendar-wrapper {
  margin-top: 16px;

  :deep(.fc .fc-toolbar) {
    flex-wrap: wrap;
    gap: 8px;

    @media (max-width: 480px) {
      gap: 6px;
    }
  }

  :deep(.fc .fc-toolbar-title) {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--gym-dark);

    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }

  :deep(.fc .fc-button-primary) {
    background: var(--gym-dark-secondary);
    border-color: var(--gym-dark-secondary);
    color: #f3f4f6;
    font-size: 13px;
    padding: 5px 10px;
    border-radius: 6px;
    transition:
      background 0.15s,
      border-color 0.15s;

    &:hover:not(:disabled) {
      background: var(--gym-accent);
      border-color: var(--gym-accent);
      color: #fff;
    }

    &:focus {
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  :deep(.fc .fc-button-primary:not(:disabled).fc-button-active),
  :deep(.fc .fc-button-primary:not(:disabled):active) {
    background: var(--gym-accent);
    border-color: var(--gym-accent);
    color: #fff;
  }

  :deep(.fc .fc-daygrid-day.fc-day-today) {
    background: rgba(249, 115, 22, 0.08);
  }

  :deep(.fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number) {
    background: var(--gym-accent);
    color: #fff;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  :deep(.fc .fc-daygrid-day-number) {
    color: var(--gym-dark);
    font-size: 13px;
    padding: 4px 6px;
  }

  :deep(.fc .fc-col-header-cell-cushion) {
    color: var(--gym-text-muted);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  :deep(.fc .fc-scrollgrid) {
    border-color: #e5e7eb;
  }

  :deep(.fc td, .fc th) {
    border-color: #e5e7eb;
  }

  :deep(.fc .fc-event) {
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 1px 4px;
    cursor: pointer;
  }

  :deep(.fc .fc-daygrid-dot-event:hover),
  :deep(.fc .fc-daygrid-event:hover) {
    filter: brightness(1.1);
  }
}

/* ── Event detail dialog ── */
.event-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.event-detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-detail-label {
  width: 80px;
  font-weight: 600;
  color: var(--gym-text-muted);
  font-size: 13px;
  flex-shrink: 0;
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

.price-paid {
  color: #059669;
  font-weight: 500;
}

.no-trainer {
  color: var(--gym-text-muted);
  font-style: italic;
}
</style>
