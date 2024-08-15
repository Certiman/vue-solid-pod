<template>
  <BFormGroup description="a. Write to your Pod" label="3.Create a private reading list in my Pod.">
    <BFormSelect
      v-model="selectedPodUrl"
      :options="podUrls"
      @change="emit('podUrl', selectedPodUrl)"
    ></BFormSelect>
    <!--     {{ selectedPodUrl }} -->
  </BFormGroup>
</template>

<script setup>
import { ref } from 'vue'
import { BFormGroup } from 'bootstrap-vue-next'
const selectedPodUrl = ref('')

/** Takes available podUrls and construts a drop down, emits selected podUrl */
defineProps(['podUrls'])
const emit = defineEmits(['podUrl'])
</script>

<style lang="scss" scoped></style>
