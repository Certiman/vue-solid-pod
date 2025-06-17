<template>
  <BCard class="resource-card h-100">
    <BCardHeader>
      <h6 class="card-title mb-0 d-flex align-items-center justify-content-between">
        <span>{{ resourceTitle || 'Untitled Resource' }}</span>
        <BBadge variant="secondary" class="small">{{ rdfTypeLabel }}</BBadge>
      </h6>
    </BCardHeader>

    <BCardBody class="d-flex flex-column">
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
    </BCardBody>
    <BCardFooter>
      <!-- Actions -->
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
          variant="outline-success"
          @click="navigateToProcess"
          title="Open the process workflow that manages this data"
          :disabled="!extractedProcessName"
        >
          <IMdiCompassOutline class="me-1" />
          Open Process
        </BButton>
      </BButtonGroup>
    </BCardFooter>
  </BCard>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BCard,
  BCardHeader,
  BCardBody,
  BCardFooter,
  BButton,
  BButtonGroup,
  BBadge
} from 'bootstrap-vue-next'
import IMdiEyeOutline from '~icons/mdi/eye-outline'
import IMdiPencilOutline from '~icons/mdi/pencil-outline'
import IMdiClockOutline from '~icons/mdi/clock-outline'
import IMdiCompassOutline from '~icons/mdi/compass-outline'
import { dataService } from '@/services/dataService'
import { EXTRACTION_PRIORITIES } from '@/services/rdfConfig'

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

const router = useRouter()

// Extract process name from resource URI
const extractedProcessName = computed(() => {
  const uri = props.resource.uri
  if (!uri) return null

  // Resource URIs follow pattern: {UsersPodURL}/data/{ProcessAbbreviated}/{resourceName}#{uuid}
  // We need to extract the ProcessAbbreviated part
  const dataPathMatch = uri.match(/\/data\/([^/]+)\//)
  if (dataPathMatch) {
    const processAbbreviated = dataPathMatch[1]
    // Convert ProcessAbbreviated back to ProcessName
    // According to PROCESS.md: ProcessAbbreviated = LOWERCASE(if no CamelCase is used ? full process name : CamelCase capitals only)
    // For simplicity, we'll capitalize the first letter to get back to the process name
    return processAbbreviated.charAt(0).toUpperCase() + processAbbreviated.slice(1)
  }

  console.warn('Could not extract process name from resource URI:', uri)
  return null
})

// Navigate to the process workflow
const navigateToProcess = () => {
  if (!extractedProcessName.value) {
    console.warn('Cannot navigate to process: no process name extracted from resource URI')
    return
  }

  console.log(
    'Navigating to process:',
    extractedProcessName.value,
    'from resource:',
    props.resource.uri
  )

  // Navigate to the process overview page
  router.push(`/process/${extractedProcessName.value}/`)
}

// Computed properties
const resourceTitle = computed(() => {
  return dataService.extractResourceTitle(props.resource.properties, props.resource.uri)
})

const truncatedURI = computed(() => {
  const uri = props.resource.uri
  if (uri.length > 50) {
    return '...' + uri.slice(-47)
  }
  return uri
})

const rdfTypeLabel = computed(() => {
  return dataService.extractRdfTypeLabel(props.rdfType)
})

const previewProperties = computed(() => {
  if (!props.resource.properties) return [] // Show max 3 most important properties - using semantic extraction priorities
  const importantProps = [
    ...EXTRACTION_PRIORITIES.DESCRIPTION,
    ...EXTRACTION_PRIORITIES.EMAIL,
    ...EXTRACTION_PRIORITIES.URL
  ]

  const preview = []
  const resourceProps = props.resource.properties

  // Add important properties first
  for (const prop of importantProps) {
    if (resourceProps[prop] && preview.length < 3) {
      preview.push({
        property: prop,
        label: dataService.extractPropertyLabel(prop),
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
          label: dataService.extractPropertyLabel(property),
          value: Array.isArray(value) ? value[0] : value
        })
      }
    }
  }

  return preview
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
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

/* Remove border styling from the old actions div since we now use card footer */
.actions {
  border-top: none;
  padding-top: 0;
}

/* Clean Bootstrap card styling - no custom overrides */
</style>
