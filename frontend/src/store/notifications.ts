import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/lib/api';
import type { Notification } from '@/types/notification';

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const isPanelOpen = ref(false);

  const hasUnread = computed(() => unreadCount.value > 0);

  async function fetchNotifications() {
    isLoading.value = true;
    try {
      const { data } = await api.get<{
        success: boolean;
        data: Notification[];
        unreadCount: number;
      }>('/notifications');
      items.value = data.data ?? [];
      unreadCount.value = data.unreadCount ?? 0;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get<{ success: boolean; unreadCount: number }>(
        '/notifications/unread-count',
      );
      unreadCount.value = data.unreadCount ?? 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }

  function pushNotification(notification: Notification) {
    const exists = items.value.some((n) => n.id === notification.id);
    if (!exists) {
      items.value.unshift(notification);
    }
    if (!notification.isRead) {
      unreadCount.value += exists ? 0 : 1;
    }
  }

  async function markRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      const item = items.value.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      items.value.forEach((n) => {
        n.isRead = true;
      });
      unreadCount.value = 0;
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  }

  function clear() {
    items.value = [];
    unreadCount.value = 0;
  }

  function setPanelOpen(open: boolean) {
    isPanelOpen.value = open;
  }

  return {
    items,
    unreadCount,
    isLoading,
    isPanelOpen,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    pushNotification,
    markRead,
    markAllRead,
    clear,
    setPanelOpen,
  };
});
