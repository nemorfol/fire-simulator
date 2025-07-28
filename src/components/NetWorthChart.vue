<script setup>
import { defineProps, watch, ref, onMounted } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps({
  simulationResults: {
    type: Array,
    required: true,
  },
  debts: {
    type: Array,
    default: () => [],
  },
});

const chartDiv = ref(null);

const drawChart = () => {
  if (!props.simulationResults || props.simulationResults.length === 0 || !chartDiv.value) {
    return;
  }

  const years = props.simulationResults.map(r => r.anno);
  const finalCapitals = props.simulationResults.map(r => r.capitaleFinale);

  // Calcola il totale dei debiti residui per ogni anno
  const totalDebts = years.map(year => {
    let yearDebt = 0;
    props.simulationResults.forEach(r => {
      if (r.anno === year) {
        for (const key in r) {
          if (key.startsWith('Capitale Residuo ')) {
            yearDebt += r[key];
          }
        }
      }
    });
    return yearDebt;
  });

  // Calcola il patrimonio netto
  const netWorth = finalCapitals.map((capital, index) => capital - totalDebts[index]);

  const data = [
    {
      x: years,
      y: finalCapitals,
      mode: 'lines',
      name: 'Capitale Finale',
      line: { color: '#4CAF50' },
    },
    {
      x: years,
      y: totalDebts,
      mode: 'lines',
      name: 'Debiti Totali',
      line: { color: '#F44336' },
    },
    {
      x: years,
      y: netWorth,
      mode: 'lines',
      name: 'Patrimonio Netto',
      line: { color: '#2196F3', width: 3 },
    },
  ];

  const layout = {
    title: {
      text: 'Andamento del Patrimonio Netto nel Tempo',
      y: 0.95, // Posiziona il titolo più in alto (0.95 è vicino al top)
      yref: 'paper', // Riferimento alla "carta" del grafico (0 a 1)
    },
    xaxis: { title: 'Anno' },
    yaxis: { title: 'Importo (€)' },
    height: 1000,
    width: 1620,
    margin: { t: 50, b: 50, l: 50, r: 50 },
  };

  Plotly.newPlot(chartDiv.value, data, layout);
};

onMounted(() => {
  drawChart();
});

watch(() => props.simulationResults, drawChart, { deep: true });
watch(() => props.debts, drawChart, { deep: true });
</script>

<template>
  <div ref="chartDiv" class="net-worth-chart"></div>
</template>

<style scoped>
.net-worth-chart {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
