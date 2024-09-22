import { createRouter, createWebHistory } from 'vue-router'
// import BooksView from '../views/BooksView.vue'
import HomeView from '@/views/HomeView.vue'
import ProcessView from '../views/ProcessView.vue'
import AuthView from '@/views/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView // As a test what we get
    },
    {
      path: '/books',
      name: 'books',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/BooksView.vue')
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/process/:action/:process/:task?/:step?',
      name: 'process',
      component: ProcessView
    },
    {
      path: '/profile/:action/:orgsite',
      name: 'profile',
      component: () => import('../views/ProfileView.vue')
    }
  ]
})

export default router
