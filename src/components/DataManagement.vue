<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  saveScenarioBtnDisabled: Boolean,
  resetScenarioBtnHidden: Boolean,
});

const emit = defineEmits(['import-csv', 'export-csv', 'save-scenario', 'reset-scenario']);

const csvImporter = ref(null);

function triggerCsvImport() {
  csvImporter.value.click();
}

function handleFileChange(event) {
  emit('import-csv', event);
}

function handleExportCsv() {
  emit('export-csv');
}

function handleSaveScenario() {
  emit('save-scenario');
}

function handleResetScenario() {
  emit('reset-scenario');
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">5. Gestione Dati e Scenari</h3>
    <div class="flex flex-wrap items-center gap-4">
      <button @click="triggerCsvImport()" class="btn btn-secondary">
        Importa da CSV
      </button>
      <input
        type="file"
        id="csvImporter"
        ref="csvImporter"
        class="hidden"
        accept=".csv"
        @change="handleFileChange"
      />
      <button @click="handleExportCsv()" class="btn btn-secondary">
        Esporta in CSV
      </button>
      <button
        id="save-scenario-btn"
        @click="handleSaveScenario()"
        class="btn btn-secondary"
        :disabled="saveScenarioBtnDisabled"
      >
        Fissa come Scenario A
      </button>
      <button
        id="reset-scenario-btn"
        @click="handleResetScenario()"
        class="btn btn-danger"
        :class="{ hidden: resetScenarioBtnHidden }"
      >
        Reset Confronto
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per DataManagement.vue */
</style>
