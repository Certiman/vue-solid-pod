<template>
  <!-- Update the select-idp option if not using PodSpaces -->
  <BFormGroup
    description="Please select an Identity Provider (IdP)"
    id="select-idp"
    label="1. Select your Identity Provider:"
    v-if="!loggedIn"
  >
    <BInputGroup prepend="IDP">
      <BFormSelect v-model="SELECTED_IDP" :options="idpProviders" />
      <BButton
        name="btnLogin"
        id="btnLogin"
        size="md"
        :disabled="!SELECTED_IDP"
        @click="loginToSelectedIdP"
      >
        Login</BButton
      >
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
// Imports
import { ref, onMounted } from 'vue'
import {
  login,
  handleIncomingRedirect,
  getDefaultSession
} from '@inrupt/solid-client-authn-browser'
import { BFormGroup, BFormSelect } from 'bootstrap-vue-next'

// Emitters
const emit = defineEmits(['podSession', 'loggedIn'])

// v-model
const SELECTED_IDP = ref('https://login.inrupt.com')
const WEBID = ref('')
const loggedIn = ref(false)

// dropdown options
const idpProviders = [
  // { value: null, text: 'Please select an Identity Provider (IdP)' },
  { value: 'https://login.inrupt.com', text: 'Inrupt.com (PodSpaces)' }
]

// functions
function loginToSelectedIdP() {
  return login({
    oidcIssuer: SELECTED_IDP.value,
    redirectUrl: new URL('/', window.location.href).toString(),
    clientName: 'Getting started app'
  })
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {
  await handleIncomingRedirect() // no-op if not part of login redirect

  const session = getDefaultSession()
  if (session.info.isLoggedIn) {
    loggedIn.value = true
    WEBID.value = session.info.webId

    // Update the page with the status.
    emit('podSession', session.info)

    // Enable Read button to read Pod URL (via emit)
    emit('loggedIn', true)
  }
}

onMounted(() => handleRedirectAfterLogin())
</script>

<style lang="scss" scoped></style>
