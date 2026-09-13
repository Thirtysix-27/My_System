<template>
  <div v-if="data" class="space-y-10">
    <header class="max-w-3xl">
      <p class="uppercase tracking-[0.22em] text-xs text-moss">Today</p>
      <h1 class="font-display text-4xl md:text-5xl mt-2">What should I study next?</h1>
      <p class="mt-3 text-ink/70">Lecturer pace and mastery stay on two tracks. Catch-up never replaces the current lecture.</p>
    </header>

    <section v-if="data.studyNext?.[0]" class="border-t border-ink/10 pt-6">
      <p class="text-xs uppercase tracking-widest text-ochre">Study next</p>
      <h2 class="font-display text-3xl mt-1">{{ data.studyNext[0].courseName }} — {{ data.studyNext[0].topicTitle }}</h2>
      <p class="mt-2 text-sm">
        Mastery {{ data.studyNext[0].overallMastery }}% · {{ data.studyNext[0].masteryLevel }} ·
        {{ data.studyNext[0].category.replace('_', '-') }}
      </p>
      <button class="mt-4 bg-pine text-white px-4 py-2" @click="start(data.studyNext[0])">Start a session</button>
    </section>

    <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
      <div>
        <dt class="text-ink/50">Target GPA</dt>
        <dd class="font-display text-3xl">{{ data.targetGpa.toFixed(2) }}</dd>
      </div>
      <div>
        <dt class="text-ink/50">Current GPA</dt>
        <dd class="font-display text-3xl">{{ data.currentGpa.toFixed(2) }}</dd>
      </div>
      <div>
        <dt class="text-ink/50">Courses</dt>
        <dd class="font-display text-3xl">{{ data.courseCount }}</dd>
      </div>
      <div>
        <dt class="text-ink/50">Average mastery</dt>
        <dd class="font-display text-3xl">{{ data.averageMastery }}%</dd>
      </div>
    </dl>

    <div class="grid md:grid-cols-2 gap-8">
      <section>
        <h3 class="font-display text-xl">Biggest learning gap</h3>
        <p v-if="data.biggestGap" class="mt-2">
          {{ data.biggestGap.courseName }} — {{ data.biggestGap.title }}
          <span class="block text-sm text-ink/60">{{ data.biggestGap.classification }} · {{ data.biggestGap.overallMastery }}%</span>
        </p>
        <p v-else class="mt-2 text-ink/60">No open gaps yet. Add topics and a lecturer position.</p>
      </section>
      <section>
        <h3 class="font-display text-xl">Weekly progress</h3>
        <p class="mt-2 font-display text-2xl">{{ data.weeklyProgress.completed }} / {{ data.weeklyProgress.total }}</p>
        <p class="text-sm text-ink/60">{{ data.allocation.mode }} mix: {{ data.allocation.current }}% current · {{ data.allocation.catchUp }}% catch-up · {{ data.allocation.revision }}% revision</p>
      </section>
    </div>

    <section>
      <h3 class="font-display text-xl">Current lecture positions</h3>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="p in data.lecturePositions" :key="p.courseId">
          {{ p.courseName }} — {{ p.topic || 'Not set' }}
        </li>
      </ul>
    </section>

    <section v-if="data.upcomingAssessment">
      <h3 class="font-display text-xl">Upcoming assessment</h3>
      <p class="mt-2">
        {{ data.upcomingAssessment.title }} —
        {{ data.upcomingAssessment.daysRemaining }} days · weight {{ data.upcomingAssessment.weight }}%
      </p>
    </section>

    <p class="text-sm text-ink/60">{{ data.gpaAdvisory }}</p>

    <section v-if="charts" class="grid md:grid-cols-2 gap-10 pt-4">
      <div>
        <h3 class="font-display text-xl mb-3">Mastery by course</h3>
        <SimpleChart :config="masteryChart" />
      </div>
      <div>
        <h3 class="font-display text-xl mb-3">Weekly study progress</h3>
        <SimpleChart :config="weekChart" />
      </div>
      <div>
        <h3 class="font-display text-xl mb-3">GPA vs target</h3>
        <SimpleChart :config="gpaChart" />
      </div>
      <div>
        <h3 class="font-display text-xl mb-3">Lecturer vs student gaps</h3>
        <SimpleChart :config="gapChart" />
      </div>
      <div class="md:col-span-2">
        <h3 class="font-display text-xl mb-1">Past-paper topic frequency</h3>
        <p class="text-xs text-ink/60 mb-3">{{ charts.frequencyDisclaimer }}</p>
        <SimpleChart :config="freqChart" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import SimpleChart from '../components/SimpleChart.vue'

const data = ref<any>(null)
const charts = ref<any>(null)
const router = useRouter()

const palette = ['#1c4638', '#b8893d', '#3f6f58', '#5c4033', '#2a4a62', '#161410']

const masteryChart = computed(() => ({
  type: 'bar' as const,
  data: {
    labels: (charts.value?.masteryByCourse ?? []).map((r: any) => r.course),
    datasets: [
      {
        label: 'Mastery %',
        data: (charts.value?.masteryByCourse ?? []).map((r: any) => r.mastery),
        backgroundColor: palette,
      },
    ],
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
}))

const weekChart = computed(() => ({
  type: 'doughnut' as const,
  data: {
    labels: (charts.value?.weeklyProgress ?? []).map((r: any) => r.label),
    datasets: [
      {
        data: (charts.value?.weeklyProgress ?? []).map((r: any) => r.value),
        backgroundColor: ['#1c4638', '#d9cbb6'],
      },
    ],
  },
  options: { responsive: true, maintainAspectRatio: false },
}))

const gpaChart = computed(() => ({
  type: 'bar' as const,
  data: {
    labels: (charts.value?.gpaProgression ?? []).map((r: any) => r.label),
    datasets: [
      {
        label: 'GPA',
        data: (charts.value?.gpaProgression ?? []).map((r: any) => r.value),
        backgroundColor: ['#3f6f58', '#b8893d'],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { min: 0, max: 4 } },
    plugins: { legend: { display: false } },
  },
}))

const gapChart = computed(() => ({
  type: 'bar' as const,
  data: {
    labels: (charts.value?.lecturerVsStudent ?? []).map((r: any) => r.course),
    datasets: [
      {
        label: 'Open gaps',
        data: (charts.value?.lecturerVsStudent ?? []).map((r: any) => r.openGaps),
        backgroundColor: '#b8893d',
      },
    ],
  },
  options: { responsive: true, maintainAspectRatio: false },
}))

const freqChart = computed(() => ({
  type: 'bar' as const,
  data: {
    labels: (charts.value?.topicFrequency ?? []).map((r: any) => r.title),
    datasets: [
      {
        label: 'Historical appearances',
        data: (charts.value?.topicFrequency ?? []).map((r: any) => r.appearances),
        backgroundColor: '#1c4638',
      },
    ],
  },
  options: { indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false },
}))

onMounted(async () => {
  const [{ data: d }, { data: c }] = await Promise.all([
    api.get('/dashboard'),
    api.get('/analytics/charts'),
  ])
  data.value = d
  charts.value = c
})

async function start(item: { courseId: string; topicId: string; category: string }) {
  const { data: session } = await api.post('/study-sessions', {
    courseId: item.courseId,
    topicId: item.topicId,
    category: item.category,
  })
  await router.push(`/study/session/${session.id}`)
}
</script>
