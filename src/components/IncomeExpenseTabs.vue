<template>
  <div>
    <tabs :tabs="['Entrate', 'Uscite']">
    <tab title="Entrate">
      <IncomeSection
        v-model:entrateRicorrenti="formInputs.entrateRicorrenti"
        v-model:entrateLumpSum="formInputs.entrateLumpSum"
        @add-riga="aggiungiRiga"
        @remove-riga="rimuoviRiga"
        @update-goal-seek-options="updateGoalSeekOptions"
        @toggle-aliquota-sost="toggleAliquotaSost"
      />
    </tab>
    <tab title="Uscite">
      <ExpenseSection
        v-model:usciteRicorrenti="formInputs.usciteRicorrenti"
        v-model:usciteLumpSum="formInputs.usciteLumpSum"
        @expenses-updated="updateGoalSeekOptions"
      />
    </tab>
  </tabs>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import IncomeSection from './IncomeSection.vue';
import ExpenseSection from './ExpenseSection.vue';
import Tab from './Tab.vue';
import Tabs from './Tabs.vue';

// Le props e le funzioni passate da App.vue
const props = defineProps({
  formInputs: Object,
  aggiungiRiga: Function,
  rimuoviRiga: Function,
  updateGoalSeekOptions: Function,
  toggleAliquotaSost: Function,
});
</script>

<style scoped>
/* Stili specifici per IncomeExpenseTabs.vue */
</style>