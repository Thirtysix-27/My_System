import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<{ id: string; email: string; fullName: string; targetGpa: number } | null>(null)

  const isAuthed = computed(() => Boolean(token.value))

  function persist(accessToken: string, nextUser: typeof user.value) {
    token.value = accessToken
    user.value = nextUser
    localStorage.setItem('token', accessToken)
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    persist(data.accessToken, data.user)
  }

  async function register(payload: {
    email: string
    password: string
    fullName: string
    targetGpa?: number
  }) {
    const { data } = await api.post('/auth/register', payload)
    persist(data.accessToken, data.user)
  }

  async function fetchMe() {
    if (!token.value) return
    const { data } = await api.get('/auth/me')
    user.value = data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isAuthed, login, register, fetchMe, logout }
})
