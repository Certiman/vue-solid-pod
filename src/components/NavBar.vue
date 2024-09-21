<script setup>
import { BButton, BNavbarNav, BNavItem, vBColorMode } from 'bootstrap-vue-next'
// store holds mode
import { modalStore } from '@/stores/ui'
import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'
</script>

<template>
  <BNavbar :variant="modalStore.mode" v-b-color-mode="modalStore.mode">
    <BNavbarBrand to="/" tag="h1" class="mb-0">solid-process-pods</BNavbarBrand>
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
            @click="modalStore.canShowAddStorage = true"
            :variant="sessionStore.canDisplayData() ? 'success' : 'danger'"
            ><IMdiStorage class="mb-1" />{{
              sessionStore.canDisplayData() ? ` ${sessionStore.loggedInWebId}` : ''
            }}</BButton
          ></BNavItem
        >
        <BNavItem
          ><BButton
            @click="processStore.canShowAddProcessProviderModal = true"
            :variant="processStore.canProcessData() ? 'success' : 'danger'"
            ><ICarbonProcess class="mb-1" />{{
              processStore.canProcessData() ? ' Process providers' : ''
            }}</BButton
          ></BNavItem
        >
        <BNavItem
          ><BButton @click="modalStore.switch()"
            ><IMaterialSymbolsLightLightMode class="mb-1" v-if="modalStore.mode == 'dark'" />
            <IMaterialSymbolsLightDarkModeRounded class="mb-1" v-else /></BButton
        ></BNavItem>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<style lang="scss" scoped></style>
