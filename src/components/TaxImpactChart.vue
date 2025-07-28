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
  const impostaReddito = props.simulationResults.map(r => r.impostaReddito);
  const impostaRendite = props.simulationResults.map(r => r.impostaRendite);
  const totaleImposte = props.simulationResults.map(r => r.impostaReddito + r.impostaRendite);

  const data = [
    {
      x: years,
      y: impostaReddito,
      mode: 'lines+markers',
      name: 'Imposta Reddito',
      line: { color: '#FF9800' },
    },
    {
      x: years,
      y: impostaRendite,
      mode: 'lines+markers',
      name: 'Imposta Rendite',
      line: { color: '#FFC107' },
    },
    {
      x: years,
      y: totaleImposte,
      mode: 'lines+markers',
      name: 'Totale Imposte',
      line: { color: '#F44336', width: 3 },
    },
  ];

  const layout = {
    title: {
      text: 'Impatto Fiscale nel Tempo',
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

  Plotly.newPlot(chartDiv.value, data, layout);
};

onMounted(() => {
  drawChart();
});

watch(() => props.simulationResults, drawChart, { deep: true });
</script>

<template>
  <div ref="chartDiv" class="tax-impact-chart"></div>
</template>

<style scoped>
.tax-impact-chart {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
