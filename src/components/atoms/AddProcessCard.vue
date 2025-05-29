<template>
  <BCard header="Create New Process" class="mt-3">
    <BCardBody>
      <!-- Alert system -->
      <BAlert v-model="showAlert" :variant="alertVariant" dismissible class="mb-3">
        {{ alertMessage }}
      </BAlert>

      <!-- Permission check -->
      <div v-if="!canCreateProcess" class="alert alert-warning">
        <p class="mb-2">
          <strong>Process creation is only available for your own Pod.</strong>
        </p>
        <p class="mb-0">
          Please ensure you are logged in and have a valid process provider configured for your Pod.
        </p>
      </div>

      <!-- SHACL Form -->
      <div v-else-if="dataShapesLoaded">
        <p class="text-muted mb-3">
          Fill out the form below to create a new process definition. The process will be stored in
          your Pod's <code>/process/</code> container.
        </p>

        <!-- SHACL Form Component -->
        <shacl-form
          :data-shapes-url="cacheStore.getShapeBlobUrl(SHAPE_URL)"
          data-shape-subject="http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Workflow"
          data-values-namespace="#process"
          submit-button-text="Create Process"
          :submit-button-disabled="!isFormValid || isCreating"
          @change="changeListener"
          @submit="submitListener"
        ></shacl-form>

        <!-- Custom submit button when creating -->
        <div v-if="isCreating" class="mt-3 text-center">
          <BButton variant="primary" disabled>
            <BSpinner small class="me-2" />
            Creating Process...
          </BButton>
        </div>
      </div>

      <!-- Loading state -->
      <div v-else class="text-center py-4">
        <BSpinner class="me-2" />
        Loading process creation form...
      </div>
    </BCardBody>
  </BCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getFile,
  fromRdfJsDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addUrl,
  setThing,
  createContainerAt
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { RDF, RDFS } from '@inrupt/vocab-common-rdf'
import { DUL } from '@/vocabularies/DUL'
import { BCard, BCardBody, BButton, BAlert, BSpinner } from 'bootstrap-vue-next'

// Store
import { cacheStore } from '@/stores/cache'
import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'

// Props
const props = defineProps({
  onProcessCreated: {
    type: Function,
    default: () => {}
  }
})

// Reactive data
const isFormValid = ref(false)
const isCreating = ref(false)
const alertMessage = ref('')
const alertVariant = ref('info')
const showAlert = ref(false)

// SHACL form configuration for process creation
const SHAPE_URL = `${processStore.eraContainerURI}process_creation.ttl`
const dataShapesLoaded = computed(() => cacheStore.isShapeCached(SHAPE_URL))

// Helper function to show alerts
const displayAlert = (message, variant = 'info', duration = 5000) => {
  alertMessage.value = message
  alertVariant.value = variant
  showAlert.value = true

  if (duration > 0) {
    setTimeout(() => {
      showAlert.value = false
    }, duration)
  }
}

// Check if user can create processes (only in their own Pod)
const canCreateProcess = computed(() => {
  const hasSession = !!sessionStore.loggedInWebId && !!sessionStore.selectedPodUrl
  const hasOwnProvider = processStore.getOwnProcessProvider()

  console.log('AddProcessCard - canCreateProcess debug:', {
    hasSession,
    hasOwnProvider: !!hasOwnProvider,
    loggedInWebId: sessionStore.loggedInWebId,
    selectedPodUrl: sessionStore.selectedPodUrl,
    ownProvider: hasOwnProvider
  })

  return hasSession && !!hasOwnProvider
})

// SHACL form event listeners
const changeListener = (event) => {
  console.log('SHACL form change event:', event.detail)

  if (event.detail?.valid) {
    isFormValid.value = true
    displayAlert('Process details are valid and ready to create', 'success', 3000)
  } else {
    isFormValid.value = false
    displayAlert('Please check all required fields', 'warning')
  }
}

const submitListener = async (event) => {
  event.preventDefault()

  if (!isFormValid.value) {
    displayAlert('Cannot create process - form data is invalid', 'danger')
    return
  }

  displayAlert('Creating new process...', 'info', 2000)
  await createProcessFromForm()
}

// Load SHACL shapes from file
const loadShapesFromFile = async () => {
  try {
    if (!dataShapesLoaded.value && SHAPE_URL) {
      displayAlert('Loading process creation form...', 'info', 2000)
      console.log(`Loading process creation shapes from ${SHAPE_URL}`)

      const data_blob = await getFile(SHAPE_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)

      // Use caching mechanism
      cacheStore.cacheShapeBlob(SHAPE_URL, data_blob_url)

      displayAlert('Process creation form loaded successfully', 'success', 3000)
      console.log('Process creation shapes loaded successfully')
    } else {
      console.log('Process creation shapes already loaded.')
    }
  } catch (err) {
    console.error(`Failed loading process creation shapes: ${err}`)
    displayAlert('Failed to load process creation form. Please check access permissions.', 'danger')
  }
}

