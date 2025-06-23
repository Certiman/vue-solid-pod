<template>
  <div class="create-application-step">
    <BAlert v-if="hasExistingSelection" variant="warning" :model-value="true" class="mb-3">
      <strong>Application already selected.</strong>
      You have selected an existing application. This step is only needed if you want to create a
      new application.
    </BAlert>

    <div v-else>
      <p class="mb-3">
        Create a new vehicle authorization application using the form below. The form is dynamically
        loaded based on railway standards.
      </p>

      <AddResourceCard
        v-if="shapeFileUrl"
        :shape-file-url="shapeFileUrl"
        :target-resource="dataTarget"
        @DataSetUpdated="handleApplicationCreated"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Create Application Step Component
 *
 * Step 2: Create a new vehicle authorization application using SHACL forms
 * Only shown when no existing application is selected
 */
import { computed } from 'vue'
import { BAlert } from 'bootstrap-vue-next'
import AddResourceCard from '@/components/atoms/AddResourceCard.vue'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({
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
  },
  hasExistingSelection: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['applicationCreated'])

// Calculate the data target for storing vehicle authorization data
const dataTarget = computed(() => {
  const containerURI = `${sessionStore.selectedPodUrl}data/${props.containerPath}/`
  const resourceURI = `${sessionStore.selectedPodUrl}data/${props.containerPath}/${props.resourceName}#`

  return {
    URI: resourceURI,
    containerURI: containerURI,
    subjectClass: null, // Let SHACL shape determine the target class via sh:targetClass
    subjectNodeId: '' // Empty string for auto-generated node ID
  }
})

// Handle application creation completion
const handleApplicationCreated = (data) => {
  emit('applicationCreated', {
    uri: data.uri || dataTarget.value.URI,
    data: data
  })
}
</script>
