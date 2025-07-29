<script setup>
import { defineProps, defineEmits, computed, ref, watch } from 'vue';
import ExpenseCategoryChart from './ExpenseCategoryChart.vue';
import ExpenseTrendChart from './ExpenseTrendChart.vue';

const props = defineProps({
  usciteRicorrenti: {
    type: Array,
    required: true
  },
  usciteLumpSum: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  'update:usciteRicorrenti',
  'update:usciteLumpSum',
  'expenses-updated'
]);

const selectedYear = ref(new Date().getFullYear()); // Default to current year

const aggregatedExpenseData = computed(() => {
  const data = {};
  const currentYear = new Date().getFullYear();
  
  // Ensure selectedYear.value is a valid number
  const yearToFilter = typeof selectedYear.value === 'number' ? selectedYear.value : new Date().getFullYear();

  props.usciteRicorrenti.forEach(item => {
    if (yearToFilter >= item.inizio && yearToFilter <= item.fine) {
      const category = item.desc || 'Senza Categoria';
      let value = parseFloat(item.valore || 0); // Ensure it's a number

      const combinedRate = (parseFloat(item.incr || 0) / 100) + (parseFloat(item.inflazioneSpecifica || 0) / 100);
      let yearsDiff;

      if (item.isTodayValue) {
        yearsDiff = yearToFilter - new Date().getFullYear();
      } else {
        yearsDiff = yearToFilter - item.inizio;
      }

      if (combinedRate !== 0) {
        value *= Math.pow(1 + combinedRate, yearsDiff);
      }

      if (data[category]) {
        data[category] += value;
      } else {
        data[category] = value;
      }
    }
  });

  return Object.keys(data).map(category => ({
    category: category,
    amount: data[category]
  }));
});

console.log('Aggregated Expense Data (for selected year):', aggregatedExpenseData.value);

const expenseTrendData = computed(() => {
  const currentYear = new Date().getFullYear();
  let minYear = currentYear;
  let maxYear = currentYear + 50; // Default to 50 years in the future

  // Determine the actual min and max years from recurring expenses
  props.usciteRicorrenti.forEach(item => {
    if (item.inizio && item.inizio < minYear) {
      minYear = item.inizio;
    }
    if (item.fine) {
      console.log(`Checking item.fine: ${item.fine}, current maxYear: ${maxYear}`);
      if (item.fine > maxYear) {
        maxYear = item.fine;
        console.log(`maxYear updated to: ${maxYear}`);
      }
    }
  });

  const years = [];
  for (let year = minYear; year <= maxYear; year++) {
    years.push(year);
  }
  console.log('ExpenseTrendData - minYear:', minYear);
  console.log('ExpenseTrendData - maxYear:', maxYear);
  console.log('ExpenseTrendData - years array:', years);

  const categories = [...new Set(props.usciteRicorrenti.map(item => item.desc || 'Senza Categoria'))];
  const colors = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#FFC107', // Amber
    '#F44336', // Red
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
    '#607D8B', // Blue Grey
    '#795548', // Brown
  ];

  const datasets = categories.map((category, index) => ({
    label: category,
    data: years.map(year => {
      let total = 0;
      props.usciteRicorrenti.forEach(item => {
        const itemCategory = item.desc || 'Senza Categoria';
        if (itemCategory === category && year >= item.inizio && year <= item.fine) {
          let value = parseFloat(item.valore || 0); // Ensure it's a number
          const currentYear = new Date().getFullYear();

          const combinedRate = (parseFloat(item.incr || 0) / 100) + (parseFloat(item.inflazioneSpecifica || 0) / 100);
          let yearsDiff;

          if (item.isTodayValue) {
            yearsDiff = year - currentYear;
          } else {
            yearsDiff = year - item.inizio;
          }

          if (combinedRate !== 0) {
            value *= Math.pow(1 + combinedRate, yearsDiff);
          }
          total += value;
        }
      });
      return total;
    }),
    backgroundColor: colors[index % colors.length], // Use consistent color
  }));

  return {
    labels: years,
    datasets: datasets,
  };
});



