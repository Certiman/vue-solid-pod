<script setup>
import { computed } from 'vue'

import LoginPod from '@/components/atoms/LoginPod.vue'
import WebId from '@/components/atoms/WebId.vue'
import PodUrls from '@/components/atoms/PodUrls.vue'

import { sessionStore } from '@/stores/sessions'
import { modalStore } from '@/stores/ui'

const allPodUrlsKnown = computed(() => sessionStore.allPodUrls.length > 0)
</script>

<template>
  <BModal
    id="add-storage-provide"
    v-model="modalStore.canShowAddStorage"
    title="Add your storage provider"
    size="lg"
    ok-only
    scrollable
  >
    <LoginPod />
    <WebId :disabled="allPodUrlsKnown" v-if="sessionStore.canGetPodURLs" />
    <PodUrls v-if="allPodUrlsKnown" class="mt-2"
  /></BModal>
</template>

<style lang="scss" scoped></style>
