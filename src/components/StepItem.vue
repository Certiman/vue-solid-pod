<template>
  <BAccordionItem :title="stepTitle"
    ><div>{{ stepIntro }}</div>
    <AddResourceCard
      v-if="formShapeFile"
      :shape-file-url="formShapeFile"
      :target-resource="dataTarget"
    />
    <BRow cols="12">
      <BCol class="col-9"> </BCol>
      <BCol class="col-3" align-self="auto"
        ><BButton @click="triggerNextStep()" class="mt-2">Next step...</BButton>
      </BCol>
    </BRow></BAccordionItem
  >
</template>

<script setup>
/**
 * Renders the contents of a Step resource, as a fixed set of UI elements to find and modify resources in /data
 *
 */
import { computed, onBeforeMount, ref } from 'vue'
import { getStringWithLocale, getStringNoLocale, getUrl } from '@inrupt/solid-client'
import { DCTERMS, RDFS } from '@inrupt/vocab-common-rdf'
import { useRoute } from 'vue-router'

import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'
import { ERA } from '@/vocabularies/ERA'
import { DUL } from '@/vocabularies/DUL'

const props = defineProps({ step: Object, sequence: Number })
const emit = defineEmits(['nextStep'])
const route = useRoute()
const stepTitle = ref('') // http://www.w3.org/2000/01/rdf-schema#label (multi-lingual)
const stepIntro = ref('') // http://purl.org/dc/elements/1.1/description (idem)
const formShapeFile = ref('') // A TTL file under http://purl.org/dc/terms/source
const dulRealizesTarget = ref('') // Resource target as defined by dul:realizes property

/**
 * dataTarget
 *
 * Calculates the /data target for the entered triples. Object has properties:
 *
 * {
 * URI: the URI to write to ({UsersPodURL}/data/:process/{taskName}#{uuid})
 * subjectClass: the Class to which the Thing will belong
 * subjectNodeId: #uuid
 * }
 * */
const dataTarget = computed(() => {
  let processName

  // Check if we're in "add task to target process" mode via query parameters
  if (route.query.targetProcess && route.query.targetProcessName) {
    // Extract process name from the target process URI
    processName = processStore.extractProcessName(route.query.targetProcess)
    console.log(`StepItem: Using target process from query parameter: ${processName}`)
  } else {
    // Normal mode: extract process name from current task URI
    processName = processStore.extractProcessName(processStore.currentTaskURI)
    console.log(`StepItem: Using current task process: ${processName}`)
  }

  let resourceName

  // Check if step has dul:realizes property (preferred approach)
  if (dulRealizesTarget.value) {
    // Use the dul:realizes value directly as the resource name
    resourceName = dulRealizesTarget.value
    console.warn(`Using dul:realizes property: ${resourceName}`)
  } else {
    // Fallback to deriving resource name from task name (legacy approach)
    const taskName = processStore.shorthandForTaskURI(processStore.currentTaskURI)
    resourceName = deriveResourceName(taskName)
    console.warn(`Fallback: Derived from task name ${taskName} -> ${resourceName}`)
  }

  // Create a proper container URI with trailing slash
  const containerURI = `${sessionStore.selectedPodUrl}data${processName}/`

  // Create a resource URI (not file URI) for the specific data type
  const resourceURI = `${sessionStore.selectedPodUrl}data${processName}/${resourceName}#`

  console.warn(`Writing data outcome to container: ${containerURI}`)
  console.warn(`Writing data outcome to resource: ${resourceURI}`)

  /*
   *
   * Target: a Process at
   * {PODURL}/process/:process/:task#step will store at:
   * {UsersPodURL}/data/:process/{resourceName}#{uuid}   *
   * With dul:realizes (new approach):
   * Step defines dul:realizes "org" -> {UserPod}/data/organisation/org#
   * Step defines dul:realizes "site" -> {UserPod}/data/organisation/site#
   * Step defines dul:realizes "unit" -> {UserPod}/data/organisation/unit#
   *
   * Examples (legacy fallback):
   * {EUARPod}/process/organisation/add -> {UserPod}/data/organisation/org#
   * {EUARPod}/process/organisation/addSite -> {UserPod}/data/organisation/site#
   * {EUARPod}/process/organisation/addUnit -> {UserPod}/data/organisation/unit#
   */
  return {
    URI: resourceURI, // Use the resource URI with fragment identifier
    containerURI: containerURI, // Also provide container URI for creation if needed
    subjectClass: ERA.NAMESPACE + 'OrgOrFormalOrgShape',
    subjectNodeId: ''
  }
})

/**
 * Derive a meaningful resource name from the task name
 * @param {string} taskName - The name of the task (e.g., 'add', 'addSite', 'addUnit')
 * @returns {string} - The derived resource name (e.g., 'org', 'site', 'unit')
 */
