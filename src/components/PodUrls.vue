<template>
  <BFormGroup
    description="a. Write to your Pod"
    label="3. Create a private reading list in my Pod."
    class="mt-2"
  >
    <BInputGroup prepend="Pod Container">
      <BFormSelect
        v-model="store.selectedPodUrl"
        :options="store.allPodUrls"
      ></BFormSelect>
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
import { BFormGroup, BInputGroup } from 'bootstrap-vue-next'
import { store } from '@/stores/store';
</script>

<style lang="scss" scoped></style>
