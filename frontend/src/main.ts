import { createApp } from 'vue';
import App from './App.vue';
import ToastService from 'primevue/toastservice';
import { createPinia } from 'pinia';
import router from './router';
import i18n from './i18n';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import 'primeicons/primeicons.css';
import './styles/styles.css';

const GymPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{indigo.600}',
          contrastColor: '#ffffff',
          hoverColor: '{indigo.700}',
          activeColor: '{indigo.800}',
        },
        highlight: {
          background: '{indigo.50}',
          focusBackground: '{indigo.100}',
          color: '{indigo.700}',
          focusColor: '{indigo.800}',
        },
      },
    },
  },
});

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: GymPreset,
    options: {
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
});

app.use(ToastService);
app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount('#app');
