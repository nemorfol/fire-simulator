<template>
  <div class="card mt-6">
    <h3 class="card-title">3. Ottimizzazione Strategica</h3>
    <div class="p-4 bg-gray-50 rounded-lg">
      <p class="text-sm text-gray-600 mb-4">
        Questa funzionalità calcola la riduzione percentuale minima necessaria per le tue spese ricorrenti al fine di raggiungere il tuo "Numero FIRE" entro la fine del periodo di simulazione.
      </p>
      <div class="flex items-center gap-4">
        <button @click="handleOptimize" class="btn btn-accent" :disabled="isLoading">
          <span v-if="isLoading">Ottimizzazione in corso...</span>
          <span v-else>Trova Riduzione Spese Ottimale</span>
        </button>
      </div>

      <div v-if="result" class="mt-4 p-4 border rounded-md" :class="result.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'">
        <h4 class="font-bold text-lg" :class="result.success ? 'text-green-800' : 'text-red-800'">Risultato dell'Ottimizzazione</h4>
        <p class="mt-2 text-gray-700">{{ result.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true,
  },
  result: {
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['run-optimization']);

function handleOptimize() {
  emit('run-optimization');
}
</script>
