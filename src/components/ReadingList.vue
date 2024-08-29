<template>
  <BFormGroup description="b. Enter items to read" class="my-3">
    <BCard class="mt-2" no-body>
      <BListGroup flush>
        <BListGroupItem
          v-for="book of allBooks"
          :key="allBooks.indexOf(book)"
          button
          :active="bookBeingHandled(book)"
          :active-class="itemGroupClass"
          @click="removeBook(book)"
          ><IMdiDeleteForeverOutline class="me-2 mb-1" />{{ book }}</BListGroupItem
        >
      </BListGroup>
      <BCardBody>
        <BInputGroup prepend="Book title">
          <BFormInput
            id="newBookToAdd"
            v-model="newBook"
            type="text"
            @keyup.enter="addBook"
          ></BFormInput>
          <BButton @click="store.canShowModal = !store.canShowModal" variant="primary"
            >Add complete book</BButton
          >
          <BButton @click="addBook"><IMdiNoteAdd class="mb-1 me-2" />Add Title</BButton>
        </BInputGroup>
      </BCardBody>
      <BCardFooter>
        <BInputGroup prepend="Book List Container: /getting-started/readingList/">
          <BFormInput v-model="newList" type="text"></BFormInput>
          <BButton @click="downloadList" variant="warning"
            ><IMaterialSymbolsCloudDownloadOutline class="me-2 mb-1" />Download</BButton
          >
          <BButton @click="createList" variant="danger"
            ><IJamWriteF class="me-2 mb-1" />Overwrite</BButton
          >
          <BButton @click="subscribeToList" variant="success"
            ><IMdiBellRing class="me-2 mb-1" />Subscribe</BButton
          >
        </BInputGroup>
      </BCardFooter>
    </BCard>
  </BFormGroup>
  <BAlert
    v-model="statusLabelsSubscriptionDuration"
    ref="Subscription"
    variant="warning"
    @close-countdown="countdownSubscription = $event"
  >
    <p v-if="statusLabelSubscriptionHTML.length === 0">{{ statusLabelSubscription }}</p>
    <p v-else v-html="statusLabelSubscriptionHTML"></p>
    <BProgress
      variant="warning"
      :max="statusLabelsDuration"
      :value="countdownSubscription"
      height="4px"
    />
  </BAlert>
  <BAlert
    v-model="statusLabelsDuration"
    ref="Alert"
    :variant="statusLabelAlertVariant"
    @close-countdown="countdown = $event"
  >
    <p>{{ statusLabelAlert }}</p>
    <BProgress
      :variant="statusLabelAlertVariant"
      :max="statusLabelsDuration"
      :value="countdown"
      height="4px"
    />
  </BAlert>
  <ShaclAddBookModal @DataSetUpdated="rebuildBookList(newReadingList)" />
</template>

