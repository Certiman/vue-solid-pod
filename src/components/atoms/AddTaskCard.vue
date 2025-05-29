<script setup>
/**
 * AddTaskCard - SHACL-form based component for adding new tasks to a process
 *
 * This replaces the hardcoded Bootstrap form in TaskList.vue with a proper
 * SHACL-form based approach, providing better validation and consistency
 * with the rest of the application.
 */
import { ref, computed, onMounted } from 'vue'
import {
  getFile,
  fromRdfJsDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addUrl,
  setThing
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { LDP, RDF, RDFS, VCARD } from '@inrupt/vocab-common-rdf'
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
const emit = defineEmits(['taskAdded'])
const props = defineProps({
  processUri: String
})

// Component state
const isSubmitting = ref(false)
const isFormValid = ref(false)
const alertMessage = ref('')
const alertVariant = ref('info')
const showAlert = ref(false)
const taskShapeBlobUrl = ref(null) // New local ref for this card's shape blob URL

// SHACL form configuration
const SHAPE_URL =
  'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Process/task_creation.ttl'
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

// Check if user can add tasks to this process
const canAddTasks = computed(() => {
  const hasProcessURI = !!props.processUri
  const isOwnedResource = processStore.isOwnedResource(props.processUri)

  console.log('AddTaskCard - canAddTasks debug:', {
    processURI: props.processUri,
    selectedPodUrl: sessionStore.selectedPodUrl,
    ownStoragePodRoot: sessionStore.ownStoragePodRoot(),
    hasProcessURI,
    isOwnedResource,
    result: hasProcessURI && isOwnedResource
  })

  return hasProcessURI && isOwnedResource
})

// SHACL form event listeners
const changeListener = (event) => {
  if (event.detail?.valid) {
    isFormValid.value = true
    displayAlert('Task details are valid and ready to create', 'success', 3000)
  } else {
    isFormValid.value = false
    displayAlert('Please check all required fields', 'warning')
    console.error('Task form validation failed - missing mandatory fields!')
  }
}

const submitListener = async (event) => {
  event.preventDefault()

  if (!isFormValid.value) {
    displayAlert('Cannot create task - form data is invalid', 'danger')
    return
  }

  displayAlert('Creating new task...', 'info', 2000)
  await createTaskFromForm()
}

// Load SHACL shapes from file
const loadShapesFromFile = async () => {
  try {
    if (!dataShapesLoaded.value && SHAPE_URL) {
      displayAlert('Loading task creation form...', 'info', 2000)
      console.log(`Loading task creation shapes from ${SHAPE_URL}`)

      const data_blob = await getFile(SHAPE_URL, { fetch: fetch })
      const data_blob_url = URL.createObjectURL(data_blob)
      taskShapeBlobUrl.value = data_blob_url // Set the local ref

      // Use new caching mechanism
      cacheStore.cacheShapeBlob(SHAPE_URL, data_blob_url)

      console.log('Task creation shapes loaded successfully')
    } else if (taskShapeBlobUrl.value) {
      console.log('Task creation shapes already loaded for this AddTaskCard instance.')
    }
  } catch (err) {
    console.error(`Failed loading task creation shapes: ${err}`)
    displayAlert('Failed to load task creation form. Please check access permissions.', 'danger')
  }
}

// Create task from SHACL form data
const createTaskFromForm = async () => {
  if (!canAddTasks.value) {
    displayAlert('You can only add tasks to your own process containers', 'danger')
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
    const taskName = formThing.predicates[RDFS.comment]?.[0]?.object?.value
    const taskIdentifier =
      formThing.predicates['http://purl.org/dc/terms/identifier']?.[0]?.object?.value
    const contactEmail = formThing.predicates[VCARD.hasEmail]?.[0]?.object?.value
    const taskDescription =
      formThing.predicates['http://purl.org/dc/terms/description']?.[0]?.object?.value

    if (!taskName || !taskIdentifier || !contactEmail) {
      throw new Error('Missing required task information')
    }

    console.log('Creating task with data:', {
      taskName,
      taskIdentifier,
      contactEmail,
      taskDescription
    }) // Create task URI
    const taskResourceURI = props.processUri
      .replace('#', '')
      .replace(sessionStore.ownStoragePodRoot(), '')
    const newTaskURI = taskResourceURI + taskIdentifier

    // Create task dataset
    let newTaskDS = createSolidDataset()
    let taskThing = createThing({ url: newTaskURI })

    // Add task properties
    taskThing = addStringNoLocale(taskThing, RDFS.comment, taskName)
    taskThing = addUrl(
      taskThing,
      VCARD.hasEmail,
      contactEmail.startsWith('mailto:') ? contactEmail : `mailto:${contactEmail}`
    )
    taskThing = addUrl(taskThing, RDF.type, LDP.RDFSource)
    taskThing = addUrl(taskThing, RDF.type, DUL.Task)

    if (taskDescription) {
      taskThing = addStringNoLocale(
        taskThing,
        'http://purl.org/dc/terms/description',
        taskDescription
      )
    }

    newTaskDS = setThing(newTaskDS, taskThing)

    // Save task to Pod
    await saveSolidDatasetAt(newTaskURI, newTaskDS, { fetch: fetch })

    displayAlert(`Task "${taskName}" created successfully!`, 'success', 4000)

    // Reset form
    form.reset()
    isFormValid.value = false

    // Notify parent component
    emit('taskAdded', {
      taskURI: newTaskURI,
      taskName: taskName,
      taskIdentifier: taskIdentifier
    })
  } catch (error) {
    console.error('Failed to create task:', error)
    displayAlert(`Failed to create task: ${error.message}`, 'danger')
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
      <h5 class="mb-0">Add New Task to Process</h5>
    </BCardHeader>

    <BCardBody>
      <!-- Alert system -->
      <BAlert v-model="showAlert" :variant="alertVariant" dismissible class="mb-3">
        {{ alertMessage }}
      </BAlert>

      <!-- Permission check -->
      <div v-if="!canAddTasks" class="text-muted">
        <p>You cannot add tasks to other process providers' storage.</p>
      </div>

      <!-- SHACL Form -->
      <div v-else-if="dataShapesLoaded">
        <p class="text-muted mb-3">Fill out the form below to create a new task in this process.</p>

        <BContainer fluid class="px-0">
          <BRow>
            <BCol>
              <!-- SHACL Form Component -->
              <shacl-form
                :data-shapes-url="cacheStore.getShapeBlobUrl(SHAPE_URL)"
                data-shape-subject="http://www.w3.org/ns/ldp#RDFSource"
                data-values-namespace="#task"
                submit-button-text="Create Task"
                :submit-button-disabled="!isFormValid || isSubmitting"
                @change="changeListener"
                @submit="submitListener"
              ></shacl-form>

              <!-- Custom submit button when submitting -->
              <div v-if="isSubmitting" class="mt-3 text-center">
                <BButton variant="primary" disabled>
                  <BSpinner small class="me-2" />
                  Creating Task...
                </BButton>
              </div>
            </BCol>
          </BRow>
        </BContainer>
      </div>

      <!-- Loading state -->
      <div v-else class="text-center py-4">
        <BSpinner class="me-2" />
        Loading task creation form...
      </div>
    </BCardBody>
  </BCard>
</template>

<style scoped>
/* Custom styles for the task creation form */
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
