<template>
  <div class="add-evidence-step">
    <BAlert v-if="!hasApplicationSelected" variant="warning" :model-value="true" class="mb-3">
      <strong>No application selected.</strong>
      Please select or create an application in the previous steps before adding evidence.
    </BAlert>

    <div v-else>
      <div class="mb-4">
        <h6>Application Selected:</h6>
        <p class="text-muted">{{ applicationDisplayInfo }}</p>
      </div>

      <div class="evidence-selection mb-4">
        <h6>Existing Evidence</h6>
        <SelectURI
          :container-path="`data/${containerPath}/evidence`"
          rdf-type="http://data.europa.eu/949/Evidence"
          display-property="http://purl.org/dc/terms/title"
          label="Available Evidence"
          description="Select existing evidence to link to this application"
          placeholder="Choose existing evidence..."
          v-model="selectedEvidence"
          @resource-selected="handleEvidenceSelected"
        />
      </div>

      <div v-if="linkedEvidence.length > 0" class="linked-evidence mb-4">
        <h6>Linked Evidence</h6>
        <BListGroup>
          <BListGroupItem
            v-for="evidence in linkedEvidence"
            :key="evidence.uri"
            class="d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{{ evidence.displayText || evidence.uri.split('/').pop() }}</strong>
              <br />
              <small class="text-muted">{{ evidence.uri }}</small>
            </div>
            <BButton variant="outline-danger" size="sm" @click="removeEvidence(evidence.uri)">
              Remove
            </BButton>
          </BListGroupItem>
        </BListGroup>
      </div>

      <BAlert v-if="linkedEvidence.length === 0" variant="info" :model-value="true">
        <strong>No evidence linked yet.</strong>
        You can select existing evidence above, or create new evidence in the next step.
      </BAlert>
    </div>
  </div>
</template>

<script setup>
/**
 * Add Evidence Step Component
 *
 * Step 3: Link existing evidence to the selected application
 * Uses SelectURI to browse available evidence resources
 */
import { ref, computed } from 'vue'
import { BAlert, BListGroup, BListGroupItem, BButton } from 'bootstrap-vue-next'
import SelectURI from '@/components/atoms/SelectURI.vue'

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
  }
})

const emit = defineEmits(['evidenceLinked', 'evidenceRemoved'])

// Reactive state
const selectedEvidence = ref(null)
const linkedEvidence = ref([])

// Computed properties
const hasApplicationSelected = computed(() => {
  return !!props.applicationUri
})

// Methods
const handleEvidenceSelected = (resource) => {
  // Check if evidence is already linked
  const isAlreadyLinked = linkedEvidence.value.some((e) => e.uri === resource.uri)

  if (!isAlreadyLinked) {
    linkedEvidence.value.push({
      uri: resource.uri,
      displayText: resource.displayText,
      resource: resource
    })

    emit('evidenceLinked', {
      evidenceUri: resource.uri,
      applicationUri: props.applicationUri,
      evidence: resource
    })
  }

  // Clear selection
  selectedEvidence.value = null
}

const removeEvidence = (evidenceUri) => {
  linkedEvidence.value = linkedEvidence.value.filter((e) => e.uri !== evidenceUri)

  emit('evidenceRemoved', {
    evidenceUri: evidenceUri,
    applicationUri: props.applicationUri
  })
}

// Expose methods for parent component
defineExpose({
  linkedEvidence,
  hasLinkedEvidence: computed(() => linkedEvidence.value.length > 0)
})
</script>
