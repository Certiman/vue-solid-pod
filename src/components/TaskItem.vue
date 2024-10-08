<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

import { sessionStore } from '@/stores/sessions'
import { modalStore } from '@/stores/ui'
import { processStore } from '@/stores/process'


// Task is a RDFresource containing the Things for steps.
// TaskStep == Book, of which the properties can lead to:
// - a form
// - a HTML explanation
// - a List with data
// - a complex component for which the app must take care of.
const props = defineProps({ task: Object })

const showChangeResourceACLModal = () => {
  modalStore.canShowResourceACL = true
  modalStore.selectedResourceACL = props.task.taskThings.url
}

const startTask = () => {
  // Update the running task URI to the correct one
  processStore.currentTaskURI = props.task.taskThings.url
  console.warn(`(startTask) Updating processStore: should execute task on pod: ${processStore.currentTaskURI}. `)
  router.push(playTaskURL.value ? playTaskURL.value : '/')

}


// TODO: not sure whether .url a Thing is the idea?
const playTaskURL = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', 0))
const playTaskURI = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', ''))
// const addStepURL = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', 'addStep'))
</script>

<template>
  <BListGroupItem>
    <BInputGroup :prepend="playTaskURI">
      <BFormInput :placeholder="task.taskName" />
      <BButton name="ChangeResourceACL" variant="warning" @click="showChangeResourceACLModal"
        ><IMdiShieldUnlocked class="mb-1"
      /></BButton>

      <!-- v-b-tooltip="{ title: 'Start this Task' }" requires unique id or vue hates it -->
      <BButton
        name="StartTaskButton"
        id="StartTaskButton"
        @click="startTask"
        :disabled="playTaskURL === null"
        ><IMdiPlayBoxLockOpenOutline class="mb-1"
      /></BButton>
    </BInputGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
