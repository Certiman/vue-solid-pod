<script setup>
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

import { getContainedResourceUrlAll } from '@inrupt/solid-client'
import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'

// locals
const processes = ref([])
const accessError = ref(null)

// listing all tasks on a process MUST be done at /process/PROC
const appProcessURL = computed(() =>
  sessionStore.fullAppProcessURL(processStore.currentTaskURI, '')
)

// props
const props = defineProps({ provider: Object })

const updateProcessList = () => {
  // Extract the dataset provided by the provider, and extract the Processes
  try {
    accessError.value = null // Clear any previous errors
    const processesFromProvider = getContainedResourceUrlAll(props.provider.ProcessDataSet)
    if (processesFromProvider) {
      processes.value = processesFromProvider.map((p) => ({
        value: p,
        text: processStore.shorthandForProcessURI(p)
      }))
      console.log(
        `Added ${processes.value.length} processes for provider: ${props.provider.ProviderWebId}.`
      )
    } else {
      processes.value = []
      console.warn(
        `No processes found for provider ${props.provider.ProviderWebId}, or ProcessDataSet is empty.`
      )
    }
  } catch (error) {
    console.error(
      `Failed updating process list for provider ${props.provider.ProviderWebId}: ${error}`
    )
    processes.value = []

    if (typeof error.statusCode === 'number' && error.statusCode === 403) {
      accessError.value = `Access denied to process container for ${props.provider.ProviderWebId}`
      console.error(`No access to the process container at ${props.provider.ProviderWebId}`)
    } else {
      accessError.value = `Failed to load processes: ${error.message || 'Unknown error'}`
    }
  }
}

const showChangeResourceACLModal = () => {
  modalStore.canShowResourceACL = true
  modalStore.selectedResourceACL = processStore.currentTaskURI
}

// Check if the current user can access the process container
const canAccessProcess = computed(() => {
  // If there's an explicit access error (like 403), check ownership
  if (accessError.value) {
    // For access denied errors, only allow if user owns the process
    if (accessError.value.includes('Access denied')) {
      const isOwnProcess = processStore.isOwnedResource(processStore.currentTaskURI)
      console.log(`Access denied - Own process check: ${isOwnProcess}`)
      return isOwnProcess
    }
    // For other errors, block access
    return false
  }

  // If no processes are available and no explicit error, block access
  if (processes.value.length === 0) {
    console.log(`No processes available - blocking access`)
    return false
  }

  // If we have processes and no access error, allow access
  console.log(`Processes available (${processes.value.length}) - allowing access`)
  return true
})

const startProcess = () => {
  console.warn(
    `(startProcess) Updating processStore: should execute process on pod: ${processStore.currentTaskURI}. `
  )

  // store the CORRECT URI to execute task from.
  // processStore.currentTaskURI = SELECTED_PROCESS.value
  // reroute to :to="appProcessURL ? appProcessURL : '/'"
  router.push(appProcessURL.value ? appProcessURL.value : '/')
}

onBeforeMount(() => updateProcessList())
</script>

<template>
  <BListGroupItem v-if="processes.length > 0">
    <!-- {{  appProcessURL  }} -->
    <BInputGroup>
      <BFormInput :placeholder="provider.Label" />
      <BFormSelect v-model="processStore.currentTaskURI" :options="processes" />
      <BButton
        name="ChangeResourceACL"
        variant="danger"
        @click="showChangeResourceACLModal"
        :disabled="appProcessURL === null || !canAccessProcess"
        ><IMdiShieldUnlocked class="mb-1"
      /></BButton>
      <BButton
        @click="startProcess"
        :disabled="appProcessURL === null || !canAccessProcess"
        :variant="canAccessProcess ? 'primary' : 'outline-secondary'"
        ><IMdiPlayCircle class="mb-1"
      /></BButton>
    </BInputGroup>
  </BListGroupItem>
  <BListGroupItem v-else>
    <BInputGroup>
      <BInputGroupText v-if="accessError" variant="danger">
        {{ accessError }}
      </BInputGroupText>
      <BInputGroupText v-else> No available processes from Provider: </BInputGroupText>
      <BInputGroupText>{{ provider.ProviderWebId }}</BInputGroupText>
    </BInputGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
