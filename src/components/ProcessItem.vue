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

    // Check if provider has a valid ProcessDataSet
    if (!props.provider.ProcessDataSet) {
      processes.value = []
      console.warn(
        `No ProcessDataSet available for provider ${props.provider.ProviderWebId}. Provider may be inactive or dataset failed to load.`
      )
      return
    }

    const processesFromProvider = getContainedResourceUrlAll(props.provider.ProcessDataSet)
    if (processesFromProvider && processesFromProvider.length > 0) {
      // Use full process URIs with provider context for collision-free handling
      processes.value = processesFromProvider.map((processURI) => ({
        value: processURI, // Store full process URI, not just name
        text: `${processStore.shorthandForProcessURI(processURI)} (${props.provider.Label})` // Show provider context
      }))
      console.log(
        `Added ${processes.value.length} processes for provider: ${props.provider.ProviderWebId}:`,
        processes.value.map((p) => p.text)
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
  modalStore.selectedResourceACL = processStore.selectedProcessURI
}

// Check if the current user can access the process container
const canAccessProcess = computed(() => {
  // If there's an explicit access error (like 403), check ownership
  if (accessError.value) {
    // For access denied errors, only allow if user owns the process
    if (accessError.value.includes('Access denied')) {
      const isOwnProcess = processStore.isOwnedResource(processStore.selectedProcessURI)
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
  if (!processStore.selectedProcessURI) {
    console.error('No process selected')
    return
  }

  // Store the selected process using provider-aware method
  processStore.selectProcess(processStore.selectedProcessURI)

  // Extract process name from URI for route navigation
  const processName = processStore.shorthandForProcessURI(processStore.selectedProcessURI)
  const appProcessURL = `/process/${processName}`

  console.log(`Starting process: ${processName} from URI: ${processStore.selectedProcessURI}`)
  console.log(`Navigating to: ${appProcessURL}`)

  // Navigate to the process view
  router.push(appProcessURL)
}

onBeforeMount(() => updateProcessList())
</script>

<template>
  <BListGroupItem v-if="processes.length > 0">
    <!-- {{  appProcessURL  }} -->
    <BInputGroup>
      <BFormInput :placeholder="provider.Label" />
      <BFormSelect v-model="processStore.selectedProcessURI" :options="processes" />
      <BButton
        name="ChangeResourceACL"
        variant="danger"
        @click="showChangeResourceACLModal"
        :disabled="!processStore.selectedProcessURI || !canAccessProcess"
        ><IMdiShieldUnlocked class="mb-1"
      /></BButton>
      <BButton
        @click="startProcess"
        :disabled="!processStore.selectedProcessURI || !canAccessProcess"
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
