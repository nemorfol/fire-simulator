<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  stressTestResult: {
    type: Object,
    default: null,
  },
  formatterValuta: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div
    id="stress-test-dashboard"
    v-if="stressTestResult"
    class="card bg-yellow-50 border-2 border-yellow-200"
  >
    <h3 class="card-title">
      Stress Test: Rischio da Sequenza dei Rendimenti
    </h3>
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
</template>

<style scoped>
/* Stili specifici per StressTestDashboard.vue */
</style>
