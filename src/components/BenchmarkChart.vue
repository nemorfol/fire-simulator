<template>
  <div class="bg-white p-4 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-800">Confronto con il Benchmark</h2>
      <button @click="exportData" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        Esporta in Excel
      </button>
    </div>
    <div class="relative h-96 md:h-[450px]">
      <canvas ref="chart"></canvas>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

export default {
  name: 'BenchmarkChart',
  props: {
    simulationData: {
      type: Array,
      required: true,
    },
    benchmarkReturn: {
      type: Number,
      required: true,
      default: 0.07, // Default 7%
    }
  },
  data() {
    return {
      chartInstance: null,
    };
  },
  mounted() {
    this.renderChart();
  },
  watch: {
    simulationData: {
      handler() {
        this.renderChart();
      },
      deep: true,
    },
    benchmarkReturn() {
        this.renderChart();
    }
  },
  methods: {
    generateBenchmarkData() {
        if (!this.simulationData || this.simulationData.length === 0) {
            return [];
        }

        const benchmarkData = [];
        let lastBenchmarkValue = this.simulationData[0].capitaleIniziale;

        this.simulationData.forEach((dataPoint, index) => {
            if (index === 0) {
                benchmarkData.push(lastBenchmarkValue);
            } else {
                lastBenchmarkValue = lastBenchmarkValue * (1 + this.benchmarkReturn);
                benchmarkData.push(lastBenchmarkValue);
            }
        });
        return benchmarkData;
    },
    renderChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const labels = this.simulationData.map(d => d.anno);
      const portfolioData = this.simulationData.map(d => d.capitaleFinale);
      const benchmarkData = this.generateBenchmarkData();

      const ctx = this.$refs.chart.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Capitale del Portafoglio',
              data: portfolioData,
              borderColor: '#4A90E2',
              backgroundColor: 'rgba(74, 144, 226, 0.1)',
              tension: 0.1,
              fill: true,
            },
            {
              label: 'Benchmark',
              data: benchmarkData,
              borderColor: '#F5A623',
              backgroundColor: 'rgba(245, 166, 35, 0.1)',
              tension: 0.1,
              fill: true,
            }
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '€' + value.toLocaleString('it-IT');
                }
              }
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        },
      });
    },
    exportData() {
      const data = this.simulationData.map((d, i) => ({
        Anno: d.anno,
        "Capitale Portafoglio": d.capitaleFinale,
        "Valore Benchmark": this.generateBenchmarkData()[i],
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Confronto Benchmark');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      saveAs(blob, 'confronto_benchmark.xlsx');
    },
  },
};
</script>
