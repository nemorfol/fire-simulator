<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  risultatiHeader: {
    type: Array,
    required: true,
  },
  risultatiBody: {
    type: Array,
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
  etaRitiro: {
    type: Number,
    required: true,
  },
  fullResults: {
    type: Array,
    required: true,
  },
});

const sortKey = ref('anno');
const sortOrder = ref(1); // 1 for ascending, -1 for descending
const searchQuery = ref(''); // New ref for search query

const sortedRisultatiBody = computed(() => {
  if (!props.risultatiBody || props.risultatiBody.length === 0) {
    return [];
  }
  return [...props.risultatiBody].sort((a, b) => {
    const valA = a[sortKey.value];
    const valB = b[sortKey.value];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB) * sortOrder.value;
    } else {
      return (valA - valB) * sortOrder.value;
    }
  });
});

const filteredAndSortedRisultatiBody = computed(() => {
  if (!searchQuery.value) {
    return sortedRisultatiBody.value;
  }
  const query = searchQuery.value.toLowerCase();
  return sortedRisultatiBody.value.filter(row => {
    return Object.values(row).some(value => {
      return String(value).toLowerCase().includes(query);
    });
  });
});

function formatHeader(headerKey) {
  const translations = {
    anno: "Anno",
    eta: "Età",
    capitaleIniziale: "Capitale Iniziale",
    entrateLumpSum: "Entrate Una Tantum",
    totaleEntrate: "Totale Entrate",
    usciteLumpSum: "Uscite Una Tantum",
    totaleUscite: "Totale Uscite",
    utilePerditaLordo: "Utile/Perdita Lordo",
    impostaReddito: "Imposta Reddito",
    utilePerditaNetto: "Utile/Perdita Netto",
    capitalePreRendimento: "Capitale Pre Rendimento",
    rendimentoLordo: "Rendimento Lordo",
    impostaRendite: "Imposta Rendite",
    rendimentoNetto: "Rendimento Netto",
    capitaleFinale: "Capitale Finale",
    capitaleInizialeReale: "Cap. Iniz. Reale",
    capitaleFinaleReale: "Cap. Finale Reale",
    withdrawalRate: "Prelievo %",
    variazionePercentualeCapitale: "Var. Cap. %",
  };
  return translations[headerKey] || headerKey; // Ritorna la traduzione o la chiave stessa se non trovata
}
function sortBy(key) {
  if (sortKey.value === key) {
    sortOrder.value *= -1; // Invert order if same key
  } else {
    sortKey.value = key;
    sortOrder.value = 1; // Default to ascending for new key
  }
}
</script>

<template>
  <div class="results-table-container">
    <input
      type="text"
      v-model="searchQuery"
      placeholder="Cerca nella tabella..."
      class="mb-4 p-2 border border-gray-300 rounded-md w-full"
    />
    <table class="w-full text-sm">
      <thead class="table-header">
        <tr>
          <th>Azioni</th>
          <th v-for="header in risultatiHeader" :key="header" @click="sortBy(header)">
            {{ formatHeader(header) }}
            <span v-if="sortKey === header">
              {{ sortOrder === 1 ? '▲' : '▼' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody id="risultatiBody">
        <tr
          v-for="(row, rowIndex) in filteredAndSortedRisultatiBody"
          :key="rowIndex"
          class="table-row text-right"
          :class="{
            'fire-goal-row':
              row.anno === (datiFIRE ? datiFIRE.anno : null),
            'retirement-age-row': row.eta === etaRitiro,
            'capital-depleted-row': row.capitaleFinale <= 0 || row.capitaleIniziale <= 0,
          }"
        >
          <td>
            <button @click="$emit('show-sankey', row)" class="btn btn-sm btn-secondary">Sankey</button>
          </td>
          <td
            v-for="(header, colIndex) in risultatiHeader"
            :key="colIndex"
            :class="{
              'text-left font-extrabold': ['anno', 'eta'].includes(header),
              'text-red-600': row[header] < 0 && !['withdrawalRate', 'variazionePercentualeCapitale'].includes(header),
              'text-gray-900': row[header] >= 0 && !['withdrawalRate', 'variazionePercentualeCapitale'].includes(header),
              'bg-red-300': header === 'capitaleFinale' && row[header] <= 0,
            }"
          >
            <template v-if="['capitaleIniziale', 'totaleEntrate', 'totaleUscite', 'prelievo', 'utilePerditaLordo', 'impostaReddito', 'impostaRendite', 'utilePerditaNetto', 'capitalePreRendimento', 'rendimentoLordo', 'rendimentoNetto', 'capitaleFinale', 'capitaleInizialeReale', 'capitaleFinaleReale'].includes(header)">
              {{ formatterValuta.format(row[header]) }}
            </template>
            <template v-else-if="['withdrawalRate', 'variazionePercentualeCapitale'].includes(header)">
              {{ row[header].toFixed(2) }}%
            </template>
            <template v-else>
              {{ row[header] }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Stili specifici per AnnualDetailTable.vue */
.results-table-container tbody tr.fire-goal-row td {
  background-color: #d1fae5 !important; /* Tailwind's green-100 */
  font-weight: bold;
}
.results-table-container tbody tr.retirement-age-row td {
  background-color: #bfdbfe !important; /* Tailwind's blue-200 */
  font-weight: bold;
}
.results-table-container tbody tr.capital-depleted-row td {
  background-color: #fecaca !important; /* Tailwind's red-200 */
  font-weight: bold;
}
.results-table-container tbody tr.capital-depleted-row td.bg-red-300 {
  background-color: #fca5a5 !important; /* Tailwind's red-300 */
}
</style>
