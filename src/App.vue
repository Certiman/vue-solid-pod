<script setup>
import { RouterView } from 'vue-router'

// UI store holds mode and toasts
import { modalStore } from '@/stores/ui';

// components
import NavBar from './components/NavBar.vue'
import AddStorageProvider from '@/components/modals/AddStorageProvider.vue';
import AddProcessProvider from './components/modals/AddProcessProvider.vue';

</script>

<template >
  <header>
    <NavBar />
  </header>
  <body v-b-color-mode="modalStore.mode">
    <BContainer>
      <RouterView />
    </BContainer>
    <!-- <Teleport to="body"> Already here, mate -->
      <!-- <div class="bottom-10 end-10">
        <BToast value="5000" v-model="modalStore.showToastWithMessage" variant="warning">{{ modalStore.ToastMessage }}</BToast>
      </div> -->
    <!-- </Teleport> -->
  </body>
  <AddStorageProvider />
  <AddProcessProvider />


</template>

<style scoped></style>
