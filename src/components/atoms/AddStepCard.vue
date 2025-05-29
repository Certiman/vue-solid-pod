<!--
  AddStepCard Component
  
  SHACL-form based component for adding new steps to a task.
  This is part of the management interface, separate from process execution.
-->
<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getFile,
  fromRdfJsDataset,
  saveSolidDatasetAt,
  getSolidDataset,
  createThing,
  addStringNoLocale,
  addUrl,
  addInteger,
  setThing
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { RDF, RDFS } from '@inrupt/vocab-common-rdf'
import { DUL } from '@/vocabularies/DUL'
import {
  BCard,
  BCardBody,
  BCardHeader,
  BAlert,
  BButton,
  BSpinner,
  BContainer,
  BRow,
  BCol
} from 'bootstrap-vue-next'

// Store
import { cacheStore } from '@/stores/cache'
import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'

// Props and Emits
const emit = defineEmits(['stepAdded'])
const props = defineProps({
  taskUri: String
})

// Component state
const isSubmitting = ref(false)
const isFormValid = ref(false)
const alertMessage = ref('')
const alertVariant = ref('info')
const showAlert = ref(false)
const stepShapeBlobUrl = ref(null)

// SHACL form configuration for step creation
const SHAPE_URL =
  'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Process/step_creation.ttl'
const dataShapesLoaded = computed(() => cacheStore.isShapeCached(SHAPE_URL))

// Helper function to show alerts
const displayAlert = (message, variant = 'warning', duration = 5000) => {
  alertMessage.value = message
  alertVariant.value = variant
  showAlert.value = true

  if (duration > 0) {
    setTimeout(() => {
      showAlert.value = false
    }, duration)
  }
}

// Check if user can add steps to this task
const canAddSteps = computed(() => {
  const hasTaskURI = !!props.taskUri
  const isOwnedResource = processStore.isOwnedResource(props.taskUri)

  console.log('AddStepCard - canAddSteps debug:', {
    taskURI: props.taskUri,
    selectedPodUrl: sessionStore.selectedPodUrl,
    ownStoragePodRoot: sessionStore.ownStoragePodRoot(),
    hasTaskURI,
    isOwnedResource,
    result: hasTaskURI && isOwnedResource
  })

  return hasTaskURI && isOwnedResource
})

// SHACL form event listeners
const changeListener = (event) => {
  if (event.detail?.valid) {
    isFormValid.value = true
    displayAlert('Step details are valid and ready to create', 'success', 3000)
  } else {
    isFormValid.value = false
    displayAlert('Please check all required fields', 'warning')
    console.error('Step form validation failed - missing mandatory fields!')
  }
}

const submitListener = async (event) => {
  event.preventDefault()

  if (!isFormValid.value) {
    displayAlert('Cannot create step - form data is invalid', 'danger')
    return
  }

  displayAlert('Creating new step...', 'info', 2000)
  await createStepFromForm()
}

// Load SHACL shapes from file
const loadShapesFromFile = async () => {
  try {
    if (!dataShapesLoaded.value && SHAPE_URL) {
      displayAlert('Loading step creation form...', 'info', 2000)
      console.log(`Loading step creation shapes from ${SHAPE_URL}`)

      const data_blob = await getFile(SHAPE_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)
      stepShapeBlobUrl.value = data_blob_url

      // Use caching mechanism
      cacheStore.cacheShapeBlob(SHAPE_URL, data_blob_url)

      displayAlert('Step creation form loaded successfully', 'success', 3000)
      console.log('Step creation shapes loaded successfully')
    } else if (stepShapeBlobUrl.value) {
      console.log('Step creation shapes already loaded for this AddStepCard instance.')
    }
  } catch (err) {
    console.error(`Failed loading step creation shapes: ${err}`)
    displayAlert('Failed to load step creation form. Please check access permissions.', 'danger')
  }
}

