<template>
  <!-- Update the select-idp option if not using PodSpaces -->
  <BFormGroup
    description="Please select an Identity Provider (IdP)"
    id="select-idp"
    label="1. Select your Identity Provider:"
    class="mt-2"
  >
    <BInputGroup prepend="IDP">
      <BFormSelect v-model="SELECTED_IDP" :options="idpProviders" :disabled="loggedIn" />
      <BButton
        name="btnLogin"
        id="btnLogin"
        size="md"
        :disabled="lockPodLogin"
        @click="loginToSelectedIdP"
        v-b-tooltip="{ title: 'Login with new session' }"
      >
        <IMdiLogin class="mb-1"
      /></BButton>
      <BButton
        name="btnReLogin"
        id="btnReLogin"
        size="md"
        :disabled="lockPodLogin || lockRetry"
        @click="reloginToSelectedIdP"
        v-b-tooltip="{ title: 'Reuse existing session' }"
      >
        <IMdiLoginVariant class="mb-1"
      /></BButton>
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
// Imports
import { ref, onMounted, computed } from 'vue'
import {
  login,
  handleIncomingRedirect,
  getDefaultSession
} from '@inrupt/solid-client-authn-browser'
import { BFormGroup, BFormSelect } from 'bootstrap-vue-next'
import { store } from '../../stores/store'

// Data
const idpProviders = [
  // { value: null, text: 'Please select an Identity Provider (IdP)' },
  { value: 'https://login.inrupt.com', text: 'Inrupt.com (PodSpaces)' },
  { value: 'https://solid.redpencil.io/idp/login/', text: 'Redpencil.io (CSS)' },
  { value: 'https://solidcommunity.net/login', text: 'Solid Community (CSS)' },
  { value: 'https://solidweb.org/login', text: 'Solid Web (CSS)' }
]

// v-model
const SELECTED_IDP = ref('https://login.inrupt.com')
const loggedIn = ref(false)
const lockRetry = ref(false)

// Computed
const lockPodLogin = computed(() => !SELECTED_IDP.value || loggedIn.value)

// functions
function loginToSelectedIdP() {
  return login({
    oidcIssuer: SELECTED_IDP.value,
    redirectUrl: new URL('/', window.location.href).toString(),
    clientName: 'Getting started app'
  })
}

function setSession() {
  const session = getDefaultSession()
  if (session.info.isLoggedIn) {
    loggedIn.value = true
    store.canGetPodURLs = true
    store.loggedInWebId = session.info.webId
  } else {
    console.warn(`No active session found`)
    // SOLVED: the above never resolves in an error so catch is useless
    lockRetry.value = false
  }
}

// Allows to try logging in again by using an active session, instead of passing again through the IDP.
// TODO: this should somehow be done automatically after reload, while it now is just a button.
async function reloginToSelectedIdP() {
  // try to reconnect with the ongoing session
  try {
    await handleIncomingRedirect({ restorePreviousSession: true })
    setSession()
  } catch (err) {
    console.error(`Relogin failed with error ${err}`)
  }
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
// TODO: session recovery only works when run in private browsers...
async function handleRedirectAfterLogin() {
  try {
    const currentSession = getDefaultSession()
    console.log(`Retrying to use a previous session...`, currentSession.info)
    if (!currentSession.info.sessionId) {
      console.log(`failed. Please log in yourself.`)
      await handleIncomingRedirect({ restorePreviousSession: true })
    } else {
      console.log(`worked. Reusing it.`)
      await handleIncomingRedirect() // no-op if not part of login redirect
    }
    setSession()
  } catch (err) {
    console.error(`Relogin failed with error ${err}`)
  }
}

onMounted(() => handleRedirectAfterLogin())
</script>

<style lang="scss" scoped></style>
