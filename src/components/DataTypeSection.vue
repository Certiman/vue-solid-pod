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
          <ResourceCard :resource="resource" :rdf-type="rdfType" @view="handleViewResource" />
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

  <!-- ViewResourceModal -->
  <ViewResourceModal
    v-if="showViewModal && viewModalData.resourceUri"
    :shape-file-url="viewModalData.shapeFileUrl"
    :resource-uri="viewModalData.resourceUri"
    :thing-uri="viewModalData.thingUri"
    :modal-data="viewModalData.modalData"
    @viewer-hidden="handleViewerHidden"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BCard, BCardBody, BCardFooter, BButton } from 'bootstrap-vue-next'
import IMdiPlus from '~icons/mdi/plus'
import IMdiDownload from '~icons/mdi/download'

import ResourceCard from '@/components/atoms/ResourceCard.vue'
import ViewResourceModal from '@/components/modals/ViewResourceModal.vue'
import { sessionStore } from '@/stores/sessions'
import { modalStore } from '@/stores/ui'

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

const router = useRouter()

// Modal data for ViewResourceModal
const viewModalData = ref({
  shapeFileUrl: '',
  resourceUri: '',
  thingUri: '',
  modalData: {
    title: 'View Resource',
    noCancel: true
  }
})

// Local modal visibility control
const showViewModal = ref(false)

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

const handleViewResource = async (resource) => {
  // Prevent multiple triggers while modal is already open
  if (showViewModal.value || modalStore.canShowViewModal) {
    console.log('Modal is already open, ignoring additional trigger')
    return
  }
  console.log('=== ViewResource Debug Info ===')
  console.log('Resource object:', resource)
  console.log('Resource URI:', resource.uri)
  console.log('Resource sourceURI:', resource.sourceURI)
  console.log('RDF Type:', props.rdfType)
  console.log('Process Name:', props.processName)

  // Note: We no longer derive shape file URLs here as they are now stored
  // directly in the RDF data using dcterms:hasFormat and extracted by ViewResourceModal
  console.log('Shape file URL will be extracted from RDF data using dcterms:hasFormat')

  // Set up modal data
  // Use sourceURI (dataset URI) for loading the data and uri (thing URI) for the SHACL form subject
  const resourceUri = resource.sourceURI || resource.uri
  const thingUri = resource.uri

  console.log('Final resourceUri:', resourceUri)
  console.log('Final thingUri:', thingUri)

  const modalData = {
    shapeFileUrl: null, // Will be extracted from RDF data by ViewResourceModal
    resourceUri: resourceUri, // Dataset URI for loading
    thingUri: thingUri, // Thing URI for SHACL form subject
    modalData: {
      title: `View ${displayTypeName.value.slice(0, -1)}: ${resource.label || 'Resource'}`,
      noCancel: true
    }
  }

  console.log('Modal data being set:', modalData)
  viewModalData.value = modalData

  // Set both local and global modal states
  console.log('Setting showViewModal to true')
  showViewModal.value = true
  modalStore.canShowViewModal = true
  console.log(
    'Modal states set - showViewModal:',
    showViewModal.value,
    'modalStore.canShowViewModal:',
    modalStore.canShowViewModal
  )
  
  console.log('=== End ViewResource Debug Info ===')
}

const handleAddNew = () => {
  // Navigate to process to add new resource of this type
  router.push(`/process/${props.processName}`)
}

const handleExport = () => {
  // TODO: Export resources of this type to various formats (TTL, JSON-LD, etc.)
  console.log('Exporting resources of type:', props.rdfType)
}

const handleViewerHidden = (data) => {
  console.log('View modal closed with data:', data)
  // Close both local and global modal states
  showViewModal.value = false
  modalStore.canShowViewModal = false
  // Reset modal data to prevent stale data issues
  viewModalData.value = {
    shapeFileUrl: '',
    resourceUri: '',
    thingUri: '',
    modalData: {
      title: 'View Resource',
      noCancel: true
    }
  }
  console.log('ViewModalData reset after modal close - showViewModal:', showViewModal.value)
}
</script>

<style scoped>
.data-type-section {
  border-left: 4px solid var(--bs-primary);
}

/* Clean Bootstrap card styling - no custom overrides */

.btn-group-sm .btn {
  font-size: 0.75rem;
}
</style>
