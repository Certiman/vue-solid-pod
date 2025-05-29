<template>
  <div class="data-view">
    <!-- Header with process info -->
    <BCard header="Data Collection Overview" class="mb-3">
      <BCardBody>
        <h5>Process: {{ processName }}</h5>
        <p class="text-muted">
          View and manage data collected through the {{ processName }} process. Data is organized by
          RDF type classes.
        </p>

        <!-- Loading state -->
        <div v-if="isLoading" class="text-center">
          <BSpinner class="me-2" />
          <span>Loading data from your pod...</span>
        </div>

        <!-- Error state -->
        <BAlert
          v-if="error"
          variant="danger"
          :model-value="true"
          dismissible
          @dismissed="error = null"
        >
          {{ error }}
        </BAlert>

        <!-- Data summary -->
        <div v-if="!isLoading && !error" class="mb-3">
          <small class="text-muted">
            Found {{ totalResourceCount }} resources across {{ Object.keys(dataByType).length }} RDF
            types
          </small>
        </div>
      </BCardBody>
    </BCard>

    <!-- Data by RDF Type -->
    <div v-if="!isLoading && !error">
      <DataTypeSection
        v-for="(resources, rdfType) in dataByType"
        :key="rdfType"
        :rdf-type="rdfType"
        :resources="resources"
        :process-name="processName"
        @refresh="loadData"
        class="mb-3"
      />

      <!-- Empty state -->
      <BCard v-if="Object.keys(dataByType).length === 0" class="text-center">
        <BCardBody>
          <h6 class="text-muted">No Data Found</h6>
          <p class="text-muted mb-3">
            No data has been collected for the {{ processName }} process yet.
          </p>
          <BButton variant="primary" @click="navigateToProcess">
            <IMdiNotePlus class="me-1" />
            Start {{ processName }} Process
          </BButton>
        </BCardBody>
      </BCard>
    </div>

    <!-- Debug section -->
    <DebugAccordion
      :show-route-info="true"
      :show-store-info="true"
      :custom-debug-data="debugData"
      class="mt-4"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BCard, BCardBody, BAlert, BSpinner, BButton } from 'bootstrap-vue-next'
import IMdiNotePlus from '~icons/mdi/note-plus'

import DataTypeSection from '@/components/DataTypeSection.vue'
import DebugAccordion from '@/components/atoms/DebugAccordion.vue'

import { sessionStore } from '@/stores/sessions'
import { dataService } from '@/services/dataService'

const route = useRoute()
const router = useRouter()

// Reactive data
const isLoading = ref(false)
const error = ref(null)
const dataByType = ref({})

// Computed properties
const processName = computed(() => route.params.process || '')

const totalResourceCount = computed(() => {
  return Object.values(dataByType.value).reduce((total, resources) => total + resources.length, 0)
})

const debugData = computed(() => [
  { label: 'Process Name', value: processName.value },
  { label: 'Data Container URI', value: dataContainerURI.value },
  { label: 'RDF Types Found', value: Object.keys(dataByType.value).length },
  { label: 'Total Resources', value: totalResourceCount.value },
  { label: 'User Pod URL', value: sessionStore.selectedPodUrl },
  { label: 'Is Loading', value: isLoading.value }
])

const dataContainerURI = computed(() => {
  if (!sessionStore.selectedPodUrl || !processName.value) return null
  return `${sessionStore.selectedPodUrl}data/${processName.value}/`
})

// Methods
const loadData = async () => {
  if (!sessionStore.selectedPodUrl || !processName.value) {
    error.value = 'No pod selected or invalid process name'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    console.log('Loading data from container:', dataContainerURI.value)

    // Fetch data organized by RDF type
    const data = await dataService.fetchDataByType(dataContainerURI.value)
    dataByType.value = data

    console.log('Loaded data by type:', data)
  } catch (err) {
    console.error('Error loading data:', err)
    if (err.status === 404) {
      error.value = `No data container found for process "${processName.value}". Create some data first by running the process.`
    } else if (err.status === 403) {
      error.value = 'Access denied to data container. Please check your permissions.'
    } else {
      error.value = `Failed to load data: ${err.message}`
    }
  } finally {
    isLoading.value = false
  }
}

const navigateToProcess = () => {
  router.push(`/process/${processName.value}`)
}

// Lifecycle
onMounted(() => {
  if (!sessionStore.selectedPodUrl) {
    error.value = 'Please log in to view your data'
    return
  }

  loadData()
})
</script>

<style scoped>
.data-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
