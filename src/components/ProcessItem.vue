<script setup>
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

import { getContainedResourceUrlAll } from '@inrupt/solid-client'
import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'

// locals
const processes = ref([])
// const SELECTED_PROCESS = ref('')

// listing all tasks on a process MUST be done at /process/PROC
const appProcessURL = computed(() => sessionStore.fullAppProcessURL(processStore.currentTaskURI, ''))

// props
const props = defineProps({ provider: Object })

const updateProcessList = () => {
  // Extract the dataset provided by the provider, and extract the Processes
  try {
    const processesFromProvider = getContainedResourceUrlAll(props.provider.ProcessDataSet)
    if (processesFromProvider) {
      processes.value = processesFromProvider.map((p) => ({
        value: p,
        text: processStore.shorthandForProcessURI(p)
      }))
    }
  } catch (error) {
    console.error(
      `Failed updating process list for provider ${props.provider.ProviderWebId}: ${error}`
    )
    if (typeof error.statusCode === 'number' && error.statusCode === 403) {
      console.error(`No access to the process container at ${props.provider.ProviderWebId}`)
    }
  }
}

const showChangeResourceACLModal = () => {
  modalStore.canShowResourceACL = true
  modalStore.selectedResourceACL = processStore.currentTaskURI
}

const startProcess = () => {
  console.warn(`(startProcess) Updating processStore: should execute process on pod: ${processStore.currentTaskURI}. `)

  // store the CORRECT URI to execute task from.
  // processStore.currentTaskURI = SELECTED_PROCESS.value
  // reroute to :to="appProcessURL ? appProcessURL : '/'"
  router.push(appProcessURL.value ? appProcessURL.value : '/')
}

onBeforeMount(() => updateProcessList())
</script>

<template>
  <BListGroupItem v-if="processes.length > 0">
    <!-- {{  appProcessURL  }} -->
    <BInputGroup>
      <BFormInput :placeholder="provider.Label" />
      <BFormSelect v-model="processStore.currentTaskURI" :options="processes" />
      <BButton
        name="ChangeResourceACL"
        variant="danger"
        @click="showChangeResourceACLModal"
        :disabled="appProcessURL === null"
        ><IMdiShieldUnlocked class="mb-1"
      /></BButton>
      <BButton @click="startProcess" :disabled="appProcessURL === null"
        ><IMdiAnimationPlay class="mb-1"
      /></BButton>
    </BInputGroup>
  </BListGroupItem>
  <BListGroupItem v-else>
    <BInputGroup>
      <BInputGroupText> No available processes from Provider: </BInputGroupText>
      <BInputGroupText>{{ provider.ProviderWebId }}</BInputGroupText>
    </BInputGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
