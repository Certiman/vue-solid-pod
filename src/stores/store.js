// store.js
import { reactive } from 'vue'

export const store = reactive({
  allPodUrls: [],
  allShapeBlobUrls: [],
  canGetPodURLs: false,
  canShowModal: false,
  loggedInWebId: '',
  mode: 'light',
  selectedPodUrl: '',
  canDisplayData() {
    return this.selectedPodUrl.length > 0
  },
  switch() {
    this.mode = this.mode == 'dark' ? 'light' : 'dark'
  }
})
