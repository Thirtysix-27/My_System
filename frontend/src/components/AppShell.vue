<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { http } from '../api/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const unread = ref(0)

const links = [
  { to: '/', label: 'Today' },
  { to: '/study/next', label: 'Study next' },
  { to: '/courses', label: 'Courses' },
  { to: '/weekly-plan', label: 'Week' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/gpa', label: 'GPA' },
  { to: '/past-papers', label: 'Past papers' },
  { to: '/revision', label: 'Revision' },
  { to: '/weekly-review', label: 'Review' },
  { to: '/settings', label: 'Settings' },
]

onMounted(async () => {
  try {
    const { data } = await http.get('/notifications')
    unread.value = data.filter((n: { isRead: boolean }) => !n.isRead).length
  } catch {
    unread.value = 0
  }
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-20 border-b border-ink/10 bg-[#eef2ec]/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-4">
        <RouterLink to="/" class="block">
          <p class="font-display text-3xl leading-none tracking-tight text-pine md:text-4xl">Field Notes</p>
          <p class="mt-1 text-xs uppercase tracking-[0.22em] text-ink/60">Mastery, not hours</p>
        </RouterLink>
        <div class="flex items-center gap-4 text-sm">
          <span class="hidden sm:inline text-ink/70">{{ auth.user?.fullName }}</span>
          <span v-if="unread" class="rounded-sm bg-ochre/20 px-2 py-1 text-xs">{{ unread }} alerts</span>
          <button class="underline decoration-moss/50 underline-offset-4" @click="logout">Sign out</button>
        </div>
      </div>
      <nav class="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 text-sm">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="whitespace-nowrap px-3 py-1.5 text-ink/70 hover:text-pine"
          active-class="bg-pine text-fog"
        >
          {{ l.label }}
        </RouterLink>
      </nav>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
