<script setup>
// Regrouping all imported process providers, allowing activation of a process through ProcessItem
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'
import { sessionStore } from '@/stores/sessions'

import ProcessItem from './ProcessItem.vue'

const showChangeResourceACLModal = () => {
  modalStore.canShowResourceACL = true
  modalStore.selectedResourceACL = sessionStore.selectedPodUrl + 'process/'
}
</script>

<template>
  <BCard header="Available processes" class="mt-3" v-if="processStore.processProviders.length > 0">
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
