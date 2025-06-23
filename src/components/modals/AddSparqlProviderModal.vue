<template>
  <BModal
    id="add-sparql-provider-modal"
    v-model="isVisible"
    title="Add SPARQL Endpoint"
    size="lg"
    @hidden="resetForm"
  >
    <BForm @submit.prevent="addProvider">
      <!-- Provider Name -->
      <BFormGroup
        label="Provider Name"
        label-for="provider-name"
        description="Human-readable name for this SPARQL endpoint"
      >
        <BFormInput
          id="provider-name"
          v-model="form.name"
          placeholder="e.g., DBpedia, Wikidata, Company Data"
          required
        />
      </BFormGroup>

      <!-- SPARQL Endpoint URL -->
      <BFormGroup
        label="SPARQL Endpoint URL"
        label-for="provider-url"
        description="Full URL to the SPARQL endpoint"
      >
        <BFormInput
          id="provider-url"
          v-model="form.url"
          type="url"
          placeholder="https://example.org/sparql"
          required
        />
      </BFormGroup>

      <!-- Description -->
      <BFormGroup
        label="Description (Optional)"
        label-for="provider-description"
        description="Brief description of what data this endpoint provides"
      >
        <BFormTextarea
          id="provider-description"
          v-model="form.description"
          placeholder="e.g., General knowledge from Wikipedia, Corporate registry data"
          rows="2"
        />
      </BFormGroup>

      <!-- Authentication (for future enhancement) -->
      <BFormGroup
        label="Authentication"
        description="Authentication method (currently only 'None' is supported)"
      >
        <BFormSelect v-model="form.authenticationType" :options="authenticationOptions" disabled />
      </BFormGroup>

      <!-- Enable immediately -->
      <BFormGroup>
        <BFormCheckbox v-model="form.enableImmediately">
          Enable this provider immediately after adding
        </BFormCheckbox>
      </BFormGroup>

      <!-- Test Connection Button -->
      <div class="mb-3">
        <BButton
          variant="outline-primary"
          :disabled="!form.url || isTesting"
          @click="testConnection"
        >
          <BSpinner v-if="isTesting" small class="me-1" />
          {{ isTesting ? 'Testing...' : 'Test Connection' }}
        </BButton>

        <!-- Test Results -->
        <div v-if="testResult !== null" class="mt-2">
          <BAlert
            :variant="testResult.success ? 'success' : 'danger'"
            show
            dismissible
            @dismissed="testResult = null"
          >
            <strong>{{ testResult.success ? 'Success!' : 'Failed!' }}</strong>
            {{ testResult.message }}
          </BAlert>
        </div>
      </div>
    </BForm>

    <template #modal-footer>
      <div class="w-100 d-flex justify-content-between">
        <BButton variant="secondary" @click="isVisible = false"> Cancel </BButton>
        <BButton
          variant="primary"
          :disabled="!form.name || !form.url || isAdding"
          @click="addProvider"
        >
          <BSpinner v-if="isAdding" small class="me-1" />
          {{ isAdding ? 'Adding...' : 'Add Provider' }}
        </BButton>
      </div>
    </template>
  </BModal>
</template>

<script setup>
/**
 * AddSparqlProviderModal Component
 *
 * Modal for adding new SPARQL endpoint providers to the search system.
 * Provides form validation, connection testing, and integration with the search store.
 */
import { ref, computed } from 'vue'
import {
  BModal,
  BForm,
  BFormGroup,
  BFormInput,
  BFormTextarea,
  BFormSelect,
  BFormCheckbox,
  BButton,
  BSpinner,
  BAlert
} from 'bootstrap-vue-next'
import { searchStore } from '@/stores/search'

// Component props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Component emits
const emit = defineEmits(['update:modelValue', 'provider-added'])

// Reactive state
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  name: '',
  url: '',
  description: '',
  authenticationType: 'none',
  enableImmediately: true
})

const isTesting = ref(false)
const isAdding = ref(false)
const testResult = ref(null)

// Configuration options
const authenticationOptions = [
  { value: 'none', text: 'None (Public endpoint)' },
  { value: 'basic', text: 'Basic Authentication (Not yet supported)', disabled: true },
  { value: 'bearer', text: 'Bearer Token (Not yet supported)', disabled: true },
  { value: 'oauth', text: 'OAuth 2.0 (Not yet supported)', disabled: true }
]

// Methods
const resetForm = () => {
  form.value = {
    name: '',
    url: '',
    description: '',
    authenticationType: 'none',
    enableImmediately: true
  }
  testResult.value = null
  isTesting.value = false
  isAdding.value = false
}

const testConnection = async () => {
  if (!form.value.url) return

  isTesting.value = true
  testResult.value = null

  try {
    // Simple test query to check endpoint responsiveness
    const testQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 1'

    const response = await fetch(form.value.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        Accept: 'application/sparql-results+json'
      },
      body: testQuery
    })

    if (response.ok) {
      testResult.value = {
        success: true,
        message: 'SPARQL endpoint is responding correctly!'
      }
    } else {
      testResult.value = {
        success: false,
        message: `Endpoint returned status ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Connection failed: ${error.message}`
    }
  } finally {
    isTesting.value = false
  }
}

const addProvider = async () => {
  if (!form.value.name || !form.value.url) return

  isAdding.value = true

  try {
    // Add the provider to the search store
    const provider = searchStore.addSparqlProvider({
      url: form.value.url,
      name: form.value.name,
      description: form.value.description,
      active: form.value.enableImmediately,
      authentication: {
        type: form.value.authenticationType
      }
    })

    // If enabled immediately, test the connection
    if (form.value.enableImmediately) {
      await searchStore.testSparqlProvider(provider.id)
    }

    // Emit success event
    emit('provider-added', provider)

    // Close modal and reset form
    isVisible.value = false
    resetForm()

    console.log('SPARQL provider added successfully:', provider)
  } catch (error) {
    console.error('Failed to add SPARQL provider:', error)
    // Could add error handling/display here
  } finally {
    isAdding.value = false
  }
}
</script>

<style scoped>
/* Component-specific styles */
.modal-footer .w-100 {
  display: flex;
  justify-content: space-between;
}
</style>
