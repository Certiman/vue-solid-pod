// TimedAlert.vue
<template>
  <BAlert
    v-model="alertDuration"
    :variant="variant"
    dismissible
    @close-countdown="alertCountdown = $event"
    class="mb-3"
    v-if="alertDuration > 0"
  >
    <slot>{{ message }}</slot>
    <BProgress :variant="variant" :max="alertDuration" :value="alertCountdown" height="4px" />
  </BAlert>
</template>

<script setup>
/**
 * TimedAlert Component
 *
 * A reusable alert component with countdown timer and progress bar
 * that automatically dismisses after a specified duration.
 * Used throughout the application for consistent user feedback.
 */
import { ref, watch } from 'vue'
import { BAlert, BProgress } from 'bootstrap-vue-next'

const props = defineProps({
  /**
   * The message to display in the alert
   */
  message: {
    type: String,
    default: ''
  },
  /**
   * The variant/type of the alert (success, warning, danger, info, etc.)
   */
  variant: {
    type: String,
    default: 'info'
  },
  /**
   * Duration in milliseconds for the alert to be shown
   */
  duration: {
    type: Number,
    default: 5000
  },
  /**
   * Whether to show the alert
   */
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['hidden'])

// Reactive state for countdown mechanism
const alertDuration = ref(0) // 0 = hidden, positive value = shown with countdown
const alertCountdown = ref(0)

// Method to show the alert with countdown
const showAlert = () => {
  alertDuration.value = props.duration
  alertCountdown.value = props.duration
}

// Watch for show prop changes to trigger the alert
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      showAlert()
    }
  },
  { immediate: true }
)

// Watch for when alert is hidden to emit event
watch(
  () => alertDuration.value,
  (newValue) => {
    if (newValue === 0) {
      emit('hidden')
    }
  }
)

// Expose method for parent components to trigger alert
defineExpose({
  showAlert
})
</script>
