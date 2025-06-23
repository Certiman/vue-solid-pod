<template>
  <BModal
    id="search-results-modal"
    v-model="isVisible"
    size="xl"
    scrollable
    title="Search Results"
    @hidden="handleModalHidden"
  >
    <div class="search-results-content">
      <!-- Search Summary -->
      <div v-if="searchRequest" class="search-summary mb-4">
        <BCard variant="light">
          <BCardBody class="py-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Query:</strong>
                <code class="ms-1">{{ searchRequest.query }}</code>
              </div>
              <div>
                <BBadge variant="primary">
                  {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
                </BBadge>
              </div>
            </div>
            <div v-if="searchRequest.sources" class="mt-2">
              <small class="text-muted">
                <strong>Sources:</strong>
                <span v-for="source in searchRequest.sources" :key="source.id" class="me-2">
                  {{ source.name }} ({{ source.type }})
                </span>
              </small>
            </div>
          </BCardBody>
        </BCard>
      </div>

      <!-- Loading State -->
      <div v-if="isSearching" class="text-center py-4">
        <BSpinner variant="primary" />
        <p class="mt-2 text-muted">Searching across sources...</p>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchResults.length > 0" class="search-results">
        <!-- Results Tabs by Source -->
        <BTabs v-if="resultsBySource.length > 1" class="mb-3">
          <BTab
            v-for="sourceGroup in resultsBySource"
            :key="sourceGroup.source"
            :title="`${sourceGroup.source} (${sourceGroup.results.length})`"
          >
            <SearchResultGroup
              :results="sourceGroup.results"
              :source="sourceGroup.source"
              @result-selected="handleResultSelected"
            />
          </BTab>
          <BTab title="All Results">
            <SearchResultGroup
              :results="searchResults"
              source="All Sources"
              @result-selected="handleResultSelected"
            />
          </BTab>
        </BTabs>

        <!-- Single Source Results -->
        <SearchResultGroup
          v-else
          :results="searchResults"
          :source="resultsBySource[0]?.source || 'Search Results'"
          @result-selected="handleResultSelected"
        />
      </div>

      <!-- No Results -->
      <div v-else-if="!isSearching && searchExecuted" class="no-results text-center py-4">
        <i class="bi bi-search display-4 text-muted"></i>
        <h5 class="mt-3">No results found</h5>
        <p class="text-muted">Try adjusting your search query or check different sources.</p>
      </div>

      <!-- Initial State -->
      <div v-else class="initial-state text-center py-4">
        <i class="bi bi-search display-4 text-muted"></i>
        <h5 class="mt-3">Ready to search</h5>
        <p class="text-muted">Execute a search to see results here.</p>
      </div>
    </div>

    <template #footer>
      <div class="d-flex justify-content-between align-items-center w-100">
        <div>
          <BButton v-if="searchResults.length > 0" variant="outline-primary" @click="exportResults">
            Export Results
          </BButton>
        </div>
        <div>
          <BButton variant="secondary" @click="closeModal"> Close </BButton>
        </div>
      </div>
    </template>
  </BModal>
</template>

<script setup>
/**
 * SearchResultsModal Component
 *
 * Displays search results from multiple sources (Pods and SPARQL endpoints)
 * Uses Comunica query engines for both Solid pods and SPARQL endpoints
 * Provides tabbed interface for results from different sources
 */
import { ref, computed } from 'vue'
import {
  BModal,
  BCard,
  BCardBody,
  BBadge,
  BSpinner,
  BTabs,
  BTab,
  BButton
} from 'bootstrap-vue-next'
import SearchResultGroup from '@/components/atoms/SearchResultGroup.vue'

// Import Comunica query engines (will be installed separately)

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'resultSelected', 'exportResults'])

// Reactive state
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSearching = ref(false)
const searchExecuted = ref(false)
const searchRequest = ref(null)
const searchResults = ref([])

// TODO: Initialize Comunica engines
// const sparqlEngine = new SparqlEngine()
// const solidEngine = new SolidEngine()

