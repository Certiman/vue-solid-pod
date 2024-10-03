<script setup>
// Regrouping all imported process providers, allowing activation of a process through ProcessItem
import { processStore } from '@/stores/process'
import ProcessItem from './ProcessItem.vue'
</script>

<template>
  <section v-if="processStore.processProviders.length > 0">
    <BFormGroup description="Select a process and run it to select from any of its tasks">
      <BListGroup flush>
        <ProcessItem
          v-for="provider of processStore.processProviders"
          :key="provider.Label"
          :provider="provider"
        />
      </BListGroup>
    </BFormGroup>
  </section>
  <section v-else>
    <p class="lead font-weight-normal">
      You can connect to a process provider of your choice by using the button
      <ICarbonProcess /> above.
    </p>
  </section>
</template>