const deriveResourceName = (taskName) => {
  if (!taskName) return 'org'

  const lowerTaskName = taskName.toLowerCase()

  // Handle common task patterns
  const taskMappings = {
    add: 'org',
    addorganisation: 'org',
    addorganization: 'org',
    addsite: 'site',
    addunit: 'unit',
    addpost: 'post',
    addmember: 'member',
    edit: 'org',
    editorganisation: 'org',
    editorganization: 'org'
  }

  // Check for exact matches first
  if (taskMappings[lowerTaskName]) {
    return taskMappings[lowerTaskName]
  }

  // Extract resource name by removing common prefixes
  let derivedName = lowerTaskName

  // Remove common prefixes
  if (derivedName.startsWith('add')) {
    derivedName = derivedName.substring(3)
  } else if (derivedName.startsWith('edit')) {
    derivedName = derivedName.substring(4)
  } else if (derivedName.startsWith('create')) {
    derivedName = derivedName.substring(6)
  } else if (derivedName.startsWith('new')) {
    derivedName = derivedName.substring(3)
  }

  // Clean up the derived name
  derivedName = derivedName.trim()

  // Map common terms to standardized names
  const termMappings = {
    organisation: 'org',
    organization: 'org',
    company: 'org',
    business: 'org',
    department: 'unit',
    location: 'site',
    address: 'site',
    place: 'site'
  }

  if (termMappings[derivedName]) {
    return termMappings[derivedName]
  }

  // If we have a meaningful derived name, use it
  if (derivedName && derivedName.length > 0) {
    return derivedName
  }

  // Fallback to 'org'
  return 'org'
}

const triggerNextStep = (seqN) => {
  // May force another seqN, but should normally just be the next seqN

  if (!seqN) seqN = Number(props.sequence + 1)
  console.log(seqN)
  emit('nextStep', seqN)
}

onBeforeMount(() => {
  // Update the step UI based on step Thing  // Extract the step's contents happens in the StepItem component.
  // Locale is hardcoded to 'en' for this application
  console.log('StepItem onBeforeMount - props.step:', props.step)
  console.log('StepItem onBeforeMount - typeof props.step:', typeof props.step)
  console.log(
    'StepItem onBeforeMount - props.step keys:',
    props.step ? Object.keys(props.step) : 'null/undefined'
  )

  if (!props.step) {
    console.error('StepItem: No step object provided!')
    return
  }
  // Try multiple English locale variants for stepTitle
  stepTitle.value =
    getStringWithLocale(props.step, RDFS.label, 'en-US') ||
    getStringWithLocale(props.step, RDFS.label, 'en') ||
    getStringNoLocale(props.step, RDFS.label) ||
    'Untitled Step'

  // Try multiple English locale variants for stepIntro
  stepIntro.value =
    getStringWithLocale(props.step, DCTERMS.description, 'en-US') ||
    getStringWithLocale(props.step, DCTERMS.description, 'en') ||
    getStringWithLocale(props.step, 'http://purl.org/dc/elements/1.1/description', 'en-US') ||
    getStringWithLocale(props.step, 'http://purl.org/dc/elements/1.1/description', 'en') ||
    getStringNoLocale(props.step, DCTERMS.description) ||
    getStringNoLocale(props.step, 'http://purl.org/dc/elements/1.1/description') ||
    ''

  formShapeFile.value = getUrl(props.step, DCTERMS.source)

  // Extract dul:realizes property if present (preferred approach for resource naming)
  dulRealizesTarget.value =
    getUrl(props.step, DUL.realizes) || getStringNoLocale(props.step, DUL.realizes)

  if (dulRealizesTarget.value) {
    console.log(`Step defines dul:realizes: ${dulRealizesTarget.value}`)
  } else {
    console.log('Step does not define dul:realizes, will use task name derivation')
  }
  // Debug output for all extracted values
  console.log('StepItem extracted values:', {
    stepTitle: stepTitle.value,
    stepIntro: stepIntro.value,
    formShapeFile: formShapeFile.value,
    dulRealizesTarget: dulRealizesTarget.value
  })

  // Debug: show which locale variants were tried
  console.log('Language extraction debug:', {
    'rdfs:label with en-US': getStringWithLocale(props.step, RDFS.label, 'en-US'),
    'rdfs:label with en': getStringWithLocale(props.step, RDFS.label, 'en'),
    'rdfs:label no locale': getStringNoLocale(props.step, RDFS.label),
    'dcterms:description with en-US': getStringWithLocale(props.step, DCTERMS.description, 'en-US'),
    'dcterms:description with en': getStringWithLocale(props.step, DCTERMS.description, 'en')
  })
})
</script>

<style lang="scss" scoped></style>
