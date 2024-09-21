// store.js (serves the books example)
import { reactive } from 'vue'
import { sessionStore } from './sessions'

export const booksStore = reactive({
  readingListURL: '',
  setReadingListResource(ds) {
    // takes a dataset and updates the readingListURL
    const SELECTED_POD = sessionStore.selectedPodUrl

    // For simplicity and brevity, this tutorial hardcodes the SolidDataset URL.
    // In practice, you should add in your profile a link to this resource
    // such that applications can follow to find your list.
    // https://storage.inrupt.com/DATASET_ID/getting-started/readingList/myList
    this.readingListURL = `${SELECTED_POD}getting-started/readingList/${ds}` // used in the Modal
  }
})