function addRiga(type, dati = {}) {
  if (type === 'usciteRicorrenti') {
    const newUscite = [...props.usciteRicorrenti, {
      desc: dati.desc || '',
      valore: dati.valore || 0,
      isTodayValue: dati.isTodayValue !== undefined ? dati.isTodayValue : true,
      inizio: dati.inizio || new Date().getFullYear(),
      fine: dati.fine || new Date().getFullYear() + 50,
      incr: dati.incr !== undefined ? dati.incr : null,
      inflazioneSpecifica: dati.inflazioneSpecifica !== undefined ? dati.inflazioneSpecifica : null,
    }];
    emit('update:usciteRicorrenti', newUscite);
    emit('expenses-updated');
  } else if (type === 'usciteLumpSum') {
    const newUscite = [...props.usciteLumpSum, {
      desc: dati.desc || '',
      importo: dati.importo || 0,
      isTodayValue: dati.isTodayValue !== undefined ? dati.isTodayValue : true,
      anno: dati.anno || new Date().getFullYear(),
    }];
    emit('update:usciteLumpSum', newUscite);
  }
}

function removeRiga(type, index) {
  if (type === 'usciteRicorrenti') {
    const newUscite = [...props.usciteRicorrenti];
    newUscite.splice(index, 1);
    emit('update:usciteRicorrenti', newUscite);
    emit('expenses-updated');
  } else if (type === 'usciteLumpSum') {
    const newUscite = [...props.usciteLumpSum];
    newUscite.splice(index, 1);
    emit('update:usciteLumpSum', newUscite);
  }
}

function updateUscitaRicorrente(index, field, value) {
  const newUscite = [...props.usciteRicorrenti];
  if (field === 'valore') {
    const parsedValue = parseFloat(value);
    newUscite[index][field] = isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
  } else if (field === 'incr' || field === 'inflazioneSpecifica') {
    const parsedValue = parseFloat(value);
    newUscite[index][field] = isNaN(parsedValue) ? null : parsedValue; // Allow null if not a valid number
  } else if (field === 'inizio' || field === 'fine') {
    const parsedValue = parseInt(value);
    newUscite[index][field] = isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
  } else {
    newUscite[index][field] = value;
  }
  emit('update:usciteRicorrenti', newUscite);
  if (field === 'valore' || field === 'inizio' || field === 'fine' || field === 'desc') {
    emit('expenses-updated');
  }
}

function updateUscitaLumpSum(index, field, value) {
  const newUscite = [...props.usciteLumpSum];
  if (field === 'importo') {
    const parsedValue = parseFloat(value);
    newUscite[index][field] = isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
  } else if (field === 'anno') {
    const parsedValue = parseInt(value);
    newUscite[index][field] = isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
  } else {
    newUscite[index][field] = value;
  }
  emit('update:usciteLumpSum', newUscite);
}
</script>

