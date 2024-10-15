<script setup>
/**
 * (cardData) some title, text above and below the Form.
 * (shapeFileUrl) Imports the Central Pod's SHACL file for a org:Site
 * (shacl-form) Displays the shacl-form including the map
 * (targetResourceUrl) Writes the data into the Central Pod's /organizations/sites#UUID dataset.
 */
import { ref, computed, onBeforeMount } from 'vue'

import { getFile, getSolidDataset, toRdfJsDataset } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

// store
import { cacheStore } from '@/stores/cache'

// util to load shape and determine where to write the data
// CANNOT WORK as event handler : import { loadDataAndShapesFromNonRDFFile } from '@/utils/pod-helpers'
import { getDSUriEnding } from '@/utils/pod-helpers.js'

// props should be coming from the Central Pod's /process/task#step
const props = defineProps({
  shapeFileUrl: String, // Full URI, no relative ones
  resourceUri: String, // Where the data comes from
  cardData: Object
})
const foundRDFData = ref('')

// See above, the component is a general Modal showing any form defined as SHACL.
const emit = defineEmits(['stepHidden'])

// refs
// Allows caching of shape files
const SHAPE_DATA_URL = props.shapeFileUrl
const SOURCE_DATA_URL = props.resourceUri
const numberOfShapesLoaded = ref(0)
const dataShapesLoaded = computed(
  () => cacheStore.allShapeBlobUrls.length > numberOfShapesLoaded.value
)

// event handler (Modal is shown) : get the data and update the view
const loadDataAndShapesFromNonRDFFile = async () => {
  try {
    if (!dataShapesLoaded.value) {
      console.warn(`Trying to (re)load the shapes from POD (viewing purpose)!`)
      const data_blob = await getFile(SHAPE_DATA_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)
      console.warn(data_blob_url)
      cacheStore.allShapeBlobUrls.push(data_blob_url)
    } else {
      console.log(`CACHED SHAPE URL, length ${cacheStore.allShapeBlobUrls.length}`)
    }
  } catch (err) {
    console.error(`Failed loading file, check access: ${err}`)
  } finally {
    // Grab the dataset from the URL and convert to RDF
    console.log(`Dataset is being grabbed from ${getDSUriEnding(props.resourceUri)}.`)
    const foundDataset = await getSolidDataset(props.resourceUri, { fetch: fetch })
    const resData = toRdfJsDataset(foundDataset)
    foundRDFData.value = resData
  }
}

// event handler at hiding of the form:
const handleEndingStepWithForm = () => {
  const dataToEmit = foundRDFData.value
  emit('stepHidden', dataToEmit)
  foundRDFData.value = null
}

onBeforeMount(async () => await loadDataAndShapesFromNonRDFFile())
</script>
<template>
  <!-- v-model="modalStore.canShowViewModal" -->
  <BCard
    id="general-shacl-form"
    :title="props.cardData.title"
  >
    <span v-if="dataShapesLoaded">
      <shacl-form
        v-if="foundRDFData"
        :data-shapes-url="cacheStore.allShapeBlobUrls.at(-1)"
        :data-values="foundRDFData"
        :data-values-subject="resourceUri"
        :data-loading="`Retrieving shapes from ${getDSUriEnding(SHAPE_DATA_URL)}, data from ${getDSUriEnding(SOURCE_DATA_URL)}...`"
        data-view
        @submit="handleEndingStepWithForm"
      />
    </span>
    <BAlert v-else variant="warning" :model-value="true">
      This viewing form is based on a Resource SHACL shape at:
      <code>{{ SHAPE_DATA_URL }}</code> which could not be retrieved from the process provider!
    </BAlert>
    <div>Source data: {{ resourceUri }}</div>
    <div>Shacl data: {{ SHAPE_DATA_URL }}</div>
  </BCard>
</template>

<style lang="scss" scoped></style>
