<script setup>
import { defineProps } from 'vue';

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
  };
  return translations[headerKey] || headerKey; // Ritorna la traduzione o la chiave stessa se non trovata
}
</script>

<template>
  <div class="results-table-container">
    <table class="w-full text-sm">
      <thead class="table-header">
        <tr>
          <th>Azioni</th>
          <th v-for="header in risultatiHeader" :key="header">
            {{ formatHeader(header) }}
          </th>
        </tr>
      </thead>
      <tbody id="risultatiBody">
        <tr
          v-for="(row, rowIndex) in risultatiBody"
          :key="rowIndex"
          class="table-row text-right"
          :class="{
            'fire-goal-row':
              row.anno === (datiFIRE ? datiFIRE.anno : null),
            'bg-red-200': row.capitaleIniziale <= 0,
          }"
        >
          <td>
            <button @click="$emit('show-sankey', row)" class="btn btn-sm btn-secondary">Sankey</button>
          </td>
          <td class="text-left font-extrabold">{{ row.anno }}</td>
          <td class="text-left font-extrabold">{{ row.eta }}</td>
          <td
            :class="
              row.capitaleIniziale < 0 ? 'text-red-600' : 'text-gray-900'
            "
          >
            {{ formatterValuta.format(row.capitaleIniziale) }}
          </td>
          <template v-for="(value, key) in row">
            <td
              v-if="!['anno', 'eta', 'capitaleIniziale'].includes(key)"
              :class="value < 0 ? 'text-red-600' : 'text-gray-900'"
            >
              {{
                typeof value === "number"
                  ? formatterValuta.format(value)
                  : value
              }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Stili specifici per AnnualDetailTable.vue */
.results-table-container tbody tr.bg-red-200 td {
  background-color: #fecaca !important; /* Tailwind's red-200 */
}
</style>
