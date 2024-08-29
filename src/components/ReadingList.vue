<template>
  <BFormGroup description="b. Enter items to read" class="my-3">
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
          <BButton @click="createList" variant="warning"
            ><IJamWriteF class="me-2 mb-1" />List</BButton
          >
          <BButton @click="subscribeToList" variant="success"
            ><IMdiBellRing class="me-2 mb-1" />Subscribe</BButton
          >
        </BInputGroup>
      </BCardFooter>
    </BCard>
  </BFormGroup>
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

import { store } from '../stores/store'
const allBooks = ref(['Leaves of Grass', 'RDF 1.1 Primer'])
const booksRewritten = ref([]) //
const newBook = ref('')
const newList = ref('myList')
watch(newList, (list) => {
  const SELECTED_POD = store.selectedPodUrl

  // For simplicity and brevity, this tutorial hardcodes the SolidDataset URL.
  // In practice, you should add in your profile a link to this resource
  // such that applications can follow to find your list.
  // https://storage.inrupt.com/DATASET_ID/getting-started/readingList/myList
  store.readingListURL = `${SELECTED_POD}getting-started/readingList/${list}` // used in the Modal
})

// Visualize the node bing handled
const handledBook = ref('')
const itemGroupClass = ref('list-group-item-primary')

// Alert qand Subscription messages
const Subscription = ref(null)
const statusLabelSubscription = ref('No messages received, maybe there are no Subscriptions.')
const statusLabelSubscriptionHTML = ref('')
const statusLabelsSubscriptionDuration = ref(10000)
const countdownSubscription = ref(1000)

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

/** Adds book from input field 'newBookToAdd'to the list */
function addBook() {
  allBooks.value.push(newBook.value)
  newBook.value = ''
}

function removeBook(book) {
  allBooks.value.splice(allBooks.value.indexOf(book), 1)
}

async function subscribeToList() {
  // URI of the ReadbngList DATA RESOURCE
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

async function rebuildBookList(dsToUpdate) {
  // Refetch the Reading List, refactored because of the Modal
  dsToUpdate = await getSolidDataset(store.readingListURL, { fetch: fetch })

  let items = getThingAll(dsToUpdate)

  for (let i = 0; i < items.length; i++) {
    let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name) // Note the requirement to use this ?p
    handledBook.value = item
    if (item !== null) {
      booksRewritten.value.push(item)
    }
  }
}

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

    await rebuildBookList(savedReadingList)

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
