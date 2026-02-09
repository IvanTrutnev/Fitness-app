<template>
  <div class="p-fluid p-formgrid p-grid">
    <h2>Register</h2>
    <div class="p-field p-col-12">
      <InputText v-model="email" placeholder="Email" />
    </div>
    <div class="p-field p-col-12">
      <Password v-model="password" placeholder="Password" toggleMask />
    </div>
    <div class="p-col-12">
      <Button label="Register" @click="onRegister" />
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

const email = ref('');
const password = ref('');
const router = useRouter();
const auth = useAuthStore();

const onRegister = async () => {
  try {
    await auth.register(email.value, password.value);
    router.push('/login');
  } catch (err) {
    console.error('Register failed', err);
  }
};
</script>
