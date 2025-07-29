<template>
  <div class="relative h-96 md:h-[450px]">
    <canvas ref="netWorthChartCanvas"></canvas>
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
const netWorthChartCanvas = ref(null);

const drawChart = () => {
  if (!netWorthChartCanvas.value) return;

  const labels = props.simulationResults.map(r => r.anno);
  const data = props.simulationResults.map(r => r.patrimonioNetto);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Patrimonio Netto',
        data: data,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const ctx = netWorthChartCanvas.value.getContext('2d');
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
              text: 'Patrimonio Netto (€)',
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
            text: 'Andamento del Patrimonio Netto nel Tempo',
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