<template>
  <div class="user-page">
    <!-- Back button -->
    <div class="page-nav">
      <Button
        icon="pi pi-arrow-left"
        :label="t('user.backToUsers')"
        severity="secondary"
        text
        @click="router.push({ name: 'Users' })"
      />
    </div>

    <!-- Loading / error states -->
    <div v-if="loading" class="state-wrapper">
      <ProgressSpinner />
      <p class="state-text">{{ t('user.loading') }}</p>
    </div>

    <div v-else-if="error" class="state-wrapper">
      <i class="pi pi-exclamation-triangle state-icon state-icon--error" />
      <p class="state-text">{{ error }}</p>
    </div>

    <template v-else-if="user">
      <!-- Profile hero card -->
      <div class="profile-hero">
        <div class="hero-avatar-wrap">
          <img
            v-if="user.avatarUrl"
            :src="user.avatarUrl"
            alt="avatar"
            class="hero-avatar"
          />
          <div v-else class="hero-avatar-placeholder">
            <i class="pi pi-user" />
          </div>
        </div>

        <div class="hero-info">
          <div class="hero-name-row">
            <h1 class="hero-name">{{ user.username || user.email }}</h1>
            <Tag
              :value="user.role"
              :severity="roleSeverity(user.role)"
              class="role-tag"
            />
          </div>
          <p class="hero-email">{{ user.email }}</p>
          <p v-if="user.phone" class="hero-phone">
            <i class="pi pi-phone" /> {{ user.phone }}
          </p>
        </div>
      </div>

      <!-- Info grid -->
      <div class="info-grid">
        <!-- Contact card -->
        <div class="info-card">
          <div class="info-card-header">
            <i class="pi pi-id-card" />
            <span>{{ t('user.accountDetails') }}</span>
          </div>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-label">{{ t('user.labels.id') }}</span>
              <span class="info-value info-value--mono">{{ user._id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('user.labels.email') }}</span>
              <span class="info-value">{{ user.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('user.labels.username') }}</span>
              <span class="info-value">{{ user.username || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('user.labels.phone') }}</span>
              <span class="info-value">{{ user.phone || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Balance card -->
        <div class="info-card" v-if="user.role === UserRole.USER">
          <div class="info-card-header">
            <i class="pi pi-wallet" />
            <span>{{ t('user.membership') }}</span>
          </div>

          <div
            v-if="user.activeBalance && !user.activeBalance.isExpired"
            class="balance-active"
          >
            <div class="balance-visits">
              <span class="balance-count">{{ user.activeBalance.visits }}</span>
              <span class="balance-label">{{ t('user.visitsRemaining') }}</span>
            </div>
            <Divider />
            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">{{ t('user.labels.purchaseDate') }}</span>
                <span class="info-value">{{
                  formatDate(user.activeBalance.purchaseDate)
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ t('user.labels.expires') }}</span>
                <span class="info-value">{{
                  formatDate(user.activeBalance.dueDate)
                }}</span>
              </div>
            </div>
          </div>

          <div
            v-else-if="user.activeBalance?.isExpired"
            class="balance-state balance-state--expired"
          >
            <i class="pi pi-clock" />
            <span>{{ t('user.membershipExpired') }}</span>
          </div>

          <div v-else class="balance-state balance-state--none">
            <i class="pi pi-ban" />
            <span>{{ t('user.noMembership') }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/lib/api';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import ProgressSpinner from 'primevue/progressspinner';
import { UserRole } from '@/constants/user';
import type { UserWithBalance } from '@/types/user';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const user = ref<UserWithBalance | null>(null);
const loading = ref(true);
const error = ref('');

const roleSeverity = (role?: string) => {
  if (role === UserRole.ADMIN) return 'danger';
  if (role === UserRole.TRAINER) return 'warn';
  return 'info';
};

const dateLocale = computed(() => locale.value === 'ru' ? 'ru-RU' : 'en-GB');

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(dateLocale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

onMounted(async () => {
  try {
    const res = await api.get(`/users/${route.params.id}`);
    user.value = res.data;
  } catch (err: any) {
    error.value = err?.response?.data?.message || t('user.error');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="postcss">
.user-page {
  max-width: 860px;
  margin: 0 auto;
}

.page-nav {
  margin-bottom: 20px;
}

/* Loading / error */
.state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
}

.state-text {
  color: var(--gym-text-muted);
  font-size: 15px;
  margin: 0;
}

.state-icon {
  font-size: 2.5rem;

  &--error {
    color: #ef4444;
  }
}

/* Hero card */
.profile-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  background: white;
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 20px;
  box-shadow: 0 2px 16px rgba(30, 27, 75, 0.08);
  border: 1px solid #ede9fe;
}

.hero-avatar-wrap {
  flex-shrink: 0;
}

.hero-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--gym-accent);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

.hero-avatar-placeholder {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #ede9fe;
  border: 3px solid var(--gym-accent);
  display: flex;
  align-items: center;
  justify-content: center;

  & .pi {
    font-size: 2.2rem;
    color: var(--gym-accent);
  }
}

.hero-info {
  flex: 1;
}

.hero-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.hero-name {
  font-size: 26px;
  font-weight: 700;
  color: var(--gym-dark);
  margin: 0;
}

.hero-email {
  color: var(--gym-text-muted);
  font-size: 15px;
  margin: 0 0 4px;
}

.hero-phone {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gym-text-muted);
  font-size: 14px;
  margin: 0;

  & .pi {
    font-size: 13px;
  }
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: white;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 16px rgba(30, 27, 75, 0.07);
  border: 1px solid #ede9fe;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gym-accent);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 18px;

  & .pi {
    font-size: 15px;
  }
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.info-label {
  font-size: 13px;
  color: var(--gym-text-muted);
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: var(--gym-dark);
  font-weight: 500;
  text-align: right;
  word-break: break-all;

  &--mono {
    font-family: monospace;
    font-size: 12px;
    color: var(--gym-text-muted);
  }
}

/* Balance */
.balance-active {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.balance-visits {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.balance-count {
  font-size: 52px;
  font-weight: 800;
  color: var(--gym-accent);
  line-height: 1;
}

.balance-label {
  font-size: 13px;
  color: var(--gym-text-muted);
  margin-top: 4px;
}

.balance-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  border-radius: 10px;
  font-size: 14px;

  & .pi {
    font-size: 2rem;
  }

  &--expired {
    color: #f59e0b;
    background: #fffbeb;

    & .pi {
      color: #f59e0b;
    }
  }

  &--none {
    color: var(--gym-text-muted);
    background: #f9f8ff;

    & .pi {
      color: #c4b5fd;
    }
  }
}

@media (max-width: 600px) {
  .profile-hero {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
  }

  .hero-name-row {
    justify-content: center;
  }

  .hero-phone {
    justify-content: center;
  }
}
</style>
