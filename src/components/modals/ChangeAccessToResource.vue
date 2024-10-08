<script setup>
/**
 * Allows to change the access rights for any given resource to any given WebId OR public.
 * Agent: https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/universalAccess.html#setagentaccess
 * Public: https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/universalAccess.html#setpublicaccess
 *
 * PROPS:
 * - URI to change the access from
 */
import { ref, onBeforeMount, computed } from 'vue'
import { getWebIdDataset, universalAccess } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import { modalStore } from '@/stores/ui'
import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'

// props and refs
const props = defineProps({ resourceURI: String })
const resRights = ref({ read: false, write: false, append: false })
const rights = Object.keys(resRights.value)
const updatingRights = ref(false)
const resWebId = ref('')
const currentRights = ref(null)
const state = ref(false)
const feedback = ref('Please enter a valid WebId, or leave blank for public agent')

// Helpers
onBeforeMount(async () => await checkCurrentRights())
const rightsInYourOwnPod = computed(() => props.resourceURI.includes(sessionStore.selectedPodUrl))

// Core function
const updateRights = async () => {
  // Changes the rights to this resource
  // FIXME: Process above is not changed explicitly. It should get read rights as well, but then it opens all other access?
  //
  updatingRights.value = true
  try {
    if (resWebId.value.length == 0) {
      // Assume PUBLIC rights
      await universalAccess.setPublicAccess(props.resourceURI, resRights.value, { fetch: fetch })
    } else {
      // Precheck the WebId
      const webIdOK = await getWebIdDataset(resWebId.value)
      if (!webIdOK) {
        feedback.value = 'WebId can not be found'
      } else {
        const accessSet = await universalAccess.setAgentAccess(
          props.resourceURI,
          resWebId.value,
          resRights.value,
          {
            fetch: fetch
          }
        )
        if (accessSet) {
          feedback.value = 'Access rights granted!'
          state.value = true
        } else {
          feedback.value = 'Access rights could not be changed for given WebId'
          state.value = false
        }
      }
    }
  } catch (err) {
    // Check error type as well
    feedback.value = err
  } finally {
    updatingRights.value = false
  }
}

const checkCurrentRights = async () => {
  // display whom rights have been given to
  // console.error(`checkCurrentRights is seeing props.resourceURI: ${props.resourceURI}`);
  if (!props.resourceURI) return false
  if (!rightsInYourOwnPod.value) return false
  const cRights = await universalAccess.getAgentAccessAll(props.resourceURI, { fetch: fetch })
  currentRights.value = cRights
}
</script>
<template>
  <BModal
    id="change-resource-acl"
    v-model="modalStore.canShowResourceACL"
    title="Allow access to the resource"
    size="lg"
    scrollable
    ok-only
    ok-title="Close"
  >
    <BCard
      :header="`Define access rights for resource ${processStore.extractProcTaskResource(props.resourceURI)}`"
      v-if="rightsInYourOwnPod"
    >
      <p>Control URI: {{ props.resourceURI }}</p>
      <BCardBody>
        <BFormGroup
          description="Choose rights and (optional) WebId to grant rights to. Important: write allows to replace data!"
          id="ChangeAccessRight"
          label="Rights you wish to grant"
        >
          <BFormCheckbox
            v-for="(right, i) in rights"
            :key="i"
            switch
            inline
            v-model="resRights[right]"
            >{{ right }}</BFormCheckbox
          >
          <p></p>
        </BFormGroup>
        <BFormGroup
          class="mt-2"
          description="What WebId you wish to grant these rights to? Leaving this empty grants to any public agent"
          id="ChangeAccessTarget"
          label="WebId or Public Agent"
          label-for="webIdAcl"
          valid-feedback="WebId found!"
          :invalid-feedback="feedback"
          :state="state"
        >
          <BFormInput id="webIdAcl" v-model="resWebId" :state="state" />
        </BFormGroup>
        <BButton
          @click="updateRights"
          variant="outline-success"
          class="mt-2"
          :loading="updatingRights"
          >Update {{ resWebId.length == 0 ? 'public' : 'specific' }} access rights</BButton
        >
      </BCardBody>
    </BCard>
    <BCard header="Current access rights" class="mt-2" v-if="rightsInYourOwnPod">
      <BCardBody>
        <AccessRightsList v-if="currentRights" :all-rights="currentRights" />
        <p v-else>Checking for rights...</p>
      </BCardBody>
    </BCard>
    <BCard header="Access rights are managed by process owner" v-else>
      No access rights can be modified, as the logged in WebId is not owning the process pod data.
    </BCard>
  </BModal>
</template>

<style lang="scss" scoped></style>
