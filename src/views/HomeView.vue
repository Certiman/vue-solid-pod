<script setup>
import { ref } from 'vue'
// import TheWelcome from '../components/TheWelcome.vue'
import LoginPod from '@/components/LoginPod.vue'
import WebId from '@/components/WebId.vue'
import PodUrls from '@/components/PodUrls.vue'
import ReadingList from '@/components/ReadingList.vue'

const loggedInWebId = ref('')
const selectedPodUrl = ref('')
const canGetPodURLs = ref(false)
const canDisplayData = ref(false)
const allPodUrls = ref([])

function setSession(sess) {
  loggedInWebId.value = sess.webId
  canGetPodURLs.value = true
}

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
  <LoginPod @podSession="setSession" />
  <WebId
    :myWebId="loggedInWebId"
    :disabled="allPodUrls.length > 0"
    v-if="canGetPodURLs"
    @podUrls="setPodUrls"
  />
  <PodUrls
    v-if="allPodUrls.length > 0"
    :podUrls="allPodUrls"
    class="mt-2"
    @podUrl="getDataFromPodUrl"
  />
  <ReadingList :podUrl="selectedPodUrl" v-if="canDisplayData" />
</template>
