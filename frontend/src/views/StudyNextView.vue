<template>
  <div class="space-y-8">
    <header>
      <h1 class="font-display text-4xl">Study next</h1>
      <p class="text-ink/70 mt-2">Priority mixes weakness, lecturer relevance, assessments, past papers, and forgetting risk.</p>
    </header>
    <ol class="space-y-6">
      <li v-for="(item, i) in items" :key="item.topicId">
        <p class="text-xs text-ochre">{{ i + 1 }} · {{ item.category.replace('_', ' ') }}</p>
        <h2 class="font-display text-2xl">{{ item.courseName }} — {{ item.topicTitle }}</h2>
        <p class="text-sm mt-1">
          Mastery {{ item.overallMastery }}% · Lecturer relevance {{ Math.round(item.components.lecturerRelevance) }}
          · Exam importance {{ Math.round(item.components.examImportance) }} (historical)
        </p>
        <button class="mt-2 text-sm underline" @click="start(item)">Start session</button>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'

const items = ref<any[]>([])
const router = useRouter()

onMounted(async () => {
  const { data } = await api.get('/study/next?limit=12')
  items.value = data
})

async function start(item: { courseId: string; topicId: string; category: string }) {
  const { data } = await api.post('/study-sessions', {
    courseId: item.courseId,
    topicId: item.topicId,
    category: item.category,
  })
  await router.push(`/study/session/${data.id}`)
}
</script>
