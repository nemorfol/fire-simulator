<template>
  <div class="tabs-container">
    <ul class="tabs-header">
      <li
        v-for="tab in tabs"
        :key="tab.title"
        @click="selectTab(tab.title)"
        :class="{'tab-selected': tab.title === activeTabTitle}"
      >
        {{ tab.title }}
      </li>
    </ul>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, defineProps, watch, defineExpose } from 'vue';

const tabs = ref([]);
const activeTabTitle = ref('');

const props = defineProps({
  activeTab: String
});

const selectTab = (title) => {
  activeTabTitle.value = title;
};

// Fornisce il titolo del tab attivo ai componenti figli
provide('activeTabTitle', activeTabTitle);

// Permette ai componenti figli di registrarsi
const addTab = (tab) => {
  tabs.value.push(tab);
};
provide('addTab', addTab);


onMounted(() => {
  if (tabs.value.length > 0) {
    // Imposta il primo tab come attivo all'avvio
    activeTabTitle.value = tabs.value[0].title;
  }
});

watch(() => props.activeTab, (newTab) => {
  if (newTab) {
    selectTab(newTab);
  }
});

// Esponi la funzione al componente genitore
defineExpose({
  selectTab
});
</script>

<style scoped>
.tabs-container {
  margin-top: 20px;
}

.tabs-header {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #ddd;
}

.tabs-header li {
  padding: 10px 15px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  margin-bottom: -1px; /* Per sovrapporre il bordo inferiore */
  border-radius: 8px 8px 0 0;
  background-color: #f0f0f0;
}

.tabs-header li:hover {
  background-color: #e0e0e0;
}

.tabs-header li.tab-selected {
  background-color: #fff;
  border-color: #ddd;
  border-bottom-color: #fff; /* Nasconde il bordo inferiore quando selezionato */
  font-weight: bold;
}
</style>