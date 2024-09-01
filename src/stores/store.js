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
  readingListURL: '',
  canDisplayData() {
    return this.selectedPodUrl.length > 0
  },
  setReadingListResource(ds) {
    // takes a dataset and updates the readingListURL
    const SELECTED_POD = this.selectedPodUrl

    // For simplicity and brevity, this tutorial hardcodes the SolidDataset URL.
    // In practice, you should add in your profile a link to this resource
    // such that applications can follow to find your list.
    // https://storage.inrupt.com/DATASET_ID/getting-started/readingList/myList
    this.readingListURL = `${SELECTED_POD}getting-started/readingList/${ds}` // used in the Modal
  },
  switch() {
    this.mode = this.mode == 'dark' ? 'light' : 'dark'
  }
})