<script setup>
import {
  addUrl,
  addStringNoLocale,
  createSolidDataset,
  createThing,
  getSolidDataset,
  getStringNoLocale,
  getThingAll,
  removeThing,
  saveSolidDatasetAt,
  setThing
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { WebsocketNotification } from '@inrupt/solid-client-notifications'
import { SCHEMA_INRUPT, RDF, AS } from '@inrupt/vocab-common-rdf'

import {
  BAlert,
  BButton,
  BCard,
  BCardBody,
  BCardFooter,
  BFormGroup,
  BFormInput,
  BInputGroup,
  BListGroupItem
} from 'bootstrap-vue-next'
import { ref, onBeforeMount, watch } from 'vue'

import ShaclAddBookModal from '@/components/ShaclAddBookModal.vue'

import { store } from '../stores/store'
const allBooks = ref(['Leaves of Grass', 'RDF 1.1 Primer']) // TODO: This should come from the POd and not hard-coded. But it is hard-code in the demo app.
const booksRewritten = ref([]) // contains the rewrittenbooks and is not really used. Idea was to mark these books in the list differently.
const newBook = ref('') // v-models the book title to add

// Creates and Updates the DATA RESOURCE to add Things to (via global store).
const newList = ref('myList')
watch(newList, (list) => {
  const SELECTED_POD = store.selectedPodUrl

  // For simplicity and brevity, this tutorial hardcodes the SolidDataset URL.
  // In practice, you should add in your profile a link to this resource
  // such that applications can follow to find your list.
  // https://storage.inrupt.com/DATASET_ID/getting-started/readingList/myList
  store.readingListURL = `${SELECTED_POD}getting-started/readingList/${list}` // used in the Modal
})

// Visualize the node bing handled, as this happens too fast it i barely visible.
const handledBook = ref('')
const itemGroupClass = ref('list-group-item-primary')

// Alert and Subscription messages
// Subscription reacts to the WS
const Subscription = ref(null)
const statusLabelSubscription = ref('No messages received, maybe there are no Subscriptions.')
const statusLabelSubscriptionHTML = ref('')
const statusLabelsSubscriptionDuration = ref(10000)
const countdownSubscription = ref(1000)

// Alert reports on the Solid Client operations
const Alert = ref(null) // gives access to pause, restart etc
const statusLabelAlert = ref('Add books to a named list in your POD.')
const statusLabelAlertVariant = ref('primary')
const statusLabelsDuration = ref(10000)
const countdown = ref(1000)
onBeforeMount(() => {
  // seems required for the alerts to appaer
  Alert.value?.pause()

  // initial value of the readingListURL
  store.readingListURL = `${store.selectedPodUrl}getting-started/readingList/${newList.value}`
})

// Functions
/**
 * Returns @return true when the book with given title is being written into the Dataset
 * @param bookTitle the string containing the book, which is potentially being written, deleted etc
 */
const bookBeingHandled = (bookTitle) => bookTitle == handledBook.value

/**
 * Function triggers the reload of the resource book list and update of the view.
 */
const downloadList = async () => {
  let myReadingList

  await rebuildBookList(myReadingList)
}

/** Adds book from input field 'newBookToAdd'to the list */
function addBook() {
  allBooks.value.push(newBook.value)
  newBook.value = ''
}

function removeBook(book) {
  allBooks.value.splice(allBooks.value.indexOf(book), 1)
}

/**
 * Function activates a WSN on the selected readinglist data resource, which will trigger the Subscription BAlert.
 */
async function subscribeToList() {
  // URI of the ReadingList DATA RESOURCE
  const containerUrl = store.readingListURL

  // Create the websocket on that data resource
  const websocket = new WebsocketNotification(containerUrl, { fetch: fetch })

  websocket.on('message', (message) => {
    Subscription.value?.restart()
    statusLabelSubscriptionHTML.value = `<pre><code>${JSON.stringify(message)}</code></pre>`
  })

  websocket.connect()

  Subscription.value?.restart()
  statusLabelSubscription.value = `Subscribed to changes in the ${containerUrl}...'`
}

/**
 * Refetch the Reading List, refactored because of the Modal, and update the view allBooks list
 * @param dsToUpdate dataset to get all Things from and from which to pull out schema:name ?o for the list
 */
async function rebuildBookList(dsToUpdate) {
  try {
    // Alert.value?.restart()

    booksRewritten.value = []

    dsToUpdate = await getSolidDataset(store.readingListURL, { fetch: fetch })

    let items = getThingAll(dsToUpdate)
    console.log(`Downloading instances in RDF resource ${store.readingListURL}. Items: `, items)

    for (let i = 0; i < items.length; i++) {
      let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name) // Note the requirement to use this ?p

      if (item !== null) {
        handledBook.value = item
        booksRewritten.value.push(item)
      }
    }

    // Update the view
    allBooks.value = booksRewritten.value
  } catch (error) {
    statusLabelAlert.value = error
    statusLabelAlertVariant.value = 'danger'
  } finally {
    Alert.value?.restart()
  }
}

/**
 * 1. Gets the readingList dataset
 * 2. If the Datset exists: Gets all Things in that dataset and removes them
 * 3. If the dataset does not exist, creates the dataset
 * 4. Based on only the titles from the titles in the allBooks array, creates a basic Thing (a as:Article)
 * 5. Using the confusingly named setThing, adds the Thing to the reading list dataset
 * 6. Saves the whole dataset
 * 7. rebuilds the bookList from the saved ds
 */
async function createList() {
  Alert.value?.restart()

  let titles = allBooks.value

  // Fetch or create a new reading list.
  let myReadingList

  try {
    // Attempt to retrieve the reading list in case it already exists.
    statusLabelAlert.value = 'Retrieving existing Dataset or creating new Dataset...'
    itemGroupClass.value = 'list-group-item-danger' // mark items being deleted in red

    myReadingList = await getSolidDataset(store.readingListURL, { fetch: fetch })
    // Clear the list to override the whole list
    let items = getThingAll(myReadingList)
    items.forEach((item) => {
      handledBook.value = getStringNoLocale(item, SCHEMA_INRUPT.name)
      myReadingList = removeThing(myReadingList, item)
    })
  } catch (error) {
    console.error('Getting data from dataset failed:', error.message)
    if (typeof error.statusCode === 'number' && error.statusCode === 404) {
      // if not found, create a new SolidDataset (i.e., the reading list)
      myReadingList = createSolidDataset()
    } else {
      console.error('Error - createSolidDataset() was not executed!')
    }
  }

  // Add titles to the Dataset
  statusLabelAlert.value = 'Creating book Things...'

  titles.forEach((title, i) => {
    if (title.trim() !== '') {
      handledBook.value = title
      let item = createThing({ name: 'title' + i })
      item = addUrl(item, RDF.type, AS.Article)
      item = addStringNoLocale(item, SCHEMA_INRUPT.name, title)
      myReadingList = setThing(myReadingList, item)
    }
  })

  try {
    // Save the SolidDataset
    let savedReadingList = await saveSolidDatasetAt(store.readingListURL, myReadingList, {
      fetch: fetch
    })

    statusLabelAlert.value = 'Saved'
    itemGroupClass.value = 'list-group-item-success' // mark items being re-added in green

    await rebuildBookList(savedReadingList) // 7.

    handledBook.value = ''
  } catch (error) {
    statusLabelAlert.value = error
    statusLabelAlertVariant.value = 'danger'
  } finally {
    Alert.value?.pause()
  }
}

/** Must allow for the creation of a list of items, prefilled with two books. */
</script>

<style lang="scss" scoped></style>
