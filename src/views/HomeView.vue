<script setup>
import { computed } from 'vue'
import { store } from '../stores/store'

import LoginPod from '@/components/LoginPod.vue'
import WebId from '@/components/WebId.vue'
import PodUrls from '@/components/PodUrls.vue'
import ReadingList from '@/components/ReadingList.vue'

// const loggedInWebId = ref('')
// const selectedPodUrl = ref('')
// const canGetPodURLs = ref(false)
// const canDisplayData = ref(false)
// const allPodUrls = ref([])
const allPodUrlsKnown = computed(() => store.allPodUrls.length > 0)

// function setSession(sess) {
//   // loggedInWebId.value = sess.webId
//   store.loggedInWebId = sess.webId
//   canGetPodURLs.value = true
// }

// function setPodUrls(allUrls) {
//   allPodUrls.value = allUrls
//   // canGetPodURLs.value = false
// }

// function getDataFromPodUrl(podUrl) {
//   selectedPodUrl.value = podUrl
//   canDisplayData.value = true
// }
</script>

<template>
  <LoginPod />
  <WebId :disabled="allPodUrlsKnown" v-if="store.canGetPodURLs" />
  <PodUrls v-if="allPodUrlsKnown" class="mt-2" />
  <ReadingList v-if="store.selectedPodUrl.length > 0" />
</template>
