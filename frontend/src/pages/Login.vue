<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2 class="login-title text-2xl font-semibold">Login</h2>

      <div class="flex flex-col gap-3 p-2">
        <div class="w-full">
          <FloatLabel>
            <InputText
              id="email"
              v-model="email"
              :class="{ 'p-invalid': emailError }"
              @blur="validateEmail"
              class="w-full"
            />
            <label for="email">Email</label>
          </FloatLabel>
          <small v-if="emailError" class="text-red-600"
            >Please enter a valid email address</small
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

const email = ref('');
const password = ref('');
const loading = ref(false);
const emailError = ref(false);
const passwordError = ref(false);

const router = useRouter();
const auth = useAuthStore();

const validateEmail = () => {
  emailError.value = !/^\S+@\S+\.\S+$/.test(email.value);
};

const validatePassword = () => {
  passwordError.value = password.value.trim().length === 0;
};

const onLogin = async () => {
  validateEmail();
  validatePassword();
  if (emailError.value || passwordError.value) return;

  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/users');
  } catch (err) {
    console.error('Login failed', err);
    // Можно добавить уведомление об ошибке здесь
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
