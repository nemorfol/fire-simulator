<script setup>
import { defineProps, defineEmits } from 'vue';
import SimulationSettings from './SimulationSettings.vue';
import RiskManagementDashboard from './RiskManagementDashboard.vue';
import StressTestDashboard from './StressTestDashboard.vue';
import Tab from './Tab.vue';
import Tabs from './Tabs.vue';

const props = defineProps({
  modelValue: Object, // Accetta modelValue per v-model
  stressTestResult: Object,
  formatterValuta: Object,
});

const emit = defineEmits(['update:modelValue', 'calculate-life-expectancy']);

const onCalculateLifeExpectancy = () => {
  emit('calculate-life-expectancy');
};

// Funzione per gestire l'aggiornamento del modello
const updateModel = (newValue) => {
  emit('update:modelValue', newValue);
};
</script>

<template>
  <div>
    <tabs :tabs="['Impostazioni Generali', 'Gestione Rischi', 'Stress Test']">
      <tab title="Impostazioni Generali">
        <SimulationSettings
          :modelValue="props.modelValue"
          @update:modelValue="updateModel"
          @calculate-life-expectancy="onCalculateLifeExpectancy"
        />
      </tab>
      <tab title="Gestione Rischi">
        <RiskManagementDashboard :inflationScenario="props.modelValue?.inflationScenario" />
      </tab>
      <tab title="Stress Test">
        <StressTestDashboard 
          :stressTestResult="props.stressTestResult"
          :formatterValuta="props.formatterValuta"
          v-model:initialCrisisOptions="modelValue.initialCrisisOptions"
        />
      </tab>
    </tabs>
  </div>
</template>
