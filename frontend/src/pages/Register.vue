<template>
  <div class="register-wrapper">
    <div class="register-left">
      <div class="register-brand">
        <span class="brand-icon-lg"><i class="pi pi-bolt" /></span>
        <span class="brand-name-lg">FitClub</span>
      </div>
      <h1 class="register-hero-title">
        {{ t('register.heroTitle1') }}<br />{{ t('register.heroTitle2') }}
      </h1>
      <p class="register-hero-sub">
        {{ t('register.heroSubtitle') }}
      </p>

      <div class="register-perks">
        <div class="perk-item">
          <i class="pi pi-check-circle" />
          <span>{{ t('register.perk1') }}</span>
        </div>
        <div class="perk-item">
          <i class="pi pi-check-circle" />
          <span>{{ t('register.perk2') }}</span>
        </div>
        <div class="perk-item">
          <i class="pi pi-check-circle" />
          <span>{{ t('register.perk3') }}</span>
        </div>
      </div>
    </div>

    <div class="register-right">
      <div class="register-card">
        <h2 class="register-title">{{ t('register.title') }}</h2>
        <p class="register-subtitle">{{ t('register.subtitle') }}</p>

        <div class="flex flex-col gap-4">
          <div class="w-full">
            <FloatLabel>
              <InputText
                id="identifier"
                v-model="identifier"
                v-bind="identifierAttrs"
                :class="{ 'p-invalid': errors.identifier }"
                class="w-full"
              />
              <label for="identifier">{{ t('register.identifier') }}</label>
            </FloatLabel>
            <small
              class="text-red-500 text-xs mt-1 block"
              :style="{ visibility: errors.identifier ? 'visible' : 'hidden' }"
            >
              {{ errors.identifier }}&nbsp;
            </small>
          </div>

          <div class="w-full">
            <FloatLabel>
              <Password
                id="password"
                v-model="password"
                v-bind="passwordAttrs"
                toggleMask
                :feedback="false"
                :class="{ 'p-invalid': errors.password }"
                class="w-full"
                inputClass="w-full"
              />
              <label for="password">{{ t('register.password') }}</label>
            </FloatLabel>
            <small
              class="text-red-500 text-xs mt-1 block"
              :style="{ visibility: errors.password ? 'visible' : 'hidden' }"
            >
              {{ errors.password }}&nbsp;
            </small>
          </div>

          <Button
            :label="t('register.createAccount')"
            @click="onRegister"
            :loading="loading"
            class="w-full mt-1"
            size="large"
          />

          <div class="text-center">
            <span class="text-gray-500 text-sm">{{ t('register.hasAccount') }} </span>
            <router-link to="/login" class="login-link">{{ t('register.signInLink') }}</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useToast } from 'primevue/usetoast';
import { useForm } from 'vee-validate';
import { registerSchema } from '@/schemas/auth';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import FloatLabel from 'primevue/floatlabel';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: registerSchema,
  initialValues: { identifier: '', password: '' },
});

const [identifier, identifierAttrs] = defineField('identifier', {
  validateOnModelUpdate: false,
});
const [password, passwordAttrs] = defineField('password', {
  validateOnModelUpdate: false,
});

const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const onRegister = handleSubmit(async (values) => {
  loading.value = true;
  try {
    await auth.register(values.identifier, values.password);
    router.push('/login');
  } catch (err: any) {
    const message =
      err?.response?.data?.message || err?.message || t('register.failedDetail');
    toast.add({
      severity: 'error',
      summary: t('register.failed'),
      detail: message,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="postcss">
.register-wrapper {
  display: flex;
  min-height: 100vh;
}

.register-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 56px;
  background: linear-gradient(145deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 320px;
    height: 320px;
    background: radial-gradient(
      circle,
      rgba(99, 102, 241, 0.35) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: -60px;
    width: 240px;
    height: 240px;
    background: radial-gradient(
      circle,
      rgba(99, 102, 241, 0.2) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
}

.register-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.brand-icon-lg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--gym-accent);
  border-radius: 10px;
  color: white;
  font-size: 22px;
}

.brand-name-lg {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.register-hero-title {
  font-size: 44px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  margin: 0 0 18px;
}

.register-hero-sub {
  font-size: 16px;
  color: #a5b4fc;
  line-height: 1.6;
  margin: 0 0 36px;
  max-width: 380px;
}

.register-perks {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.perk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #c7d2fe;
  font-size: 15px;

  & .pi {
    color: var(--gym-accent);
    font-size: 18px;
    flex-shrink: 0;
  }
}

.register-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gym-surface);
  padding: 40px 32px;
}

.register-card {
  width: 100%;
  max-width: 380px;
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 24px rgba(30, 27, 75, 0.1);
}

.register-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gym-dark);
  margin: 0 0 6px;
}

.register-subtitle {
  color: var(--gym-text-muted);
  font-size: 14px;
  margin: 0 0 28px;
}

.login-link {
  color: var(--gym-accent);
  font-weight: 600;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
    color: var(--gym-accent-hover);
  }
}

@media (max-width: 768px) {
  .register-wrapper {
    flex-direction: column;
  }

  .register-left {
    padding: 40px 28px;
    flex: none;
  }

  .register-hero-title {
    font-size: 30px;
  }

  .register-right {
    width: 100%;
    padding: 32px 20px;
  }
}
</style>
