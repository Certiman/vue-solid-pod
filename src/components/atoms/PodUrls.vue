<template>
  <BFormGroup
    description="a. Write to your Pod"
    label="3. Create a private reading list in my Pod."
    class="mt-2"
  >
    <BInputGroup prepend="Pod Container">
      <BFormSelect
        v-model="sessionStore.selectedPodUrl"
        :options="sessionStore.allPodUrls"
      ></BFormSelect>
      <BLink
        :href="'https://penny.vincenttunru.com/explore/?url=' + sessionStore.selectedPodUrl"
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
import { onMounted } from 'vue'
import { BFormGroup, BInputGroup } from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

onMounted(() => {
  if (sessionStore.allPodUrls.length > 0) {
    // set the first one in the drop down
    sessionStore.selectedPodUrl = sessionStore.allPodUrls[0].value
  }
})
</script>

<style lang="scss" scoped></style>
