<template>
  <div class="vehicle-auth-view">
    <BContainer>
      <div class="mb-4">
        <h1>VA Inspector</h1>
        <p class="lead text-muted">
          Vehicle Authorization inspection and evidence management system
        </p>
      </div>

      <!-- Step-by-step Vehicle Authorization Process -->
      <BCard>
        <BCardHeader>
          <h4 class="mb-0">Vehicle Authorization Process</h4>
          <p class="text-muted mb-0 mt-1">
            Complete the vehicle authorization application step by step
          </p>
        </BCardHeader>
        <BCardBody>
          <BAccordion v-model="openStep">
            <!-- Step 1: Select Existing Application -->
            <VehicleAuthStepItem
              step-id="step-select-application"
              title="Select Existing Application"
              description="Choose an existing vehicle authorization application to work with, or proceed to create a new one."
              :completed="stepStates.selectApplication.completed"
              :disabled="stepStates.selectApplication.disabled"
              @nextStep="proceedToNextStep('step-select-application')"
            >
              <SelectApplicationStep
                ref="selectApplicationStepRef"
                :container-path="containerPath"
                @application-selected="handleApplicationSelected"
                @selection-cleared="handleSelectionCleared"
              />
            </VehicleAuthStepItem>

            <!-- Step 2: Create New Application (conditional) -->
            <VehicleAuthStepItem
              v-if="stepStates.createApplication.visible"
              step-id="step-create-application"
              title="Create New Application"
              description="Create a new vehicle authorization application using the standardized form."
              :completed="stepStates.createApplication.completed"
              :disabled="stepStates.createApplication.disabled"
              @nextStep="proceedToNextStep('step-create-application')"
            >
              <CreateApplicationStep
                :shape-file-url="vaShapeUrl"
                :container-path="containerPath"
                :has-existing-selection="!!selectedApplication"
                @application-created="handleApplicationCreated"
              />
            </VehicleAuthStepItem>

            <!-- Step 3: Add Evidence -->
            <VehicleAuthStepItem
              step-id="step-add-evidence"
              title="Add Evidence to Application"
              description="Link existing evidence documents to your vehicle authorization application."
              :completed="stepStates.addEvidence.completed"
              :disabled="stepStates.addEvidence.disabled"
              @nextStep="proceedToNextStep('step-add-evidence')"
            >
              <AddEvidenceStep
                ref="addEvidenceStepRef"
                :container-path="containerPath"
                :application-uri="currentApplicationUri"
                :application-display-info="currentApplicationDisplayInfo"
                @evidence-linked="handleEvidenceLinked"
                @evidence-removed="handleEvidenceRemoved"
              />
            </VehicleAuthStepItem>

            <!-- Step 4: Create New Evidence (conditional) -->
            <VehicleAuthStepItem
              v-if="stepStates.createEvidence.visible"
              step-id="step-create-evidence"
              title="Create New Evidence"
              description="Create new evidence documentation for your vehicle authorization application."
              :completed="stepStates.createEvidence.completed"
              :disabled="stepStates.createEvidence.disabled"
              @nextStep="proceedToNextStep('step-create-evidence')"
            >
              <CreateEvidenceStep
                :container-path="containerPath"
                :application-uri="currentApplicationUri"
                :application-display-info="currentApplicationDisplayInfo"
                :has-existing-evidence="linkedEvidence.length > 0"
                @evidence-created="handleEvidenceCreated"
              />
            </VehicleAuthStepItem>

            <!-- Step 5: Review and Submit -->
            <VehicleAuthStepItem
              step-id="step-review-submit"
              title="Review and Submit"
              description="Review your application and evidence, then submit for processing."
              :completed="stepStates.reviewSubmit.completed"
              :disabled="stepStates.reviewSubmit.disabled"
              :is-last-step="true"
            >
              <ReviewSubmitStep
                :application-uri="currentApplicationUri"
                :application-display-info="currentApplicationDisplayInfo"
                :application-type="selectedApplicationType"
                :linked-evidence="linkedEvidence"
                @application-submitted="handleApplicationSubmitted"
                @view-details="handleViewApplicationDetails"
              />
            </VehicleAuthStepItem>
          </BAccordion>
        </BCardBody>
      </BCard>
    </BContainer>
  </div>
</template>

<script setup>
/**
 * Vehicle Authorization View
 *
 * Step-by-step orchestrator view for the VA Inspector functionality.
 * Implements accordion-based workflow similar to TaskRunner pattern.
 * Guides users through: Select → Create → Evidence → Review → Submit
 */
import { ref, computed, reactive } from 'vue'
import { BContainer, BCard, BCardHeader, BCardBody, BAccordion } from 'bootstrap-vue-next'

// Import step components
import VehicleAuthStepItem from '@/components/vehicle/VehicleAuthStepItem.vue'
import SelectApplicationStep from '@/components/vehicle/SelectApplicationStep.vue'
import CreateApplicationStep from '@/components/vehicle/CreateApplicationStep.vue'
import AddEvidenceStep from '@/components/vehicle/AddEvidenceStep.vue'
import CreateEvidenceStep from '@/components/vehicle/CreateEvidenceStep.vue'
import ReviewSubmitStep from '@/components/vehicle/ReviewSubmitStep.vue'

