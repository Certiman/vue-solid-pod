<!--
  StepList Component
  
  Displays a list of steps within a specific task for management purposes.
  This is separate from the execution-focused StepItem components in TaskRunner.
-->
<script setup>
import { onBeforeMount, ref, computed, watch } from 'vue'
import { getSolidDataset } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { dataService } from '@/services/dataService'
import {
  BCard,
  BCardBody,
  BCardFooter,
  BSpinner,
  BButton,
  BFormGroup,
  BListGroup,
  BListGroupItem,
  BAlert,
  BBadge,
  BTable
} from 'bootstrap-vue-next'

// stores
import { processStore } from '@/stores/process'
import { cacheStore } from '@/stores/cache'

const props = defineProps({ taskURI: String })

const stepsList = ref([])
const isLoading = ref(false)
const loadError = ref(null)
const taskData = ref(null)

const headerText = computed(() => {
  if (isLoading.value) {
    return '[StepList] Loading steps...'
  } else if (stepsList.value.length > 0) {
    return `[StepList] ${stepsList.value.length} steps found`
  } else {
    return '[StepList] Task contains no steps'
  }
})

// Computed step table data for management view
const stepTableData = computed(() => {
  return stepsList.value
    .map((stepItem, index) => {
      // Safely handle step data that might be incomplete
      const stepURI = stepItem.step?.value || stepItem.step?.url || 'Unknown step'
      const stepName =
        typeof stepURI === 'string'
          ? stepURI.split('/').pop() + (stepURI.includes('#') ? '#' + stepURI.split('#')[1] : '')
          : 'Invalid step URI'

      return {
        index: index + 1,
        stepURI: stepName,
        version: stepItem.version || 'No version',
        sequence: stepItem.sequence !== undefined ? stepItem.sequence : 'No sequence',
        hasSource: !!stepItem.source,
        source:
          stepItem.source && typeof stepItem.source === 'string'
            ? stepItem.source.split('/').pop()
            : 'No shape'
      }
    })
    .sort((a, b) => {
      if (a.version !== b.version) return a.version - b.version
      return (a.sequence || 0) - (b.sequence || 0)
    })
})

const stepTableFields = computed(() => [
  { key: 'index', label: '#', sortable: false },
  { key: 'stepURI', label: 'Step URI', sortable: false },
  { key: 'version', label: 'Version', sortable: true },
  { key: 'sequence', label: 'Sequence', sortable: true },
  { key: 'source', label: 'Shape Source', sortable: false },
  { key: 'hasSource', label: 'Has Shape', sortable: true }
])

// Check if user can manage steps in this task
const canManageSteps = computed(() => {
  return !!props.taskURI && processStore.isOwnedResource(props.taskURI)
})

const loadStepsData = async (forceRefresh = false) => {
  console.log('StepList - loadStepsData called:', {
    taskURI: props.taskURI,
    forceRefresh,
    currentStepCount: stepsList.value.length
  })

  if (!props.taskURI) {
    stepsList.value = []
    return
  }

  // Check cache first
  if (!forceRefresh) {
    const cached = cacheStore.getCachedTask(props.taskURI)
    if (cached && cached.loadStatus === 'loaded' && cached.data?.runnerData) {
      stepsList.value = cached.data.runnerData.stepsList || []
      taskData.value = cached.data.runnerData
      console.log(`Loaded ${stepsList.value.length} steps from cache`)
      return
    }
  }

  isLoading.value = true
  loadError.value = null
  stepsList.value = []

  try {
    // Mark as loading in cache
    cacheStore.markLoading('task', props.taskURI)

    // Fetch task dataset
    const taskDataSet = await getSolidDataset(props.taskURI, { fetch: fetch })

    // Process the task data to extract steps and metadata
    const runnerData = dataService.processTaskRunnerData(taskDataSet)

    stepsList.value = runnerData.stepsList || []
    taskData.value = runnerData

    // Update cache with the processed data
    const taskCacheData = {
      uri: props.taskURI,
      runnerData: runnerData,
      dataSet: taskDataSet,
      loadStatus: 'loaded',
      loadedAt: new Date()
    }

    cacheStore.cacheTask(
      props.taskURI,
      taskCacheData,
      processStore.getProviderForURI(props.taskURI)
    )

    console.log(`Loaded ${stepsList.value.length} steps from ${props.taskURI}`)
  } catch (error) {
    console.error(`Failed to load steps: ${error.message}`)
    loadError.value = error.message || 'Failed to load steps'
    cacheStore.markLoadFailed('task', props.taskURI, error)
  } finally {
    isLoading.value = false
  }
}

