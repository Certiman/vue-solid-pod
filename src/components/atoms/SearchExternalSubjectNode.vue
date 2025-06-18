<template>
  <BCard>
    <BCardHeader>
      <h4>External Data Search</h4>
    </BCardHeader>
    <BCardBody>
      <BAlert variant="info" :model-value="true">
        <h5>Coming Soon</h5>
        <p class="mb-0">
          External SPARQL endpoint search functionality will be implemented in a future phase. This
          component will enable searching railway data from external sources using Comunica.
        </p>
      </BAlert>
    </BCardBody>
  </BCard>
</template>

<script setup>
/**
 * SearchExternalSubjectNode Component (Placeholder)
 *
 * Future component for searching external SPARQL endpoints using Comunica.
 * Will be implemented in Phase 4 of the VA Inspector development.
 *
 * Planned features:
 * - Configurable SPARQL endpoint connections
 * - Dynamic query construction based on expected data structures
 * - Result mapping to local RDF data patterns
 * - Integration with evidence management workflow
 */
import { BCard, BCardHeader, BCardBody, BAlert } from 'bootstrap-vue-next'

defineProps({
  endpoints: {
    type: Array,
    default: () => []
  },
  queryTemplates: {
    type: Array,
    default: () => []
  },
  resultMappings: {
    type: Object,
    default: () => ({})
  }
})

// Placeholder for future implementation
console.log('SearchExternalSubjectNode: Placeholder component loaded')
</script>

<style scoped>
/* Future styles for external search interface */
</style>
