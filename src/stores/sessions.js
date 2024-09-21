import { reactive } from 'vue'

export const sessionStore = reactive({
  canGetPodURLs: false,
  allPodUrls: [], // the WebId's OWN pod Urls
  loggedInWebId: '',
  selectedPodUrl: '',
  canDisplayData() {
    return this.selectedPodUrl.length > 0
  }
})
