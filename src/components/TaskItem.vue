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
const isTaskLoaded = computed(() => playTaskURL.value !== null)

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

// TODO: not sure whether .url a Thing is the idea?
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
          :state="isTaskLoaded"
          valid-feedback="Task ready"
          invalid-feedback="Loading task..."
        />
        <!-- Action buttons appended to input -->
        <BButton variant="warning" @click="showChangeResourceACLModal" class="ms-2">
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
