<template>
  <div class="space-y-8">
    <h1 class="font-display text-4xl">Revision due</h1>
    <p class="text-ink/70">Spaced review for topics that reached Strong / Exam-ready.</p>
    <ul class="space-y-4">
      <li v-for="r in due" :key="r.id">
        <h2 class="font-display text-2xl">{{ r.topic?.course?.name }} — {{ r.topic?.title }}</h2>
        <p class="text-sm">Next review {{ new Date(r.nextReviewAt).toLocaleDateString() }} · interval {{ r.intervalDays }}d</p>
        <div class="flex gap-2 mt-2">
          <button class="border px-2" @click="mark(r.topicId, 'HARD')">Hard</button>
          <button class="border px-2" @click="mark(r.topicId, 'GOOD')">Good</button>
          <button class="border px-2" @click="mark(r.topicId, 'EASY')">Easy</button>
        </div>
      </li>
    </ul>
    <p v-if="!due.length" class="text-ink/60">Nothing overdue. Master topics through study sessions to schedule reviews.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api/client'

const due = ref<any[]>([])

async function load() {
  const { data } = await api.get('/revision')
  due.value = data
}

async function mark(topicId: string, result: string) {
  await api.post(`/revision/${topicId}`, { result })
  await load()
}

onMounted(load)
</script>
