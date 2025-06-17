<script setup>
/**
 * (modalData) some title, text above and below the Form.
 * (shapeFileUrl) Imports the Central Pod's SHACL file for a org:Site
 * (shacl-form) Displays the shacl-form including the map
 * (targetResourceUrl) Writes the data into the Central Pod's /organizations/sites#UUID dataset.
 */
import { ref, computed } from 'vue'
import { BModal, BAlert } from 'bootstrap-vue-next'

import { getFile, getSolidDataset, toRdfJsDataset, getThingAll, getUrl } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { RDF_CONFIG } from '@/services/rdfConfig'

// store
import { cacheStore } from '@/stores/cache'

// util to load shape and determine where to write the data
// CANNOT WORK as event handler : import { loadDataAndShapesFromNonRDFFile } from '@/utils/pod-helpers'
import { getDSUriEnding } from '@/utils/pod-helpers.js'

// props should be coming from the Central Pod's /process/task#step
const props = defineProps({
  shapeFileUrl: String, // Full URI, no relative ones
  resourceUri: String, // Dataset URI for loading the data
  thingUri: String, // Thing URI for the SHACL form subject
  modalData: Object
})
const foundRDFData = ref('')

// See above, the component is a general Modal showing any form defined as SHACL.
const emit = defineEmits(['viewerHidden'])

// refs
// Allows caching of shape files
const SHAPE_DATA_URL = ref(props.shapeFileUrl)
const SOURCE_DATA_URL = props.resourceUri
const dataShapesLoaded = computed(() => cacheStore.isShapeCached(SHAPE_DATA_URL.value))

// event handler (Modal is shown) : get the data and update the view
const loadDataAndShapesFromNonRDFFile = async () => {
  console.log('=== ViewResourceModal Loading Debug ===')
  console.log('Props received:')
  console.log('- shapeFileUrl:', props.shapeFileUrl)
  console.log('- resourceUri:', props.resourceUri)
  console.log('- thingUri:', props.thingUri)
  console.log('- modalData:', props.modalData)

  // Validate required props first
  if (!props.resourceUri || !props.resourceUri.trim()) {
    console.error('No valid resource URI provided to ViewResourceModal')
    return
  }

  // Prevent loading if we already have data for this resource
  if (foundRDFData.value && foundRDFData.value.length > 0) {
    console.log('Data already loaded, skipping reload')
    return
  }
  try {
    // Only try to load shape file if we have a valid URL
    if (SHAPE_DATA_URL.value && SHAPE_DATA_URL.value.trim() && !dataShapesLoaded.value) {
      console.warn(
        `Trying to (re)load the shapes from POD (viewing purpose): ${SHAPE_DATA_URL.value}`
      )
      try {
        const data_blob = await getFile(SHAPE_DATA_URL.value, { fetch: fetch })
        const data_blob_url = URL.createObjectURL(data_blob)
        console.log('Shape file loaded successfully:', data_blob_url)
        cacheStore.cacheShapeBlob(SHAPE_DATA_URL.value, data_blob_url)
      } catch (shapeErr) {
        console.error(`Failed to load shape file from ${SHAPE_DATA_URL.value}:`, shapeErr)
        // Continue without shape file - we can still load the data
      }
    } else if (SHAPE_DATA_URL.value && SHAPE_DATA_URL.value.trim()) {
      console.log(`CACHED SHAPE URL, length ${cacheStore.allShapeBlobUrls.length}`)
    } else {
      console.warn('No shape file URL provided - will skip SHACL form rendering')
    }
  } catch (err) {
    console.error(`Failed loading shape file, check access: ${err}`)
  }
  // Grab the dataset from the URL and convert to RDF
  try {
    console.log(`Dataset is being grabbed from ${getDSUriEnding(props.resourceUri)}.`)
    const foundDataset = await getSolidDataset(props.resourceUri, { fetch: fetch })
    const resData = toRdfJsDataset(foundDataset)
    foundRDFData.value = resData
    console.log('Dataset loaded successfully') // Extract shape file URL from RDF data if not provided via props
    if (!SHAPE_DATA_URL.value || !SHAPE_DATA_URL.value.trim()) {
      console.log('No shape file URL provided via props, attempting to extract from RDF data...')

      try {
        const things = getThingAll(foundDataset)
        let extractedShapeUrl = null // Look for dcterms:hasFormat property in any Thing
        for (const thing of things) {
          const hasFormatUrl = getUrl(thing, RDF_CONFIG.HAS_FORMAT)
          if (hasFormatUrl) {
            extractedShapeUrl = hasFormatUrl
            console.log('Found shape file URL in RDF data:', extractedShapeUrl)
            break
          }
        }

        // If we found a shape URL, try to load it
        if (extractedShapeUrl && !cacheStore.isShapeCached(extractedShapeUrl)) {
          console.log('Loading shape file from extracted URL:', extractedShapeUrl)
          try {
            const shape_blob = await getFile(extractedShapeUrl, { fetch: fetch })
            const shape_blob_url = URL.createObjectURL(shape_blob)
            console.log('Shape file loaded successfully from extracted URL:', shape_blob_url)
            cacheStore.cacheShapeBlob(extractedShapeUrl, shape_blob_url)

            // Update SHAPE_DATA_URL to the extracted URL so the template can use it
            SHAPE_DATA_URL.value = extractedShapeUrl
          } catch (shapeErr) {
            console.error(
              `Failed to load shape file from extracted URL ${extractedShapeUrl}:`,
              shapeErr
            )
          }
        } else if (extractedShapeUrl) {
          console.log('Shape file from extracted URL already cached')
          SHAPE_DATA_URL.value = extractedShapeUrl
        } else {
          console.log('No dcterms:hasFormat property found in RDF data')
        }
      } catch (extractErr) {
        console.error('Error extracting shape file URL from RDF data:', extractErr)
      }
    }
  } catch (err) {
    console.error(`Failed to load dataset from ${props.resourceUri}:`, err)
  }

  console.log('=== End ViewResourceModal Loading Debug ===')
}