// Configuration
const vaShapeUrl =
  'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/VehicleAuthorisation/va-c2t-admin-0.0.0.2.shacl'
const containerPath = 'VehicleAuthorisation'

// State management
const openStep = ref('step-select-application')
const selectedApplication = ref(null)
const selectedApplicationType = ref('')
const currentApplicationUri = ref('')
const currentApplicationDisplayInfo = ref('')
const linkedEvidence = ref([])

// Component references
const selectApplicationStepRef = ref(null)
const addEvidenceStepRef = ref(null)

// Step states - manages completion, visibility, and disabled states
const stepStates = reactive({
  selectApplication: {
    completed: false,
    disabled: false,
    visible: true
  },
  createApplication: {
    completed: false,
    disabled: false,
    visible: computed(() => !selectedApplication.value)
  },
  addEvidence: {
    completed: false,
    disabled: computed(() => !currentApplicationUri.value),
    visible: true
  },
  createEvidence: {
    completed: false,
    disabled: computed(() => !currentApplicationUri.value),
    visible: computed(() => linkedEvidence.value.length === 0)
  },
  reviewSubmit: {
    completed: false,
    disabled: computed(() => !currentApplicationUri.value),
    visible: true
  }
})

// Event handlers
const handleApplicationSelected = (applicationData) => {
  selectedApplication.value = applicationData
  selectedApplicationType.value = applicationData.type
  currentApplicationUri.value = applicationData.uri
  currentApplicationDisplayInfo.value = applicationData.displayInfo

  stepStates.selectApplication.completed = true

  // Auto-advance to evidence step since we have an application
  openStep.value = 'step-add-evidence'
}

const handleSelectionCleared = () => {
  selectedApplication.value = null
  selectedApplicationType.value = ''
  currentApplicationUri.value = ''
  currentApplicationDisplayInfo.value = ''

  stepStates.selectApplication.completed = false
  stepStates.createApplication.completed = false

  // Clear evidence as well
  linkedEvidence.value = []
  stepStates.addEvidence.completed = false
  stepStates.createEvidence.completed = false
}

const handleApplicationCreated = (applicationData) => {
  selectedApplication.value = { uri: applicationData.uri, type: 'created' }
  selectedApplicationType.value = 'Vehicle Authorization Application'
  currentApplicationUri.value = applicationData.uri
  currentApplicationDisplayInfo.value = `New Application: ${applicationData.uri.split('/').pop()}`

  stepStates.createApplication.completed = true

  // Auto-advance to evidence step
  openStep.value = 'step-add-evidence'
}

const handleEvidenceLinked = (evidenceData) => {
  console.log('Evidence linked:', evidenceData)

  // Update linked evidence list (handled by AddEvidenceStep component)
  stepStates.addEvidence.completed = true

  // Auto-advance to review step if we have evidence
  if (addEvidenceStepRef.value?.hasLinkedEvidence) {
    openStep.value = 'step-review-submit'
  }
}

const handleEvidenceRemoved = (evidenceData) => {
  console.log('Evidence removed:', evidenceData)

  // Check if we still have evidence
  if (!addEvidenceStepRef.value?.hasLinkedEvidence) {
    stepStates.addEvidence.completed = false
  }
}

const handleEvidenceCreated = (evidenceData) => {
  console.log('Evidence created:', evidenceData)

  // Add to linked evidence
  linkedEvidence.value.push({
    uri: evidenceData.evidenceUri,
    displayText: evidenceData.evidence.title || 'New Evidence',
    resource: evidenceData.evidence
  })

  stepStates.createEvidence.completed = true
  stepStates.addEvidence.completed = true

  // Auto-advance to review step
  openStep.value = 'step-review-submit'
}

const handleApplicationSubmitted = (submissionData) => {
  console.log('Application submitted:', submissionData)
  stepStates.reviewSubmit.completed = true
}

const handleViewApplicationDetails = (applicationUri) => {
  console.log('View application details:', applicationUri)
  // TODO: Open ViewResourceModal or navigate to detail view
}

const proceedToNextStep = (currentStepId) => {
  const stepOrder = [
    'step-select-application',
    'step-create-application',
    'step-add-evidence',
    'step-create-evidence',
    'step-review-submit'
  ]

  const currentIndex = stepOrder.indexOf(currentStepId)
  const nextIndex = currentIndex + 1

  if (nextIndex < stepOrder.length) {
    const nextStepId = stepOrder[nextIndex]

    // Skip invisible steps
    if (nextStepId === 'step-create-application' && selectedApplication.value) {
      proceedToNextStep(nextStepId)
      return
    }

    if (nextStepId === 'step-create-evidence' && linkedEvidence.value.length > 0) {
      proceedToNextStep(nextStepId)
      return
    }

    openStep.value = nextStepId
  }
}

console.log('VehicleAuthView: Using VA shape from EUAR pod:', vaShapeUrl)
</script>

<style scoped>
.vehicle-auth-view {
  padding: 2rem 0;
}

.vehicle-auth-view .lead {
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.vehicle-auth-view h1 {
  color: var(--bs-primary);
  margin-bottom: 0.5rem;
}
</style>
