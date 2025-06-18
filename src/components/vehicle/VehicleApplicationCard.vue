<template>
  <BCard>
    <BCardHeader>
      <h3>{{ formTitle }}</h3>
    </BCardHeader>
    <BCardBody>
      <p class="text-muted">{{ formDescription }}</p>

      <AddResourceCard
        v-if="shapeFileUrl"
        :shape-file-url="shapeFileUrl"
        :target-resource="dataTarget"
      />
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
import { computed } from 'vue'
import { BCard, BCardHeader, BCardBody } from 'bootstrap-vue-next'

import AddResourceCard from '@/components/atoms/AddResourceCard.vue'
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
