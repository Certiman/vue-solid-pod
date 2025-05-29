<script setup>
import { asUrl, getSolidDataset, getStringNoLocale } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import {
  BCardFooter,
  BCard,
  BCardHeader,
  BCardBody,
  BRow,
  BCol,
  BFormSelect,
  BAccordion,
  BAccordionItem,
  BButton,
  BModal,
  BContainer,
  BListGroup,
  BListGroupItem,
  BBadge,
  BTable,
  BAlert
} from 'bootstrap-vue-next'
import { onBeforeMount, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// Import icons
import IMdiNotePlus from '~icons/mdi/note-plus'
import IMdiCodeTags from '~icons/mdi/code-tags'

// Import StepItem component
import StepItem from './StepItem.vue'
import DebugAccordion from './atoms/DebugAccordion.vue'

// Stores and Services
import { processStore } from '@/stores/process'
import { cacheStore } from '@/stores/cache'
import { modalStore } from '@/stores/ui'
import { dataService } from '@/services/dataService'

// Props, refs
const props = defineProps({ taskURI: String, action: String })
const router = useRouter()

/**
 * stepsList contains all steps of the task, no matter their version
 *
 * FIXME: steps have no order, which must be deduced from pointers
 * SOLVED: can be filtered on version
 * DONE: stepsList are Array
 * [
 * { step: st, sequence: sqn, version: 1 },
 * { step: st, sequence: sqn, version: 2 },
 * ...
 * ]
 * Preferably it is moved in the state
 */
const stepsList = ref([])
const relevantSteps = computed(() =>
  stepsList.value.filter((sli) => sli.version == selectedVersion.value).map((sli) => sli.step)
)

/**
 * pointersList will contain the pairs [current, next, version], which allows resorting.
 * The step indicated as first in the core task will be started with.
 */
const pointersList = ref([])

// The taskName as collected from the dul:Task
const taskName = ref('')
const taskContact = ref('')

// The versions as observed in the dul:Action s
const taskVersions = ref([]) // is retrieved from schema:version in each step
const selectedVersion = ref('') // the version to filter from.

// UI: identifier of the accordeon sheet which is open
const openStep = ref('TaskStep-0')

// Alllw to add steps.
const canAddStep = computed(
  () => Boolean(props.taskURI) && processStore.isOwnedResource(props.taskURI)
)

const shiftToStep = (s) => {
  console.log(`Emit received, setting to step ${s}!`)
  openStep.value = `TaskStep-${s}`
}

const setProcessTaskToAddStep = () => {
  // Navigate to ERA addStep process
  // The StepItem component can extract all context from the current route and task URI
  console.log('Navigating to add step for task:', {
    taskURI: props.taskURI,
    processName: processStore.extractProcessNameFromTaskURI(props.taskURI),
    taskName: processStore.extractTaskName(props.taskURI)
  })

  // Store the current task URI in the process store for context
  processStore.currentTaskURI = props.taskURI

  // Route to the ERA addStep process
  router.push('/process/Process/addStep/0')
}

// const stepsFound = computed(() => {
//   // Do we have steps and how many?
//   const Versions = Object.keys(stepsList)
//   let Nsteps = 0
//   for (const key of Versions) {
//     Nsteps = Nsteps + stepsList[key].length
//   }
//   console.log(`Found ${Versions.length} versions and in total ${Nsteps} steps.`)

//   return { v: Versions.length, s: Nsteps }
// })

const canDisplaySteps = computed(() => stepsList.value.length > 0)

const recalculateOrder = () => {
  // Fix starting points first - match them with step versions
  const startingPoints = pointersList.value.filter((p) => p[0] === null)

  startingPoints.forEach((startPointer) => {
    const [, startURI] = startPointer

    // Find the corresponding step to get its version
    const matchingStep = stepsList.value.find((step) => asUrl(step.step) === startURI)

    if (matchingStep) {
      // Update the starting point with the correct version
      const pointerIndex = pointersList.value.findIndex((p) => p[0] === null && p[1] === startURI)
      if (pointerIndex !== -1) {
        pointersList.value[pointerIndex][2] = matchingStep.version
      }
    }
  })

  // Now group by version and calculate sequences
  const versionGroups = {}

  pointersList.value.forEach((pointer) => {
    const [current, next, version] = pointer
    if (version !== null) {
      // Only process pointers with known versions
      if (!versionGroups[version]) versionGroups[version] = []
      versionGroups[version].push({ current, next })
    }
  })

  // For each version, trace the chain starting from the beginning
  Object.entries(versionGroups).forEach(([version, pointers]) => {
    // Find the starting point (where current is null)
    const startPoint = pointers.find((p) => p.current === null)

    if (!startPoint) {
      console.warn(`No starting point found for version ${version}`)
      return
    }

    // Trace the chain and assign sequences
    let currentURI = startPoint.next
    let sequence = 0

    while (currentURI) {
      // Find step in stepsList and update its sequence
      const stepIndex = stepsList.value.findIndex(
        (item) => item.version == version && asUrl(item.step) === currentURI
      )

      if (stepIndex !== -1) {
        stepsList.value[stepIndex].sequence = sequence++
      }

      // Find the next step in the chain
      const nextPointer = pointers.find((p) => p.current === currentURI)
      currentURI = nextPointer ? nextPointer.next : null
    }
  })

  // Sort stepsList by version and sequence
  stepsList.value.sort((a, b) => {
    if (a.version !== b.version) return a.version - b.version
    return (a.sequence || 0) - (b.sequence || 0)
  })

  return stepsList.value
}

// Let's refactor the onBeforeMount to be more readable
onBeforeMount(async () => {
  if (!props.taskURI) {
    console.warn('No task URI provided')
    return
  }

  try {
    await loadTaskData()
  } catch (err) {
    console.error(`Failed to load task: ${err.message}`)
    loadingError.value = err.message
  }
})

// Split the data loading into more manageable functions
const loadTaskData = async () => {
  // Check cache first
  const cached = cacheStore.getCachedTask(props.taskURI)
  if (cached && cached.loadStatus === 'loaded') {
    console.log('Using cached task data for TaskRunner')

    // Check if we have runner data already cached
    if (cached.data.runnerData) {
      populateTaskRunnerData(cached.data.runnerData)
      return
    }

    // If we have a dataSet, process it
    if (cached.data.dataSet) {
      const runnerData = dataService.processTaskRunnerData(cached.data.dataSet)
      populateTaskRunnerData(runnerData)
      return
    }

    // If we only have basic task data from TaskList, we need to fetch the full dataset
    console.log('Cached data incomplete for TaskRunner, fetching full dataset...')
  }

  // Fetch fresh data
  const taskDataSet = await getSolidDataset(props.taskURI, { fetch })
  const runnerData = dataService.processTaskRunnerData(taskDataSet)

  // Cache the runner data with the existing task data or create new cache entry
  const taskData = cached?.data || (await processStore.getOrFetchTask(props.taskURI))
  if (taskData) {
    taskData.runnerData = runnerData
    taskData.dataSet = taskDataSet
    cacheStore.cacheTask(props.taskURI, taskData, processStore.getProviderForURI(props.taskURI))
  }

  populateTaskRunnerData(runnerData)
}

// Helper function to populate TaskRunner reactive data
const populateTaskRunnerData = (runnerData) => {
  stepsList.value = runnerData.stepsList
  pointersList.value = runnerData.pointersList
  taskName.value = runnerData.taskName
  taskContact.value = runnerData.taskContact
  totalThingsFound.value = runnerData.totalThingsFound

  // Update versions dropdown
  populateVersionsDropdown(new Set(runnerData.versions))

  // Calculate proper sequences based on the linked list structure
  recalculateOrder()
}

// Add these reactive data and computed properties after your existing ones
const totalThingsFound = ref(0)
const loadingError = ref(null)

// Populate versions dropdown
const populateVersionsDropdown = (versions) => {
  taskVersions.value = Array.from(versions)
    .map((v) => ({
      value: Number(v),
      text: `V${v}`
    }))
    .sort((a, b) => a.value - b.value)

  // Set default selected version to the latest one
  if (taskVersions.value.length > 0) {
    selectedVersion.value = taskVersions.value[taskVersions.value.length - 1].value
  }
}

// Helper function to get steps for a specific version (sorted by sequence)
const getStepsForVersion = (version) => {
  return stepsList.value
    .filter((step) => step.version === version)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
}

// Debug summary table data
const debugSummary = computed(() => [
  {
    metric: 'Pointers Found',
    value: pointersList.value.length,
    description: 'RDF rest/first relationships'
  },
  {
    metric: 'Steps Processed',
    value: stepsList.value.length,
    description: 'DUL:Action instances'
  },
  {
    metric: 'Versions Detected',
    value: taskVersions.value.length,
    description: 'Unique schema:version values'
  },
  {
    metric: 'Selected Version',
    value: selectedVersion.value || 'None',
    description: 'Currently active version'
  },
  {
    metric: 'SHACL Shape BLOBs',
    value: cacheStore.allShapeBlobUrls.length,
    description: 'Cached SHACL shape files'
  },
  {
    metric: 'Shape Mappings',
    value: cacheStore.shapeUrlMapping.size,
    description: 'Source URL to BLOB mappings'
  },
  {
    metric: 'Cache Status',
    value: `P:${cacheStore.processCache.size} T:${cacheStore.taskCache.size} S:${cacheStore.stepCache.size}`,
    description: 'Process/Task/Step cache counts'
  }
])

// General debug information for DebugAccordion
const generalDebugData = computed(() => [
  { label: 'Task URI', value: props.taskURI },
  { label: 'Action', value: props.action },
  { label: 'Selected Version', value: selectedVersion.value || 'None' },
  { label: 'Total Steps', value: stepsList.value.length },
  {
    label: 'Available Versions',
    value: taskVersions.value.map((v) => v.value).join(', ') || 'None'
  },
  { label: 'Process Store currentTaskURI', value: processStore.currentTaskURI },
  { label: 'Process Store currentProcessURI', value: processStore.currentProcessURI }
])

// Enhanced debug information for SHACL shapes
const shapeDebugInfo = computed(() => {
  const shapes = cacheStore.allShapeBlobUrls.map((url, index) => ({
    index,
    url: url, // Show full URL for debugging
    urlTruncated: url.substring(0, 80) + (url.length > 80 ? '...' : ''), // Longer truncated version for display
    isValid: url.startsWith('blob:'),
    createdAt: 'Unknown' // BLOB URLs don't have creation timestamps
  }))

  return shapes
})

// SHACL shape source URL mappings
const shapeMappingInfo = computed(() => {
  const mappings = []
  for (const [sourceUrl, blobUrl] of cacheStore.shapeUrlMapping.entries()) {
    mappings.push({
      sourceUrl: sourceUrl.split('/').slice(-1)[0], // Show just filename
      fullSourceUrl: sourceUrl,
      blobUrl: blobUrl.substring(0, 40) + (blobUrl.length > 40 ? '...' : ''),
      fullBlobUrl: blobUrl
    })
  }
  return mappings
})

// Step source analysis
const stepSourceInfo = computed(() => {
  return stepsList.value
    .map((stepItem, index) => {
      const step = stepItem.step
      const stepURI = asUrl(step)

      // Try to extract dcterms:source from the step
      const source =
        step.predicates?.['http://purl.org/dc/terms/source']?.[0]?.object?.value || 'No source'

      return {
        index,
        stepURI:
          stepURI.split('/').slice(-1)[0] +
          (stepURI.includes('#') ? '#' + stepURI.split('#')[1] : ''),
        version: stepItem.version,
        sequence: stepItem.sequence,
        source: source === 'No source' ? source : source.split('/').slice(-1)[0]
      }
    })
    .sort((a, b) => a.version - b.version || (a.sequence || 0) - (b.sequence || 0))
})

// Debug table fields configuration
const debugFields = computed(() => [
  { key: 'metric', label: 'Metric', sortable: false },
  { key: 'value', label: 'Value', sortable: false },
  { key: 'description', label: 'Description', sortable: false }
])

// Validation issues detection
const validationIssues = computed(() => {
  const issues = []

  // Check for orphaned steps (steps with no sequence)
  const orphanedSteps = stepsList.value.filter((step) => step.sequence === null)
  if (orphanedSteps.length > 0) {
    issues.push({
      type: 'warning',
      message: `${orphanedSteps.length} steps have no sequence (orphaned)`
    })
  }

  // Check for missing starting points
  const versionsWithoutStart = taskVersions.value.filter((version) => {
    const startPointers = pointersList.value.filter((p) => p[0] === null && p[2] === version.value)
    return startPointers.length === 0
  })
  if (versionsWithoutStart.length > 0) {
    issues.push({
      type: 'danger',
      message: `Versions ${versionsWithoutStart.map((v) => v.value).join(', ')} have no starting point`
    })
  }

  // Check for broken chains
  taskVersions.value.forEach((version) => {
    const versionPointers = pointersList.value.filter((p) => p[2] === version.value)
    const versionSteps = stepsList.value.filter((s) => s.version === version.value)

    if (versionPointers.length !== versionSteps.length) {
      issues.push({
        type: 'warning',
        message: `Version ${version.value}: pointer/step count mismatch (${versionPointers.length}/${versionSteps.length})`
      })
    }
  })

  // NEW: Check for steps without sequence (alternative check)
  const stepsWithoutSequence = stepsList.value.filter(
    (s) => s.sequence === undefined || s.sequence === null
  )
  if (stepsWithoutSequence.length > 0) {
    issues.push({
      type: 'warning',
      message: `${stepsWithoutSequence.length} steps missing sequence information`
    })
  }

  // NEW: Check for version mismatches
  const versionSet = new Set(stepsList.value.map((s) => s.version))
  if (versionSet.has(undefined) || versionSet.has(null)) {
    issues.push({
      type: 'error',
      message: 'Some steps have undefined version numbers'
    })
  }
  // NEW: Check for SHACL shape caching issues
  if (cacheStore.allShapeBlobUrls.length !== cacheStore.shapeUrlMapping.size) {
    issues.push({
      type: 'error',
      message: `SHACL cache inconsistency: ${cacheStore.allShapeBlobUrls.length} BLOBs vs ${cacheStore.shapeUrlMapping.size} mappings`
    })
  }

  if (cacheStore.allShapeBlobUrls.length > 1) {
    issues.push({
      type: 'warning',
      message: `Multiple SHACL shape files cached (${cacheStore.allShapeBlobUrls.length}). This may cause form rendering conflicts.`
    })
  }

  if (cacheStore.allShapeBlobUrls.length === 0) {
    issues.push({
      type: 'info',
      message: 'No SHACL shape files found in cache'
    })
  }

  // NEW: Check for broken pointer chains (version information)
  const orphanedPointers = pointersList.value.filter((p) => p[2] === null || p[2] === undefined)
  if (orphanedPointers.length > 0) {
    issues.push({
      type: 'warning',
      message: `${orphanedPointers.length} pointers without version information`
    })
  }

  return issues
})
</script>
<template>
  <BCard no-body class="mt-2">
    <BCardHeader>
      <BRow cols="12">
        <BCol class="col-10"
          >[TaskRunner] <b>{{ action || taskName }}</b> ({{
            taskContact || 'No contact information provided'
          }})</BCol
        >
        <BCol class="col-2" v-if="canDisplaySteps"
          ><BFormSelect
            :options="taskVersions"
            v-model="selectedVersion"
            :disabled="!canDisplaySteps"
          />
        </BCol>
      </BRow>
    </BCardHeader>
    <BCardBody>
      <p v-if="!canDisplaySteps">
        This process task contains no steps. Please contact the owner if needed.
      </p>
      <BAccordion v-model="openStep" v-else-if="selectedVersion">
        <StepItem
          v-for="[i, step] of relevantSteps.entries()"
          :key="i"
          :sequence="i"
          :step="step"
          :id="`TaskStep-${i}`"
          @nextStep="shiftToStep"
        />
      </BAccordion>
      <p v-else>
        Please select a version of the task to execute. This is required as some tasks may need you
        to run an older version.
      </p>
    </BCardBody>
    <BCardFooter class="d-flex justify-content-between align-items-center">
      <!-- Cache status information -->
      <small class="text-muted">
        {{ stepsList.length }} steps loaded
        <span v-if="!loadingError">
          • Cache: {{ processStore.getCacheStatus.value?.totalCached || 0 }} items
        </span>
        <span v-if="selectedVersion"> • Version: {{ selectedVersion }} </span>
      </small>
      <!-- Add Step button -->
      <BButton
        v-if="canAddStep"
        variant="primary"
        size="sm"
        @click="setProcessTaskToAddStep"
        class="ms-auto"
      >
        <IMdiNotePlus class="me-1" />
        Add Step
      </BButton>
      <small v-else class="text-muted">
        {{
          !props.taskURI ? 'Select a task first' : "You cannot add steps to other providers' tasks"
        }}
      </small>
    </BCardFooter>
  </BCard>

  <!-- General Debug Information -->
  <DebugAccordion
    title="TaskRunner General Debug"
    :custom-debug-data="generalDebugData"
    class="mt-2"
  />

  <BCard no-body class="mt-3" variant="light">
    <BAccordion>
      <BAccordionItem>
        <template #title>
          <span class="text-muted">
            <IMdiCodeTags class="me-2" />
            Debug Information
          </span>
        </template>

        <BContainer fluid>
          <BRow>
            <!-- Raw Data Section -->
            <BCol md="6">
              <h6 class="text-primary">Raw Pointers List</h6>
              <small class="text-muted">As received from RDF (current → next, version)</small>
              <BListGroup class="mt-2 mb-3">
                <BListGroupItem
                  v-for="[current, next, version] in pointersList"
                  :key="`${current}-${next}-${version}`"
                  class="py-1"
                >
                  <code class="small">
                    {{ current ? current.split('/').pop() : 'START' }}
                    →
                    {{ next ? next.split('/').pop() : 'END' }}
                    <BBadge variant="secondary" class="ms-2">v{{ version || '?' }}</BBadge>
                  </code>
                </BListGroupItem>
                <BListGroupItem v-if="pointersList.length === 0" variant="light">
                  <em class="text-muted">No pointers found</em>
                </BListGroupItem>
              </BListGroup>

              <h6 class="text-warning">SHACL Shape Cache Debug</h6>
              <small class="text-muted">Cached BLOB URLs for SHACL shape files</small>
              <BListGroup class="mt-2 mb-3">
                <BListGroupItem class="py-1 d-flex justify-content-between">
                  <span>Cached Shape BLOBs:</span>
                  <BBadge variant="info">{{ cacheStore.allShapeBlobUrls.length }}</BBadge>
                </BListGroupItem>
                <BListGroupItem v-for="shape in shapeDebugInfo" :key="shape.index" class="py-1">
                  <div class="d-flex justify-content-between align-items-start">
                    <span class="me-2">BLOB {{ shape.index }}:</span>
                    <BBadge :variant="shape.isValid ? 'success' : 'danger'" class="ms-auto">
                      {{ shape.isValid ? 'Valid' : 'Invalid' }}
                    </BBadge>
                  </div>
                  <code
                    class="small text-muted d-block mt-1"
                    style="word-break: break-all; white-space: pre-wrap"
                    >{{ shape.urlTruncated }}</code
                  >
                  <small class="text-info">Full URL length: {{ shape.url.length }} chars</small>
                </BListGroupItem>
                <BListGroupItem v-if="cacheStore.allShapeBlobUrls.length === 0" variant="light">
                  <em class="text-muted">No SHACL shape BLOBs cached</em>
                </BListGroupItem>
              </BListGroup>

              <h6 class="text-warning">Shape Source Mappings</h6>
              <small class="text-muted">Source URL to BLOB URL mappings</small>
              <BListGroup class="mt-2 mb-3">
                <BListGroupItem
                  v-for="mapping in shapeMappingInfo"
                  :key="mapping.sourceUrl"
                  class="py-1"
                >
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <span class="me-2 fw-bold">{{ mapping.sourceUrl }}</span>
                    <BBadge variant="success">Cached</BBadge>
                  </div>
                  <div class="small text-muted">
                    <div><strong>Source:</strong> {{ mapping.fullSourceUrl }}</div>
                    <div><strong>BLOB:</strong> {{ mapping.blobUrl }}</div>
                  </div>
                </BListGroupItem>
                <BListGroupItem v-if="shapeMappingInfo.length === 0" variant="light">
                  <em class="text-muted">No shape mappings found</em>
                </BListGroupItem>
              </BListGroup>

              <h6 class="text-success">Calculated Order</h6>
              <small class="text-muted">After sequence calculation</small>
              <div v-for="version in taskVersions" :key="version.value" class="mt-2">
                <BBadge variant="success" class="mb-1">Version {{ version.value }}</BBadge>
                <BListGroup>
                  <BListGroupItem
                    v-for="step in getStepsForVersion(version.value)"
                    :key="step.sequence"
                    class="py-1 d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <BBadge variant="outline-primary" class="me-2">{{ step.sequence }}</BBadge>
                      <code class="small">{{ asUrl(step.step).split('/').pop() }}</code>
                    </div>
                    <small class="text-muted">
                      {{ getStringNoLocale(step.step, 'http://schema.org/name') || 'Unnamed step' }}
                    </small>
                  </BListGroupItem>
                  <BListGroupItem
                    v-if="getStepsForVersion(version.value).length === 0"
                    variant="light"
                  >
                    <em class="text-muted">No steps for this version</em>
                  </BListGroupItem>
                </BListGroup>
              </div>
            </BCol>

            <!-- Processing Information -->
            <BCol md="6">
              <h6 class="text-info">Processing Summary</h6>
              <BTable :items="debugSummary" :fields="debugFields" small striped class="mt-2" />

              <h6 class="text-warning mt-3">Validation Issues</h6>
              <BAlert
                v-for="issue in validationIssues"
                :key="issue.message"
                :variant="issue.type"
                class="py-2 small"
                show
              >
                <strong>{{ issue.type.toUpperCase() }}:</strong> {{ issue.message }}
              </BAlert>
              <BAlert
                v-if="validationIssues.length === 0"
                variant="success"
                class="py-2 small"
                show
              >
                No validation issues detected
              </BAlert>
              <h6 class="text-secondary mt-3">Technical Details</h6>
              <BListGroup>
                <BListGroupItem class="py-1 d-flex justify-content-between">
                  <span>Task URI:</span>
                  <code class="small">{{
                    props.taskURI ? props.taskURI.split('/').slice(-2).join('/') : 'None'
                  }}</code>
                </BListGroupItem>
                <BListGroupItem class="py-1 d-flex justify-content-between">
                  <span>Total Things Found:</span>
                  <BBadge variant="info">{{ totalThingsFound }}</BBadge>
                </BListGroupItem>
                <BListGroupItem class="py-1 d-flex justify-content-between">
                  <span>Action Steps:</span>
                  <BBadge variant="primary">{{ stepsList.length }}</BBadge>
                </BListGroupItem>
                <BListGroupItem class="py-1 d-flex justify-content-between">
                  <span>Versions Found:</span>
                  <BBadge variant="secondary">{{ taskVersions.length }}</BBadge>
                </BListGroupItem>
                <BListGroupItem class="py-1 d-flex justify-content-between">
                  <span>Can Edit:</span>
                  <BBadge :variant="canAddStep ? 'success' : 'danger'">
                    {{ canAddStep ? 'Yes' : 'No' }}
                  </BBadge>
                </BListGroupItem>
              </BListGroup>

              <h6 class="text-info mt-3">Step Source Files</h6>
              <BTable
                :items="stepSourceInfo"
                :fields="[
                  { key: 'stepURI', label: 'Step' },
                  { key: 'version', label: 'Ver' },
                  { key: 'sequence', label: 'Seq' },
                  { key: 'source', label: 'Shape Source' }
                ]"
                small
                striped
                class="mt-2"
              />
            </BCol>
          </BRow>
        </BContainer>
      </BAccordionItem>
    </BAccordion>
  </BCard>

  <!-- @show="checkTaskStepsInProcess" -->
  <BModal
    id="add-process-task-step"
    v-model="modalStore.canShowAddTaskStep"
    title="Add a step to process task"
    size="lg"
    ok-only
    scrollable
    ><p>Add a step - SHACL-FORM - task {{ processStore.processTaskInEdit }}</p>
  </BModal>
</template>

<style lang="scss" scoped></style>
