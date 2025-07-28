<template>
  <div class="tabs-container">
    <ul class="tabs-header">
      <li
        v-for="title in tabs"
        :key="title"
        @click="selectTab(title)"
        :class="{'tab-selected': title === activeTabTitle}"
      >
        {{ title }}
      </li>
    </ul>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, defineProps, watch, defineExpose } from 'vue';

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeTab: String
});

const activeTabTitle = ref(props.activeTab);

const selectTab = (title) => {
  activeTabTitle.value = title;
};

provide('activeTabTitle', activeTabTitle);

watch(() => props.activeTab, (newTab) => {
  if (newTab) {
    activeTabTitle.value = newTab;
  }
});

watch(() => props.tabs, (newTabs) => {
  if (newTabs && !newTabs.includes(activeTabTitle.value)) {
    activeTabTitle.value = newTabs[0];
  }
});

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