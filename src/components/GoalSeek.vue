<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  goalSeekTarget: {
    type: Number,
    required: true
  },
  goalSeekVariable: {
    type: String,
    default: ''
  },
  goalSeekOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:goalSeekTarget', 'update:goalSeekVariable', 'execute-goal-seek']);

function handleExecuteGoalSeek() {
  emit('execute-goal-seek');
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">4. Ottimizzazione Piano (Goal Seek)</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div>
        <label for="goal-seek-target" class="block text-sm mb-1">Obiettivo: Raggiungere FIRE a (eta)</label>
        <input
          type="number"
          id="goal-seek-target"
          :value="goalSeekTarget"
          @input="emit('update:goalSeekTarget', $event.target.value)"
        />
      </div>
      <div>
        <label for="goal-seek-variable" class="block text-sm mb-1">Modificando:</label>
        <select
          id="goal-seek-variable"
          :value="goalSeekVariable"
          @change="emit('update:goalSeekVariable', $event.target.value)"
        >
          <option disabled value="">Seleziona una voce</option>
          <option
            v-for="option in goalSeekOptions"
            :value="option.value"
            :key="option.value"
          >
            {{ option.text }}
          </option>
        </select>
      </div>
      <button @click="handleExecuteGoalSeek" class="btn btn-primary">
        Trova Soluzione
      </button>
    </div>
  </div>
</template>