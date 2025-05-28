<script setup>
import {
  asUrl,
  createSolidDataset,
  getInteger,
  getSolidDataset,
  getStringNoLocale,
  getThingAll,
  getUrl,
  getUrlAll
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { LDP, RDF, RDFS, VCARD } from '@inrupt/vocab-common-rdf'
import { DUL } from '@/vocabularies/DUL'
import { BCardFooter } from 'bootstrap-vue-next'
import { onBeforeMount, ref, computed } from 'vue'

// Stores
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'

// Props, refs
const props = defineProps({ taskURI: String, action: String })

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
const openStep = ref('Taskstep-0')

// Alllw to add steps.
const canAddStep = computed(
  () => Boolean(props.taskURI) && processStore.isOwnedResource(props.taskURI)
)

const shiftToStep = (s) => {
  console.log(`Emit received, setting to step ${s}!`)
  openStep.value = `TaskStep-${s}`
}

const setProcessTaskToAddStep = () => {
  processStore.processTaskInEdit = props.taskURI
  modalStore.canShowAddTaskStep = true
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

const addStepsToStepsList = (st, ver) => {
  // adds a step to the list, with no sequence yet.
  if (!st) return null
  stepsList.value.push({ step: st, sequence: null, version: ver })
  console.warn(`New stepsList`, stepsList.value)
}

const recalculateOrder = () => {
  // Group pointers by version
  const versionGroups = {}

  // First, organize pointers into version groups
  pointersList.value.forEach((pointer) => {
    const [current, next, version] = pointer
    if (!versionGroups[version]) versionGroups[version] = []
    versionGroups[version].push({ current, next })
  })

  // For each version, determine the steps sequence
  Object.entries(versionGroups).forEach(([version, pointers]) => {
    // Find starting points (where current is null)
    const startPoints = pointers.filter((p) => p.current === null).map((p) => p.next)

    if (startPoints.length === 0) {
      console.warn(`No starting points found for version ${version}`)
      return
    }

    // For each starting point, trace the chain
    startPoints.forEach((startPoint) => {
      let currentURI = startPoint
      let sequence = 0

      // Trace the chain and update sequences
      while (currentURI) {
        // Find step in stepsList and update its sequence
        const stepIndex = stepsList.value.findIndex(
          (item) => item.version == version && asUrl(item.step) === currentURI
        )

        if (stepIndex !== -1) {
          stepsList.value[stepIndex].sequence = sequence++
        } else {
          console.warn(`Step ${currentURI} not found in stepsList for version ${version}`)
        }

        // Find the next pointer in the chain
        const nextPointer = pointers.find((p) => p.current === currentURI)
        currentURI = nextPointer ? nextPointer.next : null
      }
    })
  })

  // Sort stepsList by version and sequence
  stepsList.value.sort((a, b) => {
    if (a.version !== b.version) return a.version - b.version
    return a.sequence - b.sequence
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
    taskDataSet = createSolidDataset()
  }
})

// Split the data loading into more manageable functions
const loadTaskData = async () => {
  const taskDataSet = await getSolidDataset(props.taskURI, { fetch })
  const taskContents = getThingAll(taskDataSet)
  totalThingsFound.value = taskContents.length // Add this line
  const versions = new Set()

  // Process each thing in the dataset
  taskContents.forEach((thing) => {
    const taskTypes = getUrlAll(thing, RDF.type)

    if (taskTypes.includes(DUL.Action)) {
      processActionStep(thing, versions)
    } else if (taskTypes.includes(LDP.RDFSource)) {
      processTaskDescriptor(thing)
    } else {
      console.warn('Unrecognized resource type:', taskTypes)
    }
  })

  // Update versions dropdown
  populateVersionsDropdown(versions)

  // Calculate proper sequences based on the linked list structure
  recalculateOrder()
}

// Process a step (DUL:Action)
const processActionStep = (step, versions) => {
  try {
    const stepURI = asUrl(step)

    // Extract version
    let stepVersion = getInteger(step, 'http://schema.org/version') || 0
    if (!stepVersion) {
      console.warn('Step is missing schema:version property')
      stepVersion = 0
    }

    versions.add(stepVersion)

    // Extract next step pointer
    const nextStepURI = getUrl(step, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
    const isLastStep = nextStepURI === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'

    // Add to pointers list
    pointersList.value.push([stepURI, isLastStep ? null : nextStepURI, stepVersion])

    // Add to steps list (sequence will be calculated later)
    addStepsToStepsList(step, stepVersion)
  } catch (err) {
    console.error(`Error processing step: ${err.message}`)
  }
}

// Process task descriptor (LDP.RDFSource)
const processTaskDescriptor = (descriptor) => {
  try {
    // Get first tasks in the sequence
    const firstTasks = getUrlAll(descriptor, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first')

    // Add starting points to pointers list
    firstTasks.forEach((taskURI) => {
      // We don't know the version here, will need to match later
      pointersList.value.push([null, taskURI, null])
    })

    // Extract task metadata
    taskName.value = getStringNoLocale(descriptor, RDFS.comment) || 'Unnamed Task'
    taskContact.value =
      getStringNoLocale(descriptor, VCARD.hasEmail) || getUrl(descriptor, VCARD.hasEmail) || ''
  } catch (err) {
    console.error(`Error processing task descriptor: ${err.message}`)
  }
}

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

// Add these imports
import { BBadge, BTable, BAlert, BAccordion, BAccordionItem } from 'bootstrap-vue-next'

// Add these reactive data and computed properties after your existing ones
const totalThingsFound = ref(0)

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
  }
])

const debugFields = [
  { key: 'metric', label: 'Metric' },
  { key: 'value', label: 'Value' },
  { key: 'description', label: 'Description' }
]

// Validation issues
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

  return issues
})
</script>
<template>
  <BCard no-body class="mt-2">
    <BCardHeader>
      <BRow cols="12">
        <BCol class="col-10">
          {{ action || taskName }} ({{ taskContact || 'No contact information provided' }})</BCol
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
    <BCardFooter>
      <BInputGroup :prepend="`Found ${stepsList.length} steps in this task.`">
        <BButton
          @click="setProcessTaskToAddStep"
          :disabled="!canAddStep"
          :variant="
            !props.taskURI
              ? 'secondary'
              : !processStore.isOwnedResource(props.taskURI)
                ? 'outline-secondary'
                : 'primary'
          "
        >
          <IMdiNotePlus class="mb-1 me-2" />
          {{
            !props.taskURI
              ? 'Select a task first'
              : !processStore.isOwnedResource(props.taskURI)
                ? 'Cannot edit (not your task)'
                : 'Add a task step'
          }}
        </BButton>
      </BInputGroup>
    </BCardFooter>
  </BCard>

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
