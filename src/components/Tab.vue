<template>
  <div v-show="isActive" class="tab-content">
    <slot></slot>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});

// Inietta lo stato condiviso dal genitore
const activeTabTitle = inject('activeTabTitle');

// Determina se questo tab è attivo tramite una computed property
const isActive = computed(() => props.title === activeTabTitle.value);
</script>

<style scoped>
.tab-content {
  padding: 20px;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 8px 8px;
  background-color: #fff;
}
</style>
