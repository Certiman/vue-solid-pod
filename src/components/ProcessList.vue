<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getContainedResourceUrlAll } from '@inrupt/solid-client'
import { BCard, BCardBody, BCardFooter, BFormGroup, BListGroup, BButton } from 'bootstrap-vue-next'

// Import icons
import IMdiShieldUnlocked from '~icons/mdi/shield-unlocked'
import IMdiNotePlus from '~icons/mdi/note-plus'
import IMdiDatabaseEyeOutline from '~icons/mdi/database-eye-outline'

// Regrouping all imported process providers, allowing activation of a process through ProcessItem
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'
import { sessionStore } from '@/stores/sessions'

import ProcessItem from './ProcessItem.vue'

const router = useRouter()

const showChangeResourceACLModal = () => {
  modalStore.canShowResourceACL = true
  modalStore.selectedResourceACL = sessionStore.selectedPodUrl + 'process/'
}

// Navigate to ERA Container add process
const navigateToAddProcess = () => {
  console.log('Navigating to add new process via ERA Container')

  // Route to the ERA addProcess process
  router.push('/process/Process/add/0')
}

// Navigate to data overview (all processes)
const navigateToDataOverview = () => {
  console.log('Navigating to data overview')
  // For now, navigate to a general data route or first available process
  router.push('/data/Organisation') // Default to Organisation process data
}

// Compute total number of processes across all providers
const totalProcessCount = computed(() => {
  return processStore.processProviders.reduce((total, provider) => {
    // Count processes in each provider's dataset if available
    if (provider.ProcessDataSet) {
      try {
        const containedResources = getContainedResourceUrlAll(provider.ProcessDataSet)
        return total + containedResources.length
      } catch (error) {
        console.warn('Error counting processes in provider:', provider.Label, error)
        return total
      }
    }
    return total
  }, 0)
})

// Check if user can add processes (has own pod)
const canAddProcess = computed(() => {
  return Boolean(sessionStore.loggedInWebId && sessionStore.selectedPodUrl)
})
</script>

<template>
  <BCard
    header="Available processes [ProcessList]"
    class="mt-3"
    v-if="processStore.processProviders.length > 0"
  >
    <!-- {{ processStore.currentTaskURI }} -->

    <BFormGroup description="Select a process and run it to select from any of its tasks">
      <BListGroup flush>
        <ProcessItem
          v-for="provider of processStore.processProviders"
          :key="provider.Label"
          :provider="provider"
        />
      </BListGroup>
    </BFormGroup>
    <BCardFooter class="d-flex justify-content-between align-items-center">
      <!-- Cache status information -->
      <small class="text-muted">
        {{ processStore.processProviders.length }} providers loaded
        <span v-if="totalProcessCount > 0"> • {{ totalProcessCount }} processes </span>
        <span> • Cache: {{ processStore.getCacheStatus.value?.totalCached || 0 }} items </span>
      </small>

      <!-- Action buttons -->
      <div class="d-flex gap-2">
        <!-- View Data button -->
        <BButton
          variant="outline-info"
          size="sm"
          @click="navigateToDataOverview"
          :disabled="!sessionStore.selectedPodUrl || totalProcessCount === 0"
        >
          <IMdiDatabaseEyeOutline class="me-1" />
          View Data
        </BButton>

        <!-- Add Process button -->
        <BButton v-if="canAddProcess" variant="primary" size="sm" @click="navigateToAddProcess">
          <IMdiNotePlus class="me-1" />
          Add Process
        </BButton>
        <small v-else class="text-muted"> Log in to add processes </small>
      </div>
    </BCardFooter>
  </BCard>
  <section v-else>Please connect to a Process Provider, or create and run your own...</section>
  <BCard header="Access Control on your /process resource" class="mt-2">
    <BCardBody
      ><p>
        You can change and monitor access to your process/ resource here. Be aware that no processes
        within your Pod can be executed if the READ-access to this RDFResource is not granted.
      </p>
      <BButton
        name="ChangeResourceACL"
        variant="danger"
        @click="showChangeResourceACLModal"
        :disabled="!sessionStore.loggedInWebId"
        ><IMdiShieldUnlocked class="mb-1 me-2" />Change access to /process</BButton
      >
    </BCardBody>
  </BCard>
</template>
