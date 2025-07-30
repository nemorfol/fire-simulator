
<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4 text-gray-800">Il Tuo Piano Finanziario Guidato</h2>
    <p class="text-gray-600 mb-6">Questi sono i passi consigliati per raggiungere i tuoi obiettivi finanziari, basati sulla tua situazione attuale.</p>
    
    <div v-if="loading" class="text-center">
      <p>Analizzando i tuoi dati...</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="step in planSteps" :key="step.key" class="border rounded-lg p-4 transition-all" :class="stepStatusClass(step.status)">
        <div class="flex items-start">
          <div class="flex-none w-8 h-8">
            <svg class="financial-plan-icon" :class="stepIconColor(step.status)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="step.status === 'Completato'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-4 flex-grow">
            <h3 class="financial-plan-title font-semibold text-gray-900">{{ step.title }}</h3>
            <p class="financial-plan-description text-gray-600 mt-1">{{ step.description }}</p>
            <p class="financial-plan-details text-gray-800 mt-2" v-html="step.details"></p>
            
            <!-- Barra di Progresso -->
            <div v-if="step.progress !== undefined && step.status !== 'Completato'" class="mt-3">
              <div class="bg-gray-200 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: step.progress + '%' }"></div>
              </div>
            </div>

            <div v-if="step.action" class="mt-4">
              <button @click="handleAction(step.action)" class="text-sm font-medium text-blue-600 hover:text-blue-800">
                {{ step.action.label }} &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';
import { generateFinancialPlan, PlanStepStatus } from '@/services/planningService.js';

const props = defineProps({
  financialData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['scroll-to-section']); // Definisci l'evento personalizzato

const planSteps = ref([]);
const loading = ref(true);

onMounted(() => {
  try {
    planSteps.value = generateFinancialPlan(props.financialData);
  } catch (error) {
    console.error("Errore nella generazione del piano finanziario:", error);
    // Potresti voler mostrare un messaggio di errore all'utente
  } finally {
    loading.value = false;
  }
});

const handleAction = (action) => {
  // Emetti l'intero oggetto action al componente padre
  emit('scroll-to-section', action);
};

const stepStatusClass = (status) => {
  switch (status) {
    case PlanStepStatus.COMPLETED:
      return 'bg-green-50 border-green-200';
    case PlanStepStatus.IN_PROGRESS:
      return 'bg-blue-50 border-blue-200';
    case PlanStepStatus.NOT_STARTED:
      return 'bg-yellow-50 border-yellow-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const stepIconColor = (status) => {
    switch (status) {
    case PlanStepStatus.COMPLETED:
      return 'text-green-500';
    case PlanStepStatus.IN_PROGRESS:
      return 'text-blue-500';
    case PlanStepStatus.NOT_STARTED:
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
}

</script>

<style scoped>
.financial-plan-icon {
  width: 32px !important; /* Dimensione più grande per icone */
  height: 32px !important; /* Dimensione più grande per icone */
}

.financial-plan-title {
  font-size: 1.25rem; /* text-xl */
}

.financial-plan-description,
.financial-plan-details {
  font-size: 1rem; /* text-base */
}

/* Puoi aggiungere altri stili qui se necessario */
</style>
