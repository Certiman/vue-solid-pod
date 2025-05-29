<template>
  <BCard header="Create New Process" class="mt-3">
    <BCardBody>
      <div v-if="!canCreateProcess" class="alert alert-warning">
        <p class="mb-2">
          <strong>Process creation is only available for your own Pod.</strong>
        </p>
        <p class="mb-0">
          Please ensure you are logged in and have a valid process provider configured for your Pod.
        </p>
      </div>

      <div v-else>
        <!-- Process creation form using SHACL -->
        <div v-if="!isFormValid" class="mb-3">
          <p class="text-muted">
            Fill out the form below to create a new process definition. The process will be stored
            in your Pod's <code>/process/</code> container.
          </p>
        </div>

        <!-- SHACL Form Container -->
        <div
          id="process-creation-form"
          class="shacl-form-container"
          @shacl-form-change="changeListener"
          @shacl-form-submit="submitListener"
        ></div>

        <!-- Action buttons -->
        <div class="d-flex gap-2 mt-3">
          <BButton
            variant="primary"
            @click="createProcess"
            :disabled="!isFormValid || isCreating"
            class="px-4"
          >
            <BSpinner small v-if="isCreating" class="me-2" />
            <i class="bi bi-plus-circle me-2" v-else></i>
            {{ isCreating ? 'Creating...' : 'Create Process' }}
          </BButton>

          <BButton variant="outline-secondary" @click="resetForm" :disabled="isCreating">
            Reset Form
          </BButton>
        </div>

        <!-- Status alerts -->
        <BAlert
          v-if="alertMessage"
          :variant="alertVariant"
          class="mt-3"
          dismissible
          @dismissed="clearAlert"
        >
          {{ alertMessage }}
        </BAlert>
      </div>
    </BCardBody>
  </BCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BCard, BCardBody, BButton, BAlert, BSpinner } from 'bootstrap-vue-next'
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
const shaclFormData = ref(null)
const alertMessage = ref('')
const alertVariant = ref('info')

// Check if user can create processes (only in their own Pod)
const canCreateProcess = computed(() => {
  const hasSession = !!sessionStore.loggedInWebId && !!sessionStore.selectedPodUrl
  const hasOwnProvider = processStore.processProviders.some((provider) =>
    processStore.isOwnedResource(provider.ContainerURI)
  )

  console.log('AddProcessCard - canCreateProcess debug:', {
    hasSession,
    hasOwnProvider,
    loggedInWebId: sessionStore.loggedInWebId,
    selectedPodUrl: sessionStore.selectedPodUrl,
    ownProviders: processStore.processProviders.filter((p) =>
      processStore.isOwnedResource(p.ContainerURI)
    )
  })

  return hasSession && hasOwnProvider
})

// SHACL form event listeners
const changeListener = (event) => {
  console.log('SHACL form change event:', event.detail)

  if (event.detail?.valid) {
    isFormValid.value = true
    shaclFormData.value = event.detail.data
    displayAlert('Process details are valid and ready to create', 'success', 3000)
  } else {
    isFormValid.value = false
    shaclFormData.value = null
  }
}

const submitListener = (event) => {
  console.log('SHACL form submit event:', event.detail)

  if (event.detail?.valid) {
    shaclFormData.value = event.detail.data
    createProcess()
  } else {
    displayAlert('Please complete all required fields before submitting', 'warning')
  }
}

