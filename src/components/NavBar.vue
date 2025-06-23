<script setup>
import {
  BButton,
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavItem,
  vBColorMode
} from 'bootstrap-vue-next'

// Import icons
import IMdiStorage from '~icons/mdi/storage'
import ICarbonProcess from '~icons/carbon/process'
import IMdiDatabase from '~icons/mdi/database'
import IMaterialSymbolsLightLightMode from '~icons/material-symbols-light/light-mode'
import IMaterialSymbolsLightDarkModeRounded from '~icons/material-symbols-light/dark-mode-rounded'

// store holds mode
import { modalStore } from '@/stores/ui'
import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'
import { searchStore } from '@/stores/search'
</script>

<template>
  <BNavbar :variant="modalStore.mode" v-b-color-mode="modalStore.mode">
    <BNavbarBrand to="/" tag="h1" class="mb-0">solid-process-pods</BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem><RouterLink to="/process">Processes</RouterLink></BNavItem>
        <BNavItem><RouterLink to="/vehicle-auth">VA Inspector</RouterLink></BNavItem>
        <BNavItem><RouterLink to="/about">About</RouterLink></BNavItem>
        <BNavItem><RouterLink to="/query">Query</RouterLink></BNavItem>
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
          ><BButton
            @click="modalStore.canShowAddSparqlProviderModal = true"
            :variant="searchStore.hasActiveSparqlProviders ? 'success' : 'outline-primary'"
            ><IMdiDatabase class="mb-1" />{{
              searchStore.hasActiveSparqlProviders ? ' SPARQL endpoints' : ''
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
