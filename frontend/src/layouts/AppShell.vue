<template>
  <div class="min-h-screen md:grid md:grid-cols-[240px_1fr]">
    <aside class="bg-pine text-fog px-5 py-6 flex flex-col gap-8">
      <div>
        <p class="text-sand text-xs tracking-[0.2em] uppercase">Field Notes</p>
        <h1 class="font-display text-2xl text-white mt-1">Study Mastery</h1>
      </div>
      <nav class="flex flex-col gap-1 text-sm">
        <RouterLink to="/" class="nav-link">Today</RouterLink>
        <RouterLink to="/study/next" class="nav-link">Study next</RouterLink>
        <RouterLink to="/courses" class="nav-link">Courses</RouterLink>
        <RouterLink to="/weekly-plan" class="nav-link">Weekly targets</RouterLink>
        <RouterLink to="/assessments" class="nav-link">Assessments</RouterLink>
        <RouterLink to="/gpa" class="nav-link">GPA</RouterLink>
        <RouterLink to="/past-papers" class="nav-link">Past papers</RouterLink>
        <RouterLink to="/revision" class="nav-link">Revision</RouterLink>
        <RouterLink to="/weekly-review" class="nav-link">Weekly review</RouterLink>
        <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
      </nav>
      <button class="mt-auto text-left text-sand text-sm" @click="logout">Sign out</button>
    </aside>
    <main class="px-4 py-6 md:px-10 md:py-8">
      <ul v-if="notes.length" class="mb-6 space-y-2 text-sm border-b border-ink/10 pb-4">
        <li v-for="n in notes" :key="n.id" class="flex justify-between gap-3">
          <span><strong>{{ n.title }}</strong> — {{ n.body }}</span>
          <button class="underline shrink-0" @click="read(n.id)">Dismiss</button>
        </li>
      </ul>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const notes = ref<any[]>([])

onMounted(async () => {
  auth.fetchMe()
  const { data } = await api.get('/notifications')
  notes.value = (data ?? []).filter((n: any) => !n.isRead).slice(0, 4)
})

async function read(id: string) {
  await api.patch(`/notifications/${id}/read`)
  notes.value = notes.value.filter((n) => n.id !== id)
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  padding: 0.45rem 0.7rem;
  border-radius: 0.4rem;
  color: #e6ebe4;
}
.nav-link.router-link-exact-active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
</style>
