<template>
  <div class="min-h-screen grid md:grid-cols-2">
    <section class="hidden md:flex flex-col justify-end p-12 text-white relative overflow-hidden">
      <img
        class="absolute inset-0 w-full h-full object-cover"
        src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80"
        alt="Open notebooks on a wooden desk"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-ink/85 via-pine/40 to-transparent" />
      <div class="relative">
        <p class="uppercase tracking-[0.25em] text-sand text-xs">Field Notes</p>
        <h1 class="font-display text-5xl mt-3">Stay with the lecture. Close the gap.</h1>
      </div>
    </section>
    <section class="flex items-center justify-center p-8">
      <form class="w-full max-w-md space-y-4" @submit.prevent="submit">
        <h2 class="font-display text-3xl">Sign in</h2>
        <p class="text-sm text-ink/70">Demo: demo@student.edu / password123</p>
        <input v-model="email" type="email" required class="w-full border-b border-ink/20 bg-transparent py-2" placeholder="Email" />
        <input v-model="password" type="password" required class="w-full border-b border-ink/20 bg-transparent py-2" placeholder="Password" />
        <p v-if="error" class="text-sm text-ochre">{{ error }}</p>
        <button class="bg-pine text-white px-5 py-2">Enter</button>
        <p class="text-sm">
          New here?
          <RouterLink to="/register" class="underline">Create an account</RouterLink>
        </p>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('demo@student.edu')
const password = ref('password123')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submit() {
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    await router.push('/')
  } catch {
    error.value = 'Invalid email or password'
  }
}
</script>
