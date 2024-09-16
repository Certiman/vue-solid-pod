<template>
  <BModal
    id="form-for-view"
    v-model="store.canShowViewModal"
    title="Book Information"
    @shown="loadDataAndShapesFromNonRDFFile"
    @hidden="BookUrlValues = null"
    size="lg"
    scrollable
  >
    <span v-if="dataShapesLoaded">
      <shacl-form
        v-if="BookUrlValues"
        :data-shapes-url="store.allShapeBlobUrls.at(-1)"
        :data-values="BookUrlValues"
        :data-values-subject="BookUrl"
        :data-loading="`Retrieving shapes from ${getDSUriEnding(SHAPE_DATA_URL)}, data from ${getDSUriEnding(BookUrl)}...`"
        data-view
      />
    </span>
    <BAlert v-else variant="warning" :model-value="true">
      This viewing form is based on a 'Book'- SHACL shape at:
      <code>{{ SHAPE_DATA_URL }}</code> which could not be retrieved. Please copy the TTL file from
      the repo (/src/shapes/) to your Solid Pod.
    </BAlert>
  </BModal>
</template>

<script setup>
/** 
 * ShaclEditBookModal will require the BookItem to return its ?s URI for the SHACLForm data
  to be grabbed as a instance and then data-viewed...
  */
import { ref, computed } from 'vue'
import { getFile, getSolidDataset, toRdfJsDataset } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import { store } from '@/stores/store'
const props = defineProps({ BookUrl: String })
const BookUrlValues = ref('')

// refs
// Option to read shape from a Pod (as a file)
const SHAPE_DATA_URL = `${store.selectedPodUrl}getting-started/formShapes/new_book_form.ttl`
const numberOfShapesLoaded = ref(0)
const dataShapesLoaded = computed(() => store.allShapeBlobUrls.length > numberOfShapesLoaded.value)

// helper
const getDSUriEnding = (fullUri) => fullUri.substr(fullUri.lastIndexOf('/'))

// Shape files are alas non-RDF resources
// reset forces a new Blob
const loadDataAndShapesFromNonRDFFile = async () => {
  try {
    if (!dataShapesLoaded.value) {
      console.log(`Trying to (re)load the shapes from POD (viewing purpose)!`)
      const data_blob = await getFile(SHAPE_DATA_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)
      store.allShapeBlobUrls.push(data_blob_url)
    } else {
      console.warn(`Blob SHAPE URL from cache, length ${store.allShapeBlobUrls.length}`)
    }
  } catch (err) {
    console.error(`Failed loading file, check access: ${err}`)
  } finally {
    // Grab the dataset from the URL and convert to RDF
    console.log(`Dataset is being grabbed from ${getDSUriEnding(props.BookUrl)}.`)
    const bookDataSet = await getSolidDataset(props.BookUrl, { fetch: fetch })
    const bookData = toRdfJsDataset(bookDataSet)
    BookUrlValues.value = bookData
  }
}
</script>

<style lang="scss" scoped></style>
