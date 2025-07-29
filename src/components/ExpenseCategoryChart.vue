<template>
  <div ref="chart" class="flex justify-center items-center w-full">
    <div v-if="!hasData" class="text-gray-500 text-center p-4">
      Nessuna spesa per la categoria per l'anno selezionato.
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps({
  expenseData: {
    type: Array,
    required: true
  }
});

const chart = ref(null);
const hasData = computed(() => {
  if (!props.expenseData || props.expenseData.length === 0) {
    return false;
  }
  // Check if all amounts are zero
  return props.expenseData.some(d => d.amount > 0);
});

const renderChart = () => {
  if (!chart.value) {
    return;
  }

  if (!hasData.value) {
    Plotly.purge(chart.value);
    return;
  }

  const data = [{
    type: 'treemap',
    labels: props.expenseData.map(d => d.category),
    parents: props.expenseData.map(d => d.parent || ''),
    values: props.expenseData.map(d => d.amount),
    textinfo: 'label+value+percent parent',
    hovertemplate: '<b>%{label}</b><br>Amount: %{value}<br>Percentage: %{percentParent}<extra></extra>'
      }];

  const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        height: 608,
        width: 985,
      };

  Plotly.newPlot(chart.value, data, layout);
};

watch(() => props.expenseData, () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  renderChart();
});

onBeforeUnmount(() => {
  if (chart.value) {
    Plotly.purge(chart.value);
  }
});
</script>

<style scoped>
/* Add any specific styles for the chart container if needed */
</style>
