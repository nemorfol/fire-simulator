<script setup>
import { defineProps, computed, defineEmits } from 'vue';
import NetWorthChart from './NetWorthChart.vue';
import DebtChart from './DebtChart.vue';
import TaxImpactChart from './TaxImpactChart.vue';
import SavingsRateChart from './SavingsRateChart.vue';
import { 
  esportaPatrimonioNettoExcel, 
  esportaDebitiExcel, 
  esportaImpattoFiscaleExcel, 
  esportaTassoRisparmioExcel 
} from '../services/dataManagementService';

const props = defineProps({
  simMode: {
    type: String,
    required: true,
  },
  numeroFIRE: {
    type: Number,
    required: true,
  },
  datiFIRE: {
    type: Object,
    default: null,
  },
  formatterValuta: {
    type: Object,
    required: true,
  },
  simulationResults: {
    type: Array,
    required: true,
  },
  formInputs: {
    type: Object,
    required: true,
  },
  mostraNotifica: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(['view-details']);
</script>

<template>
  <div id="fire-dashboard" class="card bg-teal-50 border-2 border-teal-200">
    <h3 class="card-title">
      Dashboard Obiettivo F.I.R.E. ({{
        simMode === "backtest"
          ? "Backtest Storico"
          : "Deterministica"
      }})
    </h3>
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center"
    >
      <div>
        <p class="text-sm text-gray-600">Numero FIRE</p>
        <p class="text-2xl font-bold text-teal-700">
          {{ formatterValuta.format(numeroFIRE) }}
        </p>
      </div>
      <template v-if="datiFIRE">
        <div>
          <p class="text-sm text-gray-600">Obiettivo Raggiunto</p>
          <p class="text-2xl font-bold text-green-600">
            Anno {{ datiFIRE.anno }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Et Ritiro Prevista</p>
          <p class="text-2xl font-bold text-green-600">
            {{ datiFIRE.eta }} anni
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Capitale al Ritiro</p>
          <p class="text-2xl font-bold text-green-600">
            {{ formatterValuta.format(datiFIRE.capitaleFinale) }}
          </p>
        </div>
      </template>
      <div v-else class="md:col-span-3">
        <p class="text-sm text-gray-600">Obiettivo Raggiunto</p>
        <p class="text-2xl font-bold text-red-600">
          Non raggiunto in questa simulazione
        </p>
      </div>
    </div>
    <div class="text-center mt-4">
      <button @click="emit('view-details')" class="btn btn-primary">
        Visualizza Dettagli Simulazione
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
    <div class="card bg-white border-2 border-gray-200">
      <NetWorthChart :simulationResults="simulationResults" />
      <button @click="esportaPatrimonioNettoExcel(simulationResults, mostraNotifica)" class="btn btn-secondary mt-2">Esporta in Excel</button>
    </div>
    <div class="card bg-white border-2 border-gray-200">
      <DebtChart :simulationResults="simulationResults" :formInputs="formInputs" />
      <button @click="esportaDebitiExcel(simulationResults, formInputs, mostraNotifica)" class="btn btn-secondary mt-2">Esporta in Excel</button>
    </div>
    <div class="card bg-white border-2 border-gray-200">
      <TaxImpactChart :simulationResults="simulationResults" />
      <button @click="esportaImpattoFiscaleExcel(simulationResults, mostraNotifica)" class="btn btn-secondary mt-2">Esporta in Excel</button>
    </div>
    <div class="card bg-white border-2 border-gray-200">
      <SavingsRateChart :simulationResults="simulationResults" />
      <button @click="esportaTassoRisparmioExcel(simulationResults, mostraNotifica)" class="btn btn-secondary mt-2">Esporta in Excel</button>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per FireDashboard.vue */
</style>
