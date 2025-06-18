<template>
  <div class="select-uri-component">
    <BFormGroup :label="label" :description="description">
      <BFormSelect
        v-model="selectedURI"
        :options="selectOptions"
        :state="validationState"
        :disabled="loading || disabled"
        @change="handleSelectionChange"
      >
        <template #first>
          <BFormSelectOption :value="null" disabled>
            {{ loading ? 'Loading resources...' : placeholder }}
          </BFormSelectOption>
        </template>
      </BFormSelect>
      <BFormText v-if="selectedResourceInfo" class="mt-2">
        <strong>Selected:</strong> {{ selectedResourceInfo }}
      </BFormText>

      <TimedAlert
        :message="alertMessage"
        :variant="alertVariant"
        :show="showAlert"
        @hidden="showAlert = false"
      />

      <BAlert
        v-if="!loading && resources.length === 0"
        variant="info"
        :model-value="true"
        class="mt-2"
      >
        <small>No {{ rdfTypeName }} resources found in {{ containerPath }}</small>
      </BAlert>
    </BFormGroup>
  </div>
</template>

<script setup>
/**
 * Generic SelectURI Component
 *
 * Searches a Solid Pod container for RDF resources of a specific type
 * and displays them in a dropdown using a configurable display property.
 * Returns the precise resource URI when selected.
 *
 * This component is reusable across the application for any scenario where
 * users need to select existing RDF resources from their pod.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { BFormGroup, BFormSelect, BFormSelectOption, BFormText, BAlert } from 'bootstrap-vue-next'
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThingAll,
  getUrlAll,
  getStringNoLocale,
  getStringWithLocale,
  asUrl
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { RDF } from '@inrupt/vocab-common-rdf'

import { sessionStore } from '@/stores/sessions'
import TimedAlert from '@/components/atoms/TimedAlert.vue'

const props = defineProps({
  /**
   * Container path relative to user's pod (e.g., 'data/VehicleAuthorisation')
   */
  containerPath: {
    type: String,
    required: true
  },
  /**
   * RDF type URI to filter resources by (e.g., 'http://data.europa.eu/949/era#VehicleAuthorisationApplication')
   */
  rdfType: {
    type: String,
    required: true
  },
  /**
   * RDF property URI to use for display labels (e.g., 'http://purl.org/dc/terms/identifier')
   */
  displayProperty: {
    type: String,
    required: true
  },
  /**
   * Label for the form field
   */
  label: {
    type: String,
    default: 'Select Resource'
  },
  /**
   * Description text for the form field
   */
  description: {
    type: String,
    default: ''
  },
  /**
   * Placeholder text for the select dropdown
   */
  placeholder: {
    type: String,
    default: 'Choose an existing resource...'
  },
  /**
   * Whether the component is disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Initially selected URI
   */
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'resourceSelected'])

// Reactive data
const loading = ref(false)
const resources = ref([])
const selectedURI = ref(props.modelValue)

// Alert system variables
const alertMessage = ref('')
const alertVariant = ref('warning')
const showAlert = ref(false)

// Computed properties
const fullContainerPath = computed(() => {
  return `${sessionStore.selectedPodUrl}${props.containerPath}/`
})

const rdfTypeName = computed(() => {
  // Extract a human-readable name from the RDF type URI
  const parts = props.rdfType.split(/[#/]/)
  return parts[parts.length - 1] || 'Resource'
})

const selectOptions = computed(() => {
  return resources.value.map((resource) => ({
    value: resource.uri,
    text: resource.displayText || resource.uri.split('/').pop()
  }))
})

const selectedResourceInfo = computed(() => {
  if (!selectedURI.value) return null

  const selected = resources.value.find((r) => r.uri === selectedURI.value)
  if (!selected) return null

  return `${selected.displayText} (${selected.uri})`
})

const validationState = computed(() => {
  if (showAlert.value) return false
  if (selectedURI.value) return true
  return null
})

// Helper function to show alerts
const displayAlert = (message, variant = 'warning') => {
  alertMessage.value = message
  alertVariant.value = variant
  showAlert.value = true
}

// Methods
const loadResources = async () => {
  if (!sessionStore.selectedPodUrl) {
    displayAlert('No pod selected')
    return
  }

  loading.value = true
  showAlert.value = false // Clear any existing alerts
  resources.value = []

  try {
    console.log(`SelectURI: Loading resources from ${fullContainerPath.value}`)

    // Get the container dataset
    const containerDataset = await getSolidDataset(fullContainerPath.value, { fetch })
    const resourceURIs = getContainedResourceUrlAll(containerDataset)

    console.log(`SelectURI: Found ${resourceURIs.length} resources in container`)

    // Process each resource to find matching RDF types
    for (const resourceURI of resourceURIs) {
      try {
        const resourceDataset = await getSolidDataset(resourceURI, { fetch })
        const things = getThingAll(resourceDataset)

        for (const thing of things) {
          const types = getUrlAll(thing, RDF.type)

          // Check if this thing has the target RDF type
          if (types.includes(props.rdfType)) {
            const thingURI = asUrl(thing)

            // Extract display text using the specified property
            let displayText =
              getStringNoLocale(thing, props.displayProperty) ||
              getStringWithLocale(thing, props.displayProperty) ||
              thingURI.split('/').pop()

            resources.value.push({
              uri: thingURI,
              resourceURI: resourceURI,
              displayText: displayText,
              types: types
            })

            console.log(`SelectURI: Found ${props.rdfType} resource: ${displayText} (${thingURI})`)
          }
        }
      } catch (resourceError) {
        console.warn(`SelectURI: Failed to load resource ${resourceURI}:`, resourceError)
        // Continue with other resources
      }
    }

    console.log(`SelectURI: Loaded ${resources.value.length} ${rdfTypeName.value} resources`)
  } catch (err) {
    console.error('SelectURI: Failed to load resources:', err)
    displayAlert(`Failed to load resources: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (newValue) => {
  selectedURI.value = newValue
  emit('update:modelValue', newValue)

  const selectedResource = resources.value.find((r) => r.uri === newValue)
  if (selectedResource) {
    emit('resourceSelected', selectedResource)
    console.log('SelectURI: Resource selected:', selectedResource)
  }
}

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    selectedURI.value = newValue
  }
)

watch(
  () => [props.containerPath, props.rdfType, sessionStore.selectedPodUrl],
  () => {
    if (sessionStore.selectedPodUrl) {
      loadResources()
    }
  },
  { immediate: false }
)

// Lifecycle
onMounted(() => {
  if (sessionStore.selectedPodUrl) {
    loadResources()
  }
})
</script>

<style scoped>
.select-uri-component .form-text {
  font-size: 0.875rem;
  color: var(--bs-secondary);
}

.select-uri-component .alert {
  font-size: 0.875rem;
}
</style>
