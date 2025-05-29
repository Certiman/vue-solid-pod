<template>
  <BCard class="resource-card h-100">
    <BCardBody class="d-flex flex-column">
      <!-- Resource title -->
      <h6 class="card-title mb-2">
        {{ resourceTitle || 'Untitled Resource' }}
      </h6>

      <!-- Resource URI -->
      <p class="text-muted small mb-2">
        <code class="resource-uri">{{ truncatedURI }}</code>
      </p>

      <!-- Key properties preview -->
      <div class="properties-preview flex-grow-1 mb-3">
        <div v-for="prop in previewProperties" :key="prop.property" class="property-item mb-1">
          <strong class="property-label">{{ prop.label }}:</strong>
          <span class="property-value">{{ prop.value }}</span>
        </div>

        <div
          v-if="
            resource.properties &&
            Object.keys(resource.properties).length > previewProperties.length
          "
          class="text-muted small"
        >
          +{{ Object.keys(resource.properties).length - previewProperties.length }} more properties
        </div>
      </div>

      <!-- Metadata -->
      <div class="metadata small text-muted mb-3">
        <div v-if="resource.created">
          <IMdiClockOutline class="me-1" />
          Created: {{ formatDate(resource.created) }}
        </div>
        <div v-if="resource.modified && resource.modified !== resource.created">
          <IMdiPencilOutline class="me-1" />
          Modified: {{ formatDate(resource.modified) }}
        </div>
      </div>

      <!-- Actions -->
      <div class="actions mt-auto">
        <BButtonGroup size="sm" class="w-100">
          <BButton
            variant="outline-primary"
            @click="$emit('view', resource)"
            title="View resource details"
          >
            <IMdiEyeOutline class="me-1" />
            View
          </BButton>

          <BButton
            variant="outline-secondary"
            @click="$emit('edit', resource)"
            title="Edit resource"
            :disabled="!canEdit"
          >
            <IMdiPencilOutline class="me-1" />
            Edit
          </BButton>

          <BButton
            variant="outline-danger"
            @click="confirmDelete"
            title="Delete resource"
            :disabled="!canDelete"
          >
            <IMdiDeleteOutline />
          </BButton>
        </BButtonGroup>
      </div>
    </BCardBody>
  </BCard>
</template>

<script setup>
import { computed } from 'vue'
import { BCard, BCardBody, BButton, BButtonGroup } from 'bootstrap-vue-next'
import IMdiEyeOutline from '~icons/mdi/eye-outline'
import IMdiPencilOutline from '~icons/mdi/pencil-outline'
import IMdiDeleteOutline from '~icons/mdi/delete-outline'
import IMdiClockOutline from '~icons/mdi/clock-outline'

import { sessionStore } from '@/stores/sessions'

const props = defineProps({
  resource: {
    type: Object,
    required: true
  },
  rdfType: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

// Computed properties
const resourceTitle = computed(() => {
  // Try common title properties
  const titleProps = [
    'http://www.w3.org/2000/01/rdf-schema#label',
    'http://schema.org/name',
    'http://purl.org/dc/terms/title',
    'http://xmlns.com/foaf/0.1/name'
  ]

  if (props.resource.properties) {
    for (const prop of titleProps) {
      if (props.resource.properties[prop]) {
        return props.resource.properties[prop]
      }
    }
  }

  // Fallback to extracting from URI
  const uriParts = props.resource.uri.split(/[#/]/)
  return uriParts[uriParts.length - 1] || 'Resource'
})

const truncatedURI = computed(() => {
  const uri = props.resource.uri
  if (uri.length > 50) {
    return '...' + uri.slice(-47)
  }
  return uri
})

const previewProperties = computed(() => {
  if (!props.resource.properties) return []

  // Show max 3 most important properties
  const importantProps = [
    'http://www.w3.org/2000/01/rdf-schema#comment',
    'http://schema.org/description',
    'http://purl.org/dc/terms/description',
    'http://www.w3.org/2006/vcard/ns#hasEmail',
    'http://schema.org/email',
    'http://www.w3.org/2006/vcard/ns#hasURL',
    'http://schema.org/url'
  ]

  const preview = []
  const resourceProps = props.resource.properties

  // Add important properties first
  for (const prop of importantProps) {
    if (resourceProps[prop] && preview.length < 3) {
      preview.push({
        property: prop,
        label: getPropertyLabel(prop),
        value: Array.isArray(resourceProps[prop]) ? resourceProps[prop][0] : resourceProps[prop]
      })
    }
  }
  // Fill remaining slots with other properties
  if (preview.length < 3) {
    for (const [property, value] of Object.entries(resourceProps)) {
      if (!importantProps.includes(property) && preview.length < 3) {
        preview.push({
          property,
          label: getPropertyLabel(property),
          value: Array.isArray(value) ? value[0] : value
        })
      }
    }
  }

  return preview
})

const canEdit = computed(() => {
  return Boolean(sessionStore.selectedPodUrl)
})

const canDelete = computed(() => {
  return Boolean(sessionStore.selectedPodUrl)
})

// Methods
const getPropertyLabel = (propertyURI) => {
  const labelMap = {
    'http://www.w3.org/2000/01/rdf-schema#label': 'Label',
    'http://www.w3.org/2000/01/rdf-schema#comment': 'Description',
    'http://schema.org/name': 'Name',
    'http://schema.org/description': 'Description',
    'http://schema.org/email': 'Email',
    'http://schema.org/url': 'URL',
    'http://purl.org/dc/terms/title': 'Title',
    'http://purl.org/dc/terms/description': 'Description',
    'http://www.w3.org/2006/vcard/ns#hasEmail': 'Email',
    'http://www.w3.org/2006/vcard/ns#hasURL': 'URL'
  }

  return labelMap[propertyURI] || propertyURI.split(/[#/]/).pop()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete "${resourceTitle.value}"?`)) {
    emit('delete', props.resource)
  }
}
</script>

<style scoped>
.resource-card {
  transition: box-shadow 0.2s;
}

.resource-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.resource-uri {
  font-size: 0.7rem;
  word-break: break-all;
}

.property-item {
  font-size: 0.8rem;
}

.property-label {
  color: var(--bs-secondary);
}

.property-value {
  color: var(--bs-body-color);
  word-break: break-word;
}

.metadata {
  border-top: 1px solid var(--bs-border-color);
  padding-top: 0.5rem;
}

.actions {
  border-top: 1px solid var(--bs-border-color);
  padding-top: 0.5rem;
}
</style>
