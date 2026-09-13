<template>
  <div v-if="prefs" class="max-w-xl space-y-8">
    <h1 class="font-display text-4xl">Settings</h1>
    <form class="space-y-4" @submit.prevent="savePrefs">
      <h2 class="font-display text-xl">Study mix (normal)</h2>
      <div class="grid grid-cols-3 gap-3 text-sm">
        <label>Current <input v-model.number="prefs.allocationNormalCurrent" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Catch-up <input v-model.number="prefs.allocationNormalCatchUp" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Revision <input v-model.number="prefs.allocationNormalRevision" type="number" class="w-full border-b bg-transparent" /></label>
      </div>
      <h2 class="font-display text-xl">When significantly behind</h2>
      <div class="grid grid-cols-3 gap-3 text-sm">
        <label>Current <input v-model.number="prefs.allocationBehindCurrent" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Catch-up <input v-model.number="prefs.allocationBehindCatchUp" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Revision <input v-model.number="prefs.allocationBehindRevision" type="number" class="w-full border-b bg-transparent" /></label>
      </div>
      <h2 class="font-display text-xl">Priority weights</h2>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <label>Weakness <input v-model.number="prefs.priorityWeights.weakness" step="0.05" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Exam importance <input v-model.number="prefs.priorityWeights.examImportance" step="0.05" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Lecturer <input v-model.number="prefs.priorityWeights.lecturerRelevance" step="0.05" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Assessment <input v-model.number="prefs.priorityWeights.assessmentUrgency" step="0.05" type="number" class="w-full border-b bg-transparent" /></label>
        <label>Forgetting <input v-model.number="prefs.priorityWeights.forgettingRisk" step="0.05" type="number" class="w-full border-b bg-transparent" /></label>
      </div>
      <button class="bg-pine text-white px-4 py-2">Save preferences</button>
    </form>
    <form class="space-y-2" @submit.prevent="saveProfile">
      <h2 class="font-display text-xl">Profile</h2>
      <input v-model="fullName" class="w-full border-b bg-transparent py-2" />
      <label class="text-sm block">Target GPA
        <input v-model.number="targetGpa" type="number" step="0.01" class="w-full border-b bg-transparent py-1" />
      </label>
      <button class="border border-pine px-4 py-2">Update profile</button>
    </form>
    <p v-if="saved" class="text-sm text-moss">Saved.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const prefs = ref<any>(null)
const fullName = ref('')
const targetGpa = ref(4)
const saved = ref(false)
const auth = useAuthStore()

onMounted(async () => {
  const { data } = await api.get('/users/me/preferences')
  if (!data.priorityWeights) {
    data.priorityWeights = {
      weakness: 0.3,
      examImportance: 0.25,
      lecturerRelevance: 0.2,
      assessmentUrgency: 0.15,
      forgettingRisk: 0.1,
    }
  }
  prefs.value = data
  fullName.value = auth.user?.fullName ?? ''
  targetGpa.value = auth.user?.targetGpa ?? 4
})

async function savePrefs() {
  await api.patch('/users/me/preferences', prefs.value)
  saved.value = true
}

async function saveProfile() {
  await api.patch('/users/me', { fullName: fullName.value, targetGpa: targetGpa.value })
  await auth.fetchMe()
  saved.value = true
}
</script>
