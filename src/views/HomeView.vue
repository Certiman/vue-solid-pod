<script setup>
import { ref } from 'vue'
// import TheWelcome from '../components/TheWelcome.vue'
import LoginPod from '@/components/LoginPod.vue'
import WebId from '@/components/WebId.vue'
import PodUrls from '@/components/PodUrls.vue'

const loggedInWebId = ref('')
const canGetPodURLs = ref(false)
const allPodUrls = ref([])

function setSession(sess) {
  loggedInWebId.value = sess.webId
  canGetPodURLs.value = true
}

function setPodUrls(allUrls) {
  allPodUrls.value = allUrls
  canGetPodURLs.value = false
}

function getDataFromPodUrl(podUrl) {
  console.log(podUrl);

}
</script>

<template>
  <BContainer>
    <LoginPod @podSession="setSession" />
    <WebId
      :myWebId="loggedInWebId"
      :disabled="!canGetPodURLs"
      v-if="canGetPodURLs"
      @podUrls="setPodUrls"
    />
    <PodUrls v-if="allPodUrls.length > 0" :podUrls="allPodUrls" class="mt-2" @podUrl="getDataFromPodUrl"/>
  </BContainer>
</template>
