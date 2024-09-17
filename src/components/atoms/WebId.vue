<template>
  <BFormGroup label="2. Logged in with your WebID:" id="readlabel" class="mt-2">
    <BInputGroup prepend="Your WebId">
      <BFormInput disabled :placeholder="store.loggedInWebId"></BFormInput>
      <BButton name="btnRead" id="btnRead" :disabled="disabled" @click="getMyPods"
        >Get Pod URL(s)</BButton
      >
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
// Imports
import { BButton, BFormInput, BInputGroup } from 'bootstrap-vue-next'
import { getPodUrlAll } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { store } from '../../stores/store'

// Emitters & Props
defineProps({ disabled: Boolean })

// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
  const mypods = await getPodUrlAll(store.loggedInWebId, { fetch: fetch })

  // Update the page with the retrieved values.
  let selectorPod = []
  mypods.forEach((mypod) => {
    let podOption = {}
    podOption.text = mypod
    podOption.value = mypod
    selectorPod.push(podOption)
  })

  store.allPodUrls = selectorPod
}
</script>

<style lang="scss" scoped></style>
