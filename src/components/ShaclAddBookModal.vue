<template>
  <BModal
    id="form-for-data"
    v-model="store.canShowModal"
    :title="`Input the new book's data (Shape ${dataShapesLoaded ? ' ' : 'not '}loaded)`"
    @shown="loadShapesFromNonRDFFile"
    size="lg"
    hide-footer
    scrollable
  >
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
        data-shape-subject="http://example.org/Dataset"
        data-values-namespace="#title-"
        data-submit-button="Save"
        :data-loading="`Retrieving shapes from ${DATA_URL}...`"
        data-generate-node-shape-reference="http://purl.org/dc/terms/conformsTo"
      />
    </span>
    <BAlert v-else variant="warning" :model-value="true">
      This form is based on a 'Book'- SHACL shape at: <code>{{ DATA_URL }}</code> which could not be
      retrieved. Please copy the TTL file from the repo (/src/shapes/) to your Solid Pod.
    </BAlert>
  </BModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

import { BModal, BAlert } from 'bootstrap-vue-next'
import { ShaclForm } from '@ulb-darmstadt/shacl-form'
import { fetch } from '@inrupt/solid-client-authn-browser'
import {
  getFile,
  fromRdfJsDataset,
  //   saveSolidDatasetInContainer,
  saveSolidDatasetAt,
  getSolidDataset,
  getThingAll,
  setThing
} from '@inrupt/solid-client'
// import { Store } from 'n3'
// import { RDF } from '@inrupt/vocab-common-rdf'

const emit = defineEmits(['DataSetUpdated'])

import { store } from '../stores/store'

// Option to read shape from a Pod (as a file)
const DATA_URL = `${store.selectedPodUrl}getting-started/formShapes/new_book_form.ttl`
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
  await addBookAsRDF()
}

// Shape files are alas non-RDF resources
// reset forces a new Blob
const loadShapesFromNonRDFFile = async () => {
  try {
    if (!dataShapesLoaded.value) {
      console.log(`Trying to (re)load the shapes from POD!`)
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

const addBookAsRDF = async () => {
  let myReadingList

  console.log(`Storing book in RDFResource ${store.readingListURL}.`)
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
    myReadingList = await getSolidDataset(store.readingListURL, { fetch: fetch })

    // get all Things from the shaclFormDataset
    const shaclFormThings = getThingAll(shaclFormDataset)

    // add the things from ShaclForm to the existing set
    shaclFormThings.forEach((thing) => (myReadingList = setThing(myReadingList, thing)))

    // save the new dataset
    let savedReadingList = await saveSolidDatasetAt(store.readingListURL, myReadingList, {
      fetch: fetch
    })

    // EMIT the signal to the main page in order to refesh the list
    // Also emit the savedReadingList itself, to reuse the cycle of the basic app
    numberOfShapesLoaded.value += 1 // forces a reload
    await loadShapesFromNonRDFFile() // reset the form
    emit('DataSetUpdated', savedReadingList) // pushes the saved DS to the parent ReadingList compoment
    store.canShowModal = false // hides the modal
  } catch (err) {
    console.error(`Storing book failed with error ${err}!`)
  }
}

onMounted(async () => await loadShapesFromNonRDFFile())
</script>

<style lang="scss" scoped></style>