// Process creation logic
const createProcessFromForm = async () => {
  if (!canCreateProcess.value || !isFormValid.value) {
    displayAlert('Form is not ready for submission', 'warning')
    return
  }

  isCreating.value = true

  try {
    // Get data from SHACL form
    const form = document.querySelector('shacl-form')
    const shaclFormGraph = await form.toRDF()
    const shaclFormDataset = await fromRdfJsDataset(shaclFormGraph)

    // Extract form data
    const formThings = Object.values(shaclFormDataset.graphs.default)
    if (formThings.length === 0) {
      throw new Error('No data found in form')
    }

    const formThing = formThings[0]
    const processIdentifier =
      formThing.predicates['http://purl.org/dc/terms/identifier']?.[0]?.object?.value
    const processTitle = formThing.predicates[RDFS.label]?.[0]?.object?.value
    const processDescription = formThing.predicates[RDFS.comment]?.[0]?.object?.value
    const processVersion =
      formThing.predicates['http://schema.org/version']?.[0]?.object?.value || '1.0'
    const contactInfo =
      formThing.predicates['http://www.w3.org/2006/vcard/ns#hasContactInfo']?.[0]?.object?.value

    if (!processIdentifier || !processTitle) {
      throw new Error('Missing required process information (identifier and title are mandatory)')
    }

    console.log('Creating process with data:', {
      processIdentifier,
      processTitle,
      processDescription,
      processVersion,
      contactInfo
    })

    // Get the user's own process provider
    const ownProvider = processStore.getOwnProcessProvider()
    if (!ownProvider) {
      throw new Error('No owned process provider found')
    }

    // Create the process container URL
    const processContainerURL = `${ownProvider.ContainerURI}${processIdentifier}/`

    console.log('Creating process container at:', processContainerURL)

    // Create the process container
    try {
      await createContainerAt(processContainerURL, { fetch: fetch })
      displayAlert('Process container created successfully', 'success', 2000)
    } catch (containerError) {
      // Container might already exist, which could be fine
      if (containerError.status !== 409 && containerError.statusCode !== 409) {
        throw containerError
      }
      console.warn('Process container might already exist, continuing...')
    }

    // Create process metadata
    let processDataset = createSolidDataset()
    let processThing = createThing({ url: processContainerURL })

    // Add process properties from SHACL form
    processThing = addUrl(processThing, RDF.type, DUL.Workflow)
    processThing = addStringNoLocale(
      processThing,
      'http://purl.org/dc/terms/identifier',
      processIdentifier
    )
    processThing = addStringNoLocale(processThing, RDFS.label, processTitle)
    processThing = addStringNoLocale(processThing, 'http://schema.org/version', processVersion)

    if (processDescription) {
      processThing = addStringNoLocale(processThing, RDFS.comment, processDescription)
    }

    if (contactInfo) {
      processThing = addStringNoLocale(
        processThing,
        'http://www.w3.org/2006/vcard/ns#hasContactInfo',
        contactInfo
      )
    }

    processDataset = setThing(processDataset, processThing)

    // Save process metadata to the container
    const processMetadataURI = `${processContainerURL}index.ttl`
    await saveSolidDatasetAt(processMetadataURI, processDataset, { fetch: fetch })

    displayAlert(`Process "${processTitle}" created successfully!`, 'success')

    // Notify parent component
    props.onProcessCreated({
      identifier: processIdentifier,
      title: processTitle,
      uri: processContainerURL,
      data: {
        processIdentifier,
        processTitle,
        processDescription,
        processVersion,
        contactInfo
      }
    })

    // Reset form
    form.reset()
    isFormValid.value = false
  } catch (error) {
    console.error('Error creating process:', error)
    displayAlert(`Failed to create process: ${error.message}`, 'danger')
  } finally {
    isCreating.value = false
  }
}

// Setup component on mount
onMounted(async () => {
  // Initialize process providers with ERA Container
  processStore.initializeProcessProviders()

  // Load SHACL shapes
  await loadShapesFromFile()
})
</script>

<style scoped>
.shacl-form-container {
  min-height: 200px;
}

.alert {
  border-radius: 0.375rem;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.text-danger {
  color: #dc3545 !important;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}
</style>
