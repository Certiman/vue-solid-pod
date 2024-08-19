<script setup>
import { ref } from 'vue'
import { store } from '../stores/store'

import LoginPod from '@/components/LoginPod.vue'
import WebId from '@/components/WebId.vue'
import PodUrls from '@/components/PodUrls.vue'
import ReadingList from '@/components/ReadingList.vue'

// const loggedInWebId = ref('')
const selectedPodUrl = ref('')
// const canGetPodURLs = ref(false)
const canDisplayData = ref(false)
const allPodUrls = ref([])

// function setSession(sess) {
//   // loggedInWebId.value = sess.webId
//   store.loggedInWebId = sess.webId
//   canGetPodURLs.value = true
// }

function setPodUrls(allUrls) {
  allPodUrls.value = allUrls
  // canGetPodURLs.value = false
}

function getDataFromPodUrl(podUrl) {
  selectedPodUrl.value = podUrl
  canDisplayData.value = true
}
</script>

<template>
  <LoginPod />
  <WebId :disabled="allPodUrls.length > 0" v-if="store.canGetPodURLs" @podUrls="setPodUrls" />
  <PodUrls
    v-if="allPodUrls.length > 0"
    :podUrls="allPodUrls"
    class="mt-2"
    @podUrl="getDataFromPodUrl"
  />
  <ReadingList :podUrl="selectedPodUrl" v-if="canDisplayData" />
</template>
