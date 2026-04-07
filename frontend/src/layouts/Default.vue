<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-brand">
        <span class="brand-icon">
          <i class="pi pi-bolt" />
        </span>
        <span class="brand-name">FitClub</span>
      </div>

      <div class="header-actions">
        <span v-if="userStore.currentUser" class="user-greeting">
          {{ userStore.currentUser.name || userStore.currentUser.email }}
        </span>
        <Menu :model="menuItems" popup ref="menu" />
        <Button
          class="account-btn"
          severity="contrast"
          icon="pi pi-user"
          label="Account"
          @click="toggleMenu"
          rounded
        />
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';

const auth = useAuthStore();
const userStore = useUserStore();
const router = useRouter();
const menu = ref();

const menuItems = computed(() => {
  const items = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => router.push({ name: 'Profile' }),
    },
    {
      label: 'Visits',
      icon: 'pi pi-calendar',
      command: () => router.push({ name: 'Visits' }),
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => router.push({ name: 'Settings' }),
    },
  ];

  if (userStore.currentUser?.role === 'admin') {
    items.splice(2, 0, {
      label: 'Users',
      icon: 'pi pi-users',
      command: () => router.push({ name: 'Users' }),
    });
  }

  items.push({
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: async () => logout(),
  });

  return items;
});

function logout() {
  auth.logout();
  router.push('/login');
}

function toggleMenu(event: Event) {
  menu.value.toggle(event);
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background: var(--gym-dark);
  box-shadow: 0 2px 12px rgba(30, 27, 75, 0.5);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: var(--gym-accent);
  border-radius: 8px;
  color: white;
  font-size: 16px;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-greeting {
  color: #a5b4fc;
  font-size: 14px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-btn {
  background: var(--gym-dark-secondary) !important;
  border-color: #4338ca !important;
  color: #e0e7ff !important;
}

.account-btn:hover {
  background: var(--gym-accent) !important;
  border-color: var(--gym-accent) !important;
  color: #fff !important;
}

.app-main {
  flex: 1;
  padding: 24px;
}
</style>
