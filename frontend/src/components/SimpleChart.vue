<template>
  <div class="h-56">
    <canvas ref="el"></canvas>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

Chart.register(...registerables)

const props = defineProps<{
  config: ChartConfiguration
}>()

const el = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function render() {
  if (!el.value) return
  chart?.destroy()
  chart = new Chart(el.value, props.config)
}

onMounted(render)
watch(() => props.config, render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>
