<template>
  <div class="search-bar-component">
    <BCard class="search-card" no-body>
      <BCardBody class="py-3">
        <BForm @submit.prevent="executeSearch">
          <BInputGroup>
            <BFormInput
              v-model="searchQuery"
              placeholder="Search across pods and SPARQL endpoints..."
              :state="validationState"
              @input="analyzeSearchQuery"
            />
            <BInputGroupText>
              <BDropdown
                v-if="detectedSources.length > 0"
                variant="link"
                no-caret
                size="sm"
                toggle-class="p-0 border-0"
              >
                <template #button-content>
                  <i class="bi bi-info-circle"></i>
                </template>
                <BDropdownHeader>Detected Search Sources:</BDropdownHeader>
                <BDropdownItem v-for="source in detectedSources" :key="source.type" disabled>
                  {{ source.description }}
                </BDropdownItem>
              </BDropdown>
            </BInputGroupText>
            <BButton type="submit" variant="primary" :disabled="!searchQuery.trim() || isSearching">
              <span v-if="isSearching">
                <BSpinner small class="me-1" />
                Searching...
              </span>
              <span v-else>
                <i class="bi bi-search me-1"></i>
                Search
              </span>
            </BButton>
          </BInputGroup>
        </BForm>

        <!-- Search Scope Display -->
        <div v-if="searchScope.length > 0" class="search-scope mt-2">
          <small class="text-muted">
            <strong>Search scope:</strong>
            <BBadge
              v-for="scope in searchScope"
              :key="scope.id"
              :variant="getBadgeVariant(scope.type, scope.id)"
              class="me-1"
            >
              {{ scope.name }}
            </BBadge>
          </small>
        </div>

        <!-- Search Hints -->
        <div v-if="searchHints.length > 0" class="search-hints mt-2">
          <small class="text-muted">
            <i class="bi bi-lightbulb me-1"></i>
            <strong>Hints:</strong> {{ searchHints.join(', ') }}
          </small>
        </div>
      </BCardBody>
    </BCard>
  </div>
</template>

<script setup>
/**
 * Smart SearchBar Component
 *
 * Provides intelligent search across multiple sources:
 * - Connected Pods (/data/{Process}/ containers)
 * - Configured SPARQL endpoints
 * - Specific locations via props
 *
 * Uses regex analysis to determine optimal search sources
 * and provides user feedback about search strategy.
 */
import { ref, computed, watch } from 'vue'
import {
  BCard,
  BCardBody,
  BForm,
  BInputGroup,
  BFormInput,
  BInputGroupText,
  BButton,
  BDropdown,
  BDropdownHeader,
  BDropdownItem,
  BBadge,
  BSpinner
} from 'bootstrap-vue-next'
import { searchProviders } from '@/stores/search'