// Computed properties
const resultsBySource = computed(() => {
  const grouped = {}

  searchResults.value.forEach((result) => {
    const source = result.source || 'Unknown'
    if (!grouped[source]) {
      grouped[source] = []
    }
    grouped[source].push(result)
  })

  return Object.entries(grouped).map(([source, results]) => ({
    source,
    results
  }))
})

// Methods
const executeSearch = async (request) => {
  searchRequest.value = request
  isSearching.value = true
  searchExecuted.value = true
  searchResults.value = []

  try {
    const results = []

    // Execute searches across all configured sources
    for (const source of request.sources) {
      try {
        let sourceResults = []
        if (source.type === 'pod') {
          sourceResults = await searchInPod(request.query, source)
        } else if (source.type === 'sparql') {
          sourceResults = await searchInSparqlEndpoint(request.query, source)
        }

        // Add source information to results
        sourceResults.forEach((result) => {
          result.source = source.name
          result.sourceType = source.type
          result.sourceUrl = source.url
        })

        results.push(...sourceResults)
      } catch (error) {
        console.error(`Error searching in ${source.name}:`, error)
        // Add error result to show user what failed
        results.push({
          id: `error-${source.id}`,
          title: `Search Error in ${source.name}`,
          description: error.message,
          type: 'error',
          source: source.name,
          sourceType: source.type,
          sourceUrl: source.url
        })
      }
    }

    searchResults.value = results
  } catch (error) {
    console.error('Search execution error:', error)
  } finally {
    isSearching.value = false
  }
}

const searchInPod = async (query, source) => {
  // TODO: Implement Solid pod search using @comunica/query-sparql-solid
  console.log('Searching in pod:', source.name, 'Query:', query)

  // Implementation placeholder - replace with actual Comunica integration
  throw new Error(
    'Pod search not yet implemented. Please install @comunica/query-sparql-solid and implement.'
  )

  // Actual implementation would be:
  // const sparqlQuery = buildSparqlQueryForPod(query)
  // const bindingsStream = await solidEngine.queryBindings(sparqlQuery, {
  //   sources: [source.url]
  // })
  // return await processBindingsStream(bindingsStream)
}

const searchInSparqlEndpoint = async (query, source) => {
  // TODO: Implement SPARQL endpoint search using @comunica/query-sparql
  console.log('Searching in SPARQL endpoint:', source.name, 'Query:', query)

  // Implementation placeholder - replace with actual Comunica integration
  throw new Error(
    'SPARQL endpoint search not yet implemented. Please install @comunica/query-sparql and implement.'
  )

  // Actual implementation would be:
  // const sparqlQuery = buildSparqlQuery(query)
  // const bindingsStream = await sparqlEngine.queryBindings(sparqlQuery, {
  //   sources: [source.url]
  // })
  // return await processBindingsStream(bindingsStream)
}

const handleResultSelected = (result) => {
  emit('resultSelected', result)
}

const handleModalHidden = () => {
  // Reset state when modal is closed
  searchExecuted.value = false
  searchResults.value = []
  searchRequest.value = null
}

const exportResults = () => {
  const exportData = {
    searchRequest: searchRequest.value,
    results: searchResults.value,
    exportedAt: new Date().toISOString(),
    totalResults: searchResults.value.length
  }

  emit('exportResults', exportData)

  // Also create downloadable file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `search-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const closeModal = () => {
  isVisible.value = false
}

// Expose method to execute search from parent
defineExpose({
  executeSearch
})
</script>

<style scoped>
.search-summary code {
  background-color: var(--bs-gray-100);
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
}

.bi {
  font-family: 'bootstrap-icons';
}

/* Fallback for bootstrap icons if not loaded */
.bi-search::before {
  content: '🔍';
}

.search-results-content {
  min-height: 400px;
}

.no-results,
.initial-state {
  color: var(--bs-secondary);
}
</style>
