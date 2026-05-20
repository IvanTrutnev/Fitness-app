import { onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import type { Notification } from '@/types/notification';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function useNotifications() {
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (authStore.token) {
        connect();
      }
    }, 5000);
  }

  function connect() {
    const token = authStore.token || localStorage.getItem('token');
    if (!token) return;

    disconnect();

    const url = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Notification;
        if (payload?.id) {
          notificationStore.pushNotification(payload);
        }
      } catch (error) {
        console.error('Failed to parse SSE notification:', error);
      }
    };

    eventSource.onerror = () => {
      disconnect();
      scheduleReconnect();
    };
  }

  onMounted(() => {
    if (authStore.token) {
      notificationStore.fetchNotifications();
      connect();
    }
  });

  onUnmounted(() => {
    disconnect();
  });

  watch(
    () => authStore.token,
    (token) => {
      if (token) {
        notificationStore.fetchNotifications();
        connect();
      } else {
        disconnect();
        notificationStore.clear();
      }
    },
  );

  return {
    connect,
    disconnect,
  };
}
