<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  suggestions: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div
    id="suggestions-card"
    class="card bg-blue-50 border-2 border-blue-200"
  >
    <h3 class="card-title">Analisi e Suggerimenti Strategici</h3>
    <ul class="list-disc list-inside space-y-2 text-gray-800">
      <li
        v-for="(suggestion, index) in suggestions"
        :key="index"
        v-html="suggestion"
      ></li>
    </ul>
  </div>
</template>

<style scoped>
/* Stili specifici per SuggestionsCard.vue */
</style>
