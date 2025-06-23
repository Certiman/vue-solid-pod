import { reactive, computed } from 'vue'
import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'

/**
 * Search Provider Store
 *
 * Manages search providers (SPARQL endpoints) similar to how processStore manages
 * process providers (Solid Pods). This provides a unified way to configure and
 * access different data sources for search functionality.
 *
 * A searchProvider structure:
 * {
 *   id: String,           // Unique identifier
 *   type: String,         // 'sparql' | 'pod' (for future extension)
 *   url: String,          // SPARQL endpoint URL
 *   name: String,         // Human-readable name
 *   description: String,  // Optional description
 *   active: Boolean,      // Whether the provider is available/enabled
 *   authentication: {     // Optional authentication config
 *     type: String,       // 'none' | 'basic' | 'bearer' | 'oauth'
 *     credentials: Object // Auth credentials if needed
 *   }
 * }
 */

export const searchStore = reactive({
  // SPARQL endpoint providers
  sparqlProviders: [],

  // UI state
  canShowAddSparqlProviderModal: false,

  // Computed properties
  get activeSparqlProviders() {
    return this.sparqlProviders.filter((provider) => provider.active)
  },

  get hasAnySparqlProviders() {
    return this.sparqlProviders.length > 0
  },

  get hasActiveSparqlProviders() {
    return this.activeSparqlProviders.length > 0
  },

  // Methods for managing SPARQL providers
  addSparqlProvider(providerConfig) {
    const provider = {
      id: providerConfig.id || `sparql-${Date.now()}`,
      type: 'sparql',
      url: providerConfig.url,
      name: providerConfig.name || 'SPARQL Endpoint',
      description: providerConfig.description || '',
      active: providerConfig.active !== false, // Default to true unless explicitly false
      authentication: providerConfig.authentication || { type: 'none' }
    }

    // Check if provider already exists
    const existingIndex = this.sparqlProviders.findIndex((p) => p.url === provider.url)
    if (existingIndex >= 0) {
      // Update existing provider
      this.sparqlProviders[existingIndex] = provider
    } else {
      // Add new provider
      this.sparqlProviders.push(provider)
    }

    console.log('Added/updated SPARQL provider:', provider)
    return provider
  },

  removeSparqlProvider(providerId) {
    const index = this.sparqlProviders.findIndex((p) => p.id === providerId)
    if (index >= 0) {
      const removed = this.sparqlProviders.splice(index, 1)[0]
      console.log('Removed SPARQL provider:', removed)
      return removed
    }
    return null
  },

  toggleSparqlProvider(providerId) {
    const provider = this.sparqlProviders.find((p) => p.id === providerId)
    if (provider) {
      provider.active = !provider.active
      console.log(
        `Toggled SPARQL provider ${providerId} to ${provider.active ? 'active' : 'inactive'}`
      )
    }
  },

  getSparqlProvider(providerId) {
    return this.sparqlProviders.find((p) => p.id === providerId)
  },

  // Test SPARQL provider connectivity
  async testSparqlProvider(providerId) {
    const provider = this.getSparqlProvider(providerId)
    if (!provider) {
      throw new Error(`SPARQL provider ${providerId} not found`)
    }

    try {
      // Simple test query to check if endpoint is responsive
      const testQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 1'
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          Accept: 'application/sparql-results+json'
        },
        body: testQuery
      })

      if (response.ok) {
        provider.active = true
        console.log(`SPARQL provider ${providerId} test successful`)
        return true
      } else {
        provider.active = false
        console.warn(`SPARQL provider ${providerId} test failed:`, response.status)
        return false
      }
    } catch (error) {
      provider.active = false
      console.error(`SPARQL provider ${providerId} test error:`, error)
      return false
    }
  },

  // Add some default/example SPARQL endpoints for development
  addDefaultSparqlProviders() {
    // Only add if no providers exist yet
    if (this.sparqlProviders.length === 0) {
      // Note: These are example endpoints - in production you'd configure real ones
      this.addSparqlProvider({
        id: 'dbpedia',
        url: 'https://dbpedia.org/sparql',
        name: 'DBpedia',
        description: 'General knowledge from Wikipedia',
        active: false // Disabled by default until user enables
      })

      this.addSparqlProvider({
        id: 'wikidata',
        url: 'https://query.wikidata.org/sparql',
        name: 'Wikidata',
        description: 'Collaborative knowledge base',
        active: false // Disabled by default until user enables
      })

      console.log('Added default SPARQL providers (disabled)')
    }
  }
})

// Computed properties for integration with search components
export const searchProviders = computed(() => {
  const providers = []
  const seenUrls = new Set() // Track URLs to avoid duplicates

  // Collect all searchable pods (user pod + process provider pods)
  const searchablePods = []

  // Add user's pod if connected
  if (sessionStore.selectedPodUrl) {
    searchablePods.push({
      url: sessionStore.selectedPodUrl,
      isUserPod: true,
      isProcessProvider: false,
      label: null // Will be determined later
    })
  }

  // Add process provider pods
  if (processStore.processProviders && processStore.processProviders.length > 0) {
    processStore.processProviders.forEach((provider) => {
      searchablePods.push({
        url: provider.ContainerURI,
        isUserPod: false,
        isProcessProvider: true,
        label: provider.Label,
        providerWebId: provider.ProviderWebId,
        active: provider.Active !== false
      })
    })
  }

  // Deduplicate pods by URL and determine appropriate names
  const uniquePods = []
  searchablePods.forEach((pod) => {
    if (!seenUrls.has(pod.url)) {
      seenUrls.add(pod.url)

      // Check if this URL matches user's pod
      const isOwnPod = sessionStore.selectedPodUrl === pod.url

      // Determine the best name for this pod
      let name, description
      if (isOwnPod) {
        // This is the user's own pod
        name = 'Your Pod'
        description = 'Your personal Solid Pod'
        if (pod.isProcessProvider && pod.label) {
          description += ` (also: ${pod.label})`
        }
      } else {
        // This is someone else's pod/process provider
        name = pod.label || 'External Pod'
        description = `Process provider: ${pod.providerWebId || pod.url}`
      }
      uniquePods.push({
        id: isOwnPod ? 'user-pod' : `pod-${uniquePods.length}`,
        type: 'pod',
        url: pod.url,
        name: name,
        description: description,
        active: pod.active !== false
      })
    }
  })

  // Add the deduplicated pods to providers
  providers.push(...uniquePods) // Add active SPARQL providers
  searchStore.activeSparqlProviders.forEach((provider) => {
    providers.push({
      id: provider.id,
      type: 'sparql',
      url: provider.url,
      name: provider.name,
      description: provider.description,
      active: provider.active
    })
  })

  return providers
})

// Computed properties for specific provider types
export const podProviders = computed(() => {
  return searchProviders.value.filter((provider) => provider.type === 'pod')
})

export const sparqlProviders = computed(() => {
  return searchProviders.value.filter((provider) => provider.type === 'sparql')
})
