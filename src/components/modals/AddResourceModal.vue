<script setup>
/**
 * NOT YET TESTED --- 
 * 
 * (modalData) some title, text above and below the Form.
 * (shapeFileUrl) Imports the Central Pod's SHACL file for a org:Site
 * (shacl-form) Displays the shacl-form including the map
 * (targetResource).
 *      URI:  Writes the data into the Central Pod's /organizations/sites#UUID dataset.
 *      :data-shape-subject="props.targetResource.subjectClass"
        :data-values-namespace="`#${props.targetResource.subjectNodeId}`"
 */
import { ref, onMounted, computed } from 'vue'

import { BModal, BAlert } from 'bootstrap-vue-next'
import { ShaclForm } from '@ulb-darmstadt/shacl-form'
import {
    getFile,
    fromRdfJsDataset,
    //   saveSolidDatasetInContainer,
    saveSolidDatasetAt,
    getSolidDataset,
    getThingAll,
    setThing
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

// Store
import { store } from '@/stores/store'

// Props and Emits
const emit = defineEmits(['DataSetUpdated'])

// See above, the component is a general Modal showing any form defined as SHACL.
// props should be coming from the Central Pod's /process/task#step
const props = defineProps({
  shapeFileUrl: String, // absolute URL to the container!
  targetResource: Object,
  modalData: Object
})

// Option to read shape from a Pod (as a file)
const DATA_URL = props.shapeFileUrl
const numberOfShapesLoaded = ref(0)
const dataShapesLoaded = computed(() => store.allShapeBlobUrls.length > numberOfShapesLoaded.value)

// Adding event listeners to the form in order to check and use the generated content
const changeListener = (event) => {
  const form = document.querySelector('shacl-form')
  // check if form data validates according to the SHACL shapes
  if (event.detail?.valid) {
    // get data graph as RDF triples and
    // log them to the browser console
    const triples = form.serialize()
    console.log('entered form data', triples)
    // store the data somewhere, e.g. in a triple store
  } else {
    console.error('Check data completeness, missing mandatory fields!')
  }
}

const submitListener = async (event) => {
  event.preventDefault()
  await addResourceAsRDF()
}

// Shape files are alas non-RDF resources
// reset forces a new Blob
const loadShapesFromNonRDFFile = async () => {
  try {
    if (!dataShapesLoaded.value) {
      console.log(`(editing) Trying to (re)load the shapes from POD at ${DATA_URL}!`)
      const data_blob = await getFile(DATA_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)
      store.allShapeBlobUrls.push(data_blob_url)
    } else {
      console.warn(`Blob URL from cache, length ${store.allShapeBlobUrls.length}`)
    }
  } catch (err) {
    console.error(`Failed loading file, check access: ${err}`)
  }
}

const addResourceAsRDF = async () => {
  let targetDataset

  console.log(`Storing RDFResource at ${props.targetResource.URI}.`)
  try {
    // Get data out of the shacl-form
    const form = document.querySelector('shacl-form')
    //   const shaclFormGraph = new Store(), uses N3.Store(), not needed as shacl-form does this
    const shaclFormGraph = await form.toRDF()

    // Convert RDF store into a Solid dataset
    const shaclFormDataset = await fromRdfJsDataset(shaclFormGraph)

    // The following works but does not append data when used a second time in the same resource myShaclList
    // as this seemingly is totally not the function
    // const containerURL = `https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/getting-started/readingList/`
    // await saveSolidDatasetInContainer(containerURL, shaclFormDataset, { fetch: fetch, slugSuggestion: 'myShaclList' })
    // without slugSuggestion, a UUID is generated as the data RDFsource

    // THUS, we need to store the new Things from the SHACL dataset in the EXISTING dataset container
    // First get the current dataset
    targetDataset = await getSolidDataset(props.targetResource.URI, { fetch: fetch })

    // get all Things from the shaclFormDataset
    const shaclFormThings = getThingAll(shaclFormDataset)

    // add the things from ShaclForm to the existing set
    shaclFormThings.forEach((thing) => (targetDataset = setThing(targetDataset, thing)))

    // save the new dataset
    let updatedDataset = await saveSolidDatasetAt(props.targetResource.URI, targetDataset, {
      fetch: fetch
    })

    // EMIT the signal to the main page in order to refesh the list
    // Also emit the updatedDataset itself, to reuse the cycle of the basic app
    numberOfShapesLoaded.value += 1 // forces a reload
    await loadShapesFromNonRDFFile() // reset the form
    emit('DataSetUpdated', updatedDataset) // pushes the saved DS to the parent ReadingList compoment
    store.canShowEditModal = false // hides the modal
  } catch (err) {
    console.error(`Storing book failed with error ${err}!`)
  }
}

onMounted(async () => await loadShapesFromNonRDFFile())
</script>

<template>
  <BModal
    id="add-resource-form-modal"
    v-model="store.canShowEditModal"
    :title="`Input the new resource data (Shape ${dataShapesLoaded ? ' ' : 'not '}loaded)`"
    @shown="loadShapesFromNonRDFFile"
    size="lg"
    hide-footer
    scrollable
  >
    {{ DATA_URL }}
    <span v-if="dataShapesLoaded">
      <!-- v-for="[ind, DATA_SHAPE_BLOB] of store.allShapeBlobUrls.entries()"
          :key="ind" -->
      <!-- :data-shapes-url="DATA_SHAPE_BLOB" -->
      <shacl-form
        :data-shapes-url="store.allShapeBlobUrls.at(-1)"
        @change="changeListener"
        @submit="submitListener"
        data-show-node-ids
        data-collapse
        :data-shape-subject="props.targetResource.subjectClass"
        :data-values-namespace="`#${props.targetResource.subjectNodeId}`"
        data-submit-button="Save"
        :data-loading="`Retrieving shapes from ${DATA_URL}...`"
        data-generate-node-shape-reference="http://purl.org/dc/terms/conformsTo"
      />
    </span>
    <BAlert v-else variant="warning" :model-value="true">
      This form is based on a Resource SHACL shape at: <code>{{ DATA_URL }}</code> which could not
      be retrieved from the process provider. Please contact {{ props.processProvider.email }}.
    </BAlert>
  </BModal>
</template>

<style lang="scss" scoped></style>
