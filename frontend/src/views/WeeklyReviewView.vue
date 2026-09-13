<template>
  <div class="space-y-8 max-w-2xl">
    <h1 class="font-display text-4xl">Weekly academic review</h1>
    <dl v-if="preview" class="grid grid-cols-2 gap-4 text-sm">
      <div>Topics mastered <strong class="block text-xl">{{ preview.topicsMastered }}</strong></div>
      <div>Topics improved <strong class="block text-xl">{{ preview.topicsImproved }}</strong></div>
      <div>Practice questions <strong class="block text-xl">{{ preview.practiceQuestions }}</strong></div>
      <div>Average accuracy <strong class="block text-xl">{{ preview.averageAccuracy }}%</strong></div>
    </dl>
    <p v-if="preview?.biggestImprovement">Biggest improvement: {{ preview.biggestImprovement }}</p>
    <p v-if="preview?.biggestWeakness">Biggest weakness: {{ preview.biggestWeakness }}</p>
    <ol v-if="preview?.nextWeekPriorities?.length" class="list-decimal pl-5">
      <li v-for="n in preview.nextWeekPriorities" :key="n.topic">{{ n.course }} — {{ n.topic }}</li>
    </ol>

    <form class="space-y-3" @submit.prevent="save">
      <label class="block text-sm">What worked this week?
        <textarea v-model="form.whatWorked" class="w-full border p-2 bg-transparent" />
      </label>
      <label class="block text-sm">What didn’t work?
        <textarea v-model="form.whatDidntWork" class="w-full border p-2 bg-transparent" />
      </label>
      <label class="block text-sm">Which topics are still weak?
        <textarea v-model="form.stillWeak" class="w-full border p-2 bg-transparent" />
      </label>
      <label class="block text-sm">Why did I miss targets?
        <textarea v-model="form.whyMissed" class="w-full border p-2 bg-transparent" />
      </label>
      <label class="block text-sm">What should change next week?
        <textarea v-model="form.nextWeekChange" class="w-full border p-2 bg-transparent" />
      </label>
      <button class="bg-pine text-white px-4 py-2">Save review</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api/client'

const preview = ref<any>(null)
const form = reactive({
  whatWorked: '',
  whatDidntWork: '',
  stillWeak: '',
  whyMissed: '',
  nextWeekChange: '',
})

onMounted(async () => {
  const { data } = await api.get('/weekly-reviews/preview')
  preview.value = data
})

async function save() {
  await api.post('/weekly-reviews', form)
  const { data } = await api.get('/weekly-reviews/latest')
  preview.value = { ...preview.value, saved: true, ...data.summary }
}
</script>
