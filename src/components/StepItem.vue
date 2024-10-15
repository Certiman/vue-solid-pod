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
        ><BButton @click="triggerNextStep()">Next step...</BButton>
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
import { getStringWithLocale, getUrl } from '@inrupt/solid-client'
import { DCTERMS, RDFS } from '@inrupt/vocab-common-rdf'

import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'
import { ERA } from '@/vocabularies/ERA'

const props = defineProps({ step: Object, sequence: Number })
const emit = defineEmits(['nextStep'])
const stepTitle = ref('') // http://www.w3.org/2000/01/rdf-schema#label (multi-lingual)
const stepIntro = ref('') // http://purl.org/dc/elements/1.1/description (idem)
const formShapeFile = ref('') // A TTL file under http://purl.org/dc/terms/source
const dataTarget = computed(() => {
  /**
   * Calculates the /data target for the entered triples. Object hasproperties:
   * {
   * URI: the URI to write to ({UsersPodURL}/data/:process/{ChosenMainPath/}{commonName})
   * subjectClass: the Class to which the Thing will belong
   * subjectNodeId: #uuid
   * }
   * */
  const URI = `${sessionStore.selectedPodUrl}data${processStore.extractProcessName(processStore.currentTaskURI)}`
  console.warn(`Writing data outcome to ${URI}..`)

  /*
   *
   * Target: a Process at
   * {PODURL}/process/:process/:task#step will always store at:
   * {UsersPodURL}/data/:process/{ChosenMainPath/}{commonName}#uuid
   *
   * Example:
   * {EUARPod}/process/organisation/:anyTask will store at:
   * {UserPod}/data/organisation/{rdfs:stubname}#uuid (for all orgs, units, sites)
   */
  return {
    URI: URI,
    subjectClass: ERA.NAMESPACE + 'OrgOrFormalOrgShape',
    subjectNodeId: ''
  }
})

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

  stepTitle.value = getStringWithLocale(props.step, RDFS.label, locale)
  stepIntro.value =
    getStringWithLocale(props.step, 'http://purl.org/dc/elements/1.1/description', locale) ||
    getStringWithLocale(props.step, DCTERMS.description, locale)
  formShapeFile.value = getUrl(props.step, DCTERMS.source)
})
</script>

<style lang="scss" scoped></style>