// Process creation logic
const createProcess = async () => {
  if (!canCreateProcess.value || !isFormValid.value || !shaclFormData.value) {
    displayAlert('Form is not ready for submission', 'warning')
    return
  }

  isCreating.value = true

  try {
    // Extract process name from form data
    const processName = shaclFormData.value.name || shaclFormData.value.label

    if (!processName) {
      throw new Error('Process name is required')
    }

    // Get the user's own process provider
    const ownProvider = processStore.processProviders.find((provider) =>
      processStore.isOwnedResource(provider.ContainerURI)
    )

    if (!ownProvider) {
      throw new Error('No owned process provider found')
    }

    // Create the process container URL
    const processContainerURL = `${ownProvider.ContainerURI}${processName.replace(/\s+/g, '')}/`

    console.log('Creating process container at:', processContainerURL)

    // TODO: Implement actual process creation logic
    // This would involve:
    // 1. Creating the process container
    // 2. Storing the process metadata using SHACL form data
    // 3. Setting up appropriate access controls

    // For now, simulate the creation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    displayAlert(`Process "${processName}" created successfully!`, 'success')

    // Notify parent component
    props.onProcessCreated({
      name: processName,
      uri: processContainerURL,
      data: shaclFormData.value
    })

    // Reset form
    resetForm()
  } catch (error) {
    console.error('Error creating process:', error)
    displayAlert(`Failed to create process: ${error.message}`, 'danger')
  } finally {
    isCreating.value = false
  }
}

// Form management
const resetForm = () => {
  isFormValid.value = false
  shaclFormData.value = null
  clearAlert()

  // Reset SHACL form if it exists
  const formContainer = document.getElementById('process-creation-form')
  if (formContainer) {
    formContainer.innerHTML = ''
    loadShaclForm()
  }
}

// Alert management
const displayAlert = (message, variant = 'info', duration = 0) => {
  alertMessage.value = message
  alertVariant.value = variant

  if (duration > 0) {
    setTimeout(() => {
      clearAlert()
    }, duration)
  }
}

const clearAlert = () => {
  alertMessage.value = ''
  alertVariant.value = 'info'
}

// SHACL form loading
const loadShaclForm = async () => {
  if (!canCreateProcess.value) return

  try {
    // Load SHACL form for process creation
    const formContainer = document.getElementById('process-creation-form')
    if (!formContainer) return

    // TODO: Load the actual SHACL form
    // This would use the SHACL form library to render the process_creation.ttl shape
    // For now, we'll create a placeholder form structure

    formContainer.innerHTML = `
      <div class="mb-3">
        <label class="form-label">Process Name <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          id="process-name"
          placeholder="Enter process name (e.g., OrganisationManagement)"
          required
        />
        <div class="form-text">The process name will be used as the container identifier.</div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Process Description</label>
        <textarea 
          class="form-control" 
          id="process-description"
          rows="3"
          placeholder="Describe what this process is used for..."
        ></textarea>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Process Category</label>
        <select class="form-select" id="process-category">
          <option value="">Select a category...</option>
          <option value="data-collection">Data Collection</option>
          <option value="organization">Organization Management</option>
          <option value="reporting">Reporting</option>
          <option value="workflow">Workflow</option>
          <option value="other">Other</option>
        </select>
      </div>
    `

    // Add event listeners for form validation
    const nameField = formContainer.querySelector('#process-name')
    const descField = formContainer.querySelector('#process-description')
    const categoryField = formContainer.querySelector('#process-category')

    const validateForm = () => {
      const name = nameField?.value?.trim()
      const description = descField?.value?.trim()
      const category = categoryField?.value

      const isValid = name && name.length >= 3

      // Simulate SHACL form change event
      const changeEvent = new CustomEvent('shacl-form-change', {
        detail: {
          valid: isValid,
          data: isValid
            ? {
                name,
                description,
                category,
                label: name
              }
            : null
        }
      })

      formContainer.dispatchEvent(changeEvent)
    }

    // Add event listeners
    ;[nameField, descField, categoryField].forEach((field) => {
      if (field) {
        field.addEventListener('input', validateForm)
        field.addEventListener('change', validateForm)
      }
    })
  } catch (error) {
    console.error('Error loading SHACL form:', error)
    displayAlert('Failed to load process creation form', 'danger')
  }
}

// Lifecycle
onMounted(() => {
  if (canCreateProcess.value) {
    loadShaclForm()
  }
})

onUnmounted(() => {
  clearAlert()
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
