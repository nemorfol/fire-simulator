<script setup>
import { ref } from 'vue';

const showGuideContent = ref(false);

function toggleGuide() {
  showGuideContent.value = !showGuideContent.value;
}
</script>

<template>
  <div class="card">
    <button
      @click="toggleGuide()"
      class="w-full flex justify-between items-center text-left p-0.5 rounded-md hover:bg-gray-100 transition-colors duration-200 text-xs"
    >
      <h3 class="card-title mb-0 text-xs">Guida Rapida al Simulatore</h3>
      <svg
        :class="{ 'rotate-180': showGuideContent }"
        class="w-2.5 h-2.5 text-gray-500 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>
    <div
      id="guide-content"
      v-show="showGuideContent"
      class="mt-4 text-gray-700 font-medium space-y-4"
    >
      <h4 class="text-lg font-bold text-gray-800">Funzionalit Principali</h4>
      <ul class="list-disc list-inside ml-4 space-y-2 mt-2">
        <li>
          <strong>Asset Allocation:</strong> Definisci un portafoglio
          realistico specificando diverse classi di asset con le loro quote,
          rendimenti e rischi.
        </li>
        <li>
          <strong>Modalit di Simulazione:</strong> Scegli tra
          <strong>Deterministica</strong>,
          <strong>Monte Carlo</strong> (analisi probabilistica) e
          <strong>Backtest Storico</strong>. In modalit Backtest, se attivi la
          "Fase di Ritiro", verr eseguito uno
          <strong>Stress Test</strong> automatico per valutare la resilienza
          del tuo piano contro i peggiori periodi storici.
        </li>
        <li>
          <strong>Confronto Scenari:</strong> Salva una simulazione come
          "Scenario A", modifica i parametri e lanciala di nuovo per
          confrontare visivamente due strategie. Oltre al grafico, apparir una
          dashboard dedicata al confronto.
        </li>
        <li>
          <strong>Fase di Ritiro:</strong> Simula la fase di "decumulo"
          impostando un'eta di ritiro e scegliendo tra diverse strategie di
          prelievo per testare la sostenibilit del tuo capitale.
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per SimulatorGuide.vue */
</style>
