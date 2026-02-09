import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import Users from '../pages/users/Users.vue';
import Profile from '@/pages/users/Profile.vue';
import Settings from '@/pages/Settings.vue';
import { useAuthStore } from '../store/auth';
import { useUserStore } from '../store/user';
import { UserRole } from '@/constants/user';

import DefaultLayout from '@/layouts/Default.vue';

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: Profile,
      },
      {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: { requiresAdmin: true },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
      },
      {
        path: 'users/:id',
        name: 'User',
        component: () => import('@/pages/users/User.vue'),
        meta: { requiresAdmin: true },
      },
    ],
  },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _, next) => {
  const auth = useAuthStore();
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !auth.token) {
    next('/login');
    return;
  }

  if (to.meta.requiresAdmin) {
    if (!userStore.currentUser) {
      try {
        await userStore.fetchCurrentUser();
      } catch (err) {
        next('/login');
        return;
      }
    }

    if (userStore.currentUser?.role !== UserRole.ADMIN) {
      next('/');
      return;
    }
  }

  next();
});

export default router;
