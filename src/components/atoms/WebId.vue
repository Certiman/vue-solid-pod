<template>
  <BFormGroup label="2. Logged in with your WebID:" id="readlabel" class="mt-2">
    <BInputGroup prepend="Your WebId">
      <BFormInput disabled :placeholder="sessionStore.loggedInWebId" />
    </BInputGroup>
    <!-- Action button separated for clarity -->
    <div class="mt-2 d-flex">
      <BButton name="btnRead" id="btnRead" :disabled="disabled || isLoadingPods" @click="getMyPods">
        <template v-if="isLoadingPods"> <BSpinner small class="me-1" />Loading Pods... </template>
        <template v-else>
          {{ labelButton }}
        </template>
      </BButton>
    </div>
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
})
</script>

<style lang="scss" scoped></style>
