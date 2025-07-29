<template>
  <div class="relative h-96 md:h-[450px]">
    <canvas ref="taxImpactChartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  simulationResults: {
    type: Array,
    required: true,
  },
});

const chartInstance = ref(null);
const taxImpactChartCanvas = ref(null);

const drawChart = () => {
  if (!taxImpactChartCanvas.value) return;

  const labels = props.simulationResults.map(r => r.anno);
  const impostaRedditoData = props.simulationResults.map(r => r.impostaReddito);
  const impostaRenditeData = props.simulationResults.map(r => r.impostaRendite);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Imposta sul Reddito',
        data: impostaRedditoData,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.1,
      },
      {
        label: 'Imposta sulle Rendite',
        data: impostaRenditeData,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const ctx = taxImpactChartCanvas.value.getContext('2d');
  if (chartInstance.value) {
    chartInstance.value.data = chartData;
    chartInstance.value.update();
  } else {
    chartInstance.value = markRaw(new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value) => `€ ${value.toLocaleString()}`,
              font: { weight: 'bold' },
            },
            title: {
              display: true,
              text: 'Importo Tasse (€)',
            },
          },
          x: {
            ticks: {
              font: { weight: 'bold' },
            },
            title: {
              display: true,
              text: 'Anno',
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label || ''}: € ${context.parsed.y.toLocaleString()}`,
            },
          },
          legend: {
            labels: {
              font: { weight: 'bold' },
            },
          },
           title: {
            display: true,
            text: 'Andamento dell\'Impatto Fiscale nel Tempo',
            font: {
              size: 16,
              weight: 'bold',
            }
          }
        },
      },
    }));
  }
};

onMounted(() => {
  nextTick(() => {
    drawChart();
  });
});

watch(() => props.simulationResults, () => {
  nextTick(() => {
    drawChart();
  });
}, { deep: true });


onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
});
</script>

<style scoped>
/* Stili specifici se necessari */
</style>