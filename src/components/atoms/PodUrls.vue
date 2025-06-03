<template>
  <BFormGroup
    description="This container is the Root Container we will write all data to. If only one container is available, it is selected by default."
    label="Destination Pod Root Container"
    class="mt-2"
  >
    <!-- Loading state -->
    <div v-if="isLoadingPodUrls" class="text-center py-3">
      <BSpinner small class="me-2" /> Loading Pod Containers...
    </div>
    <!-- Selection and action when loaded -->
    <div v-else>
      <BInputGroup prepend="Pod Container" class="mb-2">
        <!-- Show a select when multiple Pod URLs available, otherwise a read-only input -->
        <template v-if="sessionStore.allPodUrls.length > 1">
          <BFormSelect v-model="sessionStore.selectedPodUrl" :options="sessionStore.allPodUrls" />
        </template>
        <template v-else>
          <BFormInput v-model="sessionStore.selectedPodUrl" disabled />
        </template>
      </BInputGroup>
      <div>
        <BButton
          :href="pennyUrl"
          target="_blank"
          variant="outline-primary"
          class="w-100"
          v-b-tooltip="{ title: 'Open your container with Penny' }"
        >
          <IMdiTriangle class="me-1" /> Explore with Penny
        </BButton>
      </div>
    </div>
  </BFormGroup>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import {
  BFormGroup,
  BInputGroup,
  BFormSelect,
  BFormInput,
  BButton,
  BSpinner
} from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

// Loading indicator for Pod URLs retrieval
const isLoadingPodUrls = computed(() => sessionStore.allPodUrls.length === 0)
// Penny explore URL
const pennyUrl = computed(
  () => `https://penny.vincenttunru.com/explore/?url=${sessionStore.selectedPodUrl}`
)

onMounted(() => {
  if (sessionStore.allPodUrls.length > 0) {
    // set the first one in the drop down
    sessionStore.selectedPodUrl = sessionStore.allPodUrls[0].value
  }
})
</script>

<style lang="scss" scoped></style>