const props = defineProps({
  /**
   * Specific search locations to include (optional)
   * Array of objects: [{ type: 'pod'|'sparql', url: string, name: string }]
   */
  specificSources: {
    type: Array,
    default: () => []
  },
  /**
   * Whether to show only specific sources (true) or include all available sources (false)
   */
  restrictToSpecific: {
    type: Boolean,
    default: false
  },
  /**
   * Container path filter for pod searches (e.g., 'VehicleAuthorisation')
   */
  containerFilter: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['search', 'sourcesDetected'])

// Reactive state
const searchQuery = ref('')
const isSearching = ref(false)
const detectedSources = ref([])
const searchScope = ref([])
const searchHints = ref([])

// Search pattern definitions for intelligent source detection
const searchPatterns = {
  uri: {
    regex: /^https?:\/\/[^\s]+$/,
    sources: ['pod', 'sparql'],
    hint: 'URI detected - will search all sources'
  },
  rdfType: {
    regex: /(?:rdf:type|a\s+|type:)\s*<?([^>\s]+)>?/i,
    sources: ['sparql', 'pod'],
    hint: 'RDF type query - SPARQL endpoints prioritized'
  },
  identifier: {
    regex: /(?:identifier|id|dcterms:identifier)[:=]\s*["']?([^"'\s]+)["']?/i,
    sources: ['pod', 'sparql'],
    hint: 'Identifier search - will check pods first'
  },
  sparqlKeywords: {
    regex: /\b(SELECT|CONSTRUCT|ASK|DESCRIBE|WHERE|FILTER|OPTIONAL|UNION)\b/i,
    sources: ['sparql'],
    hint: 'SPARQL syntax detected - will query endpoints only'
  },
  textSearch: {
    regex: /^[a-zA-Z0-9\s\-_]+$/,
    sources: ['pod', 'sparql'],
    hint: 'Text search - will search all sources'
  }
}

// Computed properties
const validationState = computed(() => {
  if (!searchQuery.value.trim()) return null
  return detectedSources.value.length > 0 ? true : false
})

// Methods
const analyzeSearchQuery = () => {
  const query = searchQuery.value.trim()
  if (!query) {
    detectedSources.value = []
    searchScope.value = []
    searchHints.value = []
    return
  }

  const detected = []
  const hints = []

  // Test query against patterns
  for (const [patternName, pattern] of Object.entries(searchPatterns)) {
    if (pattern.regex.test(query)) {
      detected.push({
        type: patternName,
        sources: pattern.sources,
        description: pattern.hint
      })
      hints.push(pattern.hint)
    }
  }

  // If no specific patterns match, default to text search
  if (detected.length === 0) {
    detected.push({
      type: 'textSearch',
      sources: searchPatterns.textSearch.sources,
      description: searchPatterns.textSearch.hint
    })
    hints.push(searchPatterns.textSearch.hint)
  }

  detectedSources.value = detected
  searchHints.value = [...new Set(hints)] // Remove duplicates

  // Update search scope based on detected sources and configuration
  updateSearchScope()

  emit('sourcesDetected', detected)
}

const getBadgeVariant = (type, id) => {
  if (type === 'pod') {
    // Different colors for different pod types
    if (id === 'user-pod') {
      return 'success' // Green for user's own pod
    } else {
      return 'primary' // Blue for external/process provider pods
    }
  } else if (type === 'sparql') {
    return 'warning' // Orange/yellow for SPARQL endpoints
  } else {
    return 'secondary' // Gray for unknown types
  }
}

const updateSearchScope = () => {
  const scope = []

  // Add specific sources if provided
  if (props.specificSources.length > 0) {
    props.specificSources.forEach((source) => {
      scope.push({
        id: source.id || source.url,
        name: source.name,
        type: source.type,
        url: source.url
      })
    })
  }

  // If not restricted to specific sources, add available providers from store
  if (!props.restrictToSpecific) {
    // Add all available search providers from the search store
    searchProviders.value.forEach((provider) => {
      scope.push({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        url: provider.url
      })
    })
  }

  searchScope.value = scope
}

const executeSearch = async () => {
  if (!searchQuery.value.trim() || isSearching.value) return

  isSearching.value = true

  try {
    const searchRequest = {
      query: searchQuery.value.trim(),
      sources: searchScope.value,
      detectedPatterns: detectedSources.value,
      containerFilter: props.containerFilter,
      timestamp: new Date().toISOString()
    }

    emit('search', searchRequest)
  } catch (error) {
    console.error('Search execution error:', error)
  } finally {
    isSearching.value = false
  }
}

// Initialize search scope on mount
updateSearchScope()

// Watch for changes in props to update scope
watch(
  () => [props.specificSources, props.restrictToSpecific],
  () => {
    updateSearchScope()
  },
  { deep: true }
)

// Watch for changes in search providers from store
watch(
  () => searchProviders.value,
  () => {
    updateSearchScope()
  },
  { deep: true }
)
</script>

<style scoped>
.search-card {
  border: 1px solid var(--bs-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-scope .badge {
  font-size: 0.75em;
}

.search-hints {
  border-top: 1px solid var(--bs-border-color-translucent);
  padding-top: 0.5rem;
}

.bi {
  font-family: 'bootstrap-icons';
}

/* Fallback for bootstrap icons if not loaded */
.bi-search::before {
  content: '🔍';
}
.bi-info-circle::before {
  content: 'ℹ️';
}
.bi-lightbulb::before {
  content: '💡';
}
</style>
