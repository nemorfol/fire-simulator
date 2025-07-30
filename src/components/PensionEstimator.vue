<template>
  <div class="card mt-6">
    <h3 class="card-title">2. Stima Pensione Pubblica (Contributivo)</h3>
    <div class="p-4 bg-blue-50 rounded-lg">
      <p class="text-sm text-gray-600 mb-4">
        Inserisci i dati seguenti per ottenere una stima della tua pensione pubblica e aggiungerla automaticamente alle entrate della simulazione. Il calcolo si basa su un modello semplificato del sistema contributivo.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="initialGrossSalary" class="block text-sm mb-1">Reddito Annuo Lordo Attuale (€)</label>
          <input type="number" id="initialGrossSalary" v-model.number="localInputs.initialGrossSalary" class="w-full" />
        </div>
        <div>
          <label for="contributionStartYear" class="block text-sm mb-1">Anno Inizio Contribuzione</label>
          <input type="number" id="contributionStartYear" v-model.number="localInputs.contributionStartYear" class="w-full" />
        </div>
        <div>
          <label for="salaryGrowthRate" class="block text-sm mb-1">Crescita Annua Stipendio (%)</label>
          <input type="number" id="salaryGrowthRate" v-model.number="localInputs.salaryGrowthRate" class="w-full" step="0.1" />
        </div>
        <div>
          <label for="contributionEndYear" class="block text-sm mb-1">Anno Fine Contribuzione</label>
          <input type="number" id="contributionEndYear" v-model.number="localInputs.contributionEndYear" class="w-full" />
        </div>
      </div>
      <div class="text-center mt-4">
        <button @click="handleEstimate" class="btn btn-info">
          Stima e Aggiungi Pensione
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'estimate-pension']);

const localInputs = reactive({ ...props.modelValue });

watch(localInputs, (newValue) => {
  emit('update:modelValue', newValue);
});

function handleEstimate() {
  emit('estimate-pension', localInputs);
}
</script>
