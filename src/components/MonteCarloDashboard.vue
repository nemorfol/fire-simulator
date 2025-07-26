<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  simMode: {
    type: String,
    required: true,
  },
  monteCarloSummaryResults: {
    type: Object,
    default: null,
  },
});
</script>

<template>
  <div
    id="monte-carlo-dashboard"
    v-if="simMode === 'montecarlo' && monteCarloSummaryResults"
    class="card bg-blue-50 border-2 border-blue-200"
  >
    <h3 class="card-title">Risultati Simulazione Monte Carlo</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-sm text-gray-600">Probabilit di Successo</p>
        <p class="text-2xl font-bold text-blue-700">
          {{ monteCarloSummaryResults.probabilitaSuccesso.toFixed(2) }}%
        </p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Simulazioni Fallite</p>
        <p class="text-2xl font-bold text-red-700">
          {{ monteCarloSummaryResults.numeroSimulazioniFallite }}
        </p>
      </div>
      <div v-if="monteCarloSummaryResults.etaMediaEsaurimento">
        <p class="text-sm text-gray-600">Et Media Esaurimento (Fallite)</p>
        <p class="text-2xl font-bold text-red-700">
          {{ monteCarloSummaryResults.etaMediaEsaurimento.toFixed(0) }} anni
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per MonteCarloDashboard.vue */
</style>
