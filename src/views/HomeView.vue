<script setup>
import { ref, computed, watch } from 'vue'

import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'
import TimedAlert from '@/components/atoms/TimedAlert.vue'

// Warn user to add storage Pod
const noStorageProviderWarning = computed(() => sessionStore.selectedPodUrl === '')
const showStorageAlert = ref(false)
const statusLabelStorageWarning = ref('Please connect to your Solid Pod for resource storage.')

// Warn user to add process providers
const noProcessProviderWarning = computed(() => processStore.processProviders.length === 0)
const showProcessAlert = ref(false)
const statusLabelProcessWarning = ref('Please add a process provider. For more info, ')
const statusLabelProcessWarningHTML = ref(
  '<BButton to="/about/process_providers">"What are Process Providers on Solid?""</BButton>'
)

// Watch for warning conditions and trigger alerts
watch(
  noStorageProviderWarning,
  (newValue) => {
    if (newValue) {
      showStorageAlert.value = true
    }
  },
  { immediate: true }
)

watch(
  noProcessProviderWarning,
  (newValue) => {
    if (newValue) {
      showProcessAlert.value = true
    }
  },
  { immediate: true }
)
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
      <div><strong>Debug Alert State:</strong></div>
      <div>noStorageProviderWarning: {{ noStorageProviderWarning }}</div>
      <div>showStorageAlert: {{ showStorageAlert }}</div>
      <div>noProcessProviderWarning: {{ noProcessProviderWarning }}</div>
      <div>showProcessAlert: {{ showProcessAlert }}</div>
      <div>sessionStore.selectedPodUrl: "{{ sessionStore.selectedPodUrl }}"</div>
      <div>processStore.processProviders.length: {{ processStore.processProviders.length }}</div>
    </BAccordionItem>
  </BAccordion>
  <TimedAlert
    v-if="noStorageProviderWarning"
    :show="showStorageAlert"
    variant="danger"
    :duration="30000"
    @hidden="showStorageAlert = false"
    class="mt-2"
  >
    <p><IMdiStorage class="me-2 mb-1" />{{ statusLabelStorageWarning }}</p>
  </TimedAlert>
  <TimedAlert
    v-if="noProcessProviderWarning"
    :show="showProcessAlert"
    variant="warning"
    :duration="30000"
    @hidden="showProcessAlert = false"
    class="mt-2"
  >
    <p>
      <ICarbonProcess class="me-2 mb-1" />{{ statusLabelProcessWarning }}
      <span v-html="statusLabelProcessWarningHTML" />
    </p>
  </TimedAlert>
  <div class="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-body-secondary">
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
        class="bg-body-secondary shadow-sm mx-auto"
        style="width: 80%; height: 300px; border-radius: 21px 21px 0 0"
      ></div>
    </div>
    <div class="bg-body-secondary mr-md-3 pt-3 px-3 pt-md-5 px-md-5 text-center overflow-hidden">
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
