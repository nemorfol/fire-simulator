<script setup>
import { defineProps, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  worstCaseScenario: {
    type: Array,
    default: () => []
  }
});

const chartData = computed(() => {
  if (!props.worstCaseScenario || props.worstCaseScenario.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

  const labels = props.worstCaseScenario.map(r => r.anno);
  const data = props.worstCaseScenario.map(r => r.capitaleFinale);

  return {
    labels,
    datasets: [
      {
        label: 'Scenario Peggiore',
        data,
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        fill: 'start'
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    title: {
      display: true,
      text: 'Scenario Peggiore (Capitale Finale più Basso)',
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Anno'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Capitale'
      },
      ticks: {
        callback: function(value) {
          return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
        }
      }
    }
  }
};
</script>

<template>
  <div class="relative h-96 md:h-[450px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
