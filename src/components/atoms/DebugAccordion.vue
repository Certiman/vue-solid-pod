<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BAccordion, BAccordionItem, BTable } from 'bootstrap-vue-next'
import IMdiCodeTags from '~icons/mdi/code-tags'

// Props for flexible debug information
const props = defineProps({
  title: {
    type: String,
    default: 'Debug Information'
  },
  showRouteInfo: {
    type: Boolean,
    default: false
  },
  showStoreInfo: {
    type: Boolean,
    default: false
  },
  customDebugData: {
    type: Array,
    default: () => []
  },
  storeData: {
    type: Object,
    default: () => ({})
  }
})

const route = useRoute()

// Standard route debug information
const routeDebugData = computed(() => {
  if (!props.showRouteInfo) return []

  return [
    { label: 'Route Parameters', value: JSON.stringify(route.params, null, 2) },
    { label: 'Query Parameters', value: JSON.stringify(route.query, null, 2) },
    { label: 'Full Path', value: route.fullPath },
    { label: 'Route Name', value: route.name || 'N/A' }
  ]
})

// Store debug information
const storeDebugData = computed(() => {
  if (!props.showStoreInfo) return []

  return Object.entries(props.storeData).map(([key, value]) => ({
    label: key,
    value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  }))
})

// Combined debug data
const allDebugData = computed(() => [
  ...routeDebugData.value,
  ...storeDebugData.value,
  ...props.customDebugData
])

// Table fields for debug display
const debugFields = [
  { key: 'label', label: 'Property', thClass: 'fw-bold' },
  { key: 'value', label: 'Value', tdClass: 'font-monospace small' }
]
</script>

<template>
  <BAccordion>
    <BAccordionItem>
      <template #title>
        <span class="text-muted">
          <IMdiCodeTags class="me-2" />
          {{ title }}
        </span>
      </template>

      <div v-if="allDebugData.length > 0">
        <BTable :items="allDebugData" :fields="debugFields" small striped responsive class="mb-0" />
      </div>

      <div v-else class="text-muted fst-italic">No debug information available</div>

      <!-- Slot for additional custom debug content -->
      <slot name="custom-debug"></slot>
    </BAccordionItem>
  </BAccordion>
</template>

<style scoped>
.font-monospace {
  font-family: 'Courier New', monospace;
}

/* Handle long JSON strings */
:deep(.table td) {
  word-break: break-word;
  max-width: 300px;
  white-space: pre-wrap;
}
</style>
