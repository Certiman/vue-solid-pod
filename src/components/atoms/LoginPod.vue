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
        :disabled="!hasPreviousSession || loggedIn"
        @click="reloginToSelectedIdP"
        v-b-tooltip="{ title: 'Reuse existing session' }"
        v-if="hasPreviousSession && !loggedIn"
      >
        <IMdiLoginVariant class="mb-1"
      /></BButton>
    </BInputGroup>

    <!-- Session restoration status -->
    <div v-if="sessionRestoreStatus" class="mt-2">
      <small :class="sessionRestoreStatusClass">
        <IMdiInformation class="me-1" />
        {{ sessionRestoreStatus }}
      </small>
    </div>
  </BFormGroup>
</template>

<script setup>
// Imports
import { ref, onMounted, computed, watch } from 'vue'
import {
  login,
  handleIncomingRedirect,
  getDefaultSession
} from '@inrupt/solid-client-authn-browser'
import { BFormGroup, BFormSelect, BButton } from 'bootstrap-vue-next'
import IMdiLogin from '~icons/mdi/login'
import IMdiLoginVariant from '~icons/mdi/login-variant'
import IMdiInformation from '~icons/mdi/information'
import { sessionStore } from '@/stores/sessions'

// Solid Provider configurations
const SOLID_PROVIDERS = {
  'Inrupt.com (PodSpaces)': 'https://login.inrupt.com',
  'Inrupt.net': 'https://inrupt.net',
  'Solid Community (CSS)': 'https://solidcommunity.net',
  'Solid Community AU (CSS)': 'https://solidcommunity.au',
  'Solid Web (CSS)': 'https://solidweb.org',
  'Solidweb.me': 'https://solidweb.me',
  'RedPencil.io (CSS)': 'https://solid.redpencil.io',
  'TeamId.Live': 'https://teamid.live',
  'TrinPod US': 'https://trinpod.us',
  'TrinPod EU': 'https://trinpod.eu'
}

// Note: Use.id removed as it requires custom DPoP authentication flow
// that's incompatible with standard OpenID Connect dynamic client registration

// Dynamically generate the list of IdP providers for the select
const idpProviders = Object.entries(SOLID_PROVIDERS).map(([text, value]) => ({ value, text }))

// Session state management
const LAST_IDP_KEY = 'solid-last-idp'
const SESSION_ATTEMPTED_KEY = 'solid-session-attempted'

// v-model and reactive state
const SELECTED_IDP = ref(loadLastUsedIdP())
const loggedIn = ref(false)
const sessionRestoreStatus = ref('')
const sessionRestoreStatusClass = ref('text-muted')
const hasPreviousSession = ref(false)
const isRestoringSession = ref(false)

// Computed
const lockPodLogin = computed(
  () => !SELECTED_IDP.value || loggedIn.value || isRestoringSession.value
)

// Session management functions
function saveLastUsedIdP(idp) {
  if (idp) {
    localStorage.setItem(LAST_IDP_KEY, idp)
  }
}

function loadLastUsedIdP() {
  const savedIdP = localStorage.getItem(LAST_IDP_KEY)
  return savedIdP || idpProviders[0]?.value || ''
}

function checkForPreviousSession() {
  // Check if there's evidence of a previous session
  // The Solid auth library stores session data in localStorage with specific keys
  const solidAuthKeys = Object.keys(localStorage).filter(
    (key) => key.startsWith('solidClientAuthenticationUser') || key.startsWith('solid-client-authn')
  )

  const hasSessionData = solidAuthKeys.length > 0
  const sessionAttempted = localStorage.getItem(SESSION_ATTEMPTED_KEY) === 'true'

  hasPreviousSession.value = hasSessionData

  console.log('Previous session check:', {
    hasSessionData,
    sessionAttempted,
    solidAuthKeys,
    hasPreviousSession: hasPreviousSession.value
  })

  return hasSessionData
}

function markSessionAttempted() {
  localStorage.setItem(SESSION_ATTEMPTED_KEY, 'true')
}

function clearSessionAttempted() {
  localStorage.removeItem(SESSION_ATTEMPTED_KEY)
}