// event handler at hiding of the form:
const handleHidingModal = () => {
  const dataToEmit = foundRDFData.value
  emit('viewerHidden', dataToEmit)
  // Clear the data to ensure fresh load next time
  foundRDFData.value = null
  console.log('Modal hidden and data cleared')
}
</script>
<template>
  <BModal
    id="general-shacl-form"
    :model-value="true"
    :title="props.modalData?.title || 'View Resource'"
    :ok-only="props.modalData?.noCancel ?? true"
    @shown="loadDataAndShapesFromNonRDFFile"
    @hidden="handleHidingModal"
    size="lg"
    scrollable
    no-close-on-backdrop
  >
    <!-- Show SHACL form if we have both shape file and data -->
    <span v-if="dataShapesLoaded && foundRDFData">
      <shacl-form
        :data-shapes-url="cacheStore.getShapeBlobUrl(SHAPE_DATA_URL)"
        :data-values="foundRDFData"
        :data-values-subject="props.thingUri || props.resourceUri"
        :data-loading="`Retrieving shapes from ${getDSUriEnding(SHAPE_DATA_URL)}, data from ${getDSUriEnding(SOURCE_DATA_URL)}...`"
        data-view
      />
    </span>

    <!-- Show warning if no shape file is available -->
    <BAlert
      v-else-if="!SHAPE_DATA_URL || !SHAPE_DATA_URL.trim()"
      variant="info"
      :model-value="true"
    >
      <h6>No SHACL Shape Form Available</h6>
      <p>No shape file is configured for this resource type. The raw data is shown below:</p>
      <div v-if="foundRDFData" class="mt-3">
        <strong>Raw RDF Data:</strong>
        <pre class="bg-light p-2 mt-2 small">{{ foundRDFData }}</pre>
      </div>
    </BAlert>

    <!-- Show warning if shape file failed to load -->
    <BAlert v-else variant="warning" :model-value="true">
      This viewing form is based on a Resource SHACL shape at:
      <code>{{ SHAPE_DATA_URL }}</code> which could not be retrieved from the process provider!
    </BAlert>

    <!-- Debug information -->
    <div class="mt-3 small text-muted">
      <strong>Debug Info:</strong><br />
      Dataset URI: {{ props.resourceUri }}<br />
      Thing URI: {{ props.thingUri }}<br />
      Shape file: {{ SHAPE_DATA_URL || 'None specified' }}
    </div>
  </BModal>
</template>

<style lang="scss" scoped></style>
