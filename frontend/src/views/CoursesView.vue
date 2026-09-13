<template>
  <div class="space-y-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-4xl">Courses</h1>
        <p class="text-ink/70 mt-1">Each course keeps lecturer progress and your mastery separate.</p>
      </div>
    </header>

    <form class="grid md:grid-cols-3 gap-3 max-w-3xl" @submit.prevent="create">
      <input v-model="form.name" required placeholder="Course name" class="border-b border-ink/20 bg-transparent py-2" />
      <input v-model="form.code" required placeholder="Code" class="border-b border-ink/20 bg-transparent py-2" />
      <input v-model.number="form.creditHours" type="number" placeholder="Credits" class="border-b border-ink/20 bg-transparent py-2" />
      <input v-model="form.lecturer" placeholder="Lecturer" class="border-b border-ink/20 bg-transparent py-2" />
      <input v-model="form.semester" placeholder="Semester" class="border-b border-ink/20 bg-transparent py-2" />
      <button class="bg-pine text-white px-4 py-2">Add course</button>
    </form>

    <ul class="space-y-5">
      <li v-for="c in courses" :key="c.id">
        <RouterLink :to="`/courses/${c.id}`" class="block group">
          <p class="text-xs uppercase tracking-widest text-moss">{{ c.code }}</p>
          <h2 class="font-display text-2xl group-hover:underline">{{ c.name }}</h2>
          <p class="text-sm text-ink/70">
            Mastery {{ c.overallMastery }}% · Lecturer:
            {{ c.lecturerTopic?.title || 'not set' }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api/client'

const courses = ref<any[]>([])
const form = reactive({
  name: '',
  code: '',
  creditHours: 3,
  lecturer: '',
  semester: '',
})

async function load() {
  const { data } = await api.get('/courses')
  courses.value = data
}

async function create() {
  await api.post('/courses', form)
  form.name = ''
  form.code = ''
  await load()
}

onMounted(load)
</script>
