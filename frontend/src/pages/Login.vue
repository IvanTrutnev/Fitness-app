<template>
  <div class="login-wrapper">
    <div class="login-left">
      <div class="login-brand">
        <span class="brand-icon-lg"><i class="pi pi-bolt" /></span>
        <span class="brand-name-lg">FitClub</span>
      </div>
      <h1 class="login-hero-title">Train Hard.<br />Track Smart.</h1>
      <p class="login-hero-sub">
        Manage your gym, members and visits all in one place.
      </p>
    </div>

    <div class="login-right">
      <div class="login-card">
        <h2 class="login-title">Welcome back</h2>
        <p class="login-subtitle">Sign in to your account</p>

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
              <label for="identifier">Email or Phone</label>
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
              <label for="password">Password</label>
            </FloatLabel>
            <small
              class="text-red-500 text-xs mt-1 block"
              :style="{ visibility: errors.password ? 'visible' : 'hidden' }"
            >
              {{ errors.password }}&nbsp;
            </small>
          </div>

          <Button
            label="Sign In"
            @click="onLogin"
            :loading="loading"
            class="w-full mt-1"
            size="large"
          />

          <div class="text-center">
            <span class="text-gray-500 text-sm">Don't have an account? </span>
            <router-link to="/register" class="register-link"
              >Register here</router-link
            >
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
import { loginSchema } from '@/schemas/auth';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import FloatLabel from 'primevue/floatlabel';

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: loginSchema,
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

const onLogin = handleSubmit(async (values) => {
  loading.value = true;
  try {
    await auth.login(values.identifier, values.password);
    router.push('/users');
  } catch (err: any) {
    const message =
      err?.response?.data?.message || err?.message || 'Invalid email or password';
    toast.add({
      severity: 'error',
      summary: 'Login failed',
      detail: message,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.login-wrapper {
  display: flex;
  min-height: 100vh;
}

/* Left panel — dark hero */
.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 56px;
  background: linear-gradient(145deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%);
  position: relative;
  overflow: hidden;
}

.login-left::before {
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

.login-left::after {
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

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 56px;
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

.login-hero-title {
  font-size: 48px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  margin: 0 0 20px;
}

.login-hero-sub {
  font-size: 17px;
  color: #a5b4fc;
  line-height: 1.6;
  margin: 0;
  max-width: 380px;
}

/* Right panel — form */
.login-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gym-surface);
  padding: 40px 32px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gym-dark);
  margin: 0 0 6px;
}

.login-subtitle {
  color: var(--gym-text-muted);
  font-size: 14px;
  margin: 0 0 28px;
}

.register-link {
  color: var(--gym-accent);
  font-weight: 600;
  text-decoration: none;
  font-size: 14px;
}

.register-link:hover {
  text-decoration: underline;
  color: var(--gym-accent-hover);
}

/* Responsive: stack on small screens */
@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
  }

  .login-left {
    padding: 40px 28px;
    flex: none;
  }

  .login-hero-title {
    font-size: 32px;
  }

  .login-right {
    width: 100%;
    padding: 32px 20px;
  }
}
</style>
