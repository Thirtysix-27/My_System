<template>
  <div v-if="dash" class="space-y-8">
    <header>
      <h1 class="font-display text-4xl">GPA</h1>
      <p class="text-ink/70 mt-2">Estimates only — the system will not promise a 4.00.</p>
    </header>
    <dl class="grid sm:grid-cols-3 gap-6">
      <div>
        <dt class="text-ink/50 text-sm">Current</dt>
        <dd class="font-display text-4xl">{{ dash.currentGpa.toFixed(2) }}</dd>
      </div>
      <div>
        <dt class="text-ink/50 text-sm">Target</dt>
        <dd class="font-display text-4xl">{{ dash.targetGpa.toFixed(2) }}</dd>
      </div>
      <div>
        <dt class="text-ink/50 text-sm">Progress</dt>
        <dd class="font-display text-4xl">{{ dash.progressTowardTarget }}%</dd>
      </div>
    </dl>
    <p>{{ dash.advisory }}</p>
    <form class="flex gap-3 items-end" @submit.prevent="saveTarget">
      <label class="text-sm">Target GPA
        <input v-model.number="target" type="number" step="0.01" min="0" max="4" class="block border-b bg-transparent py-1" />
      </label>
      <button class="bg-pine text-white px-3 py-1">Save target</button>
    </form>

    <table class="w-full text-sm text-left">
      <thead>
        <tr class="border-b">
          <th class="py-2">Course</th>
          <th>Credits</th>
          <th>Marks</th>
          <th>Letter</th>
          <th>Final?</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in dash.courses" :key="c.courseId" class="border-b border-ink/10">
          <td class="py-2">{{ c.courseName }}</td>
          <td>{{ c.creditHours }}</td>
          <td>
            <input
              :value="c.currentMarks ?? ''"
              type="number"
              class="w-20 border-b bg-transparent"
              @change="(e) => upsert(c.courseId, { currentMarks: Number((e.target as HTMLInputElement).value) })"
            />
          </td>
          <td>
            <input
              :value="c.letterGrade ?? ''"
              class="w-16 border-b bg-transparent"
              @change="(e) => upsert(c.courseId, { letterGrade: (e.target as HTMLInputElement).value, isFinal: true })"
            />
          </td>
          <td>{{ c.isFinal ? 'yes' : 'no' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api/client'

const dash = ref<any>(null)
const target = ref(4)

async function load() {
  const { data } = await api.get('/gpa/dashboard')
  dash.value = data
  target.value = data.targetGpa
}

async function saveTarget() {
  await api.put('/gpa/target', { targetGpa: target.value })
  await load()
}

async function upsert(courseId: string, body: Record<string, unknown>) {
  await api.put('/gpa/grades', { courseId, ...body })
  await load()
}

onMounted(load)
</script>
