<template>
  <!-- <div id="read" class="panel">
    <div class="row">
      <label id="readlabel" for="myWebID">2. Logged in with your WebID: </label>
      <input type="text" id="myWebID" name="myWebID" size="50" :value="myWebId" disabled>

      <button name="btnRead" id="btnRead" :disabled="disabled"></button>
    </div>
  </div> -->
  <BFormGroup label="2. Logged in with your WebID:" id="readlabel" class="mt-2">
    <BInputGroup prepend="Your WebId">
      <BFormInput disabled :placeholder="myWebId"></BFormInput>
      <BButton name="btnRead" id="btnRead" :disabled="disabled" @click="getMyPods"
        >Get Pod URL(s)</BButton
      >
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
// Inpoirts
import { BButton, BFormInput, BInputGroup } from 'bootstrap-vue-next'
import { getPodUrlAll } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

// Emitters & Props
const emit = defineEmits(['podUrls'])
const props = defineProps({ myWebId: String, disabled: Boolean })

// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
  const mypods = await getPodUrlAll(props.myWebId, { fetch: fetch })

  // Update the page with the retrieved values.
  let selectorPod = []
  mypods.forEach((mypod) => {
    let podOption = {}
    podOption.text = mypod
    podOption.value = mypod
    selectorPod.push(podOption)
  })

  console.log(selectorPod)

  emit('podUrls', selectorPod)
}
</script>

<style lang="scss" scoped></style>
