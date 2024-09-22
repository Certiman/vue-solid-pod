<script setup>
import { computed, onBeforeMount, ref } from 'vue'

import { getContainedResourceUrlAll } from '@inrupt/solid-client'
import { sessionStore } from '@/stores/sessions'
import { processStore } from '@/stores/process'

// locals
const processes = ref([])
const SELECTED_PROCESS = ref('')
const appProcessURL = computed(() => sessionStore.fullAppProcessURL(SELECTED_PROCESS.value, "list"))

// props
const props = defineProps({ provider: Object })

onBeforeMount(() => {
  // Extract the dataset provided by the provider, and extract the Processes
  const processesFromProvider = getContainedResourceUrlAll(props.provider.ProcessDataSet)
  processes.value = processesFromProvider.map((p) => ({
    value: p,
    text: processStore.extractProcessResource(p)
  }))
})
</script>

<template>
  <!-- {{ provider }} -->
  <BListGroupItem>
    <BInputGroup>
      <BFormInput :placeholder="provider.Label" />
      <BFormSelect v-model="SELECTED_PROCESS" :options="processes" />
      <BButton :to="appProcessURL ? appProcessURL : '/'" :disabled="appProcessURL === null"
        ><IMdiAnimationPlay class="mb-1"
      /></BButton>
    </BInputGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
