// store.js
import { reactive } from 'vue'

export const store = reactive({
  mode: 'light',
  loggedInWebId: '',
  selectedPodUrl: '',
  canGetPodURLs: false,
  canDisplayData: false,
  allPodUrls: [],
  switch() {
    this.mode = this.mode == 'dark' ? 'light' : 'dark'
  }
})
