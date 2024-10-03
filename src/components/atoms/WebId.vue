<template>
  <BFormGroup label="2. Logged in with your WebID:" id="readlabel" class="mt-2">
    <BInputGroup prepend="Your WebId">
      <BFormInput disabled :placeholder="sessionStore.loggedInWebId"></BFormInput>
      <BButton name="btnRead" id="btnRead" :disabled="disabled" @click="getMyPods">{{
        labelButton
      }}</BButton>
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
// Imports
import { ref, onMounted } from 'vue'
import { BButton, BFormInput, BInputGroup } from 'bootstrap-vue-next'
import { getPodUrlAll } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { sessionStore } from '@/stores/sessions'

// Emitters & Props
defineProps({ disabled: Boolean })

// Local ref
const labelButton = ref('Getting Pod URL(s)')

// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
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
}

onMounted(async () => {
  // just start getMyPods already...
  await getMyPods()
  labelButton.value = 'Pod URL(s) OK'
})
</script>

<style lang="scss" scoped></style>
