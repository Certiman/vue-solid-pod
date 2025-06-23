<template>
  <div class="create-evidence-step">
    <BAlert v-if="!hasApplicationSelected" variant="warning" :model-value="true" class="mb-3">
      <strong>No application selected.</strong>
      Please select or create an application before creating evidence.
    </BAlert>

    <BAlert v-else-if="hasExistingEvidence" variant="info" :model-value="true" class="mb-3">
      <strong>Evidence already linked.</strong>
      You have already linked evidence to this application. This step is optional for creating
      additional evidence.
    </BAlert>

    <div v-if="hasApplicationSelected">
      <div class="mb-4">
        <h6>Creating Evidence For:</h6>
        <p class="text-muted">{{ applicationDisplayInfo }}</p>
      </div>

      <div class="mb-3">
        <BButton v-if="!showCreateForm" variant="primary" @click="showCreateForm = true">
          Create New Evidence
        </BButton>
      </div>

      <div v-if="showCreateForm">
        <p class="mb-3">
          Create new evidence documentation for this vehicle authorization application. Evidence can
          include test reports, certificates, technical documentation, etc.
        </p>

        <!-- Placeholder for Evidence SHACL form -->
        <!-- TODO: Replace with actual evidence shape URL when available -->
        <BCard class="text-center text-muted">
          <BCardBody>
            <h6>Evidence Creation Form</h6>
            <p>Evidence SHACL form will be implemented here</p>
            <small>Shape URL needed for evidence creation</small>

            <div class="mt-3">
              <BButton variant="success" @click="handleMockEvidenceCreated">
                Mock: Create Evidence
              </BButton>
              <BButton variant="outline-secondary" class="ms-2" @click="showCreateForm = false">
                Cancel
              </BButton>
            </div>
          </BCardBody>
        </BCard>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Create Evidence Step Component
 *
 * Step 4: Create new evidence for the selected application
 * This step is conditional - only needed if no evidence exists or user wants to add more
 */
import { ref, computed } from 'vue'
import { BAlert, BButton, BCard, BCardBody } from 'bootstrap-vue-next'

const props = defineProps({
  containerPath: {
    type: String,
    default: 'VehicleAuthorisation'
  },
  applicationUri: {
    type: String,
    default: null
  },
  applicationDisplayInfo: {
    type: String,
    default: ''
  },
  hasExistingEvidence: {
    type: Boolean,
    default: false
  },
  evidenceShapeUrl: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['evidenceCreated'])

// Reactive state
const showCreateForm = ref(false)

// Computed properties
const hasApplicationSelected = computed(() => {
  return !!props.applicationUri
})

// Methods
const handleMockEvidenceCreated = () => {
  // Mock evidence creation - replace with actual SHACL form handling
  const mockEvidence = {
    uri: `${props.applicationUri}/evidence#${Date.now()}`,
    title: 'New Evidence Document',
    type: 'Technical Documentation',
    created: new Date().toISOString()
  }

  emit('evidenceCreated', {
    evidenceUri: mockEvidence.uri,
    applicationUri: props.applicationUri,
    evidence: mockEvidence
  })

  showCreateForm.value = false
}

// TODO: When evidence SHACL shape is available, replace mock with:
// const handleEvidenceCreated = (data) => {
//   emit('evidenceCreated', {
//     evidenceUri: data.uri,
//     applicationUri: props.applicationUri,
//     evidence: data
//   })
//   showCreateForm.value = false
// }
</script>
