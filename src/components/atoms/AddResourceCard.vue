<script setup>
/**
 * NOT YET TESTED --- 
 * 
 * https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/formalorg_unit.ttl
 * 
 * (cardData) some title, text above and below the Form.
 * (shapeFileUrl) Imports the Central Pod's SHACL file for a org:Site
 * (shacl-form) Displays the shacl-form including the map
 * (targetResource).
 *      URI:  Writes the data into the Central Pod's /organizations/sites#UUID dataset.
 *      :data-shape-subject="props.targetResource.subjectClass"
        :data-values-namespace="`#${props.targetResource.subjectNodeId}`"
 */
import { ref, onMounted, computed } from 'vue'

import {
  getFile,
  fromRdfJsDataset,
  //   saveSolidDatasetInContainer,
  saveSolidDatasetAt,
  getSolidDataset,
  getThingAll,
  setThing,
  createSolidDataset,
  createContainerAt,
  buildThing
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import {
  BAlert,
  BProgress,
  BBadge,
  BListGroup,
  BListGroupItem,
  BContainer,
  BRow,
  BCol
} from 'bootstrap-vue-next'
import { RDF_CONFIG } from '@/services/rdfConfig'

// Store
import { cacheStore } from '@/stores/cache'
import { modalStore } from '@/stores/ui'

// Props and Emits
const emit = defineEmits(['DataSetUpdated'])

// See above, the component is a general Modal showing any form defined as SHACL.
// props should be coming from the Central Pod's /process/task#step
const props = defineProps({
  shapeFileUrl: String, // absolute URL to the container!
  targetResource: Object,
  cardData: Object // not needed in Step, as it is provided.
})

// Alert system
const alertMessage = ref('')
const alertVariant = ref('info')
const alertDuration = ref(0) // 0 = hidden, positive value = shown with countdown
const alertCountdown = ref(0)

// RDF data preview
const currentRdfData = ref('')
const isFormValid = ref(false)
const showRdfPreview = ref(false)

// Shape loading counter for triggering reloads
const numberOfShapesLoaded = ref(0)

// Helper function to show alerts
const showAlert = (message, variant = 'warning', duration = 5000) => {
  alertMessage.value = message
  alertVariant.value = variant
  alertDuration.value = duration
  alertCountdown.value = duration
}

// Option to read shape from a Pod (as a file)
const DATA_URL = props.shapeFileUrl
const dataShapesLoaded = computed(() => cacheStore.isShapeCached(DATA_URL))

// Adding event listeners to the form in order to check and use the generated content
const changeListener = (event) => {
  const form = document.querySelector('shacl-form')
  // check if form data validates according to the SHACL shapes
  if (event.detail?.valid) {
    isFormValid.value = true
    showAlert('Form data is valid and ready to submit', 'success', 3000)

    // get data graph as RDF triples and display them
    const triples = form.serialize()
    currentRdfData.value = triples
    showRdfPreview.value = true
    console.log('entered form data', triples)
  } else {
    isFormValid.value = false
    showRdfPreview.value = false
    showAlert('Form validation failed - please check all required fields', 'warning')
    console.error('Check data completeness, missing mandatory fields!')
  }
}

const submitListener = async (event) => {
  event.preventDefault()

  if (!isFormValid.value) {
    showAlert('Cannot submit - form data is invalid', 'danger')
    return
  }

  showAlert('Saving data to Solid Pod...', 'info', 2000)
  await addResourceAsRDF()
}

// Shape files are alas non-RDF resources
// reset forces a new Blob
const loadShapesFromNonRDFFile = async () => {
  try {
    if (!dataShapesLoaded.value && DATA_URL) {
      showAlert('Loading SHACL shapes from Pod...', 'info', 2000)
      console.log(`(editing) Trying to (re)load the shapes from POD at ${DATA_URL}!`)
      const data_blob = await getFile(DATA_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)
      cacheStore.cacheShapeBlob(DATA_URL, data_blob_url)
      showAlert('SHACL shapes loaded successfully', 'success', 3000)
    } else {
      console.warn(`Blob URL from cache, length ${cacheStore.allShapeBlobUrls.length}`)
    }
  } catch (err) {
    showAlert(`Failed to load shapes file: ${err.message}`, 'danger')
    console.error(`Failed loading file, check access: ${err}`)
  }
}

const addResourceAsRDF = async () => {
  let targetDataset

  console.log(`Storing RDFResource at ${props.targetResource.URI}.`)
  try {
    showAlert('Processing form data...', 'info', 2000)

    // Get data out of the shacl-form
    const form = document.querySelector('shacl-form')
    const shaclFormGraph = await form.toRDF()

    // Convert RDF store into a Solid dataset
    const shaclFormDataset = await fromRdfJsDataset(shaclFormGraph)

    showAlert('Checking target location...', 'info', 2000)

    // HANDLE CONTAINER AND DATASET CREATION
    try {
      // First try to get the existing dataset
      targetDataset = await getSolidDataset(props.targetResource.URI, { fetch: fetch })
      console.log('Target dataset already exists')
    } catch (error) {
      // Dataset doesn't exist, we need to create it
      console.log('Target dataset does not exist, creating...')

      if (error.status === 404 || error.statusCode === 404) {
        // Check if we have a container URI to create first
        if (props.targetResource.containerURI) {
          try {
            console.log(`Creating container at ${props.targetResource.containerURI}`)
            await createContainerAt(props.targetResource.containerURI, { fetch: fetch })
            showAlert('Created data container successfully', 'success', 2000)
          } catch (containerError) {
            // Container might already exist, which is fine
            if (containerError.status !== 409 && containerError.statusCode !== 409) {
              console.warn('Could not create container:', containerError)
            }
          }
        }

        // Create a new empty dataset
        targetDataset = createSolidDataset()
        console.log('Created new empty dataset')
        showAlert('Created new dataset', 'success', 2000)
      } else {
        // Some other error occurred
        throw error
      }
    }

    showAlert('Saving to Solid Pod...', 'info', 2000) // THUS, we need to store the new Things from the SHACL dataset in the EXISTING dataset container
    // get all Things from the shaclFormDataset
    const shaclFormThings = getThingAll(shaclFormDataset) // add the things from ShaclForm to the existing set
    shaclFormThings.forEach((thing) => {
      // Add dcterms:hasFormat property to store the shape file URL
      // This creates a reliable link between the resource and its creation shape file
      if (props.shapeFileUrl) {
        const updatedThing = buildThing(thing)
          .setUrl(RDF_CONFIG.HAS_FORMAT, props.shapeFileUrl)
          .build()
        targetDataset = setThing(targetDataset, updatedThing)
      } else {
        targetDataset = setThing(targetDataset, thing)
      }
    })

    // save the new dataset
    let updatedDataset = await saveSolidDatasetAt(props.targetResource.URI, targetDataset, {
      fetch: fetch
    })

    // Success!
    showAlert(`Successfully saved ${shaclFormThings.length} resource(s) to Pod`, 'success', 4000)

    // EMIT the signal to the main page in order to refesh the list
    // Also emit the updatedDataset itself, to reuse the cycle of the basic app
    numberOfShapesLoaded.value += 1 // forces a reload
    await loadShapesFromNonRDFFile() // reset the form
    emit('DataSetUpdated', updatedDataset) // pushes the saved DS to the parent ReadingList compoment
    modalStore.canShowEditModal = false // hides the modal

    // Reset form state
    showRdfPreview.value = false
    currentRdfData.value = ''
    isFormValid.value = false
  } catch (err) {
    showAlert(`Failed to save resource: ${err.message}`, 'danger')
    console.error(`Storing RDFResource failed with error ${err}!`)
  }
}

onMounted(async () => await loadShapesFromNonRDFFile())
</script>

<template>
  <!-- Main form card -->
  <BCard id="add-resource-form-card" header="Input the new resource data" class="mt-2" no-body>
    <BCardBody>
      <span v-if="dataShapesLoaded">
        <!-- v-for="[ind, DATA_SHAPE_BLOB] of cacheStore.allShapeBlobUrls.entries()"
          :key="ind" -->
        <!-- :data-shapes-url="DATA_SHAPE_BLOB" -->
        <!-- TODO: what if NOT the first node!! 
         data-shape-subject="props.targetResource.subjectClass" 
        -->
        <shacl-form
          :data-shapes-url="cacheStore.getShapeBlobUrl(DATA_URL)"
          @change="changeListener"
          @submit="submitListener"
          data-show-node-ids
          data-collapse
          :data-values-namespace="`#${props.targetResource.subjectNodeId}`"
          data-submit-button="Save"
          :data-loading="`Retrieving shapes from ${DATA_URL}...`"
          :data-generate-node-shape-reference="RDF_CONFIG.CONFORMS_TO"
        />
      </span>
      <BAlert v-else variant="warning" :model-value="true">
        This form is based on a Resource SHACL shape at: <code>{{ DATA_URL }}</code> which could not
        be retrieved from the process provider. Please contact the task contact below.
      </BAlert>
    </BCardBody>
    <BCardFooter>
      Shape was {{ dataShapesLoaded ? ' ' : 'not ' }}loaded from: {{ DATA_URL }}
    </BCardFooter>
  </BCard>

  <!-- Alert system -->
  <BAlert
    v-model="alertDuration"
    ref="statusAlert"
    :variant="alertVariant"
    @close-countdown="alertCountdown = $event"
    class="mt-3"
    v-if="alertDuration > 0"
  >
    <p>{{ alertMessage }}</p>
    <BProgress :variant="alertVariant" :max="alertDuration" :value="alertCountdown" height="4px" />
  </BAlert>

  <!-- RDF Data Preview Card -->
  <BCard class="mt-3" no-body v-if="showRdfPreview">
    <BCardHeader>
      <div class="d-flex justify-content-between align-items-center">
        <span>
          <IMdiCodeTags class="me-2" />
          RDF Data Preview
        </span>
        <BBadge :variant="isFormValid ? 'success' : 'warning'">
          {{ isFormValid ? 'Valid' : 'Invalid' }}
        </BBadge>
      </div>
    </BCardHeader>
    <BCardBody>
      <BContainer fluid>
        <BRow>
          <BCol md="8">
            <h6 class="text-primary">Generated RDF Triples</h6>
            <small class="text-muted">Data that will be saved to your Pod</small>
            <pre
              class="bg-body-secondary p-3 mt-2 border rounded"
            ><code>{{ currentRdfData }}</code></pre>
          </BCol>
          <BCol md="4">
            <h6 class="text-info">Target Information</h6>
            <BListGroup>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>Resource URI:</span>
                <code class="small">{{
                  props.targetResource?.URI
                    ? props.targetResource.URI.includes('#')
                      ? props.targetResource.URI.split('/').slice(-2).join('/')
                      : props.targetResource.URI.split('/').slice(-2).join('/')
                    : 'Not set'
                }}</code>
              </BListGroupItem>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>Storage Type:</span>
                <BBadge :variant="props.targetResource?.URI?.includes('#') ? 'success' : 'warning'">
                  {{ props.targetResource?.URI?.includes('#') ? 'RDF Resource' : 'File/Dataset' }}
                </BBadge>
              </BListGroupItem>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>Subject Class:</span>
                <code class="small">{{
                  props.targetResource?.subjectClass?.split('/').pop() || 'Not set'
                }}</code>
              </BListGroupItem>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>Node ID:</span>
                <code class="small">{{
                  props.targetResource?.subjectNodeId || 'Generated automatically'
                }}</code>
              </BListGroupItem>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>Form Status:</span>
                <BBadge :variant="isFormValid ? 'success' : 'danger'">
                  {{ isFormValid ? 'Ready to save' : 'Validation errors' }}
                </BBadge>
              </BListGroupItem>
            </BListGroup>

            <h6 class="text-secondary mt-3">Data Summary</h6>
            <BListGroup>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>RDF Lines:</span>
                <BBadge variant="info">{{
                  currentRdfData.split('\n').filter((line) => line.trim()).length
                }}</BBadge>
              </BListGroupItem>
              <BListGroupItem class="py-1 d-flex justify-content-between">
                <span>Characters:</span>
                <BBadge variant="secondary">{{ currentRdfData.length }}</BBadge>
              </BListGroupItem>
            </BListGroup>
          </BCol>
        </BRow>
      </BContainer>
    </BCardBody>
  </BCard>
</template>

<style lang="scss" scoped></style>
