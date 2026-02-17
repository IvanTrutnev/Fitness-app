<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="Add Visit"
    :closable="false"
    :style="{ width: '500px', minWidth: '300px' }"
  >
    <form @submit.prevent="handleSubmit" class="visit-form">
      <div class="form-row">
        <label for="user">User*</label>
        <span>{{ userEmail }}</span>
      </div>

      <div class="form-row">
        <label for="trainer">Trainer</label>
        <Select
          v-model="form.trainerId"
          :options="trainers"
          optionLabel="email"
          optionValue="_id"
          placeholder="Select trainer (optional)"
          :disabled="loading"
          style="width: 100%"
        />
      </div>

      <div class="form-row">
        <label for="date">Date*</label>
        <DatePicker
          v-model="form.date"
          dateFormat="dd/mm/yy"
          :disabled="loading"
          style="width: 100%"
          :max-date="new Date()"
        />
      </div>

      <div class="form-row">
        <label for="price">Price (₽)</label>
        <InputNumber
          v-model="form.price"
          :disabled="loading"
          mode="currency"
          currency="RUB"
          locale="ru-RU"
          :min="0"
          style="width: 100%"
        />
      </div>

      <div class="form-row">
        <label for="notes">Notes</label>
        <Textarea
          v-model="form.notes"
          :disabled="loading"
          rows="3"
          style="width: 100%"
        />
      </div>

      <div class="form-row checkbox-row">
        <Checkbox
          v-model="form.useBalance"
          :disabled="loading || !user?.activeBalance"
          binary
        />
        <label for="useBalance" class="checkbox-label">
          Use balance
          <span v-if="user?.activeBalance" class="balance-info">
            (available: {{ user.activeBalance.visits }} visits)
          </span>
          <span v-else class="no-balance">(no balance)</span>
        </label>
      </div>

      <div class="form-actions">
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="handleCancel"
          :disabled="loading"
        />
        <Button
          label="Add Visit"
          icon="pi pi-check"
          type="submit"
          :loading="loading"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import api from '@/lib/api';
import { UserRole } from '@/constants/user';
import type { VisitForm } from '@/types/visit';

interface Props {
  visible: boolean;
  user: any;
  loading?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submit', form: VisitForm): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const trainers = ref<any[]>([]);

const form = ref<VisitForm>({
  userId: '',
  trainerId: undefined,
  date: new Date(),
  price: null,
  notes: '',
  useBalance: false,
});

const userEmail = computed(() => props.user?.email || '-');

watch(
  () => props.visible,
  (newValue) => {
    if (newValue && props.user) {
      resetForm();
    }
  }
);

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.value.userId = newUser._id;
    }
  }
);

const resetForm = () => {
  form.value = {
    userId: props.user?._id || '',
    trainerId: undefined,
    date: new Date(),
    price: null,
    notes: '',
    useBalance: false,
  };
};

const loadTrainers = async () => {
  try {
    const response = await api.get('/users', {
      params: { role: UserRole.TRAINER },
    });
    trainers.value = response.data;
  } catch (error) {
    console.error('Failed to load trainers:', error);
  }
};

const handleSubmit = () => {
  emit('submit', form.value);
};

const handleCancel = () => {
  emit('update:visible', false);
};

onMounted(() => {
  loadTrainers();
});
</script>

<style scoped>
.visit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-row {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.checkbox-label {
  margin: 0;
  font-size: 14px;
}

.balance-info {
  color: #2563eb;
  font-size: 12px;
}

.no-balance {
  color: #9ca3af;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

label {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}
</style>