import { createApp } from 'vue';
import App from './App.vue';
import ToastService from 'primevue/toastservice';
import { createPinia } from 'pinia';
import router from './router';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import 'primeicons/primeicons.css';
import './styles/styles.css';

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
});

app.use(PrimeVue);
app.use(ToastService);
app.use(createPinia());
app.use(router);

app.mount('#app');
