<template>
  <div class="card mt-6">
    <h3 class="card-title">2. Stima Previdenziale</h3>
    <Tabs :tabs="['Pensione Pubblica', 'Rendita Fondo Pensione']" :active-tab="'Pensione Pubblica'">
      <Tab title="Pensione Pubblica">
        <div class="p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-gray-600 mb-4">
            Inserisci i dati seguenti per ottenere una stima della tua pensione pubblica e aggiungerla automaticamente alle entrate della simulazione. Il calcolo si basa su un modello semplificato del sistema contributivo.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="initialGrossSalary" class="block text-sm mb-1">Reddito Annuo Lordo Attuale (€)</label>
              <input type="number" id="initialGrossSalary" :value="pensionInputs.initialGrossSalary" @input="$emit('update:pensionInputs', { ...pensionInputs, initialGrossSalary: $event.target.value })" class="w-full" />
            </div>
            <div>
              <label for="contributionStartYear" class="block text-sm mb-1">Anno Inizio Contribuzione</label>
              <input type="number" id="contributionStartYear" :value="pensionInputs.contributionStartYear" @input="$emit('update:pensionInputs', { ...pensionInputs, contributionStartYear: $event.target.value })" class="w-full" />
            </div>
            <div>
              <label for="salaryGrowthRate" class="block text-sm mb-1">Crescita Annua Stipendio (%)</label>
              <input type="number" id="salaryGrowthRate" :value="pensionInputs.salaryGrowthRate" @input="$emit('update:pensionInputs', { ...pensionInputs, salaryGrowthRate: $event.target.value })" class="w-full" step="0.1" />
            </div>
            <div>
              <label for="contributionEndYear" class="block text-sm mb-1">Anno Fine Contribuzione</label>
              <input type="number" id="contributionEndYear" :value="pensionInputs.contributionEndYear" @input="$emit('update:pensionInputs', { ...pensionInputs, contributionEndYear: $event.target.value })" class="w-full" />
            </div>
          </div>
          <div class="text-center mt-4">
            <button @click="$emit('estimate-pension')" class="btn btn-info">
              Stima e Aggiungi Pensione Pubblica
            </button>
          </div>
        </div>
      </Tab>
      <Tab title="Rendita Fondo Pensione">
        <div class="p-4 bg-green-50 rounded-lg">
           <p class="text-sm text-gray-600 mb-4">
            Inserisci i dati del tuo fondo pensione per stimare la rendita annua netta e aggiungerla alle entrate.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="currentCapital" class="block text-sm mb-1">Montante Attuale (€)</label>
              <input type="number" id="currentCapital" :value="pensionFundInputs.currentCapital" @input="$emit('update:pensionFundInputs', { ...pensionFundInputs, currentCapital: $event.target.value })" class="w-full" />
            </div>
            <div>
              <label for="annualContribution" class="block text-sm mb-1">Versamento Annuo Previsto (€)</label>
              <input type="number" id="annualContribution" :value="pensionFundInputs.annualContribution" @input="$emit('update:pensionFundInputs', { ...pensionFundInputs, annualContribution: $event.target.value })" class="w-full" />
            </div>
            <div>
              <label for="contributionYears" class="block text-sm mb-1">Anni di Versamento Residui</label>
              <input type="number" id="contributionYears" :value="pensionFundInputs.contributionYears" @input="$emit('update:pensionFundInputs', { ...pensionFundInputs, contributionYears: $event.target.value })" class="w-full" />
            </div>
            <div>
              <label for="investmentReturn" class="block text-sm mb-1">Rendimento Annuo Stimato (%)</label>
              <input type="number" id="investmentReturn" :value="pensionFundInputs.investmentReturn" @input="$emit('update:pensionFundInputs', { ...pensionFundInputs, investmentReturn: $event.target.value })" class="w-full" step="0.1" />
            </div>
             <div>
              <label for="conversionRate" class="block text-sm mb-1">Coefficiente di Conversione (%)</label>
              <input type="number" id="conversionRate" :value="pensionFundInputs.conversionRate" @input="$emit('update:pensionFundInputs', { ...pensionFundInputs, conversionRate: $event.target.value })" class="w-full" step="0.1" />
            </div>
            <div>
              <label for="nonDeductedContributionRate" class="block text-sm mb-1">Quota Contributi non Dedotti (%)</label>
              <input type="number" id="nonDeductedContributionRate" :value="pensionFundInputs.nonDeductedContributionRate" @input="$emit('update:pensionFundInputs', { ...pensionFundInputs, nonDeductedContributionRate: $event.target.value })" class="w-full" step="1" />
            </div>
          </div>
          <div class="text-center mt-4">
            <button @click="$emit('estimate-pension-fund')" class="btn btn-success">
              Stima Rendita Annua
            </button>
          </div>
          <div v-if="pensionAnnuity" class="mt-4 p-4 bg-white rounded-lg shadow-md">
            <h4 class="font-bold text-lg">Risultato Stima:</h4>
            <p><strong>Montante Finale Stimato:</strong> {{ pensionAnnuity.finalCapital.toFixed(2) }} €</p>
            <p><strong>Rendita Annua Lorda:</strong> {{ pensionAnnuity.annualAnnuity.toFixed(2) }} €</p>
            <p class="text-green-600 font-semibold"><strong>Rendita Annua Netta Stimata:</strong> {{ pensionAnnuity.netAnnuity.toFixed(2) }} €</p>
            <p class="text-xs text-gray-500 mt-2">Tassazione stimata ({{ (pensionAnnuity.taxRate * 100).toFixed(0) }}%) su base imponibile di {{ pensionAnnuity.taxableBase.toFixed(2) }} €.</p>
          </div>
        </div>
      </Tab>
    </Tabs>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import Tabs from './Tabs.vue';
import Tab from './Tab.vue';

const props = defineProps({
  pensionInputs: {
    type: Object,
    required: true
  },
  pensionFundInputs: {
    type: Object,
    required: true
  },
  pensionAnnuity: {
    type: Object,
    default: null
  }
});

defineEmits(['update:pensionInputs', 'update:pensionFundInputs', 'estimate-pension', 'estimate-pension-fund']);

</script>
