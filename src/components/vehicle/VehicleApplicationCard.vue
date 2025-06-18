<template>
  <BCard>
    <BCardHeader>
      <h3>{{ formTitle }}</h3>
    </BCardHeader>
    <BCardBody>
      <p class="text-muted">{{ formDescription }}</p>

      <!-- Section to select existing applications -->
      <div class="mb-4">
        <h5>Work with Existing Application</h5>
        <BRow>
          <BCol md="6">
            <SelectURI
              :container-path="`data/${containerPath}`"
              rdf-type="http://data.europa.eu/949/era#VehicleAuthorisationApplication"
              display-property="http://purl.org/dc/terms/identifier"
              label="Vehicle Authorization Application"
              description="Select an existing vehicle authorization application to edit"
              placeholder="Choose existing application..."
              v-model="selectedVehicleAuth"
              @resource-selected="handleVehicleAuthSelected"
            />
          </BCol>
          <BCol md="6">
            <SelectURI
              :container-path="`data/${containerPath}`"
              rdf-type="http://data.europa.eu/949/era#VehicleTypeAuthorisationApplication"
              display-property="http://purl.org/dc/terms/identifier"
              label="Vehicle Type Authorization Application"
              description="Select an existing vehicle type authorization application to edit"
              placeholder="Choose existing type application..."
              v-model="selectedVehicleTypeAuth"
              @resource-selected="handleVehicleTypeAuthSelected"
            />
          </BCol>
        </BRow>

        <BAlert v-if="selectedApplicationInfo" variant="info" :model-value="true" class="mt-3">
          <strong>Working with:</strong> {{ selectedApplicationInfo }}
          <BButton variant="outline-secondary" size="sm" class="ms-2" @click="clearSelection">
            Start New Application
          </BButton>
        </BAlert>
      </div>

      <hr class="my-4" />

      <!-- SHACL Form Section -->
      <div>
        <h5>{{ selectedApplicationInfo ? 'Edit Application' : 'Create New Application' }}</h5>
        <AddResourceCard
          v-if="shapeFileUrl"
          :shape-file-url="shapeFileUrl"
          :target-resource="dataTarget"
        />
      </div>
    </BCardBody>
  </BCard>
</template>

<script setup>
/**
 * Vehicle Authorization Application Card
 *
 * A simplified form component modeled after StepItem but designed for standalone use.
 * Uses SHACL forms to render vehicle authorization application forms with data
 * stored in the user's /data/VehicleAuthorisation/ container.
 */
import { computed, ref } from 'vue'
import { BCard, BCardHeader, BCardBody, BRow, BCol, BAlert, BButton } from 'bootstrap-vue-next'

import AddResourceCard from '@/components/atoms/AddResourceCard.vue'
import SelectURI from '@/components/atoms/SelectURI.vue'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({
  formTitle: {
    type: String,
    default: 'Vehicle Authorization Application'
  },
  formDescription: {
    type: String,
    default: 'Enter the vehicle authorization application details using the form below.'
  },
  shapeFileUrl: {
    type: String,
    required: true
  },
  containerPath: {
    type: String,
    default: 'VehicleAuthorisation'
  },
  resourceName: {
    type: String,
    default: 'application'
  }
})

// Reactive state for handling resource selection
const selectedVehicleAuth = ref(null)
const selectedVehicleTypeAuth = ref(null)
const selectedApplicationInfo = ref('')

// Methods to handle resource selection
const handleVehicleAuthSelected = (resource) => {
  selectedVehicleTypeAuth.value = null // Clear other selection
  selectedApplicationInfo.value = `Vehicle Authorization Application: ${resource.displayText}`
  console.log('Selected Vehicle Auth Application:', resource)
}

const handleVehicleTypeAuthSelected = (resource) => {
  selectedVehicleAuth.value = null // Clear other selection
  selectedApplicationInfo.value = `Vehicle Type Authorization Application: ${resource.displayText}`
  console.log('Selected Vehicle Type Auth Application:', resource)
}

const clearSelection = () => {
  selectedVehicleAuth.value = null
  selectedVehicleTypeAuth.value = null
  selectedApplicationInfo.value = ''
}

/**
 * Calculate the data target for storing vehicle authorization data
 * Similar to StepItem's dataTarget but simplified for VA-specific patterns
 */
const dataTarget = computed(() => {
  // Create container URI with trailing slash for proper RDF container semantics
  const containerURI = `${sessionStore.selectedPodUrl}data/${props.containerPath}/`

  // Create resource URI with fragment identifier for RDF resource semantics
  const resourceURI = `${sessionStore.selectedPodUrl}data/${props.containerPath}/${props.resourceName}#`

  console.log(`VehicleApplicationCard: Writing to container: ${containerURI}`)
  console.log(`VehicleApplicationCard: Writing to resource: ${resourceURI}`)

  return {
    URI: resourceURI,
    containerURI: containerURI,
    subjectClass: null, // Let SHACL shape determine the target class via sh:targetClass
    subjectNodeId: '' // Empty string for auto-generated node ID
  }
})
</script>

<style scoped>
.vehicle-application-card .form-description {
  margin-bottom: 1rem;
  color: var(--bs-secondary);
}
</style>
