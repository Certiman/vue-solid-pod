<script setup>
import { RouterView } from 'vue-router'

// store holds mode
import { store } from './stores/store'
import NavBar from './components/NavBar.vue'
import AddStorageProvider from '@/components/modals/AddStorageProvider.vue';

</script>

<template >
  <header>
    <NavBar />
  </header>
  <body v-b-color-mode="store.mode">
    <BContainer>
      <RouterView />
    </BContainer>
  </body>
  <AddStorageProvider />

</template>

<style scoped></style>
