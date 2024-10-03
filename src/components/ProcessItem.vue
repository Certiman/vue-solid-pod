<script setup>
import { computed, onBeforeMount, ref } from 'vue'

import { getContainedResourceUrlAll } from '@inrupt/solid-client'
import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'

// locals
const processes = ref([])
const SELECTED_PROCESS = ref('')

// listing all tasks on a process MUST be done at /process/PROC
const appProcessURL = computed(() => sessionStore.fullAppProcessURL(SELECTED_PROCESS.value, ''))

// props
const props = defineProps({ provider: Object })

const updateProcessList = () => {
  // Extract the dataset provided by the provider, and extract the Processes
  try {
    const processesFromProvider = getContainedResourceUrlAll(props.provider.ProcessDataSet)
    if (processesFromProvider) {
      processes.value = processesFromProvider.map((p) => ({
        value: p,
        text: processStore.extractProcessResource(p)
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

onBeforeMount(() => updateProcessList())
</script>

<template>
  <BListGroupItem v-if="processes.length > 0">
    <BInputGroup>
      <BFormInput :placeholder="provider.Label" />
      <BFormSelect v-model="SELECTED_PROCESS" :options="processes" />
      <BButton :to="appProcessURL ? appProcessURL : '/'" :disabled="appProcessURL === null"
        ><IMdiAnimationPlay class="mb-1"
      /></BButton>
    </BInputGroup>
  </BListGroupItem>
  <BListGroupItem v-else>
    <BInputGroup>
      <BInputGroupText>
        No available processes from Provider:
      </BInputGroupText>
      <BInputGroupText>{{ provider.ProviderWebId }}</BInputGroupText>
    </BInputGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
