// TimedAlert.vue
<template>
  <BAlert
    v-model="duration"
    :ref="alertRef"
    :variant="variant"
    @close-countdown="$emit('update:countdown', $event)"
  >
    <slot></slot>
    <BProgress :variant="variant" :max="duration" :value="countdown" height="4px" />
  </BAlert>
</template>

<script setup>
import { BAlert, BProgress } from 'bootstrap-vue-next'

const props = defineProps({
  duration: Number,
  variant: {
    type: String,
    default: 'info'
  },
  countdown: Number,
  alertRef: String
})

defineEmits(['update:countdown'])
</script>