<template>
  <div class="card flex flex-col items-center w-full">
    <h3 class="card-title">7. Uscite</h3>
    <div>
      <h4 class="text-lg font-bold mb-3">Uscite Ricorrenti</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[1000px]">
          <thead class="table-header">
            <tr>
              <th>Descrizione</th>
              <th>Valore Annuo (€)</th>
              <th>Valore Odierno?</th>
              <th>Anno Inizio</th>
              <th>Anno Fine</th>
              <th>Incr. (%)</th>
              <th>Inflazione Specifica (%)</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="usciteRicorrenti">
            <tr
              v-for="(uscita, index) in usciteRicorrenti"
              :key="index"
              class="table-row"
            >
              <td>
                <input
                  type="text"
                  class="desc"
                  :value="uscita.desc"
                  @input="updateUscitaRicorrente(index, 'desc', $event.target.value)"
                  list="expense-descriptions"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="valore"
                  :value="uscita.valore"
                  @input="updateUscitaRicorrente(index, 'valore', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  class="isTodayValue"
                  :checked="uscita.isTodayValue"
                  @change="updateUscitaRicorrente(index, 'isTodayValue', $event.target.checked)"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="inizio"
                  :value="uscita.inizio"
                  @input="updateUscitaRicorrente(index, 'inizio', parseInt($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="fine"
                  :value="uscita.fine"
                  @input="updateUscitaRicorrente(index, 'fine', parseInt($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="incr"
                  step="0.1"
                  :value="uscita.incr"
                  @input="updateUscitaRicorrente(index, 'incr', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="inflazioneSpecifica"
                  step="0.1"
                  :value="uscita.inflazioneSpecifica"
                  @input="updateUscitaRicorrente(index, 'inflazioneSpecifica', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <button
                  @click="removeRiga('usciteRicorrenti', index)"
                  class="btn btn-danger btn-sm p-2 leading-none"
                >
                  X
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        @click="addRiga('usciteRicorrenti')"
        class="btn btn-secondary mt-4"
      >
        Aggiungi Uscita
      </button>
    </div>
    <div class="mt-6">
      <h4 class="text-lg font-bold mb-3">Uscite Una Tantum</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="table-header">
            <tr>
              <th>Descrizione</th>
              <th>Importo (€)</th>
              <th>Valore Odierno?</th>
              <th>Anno Spesa</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="usciteLumpSum">
            <tr
              v-for="(uscita, index) in usciteLumpSum"
              :key="index"
              class="table-row"
            >
              <td>
                <input type="text" class="desc" :value="uscita.desc" @input="updateUscitaLumpSum(index, 'desc', $event.target.value)" />
              </td>
              <td>
                <input
                  type="number"
                  class="importo"
                  :value="uscita.importo"
                  @input="updateUscitaLumpSum(index, 'importo', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  class="isTodayValue"
                  :checked="uscita.isTodayValue"
                  @change="updateUscitaLumpSum(index, 'isTodayValue', $event.target.checked)"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="anno"
                  :value="uscita.anno"
                  @input="updateUscitaLumpSum(index, 'anno', parseInt($event.target.value))"
                />
              </td>
              <td>
                <button
                  @click="removeRiga('usciteLumpSum', index)"
                  class="btn btn-danger btn-sm p-2 leading-none"
                >
                  X
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        @click="addRiga('usciteLumpSum')"
        class="btn btn-secondary mt-4"
      >
        Aggiungi Lump Sum
      </button>
    </div>
    <datalist id="expense-descriptions">
      <option value="Affitto/Mutuo"></option>
      <option value="Spese Alimentari"></option>
      <option value="Trasporti"></option>
      <option value="Utenze"></option>
      <option value="Assicurazioni"></option>
      <option value="Intrattenimento"></option>
      <option value="Salute"></option>
      <option value="Istruzione"></option>
      <option value="Abbigliamento"></option>
      <option value="Viaggi"></option>
      <option value="Regali"></option>
      <option value="Manutenzione Casa"></option>
      <option value="Auto"></option>
      <option value="Tasse"></option>
      <option value="Vacanza"></option>
      <option value="Acquisto Auto"></option>
      <option value="Ristrutturazione Casa"></option>
      <option value="Spese Mediche Straordinarie"></option>
    </datalist>
    <div class="mt-6 flex flex-col items-center w-full">
      <h4 class="text-lg font-bold mb-3">Analisi Spese per Categoria (Anno Selezionato: {{ selectedYear }})</h4>
      <ExpenseCategoryChart :expenseData="aggregatedExpenseData" />
    </div>

    <div class="mt-6 flex flex-col items-center w-full">
      <h4 class="text-lg font-bold mb-3">Andamento Spese Ricorrenti nel Tempo</h4>
      <ExpenseTrendChart 
        :labels="expenseTrendData.labels" 
        :datasets="expenseTrendData.datasets"
        @year-selected="selectedYear = $event"
      />
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per ExpenseSection.vue */
</style>