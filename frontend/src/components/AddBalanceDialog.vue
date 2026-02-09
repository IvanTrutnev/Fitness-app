<template>
  <Dialog
    :visible="visible"
    :style="{ width: '500px' }"
    header="Add Balance"
    :modal="true"
    class="p-fluid"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="dialog-content">
      <div class="field">
        <label for="user" class="field-label">User</label>
        <div class="user-info">
          <img
            v-if="user?.avatarUrl"
            :src="user.avatarUrl"
            alt="avatar"
            class="user-avatar-small"
          />
          <span class="user-email">{{ user?.email }}</span>
        </div>
      </div>

      <div class="field">
        <label for="visits" class="field-label required">Visits</label>
        <InputNumber
          class="w-full"
          id="visits"
          v-model="form.visits"
          :min="1"
          :max="100"
          placeholder="Number of visits"
          :invalid="!form.visits || form.visits <= 0"
        />
        <small class="field-help">Number of gym visits to add</small>
      </div>

      <div class="field">
        <label for="dueDate" class="field-label required">Due Date</label>
        <Calendar
          id="dueDate"
          v-model="form.dueDate"
          :minDate="new Date()"
          dateFormat="dd/mm/yy"
          :showIcon="true"
          placeholder="Select expiration date"
          class="w-full"
          :invalid="!form.dueDate"
        />
        <small class="field-help">When the balance expires</small>
      </div>

      <div class="field">
        <label for="price" class="field-label">Price (optional)</label>
        <InputNumber
          id="price"
          v-model="form.price"
          mode="currency"
          currency="RUB"
          locale="ru-RU"
          placeholder="0.00"
          class="w-full"
        />
        <small class="field-help">Cost of the balance package</small>
      </div>

      <div class="field">
        <label for="notes" class="field-label">Notes (optional)</label>
        <Textarea
          id="notes"
          v-model="form.notes"
          placeholder="Additional notes or comments..."
          :rows="3"
          :maxlength="200"
          class="w-full"
        />
        <small class="field-help"
          >{{ form.notes?.length || 0 }}/200 characters</small
        >
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="$emit('update:visible', false)"
          class="p-button-text"
        />
        <Button
          label="Add Balance"
          icon="pi pi-check"
          @click="submitBalance"
          :loading="loading"
          :disabled="!isFormValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import type { BalanceForm } from '@/types/balance';

interface Props {
  visible: boolean;
  user: any;
  loading?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submit', form: BalanceForm): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const form = ref<BalanceForm>({
  visits: 10,
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
  price: null,
  notes: '',
});

const isFormValid = computed(() => {
  return form.value.visits > 0 && form.value.dueDate;
});

const resetForm = () => {
  form.value = {
    visits: 10,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    price: null,
    notes: '',
  };
};

const submitBalance = () => {
  if (isFormValid.value) {
    emit('submit', { ...form.value });
  }
};

// Reset form when dialog opens
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      resetForm();
    }
  },
);
</script>

<style scoped>
.dialog-content {
  padding: 0.5rem 0;
}

.field {
  margin-bottom: 8px;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.field-label.required::after {
  content: ' *';
  color: var(--red-500);
}

.field-help {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 0.5rem;
  border: 1px solid var(--surface-200);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-email {
  font-weight: 500;
  color: var(--text-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .user-info {
    background: var(--surface-800);
    border-color: var(--surface-700);
  }
}
</style>
