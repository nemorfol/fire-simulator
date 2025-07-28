<script setup>
import { defineProps, watch, ref, onMounted } from 'vue';
import Plotly from 'plotly.js-dist-min'; // Importa Plotly

const props = defineProps({
  monteCarloResults: {
    type: Object,
    required: true,
  },
});

const chartDiv = ref(null);

const drawChart = () => {
  if (!props.monteCarloResults || !chartDiv.value) {
    return;
  }

  // Estrai i capitali finali da tutte le simulazioni
  const finalCapitals = props.monteCarloResults.simulations.map(
    (sim) => sim[sim.length - 1].capitaleFinale
  );

  const data = [
    {
      x: finalCapitals,
      type: 'histogram',
      marker: {
        color: 'rgba(100, 200, 250, 0.7)',
        line: {
          color: 'rgba(100, 200, 250, 1)',
          width: 1,
        },
      },
    },
  ];

  const layout = {
    title: 'Distribuzione del Capitale Finale',
    xaxis: {
      title: 'Capitale Finale',
      rangemode: 'tozero', // Assicura che l'asse X parta da zero
    },
    yaxis: {
      title: 'Frequenza',
    },
    bargap: 0.05, // Spazio tra le barre
    height: 400, // Altezza del grafico
    width: 600, // Larghezza del grafico
  };

  Plotly.newPlot(chartDiv.value, data, layout);
};

// Guarda i cambiamenti nei risultati di Monte Carlo per ridisegnare il grafico
onMounted(() => {
  drawChart();
});

watch(() => props.monteCarloResults, drawChart, { deep: true });
</script>

<template>
  <div ref="chartDiv" class="monte-carlo-distribution-chart"></div>
</template>

<style scoped>
.monte-carlo-distribution-chart {
  /* Stili per il contenitore del grafico */
  margin-top: 20px;
  width: 100%;
  margin: 0 auto;
  text-align: center; /* Centra il contenuto inline/inline-block */
}
</style>