// Group steps by version for better display
const stepsByVersion = computed(() => {
  const groups = {}
  stepsList.value.forEach((stepItem) => {
    const version = stepItem.version || 0
    if (!groups[version]) groups[version] = []
    groups[version].push(stepItem)
  })

  // Sort each group by sequence
  Object.keys(groups).forEach((version) => {
    groups[version].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
  })

  return groups
})

onBeforeMount(async () => await loadStepsData())

// Watch for taskURI changes
watch(
  () => props.taskURI,
  async (newTaskURI, oldTaskURI) => {
    console.log('StepList - taskURI changed:', { oldTaskURI, newTaskURI })
    if (newTaskURI && newTaskURI !== oldTaskURI) {
      await loadStepsData()
    }
  }
)
</script>

<template>
  <BCard no-body :header="headerText" class="mt-2">
    <!-- Loading state -->
    <BCardBody v-if="isLoading" class="text-center py-4">
      <BSpinner class="me-2" />
      Loading steps from task...
    </BCardBody>

    <!-- Error state -->
    <BCardBody v-else-if="loadError" class="text-center py-4">
      <BAlert variant="danger" :model-value="true">
        <strong>Failed to load steps:</strong> {{ loadError }}
      </BAlert>
      <BButton variant="outline-primary" @click="loadStepsData(true)" class="mt-2">
        Try Again
      </BButton>
    </BCardBody>

    <!-- Steps loaded successfully -->
    <BCardBody v-else-if="stepsList.length > 0">
      <!-- Summary table for management overview -->
      <BFormGroup description="Overview of all steps in this task" class="mb-4">
        <BTable :items="stepTableData" :fields="stepTableFields" small striped hover class="mb-0">
          <template #cell(hasSource)="{ value }">
            <BBadge :variant="value ? 'success' : 'warning'">
              {{ value ? 'Yes' : 'No' }}
            </BBadge>
          </template>
        </BTable>
      </BFormGroup>

      <!-- Grouped by version -->
      <BFormGroup description="Steps organized by version" class="mb-3">
        <div v-for="(versionSteps, version) in stepsByVersion" :key="version" class="mb-3">
          <h6 class="text-primary mb-2">
            <BBadge variant="primary" class="me-2">Version {{ version }}</BBadge>
            {{ versionSteps.length }} step{{ versionSteps.length !== 1 ? 's' : '' }}
          </h6>

          <BListGroup flush>
            <BListGroupItem
              v-for="(stepItem, index) in versionSteps"
              :key="index"
              class="py-2 d-flex justify-content-between align-items-center"
            >
              <div>
                <BBadge variant="outline-secondary" class="me-2">{{
                  stepItem.sequence || '?'
                }}</BBadge>
                <code class="small me-2">{{ stepItem.step.value.split('/').pop() }}</code>
                <small class="text-muted">
                  {{ stepItem.source ? stepItem.source.split('/').pop() : 'No shape file' }}
                </small>
              </div>

              <div>
                <BBadge :variant="stepItem.source ? 'success' : 'warning'" class="me-2">
                  {{ stepItem.source ? 'Has Shape' : 'No Shape' }}
                </BBadge>

                <!-- Management actions would go here -->
                <BButton
                  size="sm"
                  variant="outline-primary"
                  :disabled="!canManageSteps"
                  class="me-1"
                >
                  Edit
                </BButton>
                <BButton size="sm" variant="outline-danger" :disabled="!canManageSteps">
                  Delete
                </BButton>
              </div>
            </BListGroupItem>
          </BListGroup>
        </div>
      </BFormGroup>
    </BCardBody>

    <!-- No steps found -->
    <BCardBody v-else>
      <BAlert variant="info" :model-value="true">
        This task contains no steps yet.
        <span v-if="canManageSteps"> You can add steps using the form below. </span>
        <span v-else> Contact the task owner to add steps. </span>
      </BAlert>
    </BCardBody>

    <BCardFooter>
      <!-- Step management summary -->
      <small class="text-muted">
        {{ stepsList.length }} steps loaded
        <span v-if="taskData">
          • {{ Object.keys(stepsByVersion).length }} version{{
            Object.keys(stepsByVersion).length !== 1 ? 's' : ''
          }}
        </span>
        <span v-if="!isLoading && !loadError">
          • Cache: {{ processStore.getCacheStatus.value?.totalCached || 0 }} items
        </span>
      </small>
    </BCardFooter>
  </BCard>
</template>

<style scoped>
.table th {
  font-size: 0.875rem;
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
}

code {
  background-color: #f8f9fa;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>
