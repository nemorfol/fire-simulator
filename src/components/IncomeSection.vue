<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  entrateRicorrenti: {
    type: Array,
    required: true
  },
  entrateLumpSum: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  'update:entrateRicorrenti',
  'update:entrateLumpSum',
  'add-riga',
  'remove-riga',
  'update-goal-seek-options',
  'toggle-aliquota-sost'
]);

function handleAddRiga(type) {
  emit('add-riga', type);
}

function handleRemoveRiga(type, index) {
  emit('remove-riga', type, index);
}

function handleUpdateGoalSeekOptions() {
  emit('update-goal-seek-options');
}

function handleToggleAliquotaSost(event) {
  emit('toggle-aliquota-sost', event);
}

function updateEntrataRicorrente(index, field, value) {
  const newEntrate = [...props.entrateRicorrenti];
  newEntrate[index][field] = value;
  emit('update:entrateRicorrenti', newEntrate);
}

function updateEntrataLumpSum(index, field, value) {
  const newEntrate = [...props.entrateLumpSum];
  newEntrate[index][field] = value;
  emit('update:entrateLumpSum', newEntrate);
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">6. Entrate</h3>
    <div>
      <h4 class="text-lg font-bold mb-3">Entrate Ricorrenti</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[1200px]">
          <thead class="table-header">
            <tr>
              <th>Descrizione</th>
              <th>Valore Annuo (€)</th>
              <th>Valore Odierno?</th>
              <th>Regime Fiscale</th>
              <th>Aliquota Sost. (%)</th>
              <th>Inizio</th>
              <th>Fine</th>
              <th>Incr. (%)</th>
              <th>In Pensione?</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="entrateRicorrenti">
            <tr
              v-for="(entrata, index) in entrateRicorrenti"
              :key="index"
              class="table-row"
            >
              <td>
                <input
                  type="text"
                  class="desc"
                  :value="entrata.desc"
                  @input="updateEntrataRicorrente(index, 'desc', $event.target.value); handleUpdateGoalSeekOptions()"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="valore"
                  :value="entrata.valore"
                  @input="updateEntrataRicorrente(index, 'valore', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  class="isTodayValue"
                  :checked="entrata.isTodayValue"
                  @change="updateEntrataRicorrente(index, 'isTodayValue', $event.target.checked)"
                />
              </td>
              <td>
                <select
                  class="taxRegime"
                  :value="entrata.taxRegime"
                  @change="updateEntrataRicorrente(index, 'taxRegime', $event.target.value); handleToggleAliquotaSost($event)"
                >
                  <option value="ordinaria">Ordinaria</option>
                  <option value="sostitutiva">Sostitutiva</option>
                  <option value="esente">Esente</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  class="aliquotaSost"
                  :value="entrata.aliquotaSost"
                  @input="updateEntrataRicorrente(index, 'aliquotaSost', parseFloat($event.target.value))"
                  step="0.1"
                  :disabled="entrata.taxRegime !== 'sostitutiva'"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="inizio"
                  :value="entrata.inizio"
                  @input="updateEntrataRicorrente(index, 'inizio', parseInt($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="fine"
                  :value="entrata.fine"
                  @input="updateEntrataRicorrente(index, 'fine', parseInt($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="incr"
                  step="0.1"
                  :value="entrata.incr"
                  @input="updateEntrataRicorrente(index, 'incr', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  class="inPensione"
                  :checked="entrata.inPensione"
                  @change="updateEntrataRicorrente(index, 'inPensione', $event.target.checked)"
                />
              </td>
              <td>
                <button
                  @click="handleRemoveRiga('entrateRicorrenti', index)"
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
        @click="handleAddRiga('entrateRicorrenti')"
        class="btn btn-secondary mt-4"
      >
        Aggiungi Entrata
      </button>
    </div>
    <div class="mt-6">
      <h4 class="text-lg font-bold mb-3">Entrate Una Tantum</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="table-header">
            <tr>
              <th>Descrizione</th>
              <th>Importo (€)</th>
              <th>Valore Odierno?</th>
              <th>Anno Ricezione</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="entrateLumpSum">
            <tr
              v-for="(entrata, index) in entrateLumpSum"
              :key="index"
              class="table-row"
            >
              <td>
                <input type="text" class="desc" :value="entrata.desc" @input="updateEntrataLumpSum(index, 'desc', $event.target.value)" />
              </td>
              <td>
                <input
                  type="number"
                  class="importo"
                  :value="entrata.importo"
                  @input="updateEntrataLumpSum(index, 'importo', parseFloat($event.target.value))"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  class="isTodayValue"
                  :checked="entrata.isTodayValue"
                  @change="updateEntrataLumpSum(index, 'isTodayValue', $event.target.checked)"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="anno"
                  :value="entrata.anno"
                  @input="updateEntrataLumpSum(index, 'anno', parseInt($event.target.value))"
                />
              </td>
              <td>
                <button
                  @click="handleRemoveRiga('entrateLumpSum', index)"
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
        @click="handleAddRiga('entrateLumpSum')"
        class="btn btn-secondary mt-4"
      >
        Aggiungi Lump Sum
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per IncomeSection.vue */
</style>
