<script setup>
import { defineProps, ref, watch } from 'vue';

const props = defineProps({
  stressTestResult: {
    type: Object,
    default: null,
  },
  formatterValuta: {
    type: Object,
    required: true,
  },
  initialCrisisOptions: {
    type: Object,
    default: () => ({
      enabled: false,
      crashPercentage: -30,
      durationYears: 3,
    }),
  },
});

const emit = defineEmits(['update:initialCrisisOptions']);

const localOptions = ref({ ...props.initialCrisisOptions });

watch(localOptions, (newVal) => {
  emit('update:initialCrisisOptions', newVal);
}, { deep: true });

</script>

<template>
  <div id="stress-test-dashboard" class="card bg-yellow-50 border-2 border-yellow-200">
    <h3 class="card-title">
      Stress Test e Scenari di Crisi
    </h3>

    <!-- Sezione Crisi Iniziale -->
    <div class="mt-4 p-4 border-t-2 border-yellow-200">
      <h4 class="font-semibold text-lg text-yellow-800 mb-2">Scenario Crisi Iniziale</h4>
      <div class="flex items-center space-x-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="localOptions.enabled" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-600"></div>
          <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Abilita</span>
        </label>
      </div>

      <div v-if="localOptions.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label for="crash-percentage" class="block text-sm font-medium text-gray-700">Crollo di Mercato (%)</label>
          <input type="number" id="crash-percentage" v-model.number="localOptions.crashPercentage" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
        <div>
          <label for="duration-years" class="block text-sm font-medium text-gray-700">Durata Crisi (Anni)</label>
          <input type="number" id="duration-years" v-model.number="localOptions.durationYears" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
      </div>
    </div>

    <!-- Sezione Risultati Backtest Storico -->
    <div v-if="stressTestResult" class="mt-4 pt-4 border-t-2 border-yellow-200">
       <h4 class="font-semibold text-lg text-yellow-800 mb-2">Backtest Storico (Sequenza dei Rendimenti)</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-sm text-gray-600">Peggior Anno di Partenza</p>
          <p class="text-2xl font-bold text-yellow-700">
            {{ stressTestResult?.worstStartYear }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Esito del Piano</p>
          <p
            class="text-2xl font-bold"
            :class="
              stressTestResult?.worstFinalCapital > 0
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            {{
              stressTestResult?.worstFinalCapital > 0
                ? "Sopravvissuto"
                : "Fallito"
            }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Capitale Finale Minimo</p>
          <p
            class="text-2xl font-bold"
            :class="
              stressTestResult?.worstFinalCapital > 0
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            {{ formatterValuta.format(stressTestResult?.worstFinalCapital) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili aggiuntivi se necessario */
</style>
