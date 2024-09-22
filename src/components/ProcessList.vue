<script setup>
// Regrouping all imported process providers, allowing activation of a process through ProcessItem
import { processStore } from '@/stores/process'
import ProcessItem from './ProcessItem.vue';
</script>

<template>
  <section v-if="processStore.processProviders.length > 0">
    {{ processStore.processProviders }}
    <h3>Available processes</h3>
    <BFormGroup description="Select a process">
      <BCardBody>
        <BListGroup flush>
          <ProcessItem
            v-for="provider of processStore.processProviders"
            :key="provider.Label"
            :provider="provider"
          />
        </BListGroup>
      </BCardBody>
    </BFormGroup>
  </section>
  <section v-else>
    <h3>No processes available</h3>
    <p>
      This application only supports processes as described using linked data. You can add a process
      provider above.
    </p>
  </section>
</template>
