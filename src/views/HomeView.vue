<script setup>
import { computed } from 'vue'
import { store } from '../stores/store'

import LoginPod from '@/components/LoginPod.vue'
import WebId from '@/components/WebId.vue'
import PodUrls from '@/components/PodUrls.vue'
import ReadingList from '@/components/ReadingList.vue'
import ShaclAddBookModal from '@/components/ShaclAddBookModal.vue'

const allPodUrlsKnown = computed(() => store.allPodUrls.length > 0)
</script>

<template>
  <LoginPod />
  <WebId :disabled="allPodUrlsKnown" v-if="store.canGetPodURLs" />
  <PodUrls v-if="allPodUrlsKnown" class="mt-2" />
  <ReadingList v-if="store.canDisplayData()" />
  <ShaclAddBookModal v-if="store.canDisplayData()" />
</template>