// Create step from SHACL form data
const createStepFromForm = async () => {
  if (!canAddSteps.value) {
    displayAlert('You can only add steps to your own task resources', 'danger')
    return
  }

  isSubmitting.value = true

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
    const stepTitle = formThing.predicates[RDFS.label]?.[0]?.object?.value
    const stepDescription = formThing.predicates[RDFS.comment]?.[0]?.object?.value
    const stepVersion = formThing.predicates['http://schema.org/version']?.[0]?.object?.value
    const stepSequence = formThing.predicates['http://schema.org/position']?.[0]?.object?.value
    const shapeSource = formThing.predicates['http://purl.org/dc/terms/source']?.[0]?.object?.value
    const dulRealizes = formThing.predicates[DUL.realizes]?.[0]?.object?.value

    if (!stepTitle || !stepVersion) {
      throw new Error('Missing required step information (title and version are mandatory)')
    }

    console.log('Creating step with data:', {
      stepTitle,
      stepDescription,
      stepVersion: parseInt(stepVersion),
      stepSequence: stepSequence ? parseInt(stepSequence) : null,
      shapeSource,
      dulRealizes
    })

    // Get the existing task dataset
    const taskDataSet = await getSolidDataset(props.taskUri, { fetch: fetch })

    // Generate a unique step URI within the task
    const stepIdentifier = stepTitle.replace(/\s+/g, '').toLowerCase()
    const stepURI = `${props.taskUri}#${stepIdentifier}-v${stepVersion}-${Date.now()}`

    // Create step thing
    let stepThing = createThing({ url: stepURI })

    // Add step properties
    stepThing = addUrl(stepThing, RDF.type, DUL.Action)
    stepThing = addStringNoLocale(stepThing, RDFS.label, stepTitle)
    stepThing = addInteger(stepThing, 'http://schema.org/version', parseInt(stepVersion))

    if (stepDescription) {
      stepThing = addStringNoLocale(stepThing, RDFS.comment, stepDescription)
    }

    if (stepSequence) {
      stepThing = addInteger(stepThing, 'http://schema.org/position', parseInt(stepSequence))
    }

    if (shapeSource) {
      stepThing = addUrl(stepThing, 'http://purl.org/dc/terms/source', shapeSource)
    }

    if (dulRealizes) {
      stepThing = addStringNoLocale(stepThing, DUL.realizes, dulRealizes)
    }

    // Add the step to the task dataset
    const updatedTaskDataSet = setThing(taskDataSet, stepThing)

    // Save updated task to Pod
    await saveSolidDatasetAt(props.taskUri, updatedTaskDataSet, { fetch: fetch })

    displayAlert(`Step "${stepTitle}" created successfully!`, 'success', 4000)

    // Reset form
    form.reset()
    isFormValid.value = false

    // Notify parent component
    emit('stepAdded', {
      stepURI: stepURI,
      stepTitle: stepTitle,
      stepVersion: parseInt(stepVersion)
    })
  } catch (error) {
    console.error('Failed to create step:', error)
    displayAlert(`Failed to create step: ${error.message}`, 'danger')
  } finally {
    isSubmitting.value = false
  }
}

// Setup component on mount
onMounted(async () => {
  await loadShapesFromFile()
})
</script>

<template>
  <BCard no-body class="mt-3">
    <BCardHeader>
      <h5 class="mb-0">Add New Step to Task</h5>
    </BCardHeader>

    <BCardBody>
      <!-- Alert system -->
      <BAlert v-model="showAlert" :variant="alertVariant" dismissible class="mb-3">
        {{ alertMessage }}
      </BAlert>

      <!-- Permission check -->
      <div v-if="!canAddSteps" class="text-muted">
        <p>You cannot add steps to other users' task resources.</p>
      </div>

      <!-- SHACL Form -->
      <div v-else-if="dataShapesLoaded">
        <p class="text-muted mb-3">Fill out the form below to create a new step in this task.</p>

        <BContainer fluid class="px-0">
          <BRow>
            <BCol>
              <!-- SHACL Form Component -->
              <shacl-form
                :data-shapes-url="cacheStore.getShapeBlobUrl(SHAPE_URL)"
                data-shape-subject="http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Action"
                data-values-namespace="#step"
                submit-button-text="Create Step"
                :submit-button-disabled="!isFormValid || isSubmitting"
                @change="changeListener"
                @submit="submitListener"
              ></shacl-form>

              <!-- Custom submit button when submitting -->
              <div v-if="isSubmitting" class="mt-3 text-center">
                <BButton variant="primary" disabled>
                  <BSpinner small class="me-2" />
                  Creating Step...
                </BButton>
              </div>
            </BCol>
          </BRow>
        </BContainer>
      </div>

      <!-- Loading state -->
      <div v-else class="text-center py-4">
        <BSpinner class="me-2" />
        Loading step creation form...
      </div>
    </BCardBody>
  </BCard>
</template>

<style scoped>
/* Custom styles for the step creation form */
.card-header h5 {
  color: #495057;
}

:deep(shacl-form) {
  max-width: none;
}

:deep(shacl-form .form-group) {
  margin-bottom: 1rem;
}

:deep(shacl-form .btn-primary) {
  background-color: #007bff;
  border-color: #007bff;
}

/* Dark mode styles for SHACL form buttons */
[data-bs-theme='dark'] :deep(shacl-form .btn-primary) {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>
