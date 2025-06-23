<template>
  <div class="select-application-step">
    <BRow>
      <BCol md="6">
        <SelectURI
          :container-path="`data/${containerPath}`"
          rdf-type="http://data.europa.eu/949/VehicleAuthorisationApplication"
          display-property="http://purl.org/dc/terms/identifier"
          label="Vehicle Authorization Application"
          description="Select an existing vehicle authorization application to work with"
          placeholder="Choose existing application..."
          v-model="selectedVehicleAuth"
          @resource-selected="handleVehicleAuthSelected"
        />
      </BCol>
      <BCol md="6">
        <SelectURI
          :container-path="`data/${containerPath}`"
          rdf-type="http://data.europa.eu/949/VehicleTypeAuthorisationApplication"
          display-property="http://purl.org/dc/terms/identifier"
          label="Vehicle Type Authorization Application"
          description="Select an existing vehicle type authorization application to work with"
          placeholder="Choose existing type application..."
          v-model="selectedVehicleTypeAuth"
          @resource-selected="handleVehicleTypeAuthSelected"
        />
      </BCol>
    </BRow>

    <BAlert v-if="selectedApplicationInfo" variant="success" :model-value="true" class="mt-3">
      <strong>Selected:</strong> {{ selectedApplicationInfo }}
      <BButton variant="outline-danger" size="sm" class="ms-3" @click="clearSelection">
        Clear Selection
      </BButton>
    </BAlert>

    <BAlert v-if="!hasSelection" variant="info" :model-value="true" class="mt-3">
      <strong>No application selected.</strong>
      You can either select an existing application above, or proceed to create a new one in the
      next step.
    </BAlert>
  </div>
</template>

<script setup>
/**
 * Select Application Step Component
 *
 * Step 1: Allow user to select an existing vehicle authorization application
 * Uses SelectURI components to browse available applications
 */
import { ref, computed } from 'vue'
import { BRow, BCol, BAlert, BButton } from 'bootstrap-vue-next'
import SelectURI from '@/components/atoms/SelectURI.vue'

const { containerPath } = defineProps({
  containerPath: {
    type: String,
    default: 'VehicleAuthorisation'
  }
})

const emit = defineEmits(['applicationSelected', 'selectionCleared'])

// Reactive state
const selectedVehicleAuth = ref(null)
const selectedVehicleTypeAuth = ref(null)
const selectedApplicationInfo = ref('')
const selectedResourceUri = ref(null)

// Computed properties
const hasSelection = computed(() => {
  return selectedVehicleAuth.value || selectedVehicleTypeAuth.value
})

// Methods
const handleVehicleAuthSelected = (resource) => {
  selectedVehicleTypeAuth.value = null // Clear other selection
  selectedResourceUri.value = resource.uri

  const resourceType = 'Vehicle Authorization Application'
  const displayText = resource.displayText || 'Untitled'
  const shortUri = resource.uri.split('/').pop() || resource.uri

  selectedApplicationInfo.value = `${resourceType}: ${displayText} (${shortUri})`

  emit('applicationSelected', {
    type: 'vehicle-auth',
    uri: resource.uri,
    resource: resource,
    displayInfo: selectedApplicationInfo.value
  })
}

const handleVehicleTypeAuthSelected = (resource) => {
  selectedVehicleAuth.value = null // Clear other selection
  selectedResourceUri.value = resource.uri

  const resourceType = 'Vehicle Type Authorization Application'
  const displayText = resource.displayText || 'Untitled'
  const shortUri = resource.uri.split('/').pop() || resource.uri

  selectedApplicationInfo.value = `${resourceType}: ${displayText} (${shortUri})`

  emit('applicationSelected', {
    type: 'vehicle-type-auth',
    uri: resource.uri,
    resource: resource,
    displayInfo: selectedApplicationInfo.value
  })
}

const clearSelection = () => {
  selectedVehicleAuth.value = null
  selectedVehicleTypeAuth.value = null
  selectedApplicationInfo.value = ''
  selectedResourceUri.value = null

  emit('selectionCleared')
}

// Expose methods for parent component
defineExpose({
  clearSelection,
  hasSelection,
  selectedResourceUri
})
</script>

<style scoped>
/* Step-specific styling can be added here when needed */
</style>
