<template>
  <div class="search-result-group">
    <div v-if="results.length === 0" class="text-center py-3 text-muted">
      <p>No results found in {{ source }}</p>
    </div>

    <div v-else>
      <BListGroup>
        <BListGroupItem
          v-for="result in results"
          :key="result.id"
          :variant="result.type === 'error' ? 'danger' : null"
          class="search-result-item"
          @click="selectResult(result)"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div class="result-content flex-grow-1">
              <h6 class="mb-1">
                {{ result.title || result.uri }}
                <BBadge :variant="getResultTypeBadgeVariant(result.type)" class="ms-2">
                  {{ result.type }}
                </BBadge>
              </h6>

              <p v-if="result.description" class="mb-1 text-muted">
                {{ result.description }}
              </p>

              <small class="text-muted">
                <strong>URI:</strong>
                <code>{{ result.uri }}</code>
              </small>

              <!-- Properties Display -->
              <div
                v-if="result.properties && Object.keys(result.properties).length > 0"
                class="properties mt-2"
              >
                <small>
                  <strong>Properties:</strong>
                  <span
                    v-for="(value, prop) in result.properties"
                    :key="prop"
                    class="property-badge me-1"
                  >
                    <BBadge variant="light">{{ prop }}: {{ value }}</BBadge>
                  </span>
                </small>
              </div>
            </div>

            <div class="result-actions">
              <BButton variant="outline-primary" size="sm" @click.stop="selectResult(result)">
                Select
              </BButton>
            </div>
          </div>
        </BListGroupItem>
      </BListGroup>
    </div>
  </div>
</template>

<script setup>
/**
 * SearchResultGroup Component
 *
 * Displays a group of search results from a specific source
 * Handles result selection and provides consistent formatting
 */
import { BListGroup, BListGroupItem, BBadge, BButton } from 'bootstrap-vue-next'

defineProps({
  results: {
    type: Array,
    required: true
  },
  source: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['resultSelected'])

// Methods
const selectResult = (result) => {
  emit('resultSelected', result)
}

const getResultTypeBadgeVariant = (type) => {
  const variants = {
    resource: 'primary',
    'sparql-result': 'info',
    error: 'danger',
    evidence: 'success',
    application: 'warning'
  }
  return variants[type] || 'secondary'
}
</script>

<style scoped>
.search-result-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background-color: var(--bs-gray-50);
}

.result-content code {
  font-size: 0.85em;
  background-color: var(--bs-gray-100);
  padding: 0.1em 0.3em;
  border-radius: 0.2em;
}

.property-badge {
  margin-bottom: 0.25rem;
}

.property-badge .badge {
  font-size: 0.7em;
}
</style>
