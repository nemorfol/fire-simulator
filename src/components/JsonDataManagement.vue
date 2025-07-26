<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['import-json', 'export-json']);

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
</script>

<template>
  <div class="flex flex-wrap items-center gap-4 mb-6">
    <button @click="triggerJsonImport()" class="btn btn-secondary">
      Importa Parametri Simulazione
    </button>
    <input
      type="file"
      id="jsonImporter"
      ref="jsonImporter"
      class="hidden"
      style="display: none;"
      accept=".json"
      @change="handleFileChange"
    />
    <button @click="handleExportJson()" class="btn btn-secondary">
      Esporta Parametri Simulazione
    </button>
  </div>
</template>

<style scoped>
/* Stili specifici per JsonDataManagement.vue */
</style>
