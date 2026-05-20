<template>
  <div class="notif-bell">
    <OverlayPanel ref="panel" class="notif-panel-overlay" @show="onPanelShow">
      <div class="notif-panel">
        <div class="notif-panel-header">
          <span class="notif-panel-title">{{ t('notifications.title') }}</span>
          <Button
            v-if="store.hasUnread"
            :label="t('notifications.markAllRead')"
            text
            size="small"
            @click="handleMarkAllRead"
          />
        </div>

        <div v-if="store.isLoading" class="notif-panel-loading">
          <ProgressSpinner style="width: 32px; height: 32px" />
        </div>

        <div v-else-if="store.items.length === 0" class="notif-panel-empty">
          {{ t('notifications.empty') }}
        </div>

        <ul v-else class="notif-list">
          <li
            v-for="item in store.items"
            :key="item.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !item.isRead }"
            @click="handleItemClick(item)"
          >
            <div class="notif-item-icon">
              <i :class="iconForType(item.type)" />
            </div>
            <div class="notif-item-body">
              <span class="notif-item-title">{{ displayTitle(item) }}</span>
              <span class="notif-item-message">{{ displayMessage(item) }}</span>
              <span class="notif-item-time">{{ formatTime(item.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </div>
    </OverlayPanel>

    <button
      type="button"
      class="notif-bell-btn"
      :title="t('notifications.title')"
      @click="togglePanel"
    >
      <i class="pi pi-bell" />
      <span v-if="store.unreadCount > 0" class="notif-badge">
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import OverlayPanel from 'primevue/overlaypanel';
import ProgressSpinner from 'primevue/progressspinner';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/store/notifications';
import type { Notification, NotificationType } from '@/types/notification';

const { t, locale } = useI18n();
const store = useNotificationStore();
const panel = ref<InstanceType<typeof OverlayPanel> | null>(null);

function iconForType(type: NotificationType): string {
  const map: Record<NotificationType, string> = {
    balance_created: 'pi pi-wallet',
    balance_low: 'pi pi-exclamation-triangle',
    balance_empty: 'pi pi-times-circle',
    balance_expiry_warning: 'pi pi-clock',
    balance_expired: 'pi pi-calendar-times',
  };
  return map[type] ?? 'pi pi-info-circle';
}

function displayTitle(item: Notification): string {
  const key = `notifications.types.${item.type}.title`;
  const translated = t(key);
  return translated !== key ? translated : item.title;
}

function displayMessage(item: Notification): string {
  const key = `notifications.types.${item.type}.message`;
  const meta = item.metadata ?? {};
  const translated = t(key, meta as Record<string, unknown>);
  return translated !== key ? translated : item.message;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-GB';
  return date.toLocaleString(loc, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function togglePanel(event: Event) {
  panel.value?.toggle(event);
}

function onPanelShow() {
  store.fetchNotifications();
}

async function handleMarkAllRead() {
  await store.markAllRead();
}

async function handleItemClick(item: Notification) {
  if (!item.isRead) {
    await store.markRead(item.id);
  }
}

</script>

<style scoped lang="postcss">
.notif-bell {
  position: relative;
  display: flex;
  align-items: center;
}

.notif-bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #4338ca;
  border-radius: 50%;
  background: var(--gym-dark-secondary);
  color: #e0e7ff;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    background: var(--gym-accent);
    border-color: var(--gym-accent);
    color: #fff;
  }

  & .pi-bell {
    font-size: 16px;
  }
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--gym-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.notif-panel {
  width: min(360px, 90vw);
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.notif-panel-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--gym-dark);
}

.notif-panel-loading,
.notif-panel-empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--gym-text-muted);
  font-size: 14px;
}

.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 320px;
}

.notif-item {
  display: flex;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--gym-surface);
  }

  &--unread {
    background: rgba(249, 115, 22, 0.08);

    & .notif-item-title {
      font-weight: 700;
    }
  }
}

.notif-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--gym-surface);
  color: var(--gym-accent);
  font-size: 14px;
}

.notif-item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.notif-item-title {
  font-size: 13px;
  color: var(--gym-dark);
}

.notif-item-message {
  font-size: 12px;
  color: var(--gym-text-muted);
  line-height: 1.35;
}

.notif-item-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>
