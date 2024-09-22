<script setup>
import { ref, computed, onBeforeMount } from 'vue'

import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'
import { BCardFooter, BImg } from 'bootstrap-vue-next'

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
  <BContainer>
    <BRow>
      <BCol>
        <BCard no-body>
          <BCardHeader style="h3">Processes as Linked data</BCardHeader>
          <BCardBody
            >This application supports data entry and search using linked web storage systems. This
            means we allow owners of such storages to keep control over their own structured and
            unstructured data, while PROVIDING the underlying data structure conventions through
            process providers.</BCardBody
          >
          <BCardFooter>
            <ProcessList />
          </BCardFooter>
        </BCard>
      </BCol>
      <BCol>
        <BCard no-body>
          <BCardHeader style="h3">Your profile data</BCardHeader>
          <BCardBody
            >Since correct data about your organization matters in many processes, this application
            specifically helps structuring this data as Sites and Organisations/Units, all as
            defined in W3C/Org ontology.</BCardBody
          >
          <BCardFooter>
            <BButton to="/profile/edit/organization">Refine your organization data</BButton>
          </BCardFooter>
        </BCard></BCol
      >
    </BRow>
  </BContainer>
</template>
