<template>
  <div class="card">
    <h3 class="card-title">Dashboard di Gestione dei Rischi</h3>
    <p class="mb-6">Valuta la probabilità e l'impatto di ogni rischio sul tuo piano finanziario. I rischi più critici verranno evidenziati nella matrice sottostante.</p>

    <!-- Tabella di Valutazione dei Rischi (Stile Dettaglio Annuale) -->
    <div class="results-table-container">
      <table class="w-full text-sm">
        <thead class="table-header">
          <tr>
            <th class="w-1/4 p-2" style="text-align: center;">Rischio</th>
            <th class="w-2/4 p-2" style="text-align: center;">Descrizione</th>
            <th class="w-1/4 text-left p-2">Probabilità</th>
            <th class="w-1/4 text-left p-2">Impatto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="risk in assessments" :key="risk.id" class="table-row">
            <td class="p-2 font-semibold text-gray-900" style="text-align: center;">{{ risk.name }}</td>
            <td class="p-2 text-gray-600" style="text-align: center;">{{ risk.description }}</td>
            <td class="p-2">
              <select v-model="risk.probability" @change="updateAssessment(risk.id, 'probability', $event.target.value)" class="select-risk w-full" :disabled="risk.id === 'inflation' && isInflationRiskDisabled">
                <option>Basso</option>
                <option>Medio</option>
                <option>Alto</option>
              </select>
            </td>
            <td class="p-2">
              <select v-model="risk.impact" @change="updateAssessment(risk.id, 'impact', $event.target.value)" class="select-risk w-full" :disabled="risk.id === 'inflation' && isInflationRiskDisabled">
                <option>Basso</option>
                <option>Medio</option>
                <option>Alto</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Matrice di Rischio -->
    <div class="mt-8">
      <h4 class="text-lg font-medium text-gray-800 mb-4">Matrice Probabilità / Impatto</h4>
      <div class="flex flex-col border border-gray-300">
        <!-- Header Impatto -->
        <div class="flex">
          <div class="w-1/4 p-2 bg-gray-300 font-bold text-center"></div> <!-- Angolo vuoto -->
          <div class="w-1/4 p-2 bg-gray-200 font-bold text-center">Basso</div>
          <div class="w-1/4 p-2 bg-gray-200 font-bold text-center">Medio</div>
          <div class="w-1/4 p-2 bg-gray-200 font-bold text-center">Alto</div>
        </div>

        <!-- Righe della Matrice -->
        <div v-for="prob in probabilityLevels" :key="prob" class="flex">
          <div class="w-1/4 p-2 bg-gray-200 font-bold flex items-center justify-center">{{ prob }}</div>
          <div v-for="imp in impactLevels" :key="imp" class="w-1/4 h-28 p-2 border-l border-t border-gray-300 flex flex-wrap gap-1 content-start overflow-y-auto" :style="{ backgroundColor: getCellColor(prob, imp) }">
            <span v-for="risk in getRisksForCell(prob, imp)" :key="risk.id" class="badge">
              {{ risk.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { userRiskAssessments, updateRiskAssessment } from '../services/riskService.js';

const props = defineProps({
  inflationScenario: {
    type: String,
    required: true,
  },
});

console.log('[DEBUG] inflationScenario:', props.inflationScenario);

const assessments = ref(userRiskAssessments);

const updateAssessment = (riskId, field, value) => {
  updateRiskAssessment(riskId, field, value);
};

const probabilityLevels = ['Alto', 'Medio', 'Basso'];
const impactLevels = ['Basso', 'Medio', 'Alto'];

const getRisksForCell = (probability, impact) => {
  return assessments.value.filter(r => r.probability === probability && r.impact === impact);
};

const getCellColor = (prob, imp) => {
  if (prob === 'Alto' && imp === 'Alto') return '#ef4444'; // bg-red-500
  if (prob === 'Alto' && imp === 'Medio') return '#f97316'; // bg-orange-500
  if (prob === 'Medio' && imp === 'Alto') return '#f97316'; // bg-orange-500
  if (prob === 'Alto' && imp === 'Basso') return '#facc15'; // bg-yellow-400
  if (prob === 'Basso' && imp === 'Alto') return '#facc15'; // bg-yellow-400
  if (prob === 'Medio' && imp === 'Medio') return '#facc15'; // bg-yellow-400
  return '#4ade80'; // bg-green-400
};

const isInflationRiskDisabled = computed(() => {
  return props.inflationScenario !== 'none';
});

</script>

<style scoped>
.select-risk {
  @apply block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md;
}
.card {
    @apply bg-white shadow-lg rounded-lg p-6 mb-6;
}
.card-title {
    @apply text-xl font-bold text-gray-800 mb-4;
}
.badge {
  @apply inline-block bg-gray-900 bg-opacity-60 text-white text-xs font-semibold rounded-full px-2 py-1;
}
</style>