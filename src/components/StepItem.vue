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

import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'
import { ERA } from '@/vocabularies/ERA'

const props = defineProps({ step: Object, sequence: Number })
const emit = defineEmits(['nextStep'])
const stepTitle = ref('') // http://www.w3.org/2000/01/rdf-schema#label (multi-lingual)
const stepIntro = ref('') // http://purl.org/dc/elements/1.1/description (idem)
const formShapeFile = ref('') // A TTL file under http://purl.org/dc/terms/source
const schemaTarget = ref('') // Resource target as defined by schema:target property

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
  // Extract process name (e.g., "/Organisation" from process URI)
  const processName = processStore.extractProcessName(processStore.currentTaskURI)

  let resourceName

  // Check if step has schema:target property (preferred approach)
  if (schemaTarget.value) {
    // Use the schema:target value directly as the resource name
    resourceName = schemaTarget.value
    console.warn(`Using schema:target property: ${resourceName}`)
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
   * {UsersPodURL}/data/:process/{resourceName}#{uuid}
   *
   * With schema:target (new approach):
   * Step defines schema:target "org" -> {UserPod}/data/organisation/org#
   * Step defines schema:target "site" -> {UserPod}/data/organisation/site#
   * Step defines schema:target "unit" -> {UserPod}/data/organisation/unit#
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
  // Update the step UI based on step Thing
  // Extract the step's contents happens in the StepItem component.
  // TODO: i19 internationalisation of the app should set this language
  // See https://vue-i18n.intlify.dev/guide/essentials/scope.html
  const locale = sessionStore.locale

  //   console.log(props.step);

  stepTitle.value = getStringWithLocale(props.step, RDFS.label, locale)
  stepIntro.value =
    getStringWithLocale(props.step, 'http://purl.org/dc/elements/1.1/description', locale) ||
    getStringWithLocale(props.step, DCTERMS.description, locale)
  formShapeFile.value = getUrl(props.step, DCTERMS.source)
  // Extract schema:target property if present (preferred approach for resource naming)
  schemaTarget.value =
    getUrl(props.step, 'http://schema.org/target') ||
    getStringNoLocale(props.step, 'http://schema.org/target')

  if (schemaTarget.value) {
    console.log(`Step defines schema:target: ${schemaTarget.value}`)
  } else {
    console.log('Step does not define schema:target, will use task name derivation')
  }
})
</script>

<style lang="scss" scoped></style>
