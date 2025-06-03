<template>
  <BFormGroup label="Available Pod Root Containers" id="readlabel" class="mb-4">
    <BInputGroup :prepend="labelGroup">
      <BFormInput disabled :placeholder="sessionStore.loggedInWebId" />
      <BButton name="btnRead" id="btnRead" :disabled="disabled || isLoadingPods" @click="getMyPods">
        <template v-if="isLoadingPods"> <BSpinner small class="me-1" />Loading Pods... </template>
        <template v-else>
          {{ labelButton }}
        </template>
      </BButton>
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
// Imports
import { ref, onMounted } from 'vue'
import { BButton, BFormInput, BInputGroup, BSpinner } from 'bootstrap-vue-next'
import { getPodUrlAll } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { sessionStore } from '@/stores/sessions'

// Emitters & Props
defineProps({ disabled: Boolean })

// Local ref
const labelButton = ref('Get Pod URL(s)')
const labelGroup = ref('Checking containers for WebId')
const isLoadingPods = ref(false) // Loading state for fetching pods

// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
  isLoadingPods.value = true
  const mypods = await getPodUrlAll(sessionStore.loggedInWebId, { fetch: fetch })

  // Update the page with the retrieved values.
  let selectorPod = []
  mypods.forEach((mypod) => {
    let podOption = {}
    podOption.text = mypod
    podOption.value = mypod
    selectorPod.push(podOption)
  })

  sessionStore.allPodUrls = selectorPod
  isLoadingPods.value = false
}

onMounted(async () => {
  // just start getMyPods already...
  await getMyPods()
  labelButton.value = 'Pod URL(s) OK'
  labelGroup.value = 'Checked containers for WebId'
})
</script>

<style lang="scss" scoped></style>
