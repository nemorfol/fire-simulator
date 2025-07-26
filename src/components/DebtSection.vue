<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'add-debt', 'remove-debt']);

function aggiungiDebito(dati = {}) {
  const newDebts = [...props.modelValue];
  newDebts.push({
    desc: "",
    tipoDebito: "Mutuo", // Valore predefinito
    importoIniziale: 0,
    tassoInteresse: 0,
    durataAnni: 0,
    annoInizio: new Date().getFullYear(),
    ...dati
  });
  emit('update:modelValue', newDebts);
}

function rimuoviDebito(index) {
  const newDebts = [...props.modelValue];
  newDebts.splice(index, 1);
  emit('update:modelValue', newDebts);
}

function updateDebitoField(event, index, field) {
  const newDebts = [...props.modelValue];
  let value = event.target.value;

  if (field === 'importoIniziale' || field === 'tassoInteresse' || field === 'durataAnni' || field === 'annoInizio') {
    const parsedValue = parseFloat(value);
    value = isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
  }

  newDebts[index][field] = value;
  emit('update:modelValue', newDebts);
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">4. Gestione Debiti</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="table-header">
          <tr>
            <th>Descrizione</th>
            <th>Tipo Debito</th>
            <th>Importo Iniziale (€)</th>
            <th>Tasso Interesse (%)</th>
            <th>Durata (Anni)</th>
            <th>Anno Inizio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(debito, index) in modelValue" :key="index" class="table-row">
            <td>
              <input type="text" :value="debito.desc" @input="updateDebitoField($event, index, 'desc')" />
            </td>
            <td>
              <select :value="debito.tipoDebito" @change="updateDebitoField($event, index, 'tipoDebito')">
                <option value="Mutuo">Mutuo</option>
                <option value="Prestito Personale">Prestito Personale</option>
                <option value="Carta di Credito">Carta di Credito</option>
                <option value="Altro">Altro</option>
              </select>
            </td>
            <td>
              <input type="number" :value="debito.importoIniziale" @input="updateDebitoField($event, index, 'importoIniziale')" step="100" />
            </td>
            <td>
              <input type="number" :value="debito.tassoInteresse" @input="updateDebitoField($event, index, 'tassoInteresse')" step="0.1" />
            </td>
            <td>
              <input type="number" :value="debito.durataAnni" @input="updateDebitoField($event, index, 'durataAnni')" step="1" />
            </td>
            <td>
              <input type="number" :value="debito.annoInizio" @input="updateDebitoField($event, index, 'annoInizio')" step="1" />
            </td>
            <td>
              <button @click="rimuoviDebito(index)" class="btn btn-danger btn-sm p-2 leading-none">
                X
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-end mt-4">
      <button @click="aggiungiDebito()" class="btn btn-secondary">
        Aggiungi Debito
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per DebtSection.vue */
</style>
