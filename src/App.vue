<script setup>
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { BContainer } from 'bootstrap-vue-next'

// UI store holds mode and toasts
import { modalStore } from '@/stores/ui'

// components
import NavBar from './components/NavBar.vue'
import SearchNavBar from './components/SearchNavBar.vue'
import AddStorageProvider from '@/components/modals/AddStorageProvider.vue'
import AddProcessProvider from './components/modals/AddProcessProvider.vue'
import AddSparqlProviderModal from './components/modals/AddSparqlProviderModal.vue'

// Initialize app
onMounted(() => {
  // App initialization - ERA Container will be added when user opens AddProcessProvider modal

  // Apply initial dark mode state to the actual document body
  applyThemeToDocument(modalStore.mode)
})

// Watch for theme changes and apply them to the actual document
watch(
  () => modalStore.mode,
  (newMode) => {
    applyThemeToDocument(newMode)
  }
)

// Function to apply theme to the actual document body
const applyThemeToDocument = (mode) => {
  const body = document.body
  const html = document.documentElement

  if (mode === 'dark') {
    body.setAttribute('data-bs-theme', 'dark')
    html.setAttribute('data-bs-theme', 'dark')
    body.classList.add('dark')
    html.classList.add('dark')
  } else {
    body.setAttribute('data-bs-theme', 'light')
    html.setAttribute('data-bs-theme', 'light')
    body.classList.remove('dark')
    html.classList.remove('dark')
  }
}
</script>

<template>
  <header>
    <NavBar />
    <SearchNavBar />
  </header>
  <main>
    <BContainer>
      <RouterView />
    </BContainer>
  </main>
  <AddStorageProvider />
  <AddProcessProvider />
  <AddSparqlProviderModal v-model="modalStore.canShowAddSparqlProviderModal" />
</template>

<style scoped></style>
