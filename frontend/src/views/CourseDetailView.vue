<template>
  <div v-if="course" class="space-y-10">
    <header>
      <p class="text-xs uppercase tracking-widest text-moss">{{ course.code }}</p>
      <h1 class="font-display text-4xl">{{ course.name }}</h1>
      <p class="mt-2 text-ink/70">{{ course.description }}</p>
    </header>

    <section class="grid md:grid-cols-2 gap-8">
      <div>
        <h2 class="font-display text-xl">Track A — Lecturer</h2>
        <p class="mt-1">Currently teaching: {{ course.lecturerTopic?.title || 'Not set' }}</p>
        <select v-model="lecturerTopicId" class="mt-3 w-full bg-transparent border-b border-ink/20 py-2" @change="saveLecturer">
          <option value="">Set lecturer topic</option>
          <option v-for="t in course.topics" :key="t.id" :value="t.id">{{ t.orderIndex + 1 }}. {{ t.title }}</option>
        </select>
      </div>
      <div>
        <h2 class="font-display text-xl">Track B — Mastery</h2>
        <p class="mt-1">Overall {{ course.overallMastery }}%</p>
      </div>
    </section>

    <section>
      <h2 class="font-display text-xl">Learning gaps</h2>
      <p class="text-sm text-ink/60 mb-3">Not “N topics behind” — exact weak and newly introduced topics.</p>
      <ul class="space-y-2">
        <li v-for="g in gaps" :key="g.topicId" class="flex justify-between gap-4 text-sm border-b border-ink/10 py-2">
          <span>{{ g.title }}</span>
          <span>{{ g.classification }} · {{ g.overallMastery }}%</span>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="font-display text-xl mb-3">Topics</h2>
      <form class="flex gap-3 mb-4" @submit.prevent="addTopic">
        <input v-model="newTopic" required placeholder="New topic" class="flex-1 border-b border-ink/20 bg-transparent py-2" />
        <button class="bg-pine text-white px-3">Add</button>
      </form>
      <ul class="space-y-4">
        <li v-for="t in course.topics" :key="t.id" class="border-b border-ink/10 pb-3">
          <div class="flex flex-wrap justify-between gap-2">
            <strong>{{ t.orderIndex + 1 }}. {{ t.title }}</strong>
            <span class="text-sm">{{ t.mastery?.overallScore ?? 0 }}% · {{ level(t.mastery?.overallScore ?? 0) }}</span>
          </div>
          <form class="grid sm:grid-cols-5 gap-2 mt-2 text-xs" @submit.prevent="saveMastery(t)">
            <label>Understand
              <input v-model.number="draft[t.id].understanding" type="number" min="0" max="100" class="w-full border-b bg-transparent" />
            </label>
            <label>Recall
              <input v-model.number="draft[t.id].recall" type="number" min="0" max="100" class="w-full border-b bg-transparent" />
            </label>
            <label>Apply
              <input v-model.number="draft[t.id].application" type="number" min="0" max="100" class="w-full border-b bg-transparent" />
            </label>
            <label>Exam Qs
              <input v-model.number="draft[t.id].examQuestions" type="number" min="0" max="100" class="w-full border-b bg-transparent" />
            </label>
            <button class="self-end border border-pine px-2 py-1">Update</button>
          </form>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api/client'

const route = useRoute()
const course = ref<any>(null)
const gaps = ref<any[]>([])
const lecturerTopicId = ref('')
const newTopic = ref('')
const draft = reactive<Record<string, { understanding: number; recall: number; application: number; examQuestions: number }>>({})

function level(score: number) {
  if (score <= 0) return 'Not started'
  if (score <= 25) return 'Familiar'
  if (score <= 50) return 'Basic understanding'
  if (score <= 75) return 'Developing'
  if (score <= 89) return 'Strong'
  return 'Exam ready'
}

async function load() {
  const id = String(route.params.id)
  const { data } = await api.get(`/courses/${id}`)
  course.value = data
  lecturerTopicId.value = data.lecturerTopic?.id ?? ''
  for (const t of data.topics ?? []) {
    draft[t.id] = {
      understanding: t.mastery?.understanding ?? 0,
      recall: t.mastery?.recall ?? 0,
      application: t.mastery?.application ?? 0,
      examQuestions: t.mastery?.examQuestions ?? 0,
    }
  }
  const g = await api.get(`/courses/${id}/gaps`)
  gaps.value = g.data
}

async function saveLecturer() {
  if (!lecturerTopicId.value) return
  await api.put(`/courses/${course.value.id}/lecturer-progress`, {
    currentTopicId: lecturerTopicId.value,
  })
  await load()
}

async function addTopic() {
  await api.post(`/courses/${course.value.id}/topics`, { title: newTopic.value })
  newTopic.value = ''
  await load()
}

async function saveMastery(t: { id: string }) {
  await api.put(`/topics/${t.id}/mastery`, draft[t.id])
  await load()
}

onMounted(load)
</script>
