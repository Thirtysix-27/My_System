<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <form class="w-full max-w-md space-y-4" @submit.prevent="submit">
      <h2 class="font-display text-3xl">Create your study track</h2>
      <input v-model="fullName" required class="w-full border-b border-ink/20 bg-transparent py-2" placeholder="Full name" />
      <input v-model="email" type="email" required class="w-full border-b border-ink/20 bg-transparent py-2" placeholder="Email" />
      <input v-model="password" type="password" required minlength="6" class="w-full border-b border-ink/20 bg-transparent py-2" placeholder="Password" />
      <label class="block text-sm">Target GPA
        <input v-model.number="targetGpa" type="number" step="0.01" min="0" max="4" class="w-full border-b border-ink/20 bg-transparent py-2" />
      </label>
      <p v-if="error" class="text-sm text-ochre">{{ error }}</p>
      <button class="bg-pine text-white px-5 py-2">Start</button>
      <p class="text-sm"><RouterLink to="/login" class="underline">Back to sign in</RouterLink></p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const fullName = ref('')
const email = ref('')
const password = ref('')
const targetGpa = ref(4)
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submit() {
  error.value = ''
  try {
    await auth.register({
      email: email.value,
      password: password.value,
      fullName: fullName.value,
      targetGpa: targetGpa.value,
    })
    await router.push('/')
  } catch {
    error.value = 'Could not register. Try a different email.'
  }
}
</script>
