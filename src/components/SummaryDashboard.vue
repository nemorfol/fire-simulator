<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  simMode: {
    type: String,
    required: true
  },
  numeroFIRE: {
    type: Number,
    default: 0
  },
  datiFIRE: {
    type: Object,
    default: null
  },
  monteCarloSummaryResults: {
    type: Object,
    default: null
  },
  ultimoRisultato: {
    type: Array,
    default: () => []
  },
  formatterValuta: {
    type: Object,
    required: true
  }
});

const capitaleFinaleSimulazione = computed(() => {
  if (props.ultimoRisultato && props.ultimoRisultato.length > 0) {
    return props.ultimoRisultato[props.ultimoRisultato.length - 1].capitaleFinale;
  }
  return 0;
});

const etaFinaleSimulazione = computed(() => {
  if (props.ultimoRisultato && props.ultimoRisultato.length > 0) {
    return props.ultimoRisultato[props.ultimoRisultato.length - 1].eta;
  }
  return 0;
});

const statoRaggiungimentoFIRE = computed(() => {
  if (props.simMode === 'montecarlo') {
    return null; // Non applicabile direttamente per Monte Carlo
  }
  if (props.datiFIRE) {
    return `Raggiunto a ${props.datiFIRE.eta} anni`;
  }
  return 'Non Raggiunto';
});

const probSuccessoMonteCarlo = computed(() => {
  if (props.simMode === 'montecarlo' && props.monteCarloSummaryResults) {
    return `${props.monteCarloSummaryResults.probabilitaSuccesso.toFixed(2)}%`;
  }
  return 'N/A';
});

const etaMediaEsaurimentoMonteCarlo = computed(() => {
  if (props.simMode === 'montecarlo' && props.monteCarloSummaryResults && props.monteCarloSummaryResults.etaMediaEsaurimento) {
    return `${props.monteCarloSummaryResults.etaMediaEsaurimento.toFixed(0)} anni`;
  }
  return 'N/A';
});
</script>

<template>
  <div class="card bg-blue-50 border-2 border-blue-200 p-6 mb-6">
    <h3 class="text-2xl font-bold text-blue-800 mb-4">Riepilogo Simulazione</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="summary-item">
        <p class="text-blue-600 font-semibold">Modalità Simulazione:</p>
        <p class="text-blue-900 font-bold">{{ simMode.charAt(0).toUpperCase() + simMode.slice(1) }}</p>
      </div>

      <div v-if="simMode !== 'montecarlo'" class="summary-item">
        <p class="text-blue-600 font-semibold">Capitale Finale:</p>
                <p class="text-blue-900 font-bold">{{ formatterValuta.format(capitaleFinaleSimulazione) }} (a {{ etaFinaleSimulazione }} anni)</p>
      </div>

      <div v-if="simMode !== 'montecarlo'" class="summary-item">
        <p class="text-blue-600 font-semibold">Stato FIRE:</p>
        <p class="text-blue-900 font-bold">{{ statoRaggiungimentoFIRE }}</p>
      </div>

      <div v-if="simMode === 'montecarlo'" class="summary-item">
        <p class="text-blue-600 font-semibold">Probabilità di Successo:</p>
        <p class="text-blue-900 font-bold">{{ probSuccessoMonteCarlo }}</p>
      </div>

      <div v-if="simMode === 'montecarlo'" class="summary-item">
        <p class="text-blue-600 font-semibold">Età Media Esaurimento:</p>
        <p class="text-blue-900 font-bold">{{ etaMediaEsaurimentoMonteCarlo }}</p>
      </div>

      <div class="summary-item">
        <p class="text-blue-600 font-semibold">Numero FIRE Target:</p>
        <p class="text-blue-900 font-bold">{{ formatterValuta.format(numeroFIRE) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-item {
  background-color: #e0f2f7; /* Light blue background */
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #b3e5fc; /* Slightly darker blue border */
}
</style>