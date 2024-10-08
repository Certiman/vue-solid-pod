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
  <BAccordion class="mt-2">
    <BAccordionItem title="Debug Information">
      <h5>Home View State</h5>
      <div>Process providers: {{ processStore.processProviders.map((o) => o.ContainerURI) }}</div>
      <div>
        Process provider datasets: {{ processStore.processProviders.map((o) => o.ProcessDataSet) }}
      </div>
      <div>Query full: {{ $route.query }}</div>
      <div>This route: {{ $route.fullPath }}</div>
    </BAccordionItem>
  </BAccordion>
  <BAlert
    v-if="noStorageProviderWarning"
    v-model="noStorageAlertDuration"
    ref="StorageWarning"
    variant="danger"
    dismissible
    fade
    @close-countdown="noStorageCountdown = $event"
    class="mt-2"
  >
    <p>
      <IMdiStorage class="me-2 mb-1" />{{ statusLabelStorageWarning }}
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
    class="mt-2"
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
  <div class="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-light">
    <div class="col-md-10 p-lg-5 mx-auto my-2">
      <h1 class="display-4 font-weight-normal">Linked data processes</h1>
      <p class="lead font-weight-normal">
        Connect your storage pod and control the data your organization owns and publishes. Share
        your data with your relevant stakeholders, based on their Web Identity. Data is collected by
        executing linked data processes, created and shared by process providers. This assures the
        underlying ontrologies to be completely common.
      </p>
      <BButton
        v-if="processStore.processProviders.length > 0"
        to="/process/"
        class="mx-2"
        variant="primary"
        >Check out the processes...</BButton
      >
      <p v-else class="lead font-weight-normal">
        You can connect to a process provider of your choice by using the button
        <ICarbonProcess /> above.
      </p>
      <BButton to="/about/" class="mx-2" variant="secondary">Learn more...</BButton>
    </div>
  </div>
  <div class="d-md-flex flex-md-equal w-100 my-md-3 pl-md-3">
    <div class="bg-dark mr-md-3 pt-3 px-3 pt-md-5 px-md-5 text-center text-white overflow-hidden">
      <div class="my-3 py-3">
        <h2 class="display-5">Process Providers</h2>
        <p class="lead">
          Processes determine content schemas. Connect to a process provider and run their
          processes, but store the result in your data pod. The process provider will link to your
          data in order to allow for centralised search. But only your organisation controls what
          Web identifiers can see the full data.
        </p>
      </div>
      <div
        class="bg-light shadow-sm mx-auto"
        style="width: 80%; height: 300px; border-radius: 21px 21px 0 0"
      ></div>
    </div>
    <div class="bg-light mr-md-3 pt-3 px-3 pt-md-5 px-md-5 text-center overflow-hidden">
      <div class="my-3 p-3">
        <h2 class="display-5">Your profile data</h2>
        <p class="lead">
          Since correct data about your organization matters in many processes, this application
          specifically helps structuring this data as Sites and Organisations/Units, all as defined
          in W3C/Org ontology.
        </p>
      </div>
      <div
        class="bg-dark shadow-sm mx-auto"
        style="width: 80%; height: 300px; border-radius: 21px 21px 0 0"
      ></div>
    </div>
  </div>
</template>
