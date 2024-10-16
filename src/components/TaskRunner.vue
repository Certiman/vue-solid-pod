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
const canAddStep = computed(() => Boolean(props.taskURI))

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

const recalculateOrder = (list) => {
  // TODO: a sequence number for the elements in list are deduced from first, rest in pointers.
  return list
}

onBeforeMount(async () => {
  // Grab all task Things and prepare them as accordeon, activate the first accordeaon
  let taskDataSet,
    versions = new Set([])
  try {
    taskDataSet = await getSolidDataset(props.taskURI, { fetch: fetch })
    const taskContents = getThingAll(taskDataSet)
    // Filtering will happen on the accordeon element itself, given a general version.
    taskContents.forEach((step) => {
      try {
        // Collect the step contents in prder to run the correct visualizers
        console.log(step)
        const taskType = getUrlAll(step, RDF.type) // || getUrl(step, RDF.type)
        const isTaskDescriptor = taskType.includes(LDP.RDFSource) // || taskType == LDP.RDFSource
        const isStep = taskType.includes(DUL.Action) // taskType == DUL.Action
        if (isStep) {
          // A pure step with a URI
          const stepURI = asUrl(step)

          // Extract the step Version
          let stepVersion = getInteger(step, 'http://schema.org/version') // SCHEMA_INRUPT has no prop version
          if (!stepVersion) {
            stepVersion = 0
            console.warn(`Steps should always contain Integer for property 'schema:version'!`)
          }
          versions.add(stepVersion)

          // Extract the rest URI, it MUST be unique!
          const nextStepURI = getUrl(step, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
          pointersList.value.push([
            stepURI,
            nextStepURI == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil' ? null : nextStepURI,
            stepVersion
          ])

          // step is a non-extensible Thing, do not change it.
          // stepsList.value.push(step)
          addStepsToStepsList(step, stepVersion)
        } else if (isTaskDescriptor) {
          // A task placeholder RDFSource

          // Place the first tasks in pointers as [ [null, URI1], [null, URI6] ], they will be complemented later.
          const firstTasks = getUrlAll(step, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first') // RDFS.first not present?
          pointersList.value.push(firstTasks.map((task_uri) => [null, task_uri]))

          // Data about the task and contact
          taskName.value = getStringNoLocale(step, RDFS.comment)
          taskContact.value =
            getStringNoLocale(step, VCARD.hasEmail) || getUrl(step, VCARD.hasEmail)
        } else {
          console.error(`Resource is not identified as a Step.`)
        }
      } catch (err) {
        console.error(`Building steps failed: ${err}.`)
      }
    })

    versions.forEach((v, i, set) => {
      // console.log(`Pushing version object at index ${i}, value ${v}, from set`, set)
      taskVersions.value.push({ value: Number(v), text: `Version ${v}` })
    })
  } catch (err) {
    console.error(err)
    console.warn(` No task data was found at this URI. Will push the /add route`)
    taskDataSet = createSolidDataset()
  } finally {
    // Try to add the order of the steps, and cache them!
  }
})
</script>
<template>
  <BCard no-body class="mt-2">
    <BCardHeader>
      <BRow cols="12">
        <BCol class="col-9">
          {{ action || taskName }} ({{ taskContact || 'No contact information provided' }})</BCol
        >
        <BCol class="col-3" v-if="canDisplaySteps"
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
      <!-- v-b-tooltip="{ title: 'Add a step to this Task' }" -->
      <BInputGroup :prepend="`Found ${stepsList.length} steps in this task.`">
        <BButton @click="setProcessTaskToAddStep" :disabled="!canAddStep"
          ><IMdiNotePlus class="mb-1 me-2" />Add a task step</BButton
        >
      </BInputGroup>
    </BCardFooter>
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
