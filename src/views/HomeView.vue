<script setup>
import { ref, computed, onBeforeMount } from 'vue'

import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'

// Warn user to add storage Pod
const noStorageProviderWarning = computed(() => sessionStore.selectedPodUrl === '')
const noStorageAlertDuration = ref(30000)
const StorageWarning = ref(null)
const statusLabelStorageWarning = ref('Please connect to your Solid Pod for resource storage.')
// const statusLabelStorageWarningHTML = ref('') if ever needed.
const noStorageCountdown = ref(1000)

// Warn user to add process providers
const noProcessProviderWarning = computed(() => processStore.processProviders.length === 0)
const noProcessAlertDuration = ref(30000)
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
  <h1>Welcome</h1>
  <BAlert
    v-if="noStorageProviderWarning"
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
    v-if="noProcessProviderWarning"
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
  <p>The ProcessList component is here:</p>
  <p>
    {{ processStore.processProviders }}
  </p>
  <ul>
    <li>v-for over /:process, with option to make it public or not (if owned)</li>
    <li>should list all the TASKS, and provide a play button to launch the first #step.</li>
    <li>
      should allow to add a task (myReadingList), and task steps (books). The app route for this
      action is hard-coded on /:process/addTask
    </li>
  </ul>
</template>
