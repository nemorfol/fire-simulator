<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'calculate-life-expectancy']);

const localFormInputs = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

const showMonteCarloParams = computed(() => localFormInputs.value.simMode === 'montecarlo');
const showFaseRitiroParams = computed(() => localFormInputs.value.isRetirement);
const showPercentualePrelievo = computed(() => {
  return ['percentualeCostante', 'guardrails'].includes(localFormInputs.value.strategiaPrelievo);
});

</script>

<template>
  <div class="card">
    <h3 class="card-title">1. Impostazioni Generali e di Simulazione</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Riga 1 -->
      <div class="p-2 bg-gray-200 rounded-lg col-span-1 md:col-span-2">
        <label for="sim-mode" class="block text-center font-bold mb-2">Modalità Simulazione</label>
        <select id="sim-mode" class="w-full" v-model="localFormInputs.simMode" title="Seleziona la modalità di simulazione: Deterministica per proiezioni fisse, Monte Carlo per analisi di probabilità, Backtest Storico per scenari passati.">
          <option value="deterministic">Deterministica</option>
          <option value="montecarlo">Monte Carlo</option>
          <option value="backtest">Backtest Storico</option>
        </select>
      </div>
      <div class="p-2 bg-gray-200 rounded-lg col-span-1 md:col-span-2" v-show="localFormInputs.simMode !== 'montecarlo'">
        <label for="scenarioCrisi" class="block text-center font-bold mb-2">Scenario di Crisi</label>
        <select id="scenarioCrisi" class="w-full" v-model="localFormInputs.scenarioCrisi" title="Applica uno scenario di crisi storico per testare la resilienza del tuo piano finanziario.">
          <option value="none">Nessuno</option>
          <option value="dotCom">Dot-com Bubble (2000-2002)</option>
          <option value="greatRecession">Grande Recessione (2008-2009)</option>
        </select>
      </div>
      <div class="p-2 bg-gray-200 rounded-lg col-span-1 md:col-span-2">
        <label for="inflationScenario" class="block text-center font-bold mb-2">Scenario Inflazione</label>
        <select id="inflationScenario" class="w-full" v-model="localFormInputs.inflationScenario" title="Seleziona uno scenario di inflazione per testare la resilienza del tuo piano.">
          <option value="none">Tasso Fisso (dal campo sotto)</option>
          <option value="highInflation">Inflazione Alta</option>
          <option value="lowInflation">Inflazione Bassa</option>
          <option value="volatileInflation">Inflazione Volatile</option>
        </select>
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
          title="La percentuale del capitale iniziale che puoi prelevare annualmente senza esaurire i fondi, secondo la regola del 4% (o simile)."
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
          title="La percentuale di tassazione applicata annualmente sui rendimenti del tuo capitale investito."
        />
      </div>
      <div>
        <label for="benchmarkReturn" class="block text-sm mb-1">Rendimento Benchmark (%)</label>
        <input
          type="number"
          id="benchmarkReturn"
          v-model="localFormInputs.benchmarkReturn"
          step="0.1"
          title="Il rendimento annuale medio atteso del benchmark di riferimento (es. 8% per S&P 500)."
        />
      </div>
      <div id="fase-ritiro-params">
        <label for="etaRitiro" class="block text-sm mb-1">Età di Ritiro</label>
        <input
          type="number"
          id="etaRitiro"
          v-model="localFormInputs.etaRitiro"
        />
      </div>
      <div id="costiSanitariPensione-params">
        <label for="costiSanitariPensione" class="block text-sm mb-1">Costi Sanitari Annuo in Pensione (€)</label>
        <input
          type="number"
          id="costiSanitariPensione"
          v-model="localFormInputs.costiSanitariPensione"
          step="100"
        />
      </div>
      <div>
        <label for="gender" class="block text-sm mb-1">Sesso</label>
        <select id="gender" class="w-full" v-model="localFormInputs.gender">
          <option value="male">Maschio</option>
          <option value="female">Femmina</option>
        </select>
      </div>
      <div>
        <label for="longevityPercentile" class="block text-sm mb-1">Percentile Longevità</label>
        <select id="longevityPercentile" class="w-full" v-model="localFormInputs.longevityPercentile">
          <option value="50">50° Percentile (Mediana)</option>
          <option value="75">75° Percentile</option>
          <option value="90">90° Percentile</option>
          <option value="95">95° Percentile</option>
        </select>
      </div>
      <div>
        <label for="etaMassimaSimulazione" class="block text-sm mb-1">Età Massima Simulazione</label>
        <div class="flex items-center">
          <input
            type="number"
            id="etaMassimaSimulazione"
            v-model="localFormInputs.etaMassimaSimulazione"
            class="flex-grow"
          />
          <button @click="$emit('calculate-life-expectancy')" class="btn btn-secondary ml-2">
            Calcola da ISTAT
          </button>
        </div>
      </div>

      <!-- Riga 4 -->
      <div
        class="col-span-2"
        id="strategia-prelievo-params"
      >
        <label for="strategiaPrelievo" class="block text-sm mb-1">Strategia di Prelievo</label>
        <select
          id="strategiaPrelievo"
          v-model="localFormInputs.strategiaPrelievo"
        >
          <option value="regolaFIRE">Regola FIRE (Fisso)</option>
          <option value="percentualeCostante">Percentuale Costante</option>
          <option value="prelievoFissoInflazione">Prelievo Fisso (Aggiustato per Inflazione)</option>
          <option value="vpw">Variable Percentage Withdrawal (VPW)</option>
          <option value="guardrails">Guardrails</option>
        </select>
      </div>
      <div id="percentuale-prelievo-params" v-show="showPercentualePrelievo">
        <label for="percentualePrelievo" class="block text-sm mb-1">Percentuale di Prelievo (%)</label>
        <input
          type="number"
          id="percentualePrelievo"
          v-model="localFormInputs.percentualePrelievo"
          step="0.1"
        />
      </div>
      <div id="guardrails-params" v-show="localFormInputs.strategiaPrelievo === 'guardrails'">
        <div>
          <label for="guardrailUpper" class="block text-sm mb-1">Soglia Superiore (%)</label>
          <input type="number" id="guardrailUpper" v-model="localFormInputs.guardrailUpper" step="1" />
        </div>
        <div>
          <label for="guardrailLower" class="block text-sm mb-1">Soglia Inferiore (%)</label>
          <input type="number" id="guardrailLower" v-model="localFormInputs.guardrailLower" step="1" />
        </div>
      </div>
      <div id="monte-carlo-params" v-show="showMonteCarloParams">
        <label for="numeroSimulazioni" class="block text-sm mb-1">Numero Simulazioni</label>
        <input
          type="number"
          id="numeroSimulazioni"
          v-model="localFormInputs.numeroSimulazioni"
          step="100"
          title="Il numero di simulazioni Monte Carlo da eseguire per calcolare la probabilità di successo del tuo piano finanziario."
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
    </div>
  </div>
</template>

<style scoped>
/* Puoi aggiungere qui stili specifici per questo componente se necessario */
</style>