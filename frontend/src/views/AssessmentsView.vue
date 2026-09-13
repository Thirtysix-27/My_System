<template>
  <div class="space-y-8">
    <h1 class="font-display text-4xl">Assessments</h1>
    <form class="grid md:grid-cols-3 gap-3" @submit.prevent="create">
      <select v-model="form.courseId" required class="bg-transparent border-b py-2">
        <option value="" disabled>Course</option>
        <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <input v-model="form.title" required placeholder="Title" class="border-b bg-transparent py-2" />
      <select v-model="form.type" class="bg-transparent border-b py-2">
        <option>ASSIGNMENT</option>
        <option>TEST</option>
        <option>MIDTERM</option>
        <option>PRACTICAL</option>
        <option>PRESENTATION</option>
        <option>FINAL</option>
      </select>
      <input v-model="form.date" type="date" required class="border-b bg-transparent py-2" />
      <input v-model.number="form.weight" type="number" placeholder="Weight %" class="border-b bg-transparent py-2" />
      <button class="bg-pine text-white px-3">Record</button>
    </form>

    <section>
      <h2 class="font-display text-xl">Upcoming</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="a in upcoming" :key="a.id">
          {{ a.title }} — {{ a.daysRemaining }} days · weight {{ a.weight }}% · {{ a.course?.name }}
        </li>
      </ul>
    </section>

    <section>
      <h2 class="font-display text-xl">All</h2>
      <ul class="mt-3 space-y-3">
        <li v-for="a in items" :key="a.id" class="text-sm flex flex-wrap gap-3 items-center">
          <span class="flex-1">{{ a.title }} ({{ a.type }}) {{ a.date }}</span>
          <input
            :value="a.actualMark ?? ''"
            type="number"
            class="w-20 border-b bg-transparent"
            placeholder="Mark"
            @change="(e) => saveMark(a.id, Number((e.target as HTMLInputElement).value))"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api/client'

const courses = ref<any[]>([])
const items = ref<any[]>([])
const upcoming = ref<any[]>([])
const form = reactive({
  courseId: '',
  title: '',
  type: 'TEST',
  date: '',
  weight: 10,
})

async function load() {
  const [c, a, u] = await Promise.all([
    api.get('/courses'),
    api.get('/assessments'),
    api.get('/assessments/upcoming'),
  ])
  courses.value = c.data
  items.value = a.data
  upcoming.value = u.data
}

async function create() {
  await api.post('/assessments', form)
  form.title = ''
  await load()
}

async function saveMark(id: string, actualMark: number) {
  await api.patch(`/assessments/${id}`, { actualMark, status: 'COMPLETED' })
  await load()
}

onMounted(load)
</script>
