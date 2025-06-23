<template>
  <div class="review-submit-step">
    <BAlert v-if="!isReadyForReview" variant="warning" :model-value="true" class="mb-3">
      <strong>Application incomplete.</strong>
      Please complete the previous steps before reviewing and submitting.
    </BAlert>

    <div v-else>
      <div class="review-summary">
        <h6>Application Summary</h6>

        <!-- Application Details -->
        <BCard class="mb-3">
          <BCardBody>
            <h6 class="card-title">Vehicle Authorization Application</h6>
            <p class="card-text">
              <strong>URI:</strong> {{ applicationUri }}<br />
              <strong>Status:</strong> {{ applicationDisplayInfo }}<br />
              <strong>Type:</strong> {{ applicationType }}
            </p>

            <BButton variant="outline-primary" size="sm" @click="viewApplicationDetails">
              View Details
            </BButton>
          </BCardBody>
        </BCard>

        <!-- Evidence Summary -->
        <BCard class="mb-3">
          <BCardBody>
            <h6 class="card-title">Linked Evidence</h6>
            <div v-if="linkedEvidence.length > 0">
              <p class="card-text"><strong>Evidence Count:</strong> {{ linkedEvidence.length }}</p>
              <BListGroup flush>
                <BListGroupItem v-for="evidence in linkedEvidence" :key="evidence.uri" class="px-0">
                  <small>
                    <strong>{{ evidence.displayText || evidence.uri.split('/').pop() }}</strong
                    ><br />
                    <span class="text-muted">{{ evidence.uri }}</span>
                  </small>
                </BListGroupItem>
              </BListGroup>
            </div>
            <p v-else class="card-text text-muted">No evidence linked to this application.</p>
          </BCardBody>
        </BCard>

        <!-- Submission Actions -->
        <BCard variant="light" class="mb-3">
          <BCardBody>
            <h6 class="card-title">Submit Application</h6>
            <p class="card-text">
              Review the application details above. When ready, submit the application for
              processing.
            </p>

            <div class="d-flex gap-2">
              <BButton variant="success" @click="handleSubmitApplication" :disabled="submitting">
                <span v-if="submitting">Submitting...</span>
                <span v-else>Submit Application</span>
              </BButton>

              <BButton variant="outline-secondary" @click="exportApplicationData">
                Export Data
              </BButton>
            </div>
          </BCardBody>
        </BCard>
      </div>

      <!-- Success Message -->
      <BAlert v-if="submitted" variant="success" :model-value="true" class="mt-3">
        <h6>Application Submitted Successfully!</h6>
        <p class="mb-0">
          Your vehicle authorization application has been submitted for review. You will be notified
          of any updates to the application status.
        </p>
      </BAlert>
    </div>

    <!-- Application Details Modal placeholder -->
    <!-- TODO: Implement modal for viewing full application details -->
  </div>
</template>

<script setup>
/**
 * Review and Submit Step Component
 *
 * Step 5: Final review of the application and evidence before submission
 * Shows summary of all data and provides submission functionality
 */
import { ref, computed } from 'vue'
import { BAlert, BCard, BCardBody, BButton, BListGroup, BListGroupItem } from 'bootstrap-vue-next'

const props = defineProps({
  applicationUri: {
    type: String,
    default: null
  },
  applicationDisplayInfo: {
    type: String,
    default: ''
  },
  applicationType: {
    type: String,
    default: 'Vehicle Authorization'
  },
  linkedEvidence: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['applicationSubmitted', 'viewDetails'])

// Reactive state
const submitting = ref(false)
const submitted = ref(false)

// Computed properties
const isReadyForReview = computed(() => {
  return !!props.applicationUri
})

// Methods
const handleSubmitApplication = async () => {
  submitting.value = true

  try {
    // TODO: Implement actual submission logic
    // This could involve:
    // 1. Validating all application data
    // 2. Creating submission records
    // 3. Updating application status
    // 4. Sending notifications

    // Mock submission delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    submitted.value = true

    emit('applicationSubmitted', {
      applicationUri: props.applicationUri,
      evidenceUris: props.linkedEvidence.map((e) => e.uri),
      submittedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error submitting application:', error)
    // TODO: Show error message to user
  } finally {
    submitting.value = false
  }
}

const viewApplicationDetails = () => {
  emit('viewDetails', props.applicationUri)

  // TODO: Open modal with full application details
  // This could reuse the ViewResourceModal component
}

const exportApplicationData = () => {
  // TODO: Implement data export functionality
  // This could generate JSON, RDF, or other formats
  const exportData = {
    application: {
      uri: props.applicationUri,
      type: props.applicationType,
      info: props.applicationDisplayInfo
    },
    evidence: props.linkedEvidence,
    exportedAt: new Date().toISOString()
  }

  console.log('Export data:', exportData)

  // Create and download file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vehicle-auth-application-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
