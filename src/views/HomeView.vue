<script setup>
import { ref, computed, onBeforeMount } from 'vue'

import { processStore } from '@/stores/process'
import { store } from '@/stores/store'

// Warn user to add storage Pod
const noStorageProviderWarning = computed(() => store.selectedPodUrl === '')
const noStorageAlertDuration = ref(noStorageProviderWarning.value ? 30000 : 0)
const StorageWarning = ref(null)
const statusLabelStorageWarning = ref('Please connect to your Solid Pod for resource storage.')
// const statusLabelStorageWarningHTML = ref('') if ever needed.
const noStorageCountdown = ref(1000)

// Warn user to add process providers
const noProcessProviderWarning = computed(() => processStore.processProviders.length === 0)
const noProcessAlertDuration = computed(() => (noProcessProviderWarning.value ? 30000 : 0))
const ProcessWarning = ref(null)
const statusLabelProcessWarning = ref('Please add a process provider. For more info, ')
const statusLabelProcessWarningHTML = ref(
  '<BButton to="/about/process_providers">"What are Process Providers on Solid?""</BButton>'
)
const noProcessCountdown = ref(1000)

// Show warnings at startup
onBeforeMount(() => {
  StorageWarning.value?.pause() //
  ProcessWarning.value?.pause() //
})
</script>

<template>
  <h1>Welcome to Solid for Rail</h1>
  <BAlert
    v-model="noStorageAlertDuration"
    ref="StorageWarning"
    variant="danger"
    dismissible
    fade
    @close-countdown="noStorageCountdown = $event"
  >
    <p>
      <IMdiStorage class="me-2 mb-1" />{{ statusLabelStorageWarning }}
      {{ noStorageProviderWarning }}
    </p>
    <BProgress
      variant="danger"
      :max="noStorageAlertDuration"
      :value="noStorageCountdown"
      height="4px"
    />
  </BAlert>
  <BAlert
    v-model="noProcessAlertDuration"
    ref="ProcessWarning"
    variant="warning"
    dismissible
    fade
    @close-countdown="noProcessCountdown = $event"
  >
    <p>
      <ICarbonProcess class="me-2 mb-1" />{{ statusLabelProcessWarning }}
      <span v-html="statusLabelProcessWarningHTML" />
    </p>
    <BProgress
      variant="warning"
      :max="noProcessAlertDuration"
      :value="noProcessCountdown"
      height="4px"
    />
  </BAlert>
</template>