// functions
async function loginToSelectedIdP() {
  saveLastUsedIdP(SELECTED_IDP.value)
  markSessionAttempted()

  sessionRestoreStatus.value = 'Initiating login...'
  sessionRestoreStatusClass.value = 'text-info'

  try {
    await login({
      oidcIssuer: SELECTED_IDP.value,
      redirectUrl: new URL('/auth', window.location.href).toString(),
      clientName: 'Solid-Process-Pods'
    })
  } catch (error) {
    console.error('Login failed:', error)

    // Handle specific error cases with helpful messages
    if (
      error.message?.includes('no registration endpoint') ||
      error.message?.includes('Dynamic Registration could not be completed')
    ) {
      sessionRestoreStatus.value = `Login failed: ${SELECTED_IDP.value} doesn't support dynamic client registration. Try a different server like Inrupt.com or SolidCommunity.net.`
      sessionRestoreStatusClass.value = 'text-danger'
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      sessionRestoreStatus.value =
        'Login failed: Network error. Please check your connection and try again.'
      sessionRestoreStatusClass.value = 'text-danger'
    } else {
      sessionRestoreStatus.value = `Login failed: ${error.message || 'Unknown error'}. Try a different server.`
      sessionRestoreStatusClass.value = 'text-danger'
    }

    clearSessionAttempted()
    throw error // Re-throw to maintain existing error handling behavior
  }
}

function setSession() {
  const session = getDefaultSession()
  if (session.info.isLoggedIn) {
    loggedIn.value = true
    sessionStore.canGetPodURLs = true
    sessionStore.loggedInWebId = session.info.webId
    sessionRestoreStatus.value = `Logged in as ${session.info.webId}`
    sessionRestoreStatusClass.value = 'text-success'
    clearSessionAttempted()
  } else {
    console.warn(`No active session found`)
    sessionRestoreStatus.value = ''
    sessionRestoreStatusClass.value = 'text-muted'
  }
}

// Manual re-login function (now only shown when there's evidence of previous session)
async function reloginToSelectedIdP() {
  if (!hasPreviousSession.value) {
    console.warn('No previous session detected')
    return
  }

  isRestoringSession.value = true
  sessionRestoreStatus.value = 'Attempting to restore previous session...'
  sessionRestoreStatusClass.value = 'text-info'

  try {
    await handleIncomingRedirect({ restorePreviousSession: true })
    setSession()

    if (!loggedIn.value) {
      sessionRestoreStatus.value = 'Previous session expired. Please log in again.'
      sessionRestoreStatusClass.value = 'text-warning'
    }
  } catch (err) {
    console.error(`Manual relogin failed:`, err)
    sessionRestoreStatus.value = 'Session restoration failed. Please log in again.'
    sessionRestoreStatusClass.value = 'text-danger'
  } finally {
    isRestoringSession.value = false
  }
}

// Automatic session restoration on app startup
async function handleRedirectAfterLogin() {
  console.log('=== Auto Session Restoration Debug ===')

  // Check for previous session evidence first
  const hasPrevSession = checkForPreviousSession()

  try {
    const currentSession = getDefaultSession()
    console.log(`Current session info:`, currentSession.info)

    // First, handle any incoming redirect (e.g., after OAuth callback)
    await handleIncomingRedirect({ restorePreviousSession: true })

    // Check if we're now logged in
    const updatedSession = getDefaultSession()
    if (updatedSession.info.isLoggedIn) {
      console.log(`Session successfully restored/established`)
      setSession()
      return
    }

    // If we have evidence of a previous session but aren't logged in,
    // provide helpful feedback to the user
    if (hasPrevSession) {
      sessionRestoreStatus.value =
        'Previous session expired. Click "Re-login" to restore or "Login" for new session.'
      sessionRestoreStatusClass.value = 'text-warning'
      console.log('Previous session detected but expired')
    } else {
      sessionRestoreStatus.value = 'No previous session found. Please log in.'
      sessionRestoreStatusClass.value = 'text-muted'
      console.log('No previous session detected')
    }
  } catch (err) {
    console.error(`Auto session restoration failed:`, err)
    sessionRestoreStatus.value = 'Session restoration failed. Please log in.'
    sessionRestoreStatusClass.value = 'text-danger'
  }
  console.log('=== End Auto Session Restoration Debug ===')
}

// Watch for IdP changes and save to localStorage
watch(SELECTED_IDP, (newIdP) => {
  if (newIdP) {
    saveLastUsedIdP(newIdP)
  }
})

onMounted(() => handleRedirectAfterLogin())
</script>

<style lang="scss" scoped></style>
