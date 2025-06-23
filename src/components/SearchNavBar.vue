<template>
  <BNavbar variant="light" class="search-navbar border-bottom">
    <BContainer>
      <div class="w-100">
        <SearchBar
          :restrict-to-specific="false"
          @search="handleSearch"
          @sources-detected="handleSourcesDetected"
        />
      </div>
    </BContainer>

    <!-- Search Results Modal -->
    <SearchResultsModal
      ref="searchModalRef"
      v-model="showSearchResults"
      @result-selected="handleResultSelected"
      @export-results="handleExportResults"
    />
  </BNavbar>
</template>

<script setup>
/**
 * SearchNavBar Component
 *
 * Application-wide search bar positioned as a second navbar
 * Provides intelligent search across pods and SPARQL endpoints
 */
import { ref } from 'vue'
import { BNavbar, BContainer } from 'bootstrap-vue-next'
import SearchBar from '@/components/atoms/SearchBar.vue'
import SearchResultsModal from '@/components/modals/SearchResultsModal.vue'

// Reactive state
const showSearchResults = ref(false)
const searchModalRef = ref(null)

// Event handlers
const handleSearch = async (searchRequest) => {
  console.log('Executing search:', searchRequest)

  // Open search results modal
  showSearchResults.value = true

  // Execute search in modal
  if (searchModalRef.value) {
    await searchModalRef.value.executeSearch(searchRequest)
  }
}

const handleSourcesDetected = (detectedSources) => {
  console.log('Search sources detected:', detectedSources)
  // Could be used to update UI state or provide feedback
}

const handleResultSelected = (result) => {
  console.log('Search result selected:', result)

  // TODO: Handle result selection based on result type
  // This could navigate to a detail view, open a modal, or populate a form

  // For now, close the modal
  showSearchResults.value = false
}

const handleExportResults = (exportData) => {
  console.log('Exporting search results:', exportData)
  // Search results are already downloaded by the modal
  // Could add additional processing here if needed
}
</script>

<style scoped>
.search-navbar {
  background-color: var(--bs-gray-50);
  min-height: auto;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.search-navbar .container {
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Dark mode support */
[data-bs-theme='dark'] .search-navbar {
  background-color: var(--bs-gray-900);
  border-bottom-color: var(--bs-border-color);
}
</style>
