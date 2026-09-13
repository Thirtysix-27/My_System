<template>
  <div class="space-y-8">
    <header>
      <h1 class="font-display text-4xl">Past papers</h1>
      <p class="text-ink/70">Frequency is historical evidence for priority — not a prediction of the next paper.</p>
    </header>

    <form class="grid md:grid-cols-4 gap-3" @submit.prevent="createPaper">
      <select v-model="form.courseId" required class="bg-transparent border-b py-2">
        <option value="" disabled>Course</option>
        <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <input v-model.number="form.year" type="number" required placeholder="Year" class="border-b bg-transparent py-2" />
      <input v-model="form.title" placeholder="Title" class="border-b bg-transparent py-2" />
      <button class="bg-pine text-white">Add paper</button>
    </form>

    <section v-if="frequency">
      <h2 class="font-display text-xl">Topic frequency</h2>
      <p class="text-xs text-ink/60 mb-2">{{ frequency.disclaimer }}</p>
      <ul class="text-sm space-y-1">
        <li v-for="t in frequency.topics" :key="t.topicId">{{ t.title }} — {{ t.appearances }} appearances</li>
      </ul>
    </section>

    <article v-for="p in papers" :key="p.id" class="border-t border-ink/10 pt-4">
      <h3 class="font-display text-2xl">{{ p.title }} ({{ p.year }})</h3>
      <form class="mt-3 grid gap-2" @submit.prevent="addQuestion(p.id)">
        <textarea v-model="qtext[p.id]" required placeholder="Question text" class="border border-ink/15 p-2 bg-transparent" />
        <select v-model="qtopic[p.id]" class="bg-transparent border-b py-1">
          <option value="">Topic</option>
          <option v-for="t in topicsFor(p.courseId)" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
        <button class="justify-self-start border border-pine px-3 py-1">Add question</button>
      </form>
      <ul class="mt-2 text-sm space-y-1">
        <li v-for="q in p.questions" :key="q.id">{{ q.questionText }} — {{ q.marks }} marks</li>
      </ul>
    </article>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { api } from '../api/client'

const courses = ref<any[]>([])
const papers = ref<any[]>([])
const frequency = ref<any>(null)
const form = reactive({ courseId: '', year: 2024, title: '' })
const qtext = reactive<Record<string, string>>({})
const qtopic = reactive<Record<string, string>>({})

function topicsFor(courseId: string) {
  return courses.value.find((c) => c.id === courseId)?.topics ?? []
}

async function load() {
  const [c, p] = await Promise.all([api.get('/courses'), api.get('/past-papers')])
  courses.value = c.data
  papers.value = p.data
  if (form.courseId) {
    const f = await api.get(`/courses/${form.courseId}/topic-frequency`)
    frequency.value = f.data
  }
}

async function createPaper() {
  await api.post('/past-papers', form)
  await load()
}

async function addQuestion(id: string) {
  await api.post(`/past-papers/${id}/questions`, {
    questionText: qtext[id],
    marks: 10,
    topicIds: qtopic[id] ? [qtopic[id]] : [],
  })
  qtext[id] = ''
  await load()
}

watch(
  () => form.courseId,
  async (id) => {
    if (!id) return
    const f = await api.get(`/courses/${id}/topic-frequency`)
    frequency.value = f.data
  },
)

onMounted(load)
</script>
