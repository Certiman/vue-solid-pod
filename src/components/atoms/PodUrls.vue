<template>
  <BFormGroup
    description="a. Write to your Pod"
    label="3. Create a private reading list in my Pod."
    class="mt-2"
  >
    <BInputGroup prepend="Pod Container">
      <BFormSelect v-model="store.selectedPodUrl" :options="store.allPodUrls"></BFormSelect>
      <BLink
        :href="'https://penny.vincenttunru.com/explore/?url=' + store.selectedPodUrl"
        target="_new"
      >
        <BButton
          name="btnToPenny"
          variant="primary"
          id="btnToPenny"
          v-b-tooltip="{ title: 'Open your container with Penny' }"
        >
          <IMdiTriangleSmallUp class="mb-1"
        /></BButton>
      </BLink>
    </BInputGroup>
  </BFormGroup>
</template>

<script setup>
import { BFormGroup, BInputGroup } from 'bootstrap-vue-next'
import { store } from '@/stores/store'
</script>

<style lang="scss" scoped></style>
