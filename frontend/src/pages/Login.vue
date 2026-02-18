<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2 class="login-title text-2xl font-semibold">Login</h2>

      <div class="flex flex-col gap-3 p-2">
        <div class="w-full">
          <FloatLabel>
            <InputText
              id="identifier"
              v-model="identifier"
              :class="{ 'p-invalid': identifierError }"
              @blur="validateIdentifier"
              class="w-full"
            />
            <label for="identifier">Email or Phone</label>
          </FloatLabel>
          <small v-if="identifierError" class="text-red-600"
            >Please enter a valid email address or phone number</small
          >
        </div>

        <div class="w-full">
          <FloatLabel>
            <Password
              id="password"
              v-model="password"
              toggleMask
              :feedback="false"
              :class="{ 'p-invalid': passwordError }"
              @blur="validatePassword"
              class="w-full"
              inputClass="w-full"
            />
            <label for="password">Password</label>
          </FloatLabel>
          <small v-if="passwordError" class="text-red-600"
            >Password is required</small
          >
        </div>

        <div class="w-full">
          <Button
            label="Login"
            @click="onLogin"
            :loading="loading"
            class="p-button-rounded p-button-primary"
            style="width: 100%"
          />
        </div>

        <div class="text-center mt-3">
          <span class="text-gray-600">Don't have an account? </span>
          <router-link to="/register" class="text-blue-600 hover:underline">
            Register here
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import FloatLabel from 'primevue/floatlabel';

const identifier = ref('');
const password = ref('');
const loading = ref(false);
const identifierError = ref(false);
const passwordError = ref(false);

const router = useRouter();
const auth = useAuthStore();

const validateIdentifier = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  identifierError.value =
    !emailRegex.test(identifier.value) && !phoneRegex.test(identifier.value);
};

const validatePassword = () => {
  passwordError.value = password.value.trim().length === 0;
};

const onLogin = async () => {
  validateIdentifier();
  validatePassword();
  if (identifierError.value || passwordError.value) return;

  loading.value = true;
  try {
    await auth.login(identifier.value, password.value);
    router.push('/users');
  } catch (err) {
    console.error('Login failed', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f9f9f9;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  color: #3f51b5;
  margin-bottom: 1.5rem;
}
</style>
