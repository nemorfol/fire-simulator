<script setup>
import { defineProps, watch, ref, onMounted } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps({
  simulationResults: {
    type: Array,
    required: true,
  },
});

const chartDiv = ref(null);

const drawChart = () => {
  if (!props.simulationResults || props.simulationResults.length === 0 || !chartDiv.value) {
    return;
  }

  const years = props.simulationResults.map(r => r.anno);
  const initialDebt = props.simulationResults[0].capitaleIniziale; // Assuming initial capital is debt if no assets

  const data = [];
  const layout = {
    title: {
      text: 'Andamento del Debito nel Tempo',
      y: 0.95,
      yref: 'paper',
    },
    xaxis: { title: 'Anno' },
    yaxis: { title: 'Importo (€)' },
    height: 1000,
    width: 1620,
    margin: { t: 50, b: 50, l: 50, r: 50 },
    showlegend: true,
  };

  // Per ogni debito, crea una traccia
  const debtNames = new Set();
  props.simulationResults.forEach(yearData => {
    for (const key in yearData) {
      if (key.startsWith('Capitale Residuo ')) {
        debtNames.add(key.replace('Capitale Residuo ', ''));
      }
    }
  });

  debtNames.forEach(debtName => {
    const remainingCapital = props.simulationResults.map(r => r[`Capitale Residuo ${debtName}`] || 0);
    data.push({
      x: years,
      y: remainingCapital,
      mode: 'lines',
      name: `Capitale Residuo ${debtName}`,
      line: { dash: 'dot', width: 2 },
    });
  });

  // Aggiungi una traccia per il totale dei debiti residui
  const totalRemainingDebts = years.map(year => {
    let total = 0;
    props.simulationResults.forEach(r => {
      if (r.anno === year) {
        for (const key in r) {
          if (key.startsWith('Capitale Residuo ')) {
            total += r[key];
          }
        }
      }
    });
    return total;
  });

  data.push({
    x: years,
    y: totalRemainingDebts,
    mode: 'lines',
    name: 'Totale Debiti Residui',
    line: { color: '#FF5722', width: 3 },
  });

  Plotly.newPlot(chartDiv.value, data, layout);
};

onMounted(() => {
  drawChart();
});

watch(() => props.simulationResults, drawChart, { deep: true });
</script>

<template>
  <div ref="chartDiv" class="debt-waterfall-chart"></div>
</template>

<style scoped>
.debt-waterfall-chart {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
