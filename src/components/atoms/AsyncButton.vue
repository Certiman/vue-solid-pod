<script setup>
import { ref, watch } from 'vue'
const asyncButton = ref(null)
const processAwaiting = ref(false)

const emit = defineEmits(['aclick'])

const props = defineProps({
  label: String,
  iconClass: String, // IMdiNoteAdd etc
  asyncDone: Boolean, // component does not know itself
  variant: String,
  disabled: Boolean
})

// watch(props.asyncDone, (newAsyncDone) => {
//   // Button is informed about async being finished.
//   processAwaiting.value = newAsyncDone
// })

const onHideOverlay = () => {
  processAwaiting.value = false
  asyncButton.value?.focus()
}

const onStartAsync = () => {
  processAwaiting.value = true
  emit('aclick')
}
</script>

<template>
  <!-- <BOverlay
    :show="!asyncDone"
    rounded
    opacity="0.6"
    spinner-small
    :spinner-variant="variant"
    class="d-inline-block"
    @hidden="onHideOverlay"
  > -->
    <BButton ref="asyncButton" :disabled="!asyncDone || disabled" :variant="variant" @click="onStartAsync"
      ><component :is="iconClass" class="me-2 mb-1" />{{ label }}</BButton
    >
  <!-- </BOverlay> -->
</template>

<style lang="scss" scoped></style>
