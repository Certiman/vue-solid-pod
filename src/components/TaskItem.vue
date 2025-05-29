<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BListGroupItem, BFormGroup, BInputGroup, BFormInput, BButton } from 'bootstrap-vue-next'

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

// Computed to check if task is loaded (playTaskURL available)
const isTaskLoaded = computed(() => {
  // Check multiple conditions for task readiness
  const hasValidURL = playTaskURL.value !== null
  const isNotFailed = !props.task.loadStatus || props.task.loadStatus !== 'failed'
  const hasTaskThings = props.task.taskThings && props.task.taskThings.url

  return hasValidURL && isNotFailed && hasTaskThings
})

// Computed to get task load status for UI feedback
const taskLoadStatus = computed(() => {
  if (props.task.loadStatus === 'failed') return 'failed'
  if (props.task.loadStatus === 'loading') return 'loading'
  if (isTaskLoaded.value) return 'loaded'
  return 'unknown'
})

// Get appropriate feedback messages
const validFeedback = computed(() => {
  switch (taskLoadStatus.value) {
    case 'loaded':
      return 'Task ready to execute'
    case 'loading':
      return 'Loading task data...'
    case 'failed':
      return `Failed to load: ${props.task.error?.message || 'Unknown error'}`
    default:
      return 'Task status unknown'
  }
})

const invalidFeedback = computed(() => {
  if (taskLoadStatus.value === 'failed') {
    return `Load failed: ${props.task.error?.message || 'Unknown error'}`
  }
  return 'Loading task...'
})

const showChangeResourceACLModal = () => {
  modalStore.canShowResourceACL = true
  modalStore.selectedResourceACL = props.task.taskThings.url
}

const startTask = () => {
  // Update the running task URI to the correct one
  processStore.currentTaskURI = props.task.taskThings.url
  console.warn(
    `(startTask) Updating processStore: should execute task on pod: ${processStore.currentTaskURI}. `
  )
  router.push(playTaskURL.value ? playTaskURL.value : '/')
}

// Add computed to determine if ACL button should be enabled
const canChangeRights = computed(() => processStore.isOwnedResource(props.task.taskThings.url))

const playTaskURL = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', 0))
const playTaskURI = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', ''))
// const addStepURL = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', 'addStep'))
</script>

<template>
  <BListGroupItem>
    <BFormGroup :description="playTaskURI">
      <BInputGroup>
        <BFormInput
          :placeholder="task.taskName"
          disabled
          :state="taskLoadStatus === 'loaded'"
          :valid-feedback="validFeedback"
          :invalid-feedback="invalidFeedback"
        />
        <!-- Action buttons appended to input -->
        <BButton
          variant="warning"
          @click="showChangeResourceACLModal"
          class="ms-2"
          :disabled="!canChangeRights"
        >
          <IMdiShieldUnlocked />
        </BButton>
        <BButton @click="startTask" :disabled="!isTaskLoaded" class="ms-2">
          <IMdiPlayBoxLockOpenOutline />
        </BButton>
      </BInputGroup>
    </BFormGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
