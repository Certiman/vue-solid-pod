<script setup>
/**
 * This AuthView serves to catch the callback from ANY authentication system:
 * - store tokens received in session from SolidAuth or ENTRA ID
 * 
 * It SHALL then reroute to /
 */
import { sessionStore } from '@/stores/sessions'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (route.query.code && route.query.state) {
    // Inrupt token returned
    sessionStore.addSolidPodAuthData({ token: route.query.code, state: route.query.state })
  }
  router.push('/')
})
</script>

<template>
  <h5>Authentication redirect (debug)</h5>
  <div>Parameters: {{ $route.params }}</div>
  <div>Route query object: {{ $route.query }}</div>
</template>

<style lang="scss" scoped></style>
