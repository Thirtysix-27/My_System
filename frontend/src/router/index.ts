import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/register', component: () => import('../views/RegisterView.vue') },
    {
      path: '/',
      component: () => import('../layouts/AppShell.vue'),
      meta: { auth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'courses', component: () => import('../views/CoursesView.vue') },
        { path: 'courses/:id', component: () => import('../views/CourseDetailView.vue') },
        { path: 'study/next', component: () => import('../views/StudyNextView.vue') },
        { path: 'study/session/:id', component: () => import('../views/SessionView.vue') },
        { path: 'weekly-plan', component: () => import('../views/WeeklyPlanView.vue') },
        { path: 'assessments', component: () => import('../views/AssessmentsView.vue') },
        { path: 'past-papers', component: () => import('../views/PastPapersView.vue') },
        { path: 'gpa', component: () => import('../views/GpaView.vue') },
        { path: 'revision', component: () => import('../views/RevisionView.vue') },
        { path: 'weekly-review', component: () => import('../views/WeeklyReviewView.vue') },
        { path: 'settings', component: () => import('../views/SettingsView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isAuthed) return '/login'
  if ((to.path === '/login' || to.path === '/register') && auth.isAuthed) return '/'
})

export default router
