<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  taxBrackets: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:taxBrackets', 'add-bracket', 'remove-bracket']);

function aggiungiScaglione(dati = {}) {
  const newBrackets = [...props.taxBrackets];
  newBrackets.push({ ...dati });
  newBrackets.sort((a, b) => a.finoA - b.finoA); // Keep sorted
  emit('update:taxBrackets', newBrackets);
}

function rimuoviRiga(index) {
  const newBrackets = [...props.taxBrackets];
  newBrackets.splice(index, 1);
  emit('update:taxBrackets', newBrackets);
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">
      2. Impostazioni Fiscali (Scaglioni Progressivi IRPEF)
    </h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="table-header">
          <tr>
            <th>Reddito Fino a (€)</th>
            <th>Aliquota (%)</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tax-brackets-body">
          <tr
            v-for="(bracket, index) in taxBrackets"
            :key="index"
            class="table-row"
          >
            <td>
              <input
                type="text"
                class="tax-limit"
                :value="bracket.finoA === Infinity ? '' : bracket.finoA"
                @input="
                  bracket.finoA =
                    $event.target.value === ''
                      ? Infinity
                      : parseFloat($event.target.value)
                "
              />
            </td>
            <td>
              <input
                type="number"
                class="tax-rate"
                v-model="bracket.aliquota"
                step="0.1"
              />
            </td>
            <td>
              <button
                @click="rimuoviRiga(index)"
                class="btn btn-danger btn-sm p-2 leading-none"
              >
                X
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <button @click="aggiungiScaglione()" class="btn btn-secondary mt-4">
      Aggiungi Scaglione
    </button>
  </div>
</template>

<style scoped>
/* Stili specifici per TaxBrackets.vue */
</style>
