<script setup>
import { defineProps, defineEmits, watch, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const localFormInputs = ref(props.modelValue);

watch(localFormInputs, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });

const showMonteCarloParams = ref(localFormInputs.value.simMode === 'montecarlo');
const showFaseRitiroParams = ref(localFormInputs.value.isRetirement);

watch(() => localFormInputs.value.simMode, (newMode) => {
  showMonteCarloParams.value = newMode === 'montecarlo';
});

watch(() => localFormInputs.value.isRetirement, (isRetirement) => {
  showFaseRitiroParams.value = isRetirement;
});

const showPercentualePrelievo = ref(localFormInputs.value.strategiaPrelievo === 'percentualeCostante');

watch(() => localFormInputs.value.strategiaPrelievo, (newStrategy) => {
  showPercentualePrelievo.value = newStrategy === 'percentualeCostante';
});

</script>

<template>
  <div class="card">
    <h3 class="card-title">1. Impostazioni Generali e di Simulazione</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Riga 1 -->
      <div class="p-2 bg-gray-200 rounded-lg col-span-1 md:col-span-2">
        <label for="sim-mode" class="block text-center font-bold mb-2">Modalità Simulazione</label>
        <select id="sim-mode" class="w-full" v-model="localFormInputs.simMode">
          <option value="deterministic">Deterministica</option>
          <option value="montecarlo">Monte Carlo</option>
          <option value="backtest">Backtest Storico</option>
        </select>
      </div>
      <div
        class="p-2 bg-gray-200 rounded-lg col-span-1 md:col-span-2 flex items-center justify-center space-x-4"
      >
        <span class="font-bold text-gray-700">Accumulo</span>
        <div class="flex flex-col items-center">
          <span class="font-bold text-teal-700">Fase di Ritiro</span>
          <label
            for="retirement-toggle"
            class="relative inline-flex items-center cursor-pointer mt-1"
          >
            <input
              type="checkbox"
              id="retirement-toggle"
              class="sr-only peer"
              v-model="localFormInputs.isRetirement"
            />
            <div
              class="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600"
            ></div>
          </label>
        </div>
      </div>

      <!-- Riga 2 -->
      <div>
        <label for="etaIniziale" class="block text-sm mb-1">Età Iniziale</label>
        <input
          type="number"
          id="etaIniziale"
          v-model="localFormInputs.etaIniziale"
        />
      </div>
      <div>
        <label for="capitaleIniziale" class="block text-sm mb-1">Capitale Iniziale (€)</label>
        <input
          type="number"
          id="capitaleIniziale"
          v-model="localFormInputs.capitaleIniziale"
        />
      </div>
      <div>
        <label for="tassoInflazione" class="block text-sm mb-1">Inflazione Annuo (%)</label>
        <input
          type="number"
          id="tassoInflazione"
          v-model="localFormInputs.tassoInflazione"
          step="0.1"
        />
      </div>
      <div>
        <label for="regolaFIRE" class="block text-sm mb-1">Regola FIRE (%)</label>
        <input
          type="number"
          id="regolaFIRE"
          v-model="localFormInputs.regolaFIRE"
          step="0.1"
        />
      </div>

      <!-- Riga 3 -->
      <div>
        <label for="tassazioneRendite" class="block text-sm mb-1">Tassazione Rendite (%)</label>
        <input
          type="number"
          id="tassazioneRendite"
          v-model="localFormInputs.tassazioneRendite"
          step="0.1"
        />
      </div>
      <div id="fase-ritiro-params" v-show="showFaseRitiroParams">
        <label for="etaRitiro" class="block text-sm mb-1">Età di Ritiro</label>
        <input
          type="number"
          id="etaRitiro"
          v-model="localFormInputs.etaRitiro"
        />
      </div>
      <div id="costiSanitariPensione-params" v-show="showFaseRitiroParams">
        <label for="costiSanitariPensione" class="block text-sm mb-1">Costi Sanitari Annuo in Pensione (€)</label>
        <input
          type="number"
          id="costiSanitariPensione"
          v-model="localFormInputs.costiSanitariPensione"
          step="100"
        />
      </div>
      <div
        class="col-span-2"
        id="strategia-prelievo-params"
        v-show="showFaseRitiroParams"
      >
        <label for="strategiaPrelievo" class="block text-sm mb-1">Strategia di Prelievo</label>
        <select
          id="strategiaPrelievo"
          v-model="localFormInputs.strategiaPrelievo"
        >
          <option value="regolaFIRE">Regola FIRE (Fisso)</option>
          <option value="percentualeCostante">Percentuale Costante</option>
        </select>
      </div>

      <!-- Riga 4 -->
      <div id="percentuale-prelievo-params" v-show="showPercentualePrelievo">
        <label for="percentualePrelievo" class="block text-sm mb-1">Percentuale di Prelievo (%)</label>
        <input
          type="number"
          id="percentualePrelievo"
          v-model="localFormInputs.percentualePrelievo"
          step="0.1"
        />
      </div>
      <div id="monte-carlo-params" v-show="showMonteCarloParams">
        <label for="numeroSimulazioni" class="block text-sm mb-1">Numero Simulazioni</label>
        <input
          type="number"
          id="numeroSimulazioni"
          v-model="localFormInputs.numeroSimulazioni"
          step="100"
        />
      </div>
      <div>
        <label for="correlazioneAsset" class="block text-sm mb-1">Correlazione Asset 1-2</label>
        <input
          type="number"
          id="correlazioneAsset"
          v-model="localFormInputs.correlazioneAsset"
          step="0.01"
        />
      </div>
      <!-- Le colonne 3 e 4 sono vuote in questa riga -->
    </div>
  </div>
</template>

<style scoped>
/* Puoi aggiungere qui stili specifici per questo componente se necessario */
</style>
