<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    // Expected structure: { goalSeekTarget: number, goalSeekVariable: string }
  },
  goalSeekOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'execute-goal-seek']);

const localGoalSeekTarget = computed({
  get: () => props.modelValue.goalSeekTarget,
  set: (value) => emit('update:modelValue', { ...props.modelValue, goalSeekTarget: value })
});

const localGoalSeekVariable = computed({
  get: () => props.modelValue.goalSeekVariable,
  set: (value) => emit('update:modelValue', { ...props.modelValue, goalSeekVariable: value })
});

function handleExecuteGoalSeek() {
  emit('execute-goal-seek');
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">4. Ottimizzazione Piano (Goal Seek)</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div>
        <label for="goal-seek-target" class="block text-sm mb-1"
          >Obiettivo: Raggiungere FIRE a (eta)</label
        ><input
          type="number"
          id="goal-seek-target"
          v-model="localGoalSeekTarget"
        />
      </div>
      <div>
        <label for="goal-seek-variable" class="block text-sm mb-1"
          >Modificando:</label
        ><select
          id="goal-seek-variable"
          v-model="localGoalSeekVariable"
        >
          <option
            v-for="option in goalSeekOptions"
            :value="option.value"
            :key="option.value"
          >
            {{ option.text }}
          </option>
        </select>
      </div>
      <button @click="handleExecuteGoalSeek()" class="btn btn-primary">
        Trova Soluzione
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per GoalSeek.vue */
</style>
