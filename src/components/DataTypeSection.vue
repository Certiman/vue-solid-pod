<template>
  <BCard :header="`${displayTypeName} (${resources.length})`" class="data-type-section">
    <BCardBody>
      <!-- Type description -->
      <p class="text-muted mb-3">
        <small
          >RDF Type: <code>{{ rdfType }}</code></small
        >
      </p>

      <!-- Resources list -->
      <div class="row">
        <div v-for="resource in resources" :key="resource.uri" class="col-md-6 col-lg-4 mb-3">
          <ResourceCard
            :resource="resource"
            :rdf-type="rdfType"
            @view="handleViewResource"
            @edit="handleEditResource"
            @delete="handleDeleteResource"
          />
        </div>
      </div>

      <!-- Empty state for this type -->
      <div v-if="resources.length === 0" class="text-center text-muted py-4">
        <p>No resources of this type found.</p>
      </div>
    </BCardBody>

    <!-- Footer with type-specific actions -->
    <BCardFooter class="d-flex justify-content-between align-items-center">
      <small class="text-muted">
        {{ resources.length }} {{ resources.length === 1 ? 'resource' : 'resources' }}
      </small>

      <div class="btn-group btn-group-sm">
        <BButton variant="outline-primary" size="sm" @click="handleAddNew" :disabled="!canAddNew">
          <IMdiPlus class="me-1" />
          Add {{ displayTypeName }}
        </BButton>

        <BButton
          variant="outline-secondary"
          size="sm"
          @click="handleExport"
          :disabled="resources.length === 0"
        >
          <IMdiDownload class="me-1" />
          Export
        </BButton>
      </div>
    </BCardFooter>
  </BCard>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BCard, BCardBody, BCardFooter, BButton } from 'bootstrap-vue-next'
import IMdiPlus from '~icons/mdi/plus'
import IMdiDownload from '~icons/mdi/download'

import ResourceCard from '@/components/atoms/ResourceCard.vue'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({
  rdfType: {
    type: String,
    required: true
  },
  resources: {
    type: Array,
    required: true
  },
  processName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const router = useRouter()

// Computed properties
const displayTypeName = computed(() => {
  // Convert RDF type URI to human-readable name
  const typeMap = {
    'http://www.w3.org/ns/org#FormalOrganization': 'Organizations',
    'http://www.w3.org/ns/org#OrganizationalUnit': 'Units',
    'http://www.w3.org/ns/org#Site': 'Sites',
    'http://schema.org/Organization': 'Organizations',
    'http://schema.org/Place': 'Places',
    'http://xmlns.com/foaf/0.1/Organization': 'Organizations',
    'http://xmlns.com/foaf/0.1/Person': 'People'
  }

  return typeMap[props.rdfType] || extractTypeNameFromURI(props.rdfType)
})

const canAddNew = computed(() => {
  return Boolean(sessionStore.selectedPodUrl)
})

// Methods
const extractTypeNameFromURI = (uri) => {
  // Extract class name from URI (e.g., "http://example.org/Class" -> "Class")
  const parts = uri.split(/[#/]/)
  const className = parts[parts.length - 1]
  return className ? className + 's' : 'Resources'
}

const handleViewResource = (resource) => {
  console.log('Viewing resource:', resource)
  // TODO: Open resource view modal or navigate to detail view
}

const handleEditResource = (resource) => {
  console.log('Editing resource:', resource)
  // TODO: Open resource edit modal or navigate to edit form
}

const handleDeleteResource = async (resource) => {
  console.log('Deleting resource:', resource)
  // TODO: Implement delete functionality with confirmation
  // After deletion, emit refresh event
  emit('refresh')
}

const handleAddNew = () => {
  // Navigate to process to add new resource of this type
  router.push(`/process/${props.processName}`)
}

const handleExport = () => {
  // TODO: Export resources of this type to various formats (TTL, JSON-LD, etc.)
  console.log('Exporting resources of type:', props.rdfType)
}
</script>

<style scoped>
.data-type-section {
  border-left: 4px solid var(--bs-primary);
}

.btn-group-sm .btn {
  font-size: 0.75rem;
}
</style>
