<template>
  <div class="space-y-8">
    <header class="flex flex-wrap justify-between gap-4">
      <div>
        <h1 class="font-display text-4xl">Weekly targets</h1>
        <p class="text-ink/70">Outcome-based. Unfinished work rolls with new priorities, not a copied to-do list.</p>
      </div>
      <div class="flex gap-2">
        <button class="bg-pine text-white px-3 py-2" @click="generate">Generate this week</button>
        <button class="border border-pine px-3 py-2" @click="roll">Roll unfinished</button>
      </div>
    </header>

    <section v-if="recovery" class="border-t border-ink/10 pt-4">
      <h2 class="font-display text-xl">Recovery</h2>
      <p class="mt-2">{{ recovery.missedHint }}</p>
      <ol class="mt-3 list-decimal pl-5 text-sm space-y-1">
        <li v-for="t in recovery.tomorrowFocus" :key="t.id">{{ t.courseName }} — {{ t.topicTitle }}</li>
      </ol>
    </section>

    <ul class="space-y-4">
      <li v-for="t in targets" :key="t.id" class="border-b border-ink/10 pb-3">
        <p class="text-xs uppercase tracking-widest text-moss">{{ t.category }} · {{ t.status }}</p>
        <h2 class="font-display text-2xl">{{ t.course?.name }} — {{ t.topic?.title }}</h2>
        <p class="text-sm">
          Reach {{ t.targetMastery }}% (now {{ t.topic?.mastery?.overallScore ?? t.currentMasterySnapshot }}%)
          and complete {{ t.targetQuestions }} practice questions by {{ t.deadline }}.
        </p>
        <button v-if="t.status !== 'COMPLETED'" class="text-sm underline mt-1 mr-3" @click="complete(t.id)">Mark complete</button>
        <button v-if="t.status !== 'COMPLETED'" class="text-sm underline mt-1" @click="start(t)">Start session</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'

const targets = ref<any[]>([])
const recovery = ref<any>(null)
const router = useRouter()

async function load() {
  const [{ data: t }, { data: r }] = await Promise.all([
    api.get('/weekly-targets'),
    api.get('/recovery/plan'),
  ])
  targets.value = t
  recovery.value = r
}

async function generate() {
  await api.post('/weekly-targets/generate')
  await load()
}

async function roll() {
  await api.post('/weekly-targets/roll-forward')
  await load()
}

async function complete(id: string) {
  await api.patch(`/weekly-targets/${id}`, { status: 'COMPLETED' })
  await load()
}

async function start(t: { courseId: string; topicId: string; category: string }) {
  const { data } = await api.post('/study-sessions', {
    courseId: t.courseId,
    topicId: t.topicId,
    category: t.category,
  })
  await router.push(`/study/session/${data.id}`)
}

onMounted(load)
</script>
