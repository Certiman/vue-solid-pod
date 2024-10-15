<script setup>
import {
  createSolidDataset,
  getInteger,
  getSolidDataset,
  getStringNoLocale,
  getThingAll,
  getUrl
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
const stepsList = ref([])
const taskName = ref('')
const taskContact = ref('')
const taskVersions = ref([]) // is retrieved from schema:version in each step
const selectedVersion = ref('') // the version to filter from.
const openStep = ref('')

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

onBeforeMount(async () => {
  // Grab all task Things and prepare them as accordeon
  let taskDataSet,
    versions = new Set([])
  try {
    taskDataSet = await getSolidDataset(props.taskURI, { fetch: fetch })
    const taskContents = getThingAll(taskDataSet)
    // Filtering will happen on the accordeon element itself, given a general version.
    taskContents.forEach((step) => {
      try {
        // Collect the step contents in prder to run the correct visualizers
        // console.log(step)
        const taskType = getUrl(step, RDF.type)
        const isTaskDescriptor = taskType == LDP.RDFSource
        const isStep = taskType == DUL.Action
        if (isStep) {
          // A pure step

          // Extract the step Version
          const stepVersion = getInteger(step, 'http://schema.org/version') // SCHEMA_INRUPT has no prop version
          if (stepVersion) versions.add(stepVersion)
          else {
            console.warn(`Steps should always contain Integer for property 'schema:version'!`)
            versions.add(0)
          }

          // step is a non-extensible Thing, do not change it.
          stepsList.value.push(step)
        } else if (isTaskDescriptor) {
          // A task placeholder RDFSource
          taskName.value = getStringNoLocale(step, RDFS.comment)          
          taskContact.value = getStringNoLocale(step, VCARD.hasEmail) || getUrl(step, VCARD.hasEmail)
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
    //
  }
})
</script>
<template>
  <BCard no-body class="mt-2">
    <BCardHeader>
      <BRow cols="12">
        <BCol class="col-9"> {{ action || taskName }} ({{ taskContact || 'No contact information provided' }})</BCol>
        <BCol class="col-3" v-if="stepsList.length > 0"
          ><BFormSelect :options="taskVersions" v-model="selectedVersion" :disabled="stepsList.length == 0" />
        </BCol>
      </BRow>
    </BCardHeader>
    <BCardBody>
      <p v-if="stepsList.length == 0">This process task contains no steps. Please contact the owner if needed.</p>
      <BAccordion v-model="openStep" v-else-if="selectedVersion">
        <StepItem
          v-for="[i, step] of stepsList.entries()"
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
