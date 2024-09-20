<script setup>
import { BButton, BNavbarNav, BNavItem, vBColorMode } from 'bootstrap-vue-next'
// store holds mode
import { store } from '@/stores/store'
import { processStore } from '@/stores/process'
</script>

<template>
  <BNavbar :variant="store.mode" v-b-color-mode="store.mode">
    <BNavbarBrand to="/" tag="h1" class="mb-0">Pod Starter</BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem><RouterLink to="/books">Books</RouterLink></BNavItem>
        <BNavItem><RouterLink to="/about">About</RouterLink></BNavItem>
        <!-- <BNavItem><RouterLink to="/form">Data Forms</RouterLink></BNavItem> -->
      </BNavbarNav>
      <BNavbarNav class="ms-auto mb-2 mb-lg-0">
        <BNavItem
          ><BButton
            @click="store.canShowAddStorage = true"
            :variant="store.canDisplayData() ? 'success' : 'danger'"
            ><IMdiStorage class="mb-1" />{{
              store.canDisplayData() ? store.loggedInWebId : ''
            }}</BButton
          ></BNavItem
        >
        <BNavItem
          ><BButton
            @click="processStore.canShowAddProcessProviderModal = true"
            :variant="processStore.canProcessData() ? 'success' : 'danger'"
            ><ICarbonProcess class="mb-1" />{{
              processStore.canProcessData() ? 'Process providers' : ''
            }}</BButton
          ></BNavItem
        >
        <BNavItem
          ><BButton @click="store.switch()"
            ><IMaterialSymbolsLightLightMode class="mb-1" v-if="store.mode == 'dark'" />
            <IMaterialSymbolsLightDarkModeRounded class="mb-1" v-else /></BButton
        ></BNavItem>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<style lang="scss" scoped></style>
