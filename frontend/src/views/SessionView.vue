<template>
  <div v-if="session" class="max-w-2xl space-y-8">
    <header>
      <p class="text-xs uppercase tracking-widest text-moss">{{ session.category }} · duration is secondary</p>
      <h1 class="font-display text-4xl">{{ session.topic?.title }}</h1>
      <p class="text-ink/70">{{ session.course?.name }} · mastery before {{ session.masteryBefore }}%</p>
    </header>

    <section v-if="step === 1">
      <h2 class="font-display text-2xl">1 · Recall</h2>
      <p class="text-sm mt-1">What do I already remember about this topic?</p>
      <textarea v-model="form.recallNotes" rows="5" class="w-full mt-3 bg-transparent border border-ink/15 p-3" />
      <button class="mt-3 bg-pine text-white px-4 py-2" @click="next">Continue</button>
    </section>

    <section v-else-if="step === 2">
      <h2 class="font-display text-2xl">2 · Learn</h2>
      <p class="text-sm mt-1">Study the material. Notes optional.</p>
      <textarea v-model="form.learnNotes" rows="5" class="w-full mt-3 bg-transparent border border-ink/15 p-3" />
      <button class="mt-3 bg-pine text-white px-4 py-2" @click="next">Continue</button>
    </section>

    <section v-else-if="step === 3">
      <h2 class="font-display text-2xl">3 · Practice</h2>
      <textarea v-model="form.practiceNotes" rows="4" class="w-full mt-3 bg-transparent border border-ink/15 p-3" placeholder="What did you practise?" />
      <div class="grid grid-cols-2 gap-3 mt-3">
        <label class="text-sm">Questions attempted
          <input v-model.number="form.questionsAttempted" type="number" min="0" class="w-full border-b bg-transparent py-1" />
        </label>
        <label class="text-sm">Correct
          <input v-model.number="form.questionsCorrect" type="number" min="0" class="w-full border-b bg-transparent py-1" />
        </label>
      </div>
      <button class="mt-3 bg-pine text-white px-4 py-2" @click="next">Continue</button>
    </section>

    <section v-else-if="step === 4">
      <h2 class="font-display text-2xl">4 · Test</h2>
      <p class="text-sm">Attempt questions without notes. Accuracy updates mastery with evidence.</p>
      <label class="block mt-3 text-sm">Accuracy %
        <input v-model.number="form.testScore" type="number" min="0" max="100" class="w-full border-b bg-transparent py-1" />
      </label>
      <button class="mt-3 bg-pine text-white px-4 py-2" @click="next">Continue</button>
    </section>

    <section v-else>
      <h2 class="font-display text-2xl">5 · Reflect</h2>
      <label class="block text-sm mt-3">Understood
        <textarea v-model="form.understood" rows="2" class="w-full border border-ink/15 p-2 bg-transparent" />
      </label>
      <label class="block text-sm mt-3">Confused
        <textarea v-model="form.confused" rows="2" class="w-full border border-ink/15 p-2 bg-transparent" />
      </label>
      <label class="block text-sm mt-3">Need to review
        <textarea v-model="form.needReview" rows="2" class="w-full border border-ink/15 p-2 bg-transparent" />
      </label>
      <label class="block text-sm mt-3">Minutes (recorded, not the success metric)
        <input v-model.number="form.durationMinutes" type="number" min="0" class="w-full border-b bg-transparent py-1" />
      </label>
      <button class="mt-4 bg-pine text-white px-4 py-2" @click="complete">Finish session</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api/client'

const route = useRoute()
const router = useRouter()
const session = ref<any>(null)
const step = ref(1)
const form = reactive({
  recallNotes: '',
  learnNotes: '',
  practiceNotes: '',
  questionsAttempted: 0,
  questionsCorrect: 0,
  testScore: 0,
  understood: '',
  confused: '',
  needReview: '',
  durationMinutes: 25,
})

onMounted(async () => {
  const { data } = await api.get(`/study-sessions/${route.params.id}`)
  session.value = data
  Object.assign(form, {
    recallNotes: data.recallNotes,
    learnNotes: data.learnNotes,
    practiceNotes: data.practiceNotes,
    questionsAttempted: data.questionsAttempted,
    questionsCorrect: data.questionsCorrect,
    testScore: data.testScore ?? 0,
    understood: data.understood,
    confused: data.confused,
    needReview: data.needReview,
    durationMinutes: data.durationMinutes || 25,
  })
})

async function next() {
  await api.patch(`/study-sessions/${session.value.id}`, { ...form })
  step.value += 1
}

async function complete() {
  await api.patch(`/study-sessions/${session.value.id}`, { ...form })
  await api.post(`/study-sessions/${session.value.id}/complete`, {
    testScore: form.testScore,
    durationMinutes: form.durationMinutes,
    understood: form.understood,
    confused: form.confused,
    needReview: form.needReview,
  })
  await router.push('/')
}
</script>
