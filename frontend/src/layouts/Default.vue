<template>
  <div>
    <header class="app-header">
      <Menu :model="menuItems" popup ref="menu" />
      <Button
        class="logout-btn"
        severity="secondary"
        icon="pi pi-user"
        label="Account"
        @click="toggleMenu"
      />
    </header>
    <main>
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
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => router.push({ name: 'Settings' }),
    },
  ];

  if (userStore.currentUser?.role === 'admin') {
    items.push({
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
.app-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 20px;
  color: white;
}

.logo {
  margin: 0;
  font-size: 20px;
}

main {
  padding: 20px;
}

.logout-btn {
  margin-left: 10px;
}
</style>
