<script setup>
import { sessionStore } from '@/stores/sessions'
import { computed } from 'vue'

// Task is a RDFresource containing the Things for steps.
// TaskStep == Book, of which the properties can lead to:
// - a form
// - a HTML explanation
// - a List with data
// - a complex component for which the app must take care of.
const props = defineProps({ task: Object })

// TODO: not sure whether .url a Thing is the idea?
const playTaskURL = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', 0))
const playTaskURI = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', ''))
// const addStepURL = computed(() => sessionStore.fullAppTaskURL(props.task.taskThings.url, '', 'addStep'))
</script>

<template>
  <BListGroupItem>
    <BInputGroup :prepend="playTaskURI">
      <BFormInput :placeholder="task.taskName" />

      <!-- v-b-tooltip="{ title: 'Start this Task' }" -->
      <BButton :to="playTaskURL ? playTaskURL : '/'" :disabled="playTaskURL === null"
        ><IMdiPlayBoxLockOpenOutline class="mb-1"
      /></BButton>
    </BInputGroup>
  </BListGroupItem>
</template>

<style lang="scss" scoped></style>
