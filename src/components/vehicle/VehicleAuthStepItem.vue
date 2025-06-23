<template>
  <BAccordionItem
    :id="stepId"
    :title="stepTitle"
    :class="{ 'step-completed': completed, 'step-disabled': disabled }"
  >
    <div class="step-content">
      <div class="step-description text-muted mb-3">
        {{ description }}
      </div>

      <slot />

      <div class="step-navigation mt-4 d-flex justify-content-between align-items-center">
        <div>
          <BBadge v-if="completed" variant="success" class="me-2"> ✓ Completed </BBadge>
          <BBadge v-else-if="disabled" variant="secondary"> Disabled </BBadge>
          <BBadge v-else variant="primary"> Active </BBadge>

          <BBadge
            v-if="!completed && allowProgressWhenIncomplete"
            variant="outline-info"
            class="ms-1"
          >
            Optional
          </BBadge>
        </div>
        <div>
          <BButton
            v-if="!isLastStep && (completed || allowProgressWhenIncomplete)"
            variant="primary"
            @click="$emit('nextStep')"
          >
            Next Step
          </BButton>
        </div>
      </div>
    </div>
  </BAccordionItem>
</template>

<script setup>
/**
 * Vehicle Auth Step Item Component
 *
 * Reusable step wrapper for the vehicle authorization process
 * Similar to StepItem but specialized for vehicle auth workflow
 */
import { BAccordionItem, BButton, BBadge } from 'bootstrap-vue-next'

const props = defineProps({
  stepId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isLastStep: {
    type: Boolean,
    default: false
  },
  allowProgressWhenIncomplete: {
    type: Boolean,
    default: false
  }
})

defineEmits(['nextStep'])

const stepTitle = `${props.completed ? '✓' : ''} ${props.title}`
</script>

<style scoped>
.step-completed {
  border-left: 4px solid var(--bs-success);
}

.step-disabled {
  opacity: 0.6;
}

.step-disabled .accordion-button {
  cursor: not-allowed;
}

.step-content {
  padding: 1rem 0;
}

.step-navigation {
  border-top: 1px solid var(--bs-border-color);
  padding-top: 1rem;
}
</style>
