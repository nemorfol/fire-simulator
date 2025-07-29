<template>
  <div class="relative h-96 md:h-[450px]">
    <canvas ref="debtChartCanvas"></canvas>
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
  formInputs: {
    type: Object,
    required: true,
  },
});

const chartInstance = ref(null);
const debtChartCanvas = ref(null);

const drawChart = () => {
  if (!debtChartCanvas.value) return;

  const labels = props.simulationResults.map(r => r.anno);
  const datasets = props.formInputs.debiti.map((d, index) => {
    const color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
    return {
      label: `Capitale Residuo ${d.desc}`,
      data: props.simulationResults.map(r => r[`Capitale Residuo ${d.desc}`] || 0),
      borderColor: color,
      backgroundColor: `${color}33`, // 20% opacity
      fill: true,
      tension: 0.1,
    };
  });

  const chartData = {
    labels: labels,
    datasets: datasets,
  };

  const ctx = debtChartCanvas.value.getContext('2d');
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
              text: 'Capitale Residuo (€)',
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
            text: 'Andamento dei Debiti nel Tempo',
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

watch(() => [props.simulationResults, props.formInputs.debiti], () => {
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
