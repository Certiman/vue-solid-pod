<template>
  <BModal
    id="form-for-data"
    v-model="store.canShowModal"
    :title="`Input the new book's data (Shape ${dataShapesLoaded ? ' ' : 'not '}loaded)`"
    @shown="loadShapesFromNonRDFFile"
    scrollable
  >
    <span v-if="dataShapesLoaded">
      <shacl-form
        v-for="[ind, DATA_SHAPE_BLOB] of store.allShapeBlobUrls.entries()"
        :key="ind"
        :data-shapes-url="DATA_SHAPE_BLOB"
        @change="changeListener"
        @submit="submitListener"
        data-shape-subject="http://example.org/Dataset"
        data-values-namespace="#title-"
        data-submit-button="Save"
        data-show-node-ids
        data-generate-node-shape-reference="http://purl.org/dc/terms/conformsTo"
        data-collapse
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
import { getFile } from '@inrupt/solid-client'
import { Store } from 'n3'
// import { RDF } from '@inrupt/vocab-common-rdf'

import { store } from '../stores/store'

// Option to read shape from a Pod (as a file)
const DATA_URL = `${store.selectedPodUrl}getting-started/formShapes/new_book_form.ttl`
const dataShapesLoaded = computed(() => store.allShapeBlobUrls.length > 0)

// Adding event listeners to the form in order to check and use the generated content
const changeListener = (event) => {
  const form = document.querySelector('shacl-form')
  console.log('Change triggered. Event:', event)
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
  console.log('Submit detected. Event:', event)
  event.preventDefault()
  await addBookAsRDF()
}

// Shape files are alas non-RDF resources
const loadShapesFromNonRDFFile = async () => {
  try {
    if (!dataShapesLoaded.value) {
      console.log(`Trying to load the shapes from POD!`)
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
  const form = document.querySelector('shacl-form')

  console.log('adding Book, based on data in form...')
  const tstore = new Store()
}

onMounted(async () => await loadShapesFromNonRDFFile())
</script>

<style lang="scss" scoped></style>
