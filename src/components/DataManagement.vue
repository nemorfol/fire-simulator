<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  saveScenarioBtnDisabled: Boolean,
  resetScenarioBtnHidden: Boolean,
});

const emit = defineEmits(['save-scenario', 'reset-scenario']);

const jsonImporter = ref(null);

function triggerJsonImport() {
  jsonImporter.value.click();
}

function handleFileChange(event) {
  emit('import-json', event);
}

function handleExportJson() {
  emit('export-json');
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
