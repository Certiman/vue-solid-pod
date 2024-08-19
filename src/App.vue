<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { BButton, BNavbarNav, BNavItem, vBColorMode } from 'bootstrap-vue-next'

// store holds mode
import { store } from './stores/store'

</script>

<template>
  <header>
    <BNavbar :variant="store.mode" v-b-color-mode="store.mode">
      <BNavbarBrand tag="h1" class="mb-0">BootstrapVue</BNavbarBrand>
      <BNavbarToggle target="nav-collapse" />
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav>
          <BNavItem><RouterLink to="/">Home</RouterLink></BNavItem>
          <BNavItem><RouterLink to="/about">About</RouterLink></BNavItem>
        </BNavbarNav>
        <BNavbarNav class="ms-auto mb-2 mb-lg-0">
          <BNavText class="mt-2">{{ store.mode }}</BNavText>
          <BNavItem
            ><BButton @click="store.switch()"
              ><IMaterialSymbolsLightLightMode v-if="store.mode == 'dark'" />
              <IMaterialSymbolsLightDarkModeRounded v-else /></BButton
          ></BNavItem>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </header>
  <BContainer v-b-color-mode="store.mode">
    <RouterView />
  </BContainer>
</template>

<style scoped></style>
