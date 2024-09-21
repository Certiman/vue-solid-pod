<template>
  <BFormGroup description="b. Enter items to read" class="my-3">
    <BCard class="mt-2" no-body>
      <BCardHeader>
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
      </BCardHeader>
      <BCardBody>
        <BListGroup flush>
          <ReadingItem
            v-for="book of allNonDeletedBooks"
            :key="allBookTitles.indexOf(book.title)"
            :book="book"
            @deleteBook="removeBook"
            @editBook="editBook"
          />
        </BListGroup>
      </BCardBody>
      <BCardFooter>
        <BContainer class="fluid">
          <BRow>
            <BCol lg="9" order="1">
              <BInputGroup prepend="Book title" class="me-2">
                <BFormInput
                  id="newBookToAdd"
                  v-model="newBook"
                  type="text"
                  @keyup.enter="addBook"
                ></BFormInput>
                <BButton @click="addBook"><IMdiNoteAdd class="me-2 mb-1" />Add Title Only</BButton>
              </BInputGroup>
            </BCol>
            <BCol order="2">
              <BButton
                @click="modalStore.canShowEditModal = !modalStore.canShowEditModal"
                variant="primary"
                ><IMdiAddBox class="me-2 mb-1"></IMdiAddBox> Add Detailed Book</BButton
              >
            </BCol>
          </BRow>
        </BContainer>
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
      :max="statusLabelsSubscriptionDuration"
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
  <!-- <ShaclViewBookModal :BookUrl="bookToShowUrl" /> -->
  <ViewResourceModal
    :shapeFileUrl="`${sessionStore.selectedPodUrl}getting-started/formShapes/new_book_form.ttl`"
    :resource-uri="bookToShowUrl"
    :modal-data="{ title: 'Book Information', noCancel: true }"
    @viewer-hidden="testLogRDF"
  />
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
  setThing,
  getUrl
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { WebsocketNotification } from '@inrupt/solid-client-notifications'
import { SCHEMA_INRUPT, RDF, AS, DCTERMS } from '@inrupt/vocab-common-rdf'

import {
  BAlert,
  BButton,
  BCard,
  BCardBody,
  BCardFooter,
  BFormGroup,
  BFormInput,
  BInputGroup
  // BListGroupItem
} from 'bootstrap-vue-next'
import { ref, onBeforeMount, watch, computed } from 'vue'

import ShaclAddBookModal from '@/components/modals/ShaclAddBookModal.vue'
// import ShaclViewBookModal from '@/components/modals/ShaclViewBookModal.vue'
import ViewResourceModal from '@/components/modals/ViewResourceModal.vue'
import ReadingItem from './ReadingItem.vue'

import { sessionStore } from '@/stores/sessions'
import { booksStore } from '@/stores/store'
import { modalStore } from '@/stores/ui'

// The books themselves, and some helpers used in the template
// To remain faithful to the original app, two books are always present from start.
const newBook = ref('') // v-model for the book title to add
const bookToShowUrl = ref('')
const allBooks = ref([
  { title: 'Leaves of Grass', isComplex: false, isToBeDeleted: false },
  { title: 'RDF 1.1 Primer', isComplex: false, isToBeDeleted: false }
])

/**
 *
 * v-model for all the books as they exist in the
 * This now can come from the Pod using download. But it is hard-code in the demo app, so we pre-fill them anyway.
 * */
const allNonDeletedBooks = computed(() =>
  allBooks.value
    .filter((book) => !book.isToBeDeleted)
    .sort((a, b) => a.title.localeCompare(b.title))
)
const allBookTitles = computed(() => allNonDeletedBooks.value.map((book) => book.title))
// const allBookTitles = ref(['Leaves of Grass', 'RDF 1.1 Primer'])

// Creates and Updates the DATA RESOURCE to add Things to (via global store).
const newList = ref('myList')
watch(newList, (list) => {
  booksStore.setReadingListResource(list)
})

// FIXME: Visualize the node bing handled, as this happens too fast it is barely visible.
const handledBook = ref('')
// const itemGroupClass = ref('list-group-item-primary')

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

// Before mounting, create the readingLIst
onBeforeMount(() => {
  // seems required for the alerts to appear
  Alert.value?.pause()

  // initial value of the readingListURL
  booksStore.setReadingListResource(newList.value)
})

// Functions
/**
 * Function to check what ViewResourceModal is up to
 */
const testLogRDF = (data) => {
  console.log('Full N3 Store object from SHACL Form:', data)
}

/**
 * Returns @return true when the book with given title is being written into the Dataset
 * @param bookTitle the string containing the book, which is potentially being written, deleted etc
 * Function not used because the changes are faster than DOM updates.
 */
// const bookBeingHandled = (bookTitle) => bookTitle == handledBook.value

/**
 * Function triggers the reload of the resource book list and update of the view.
 */
const downloadList = async () => {
  let myReadingList

  await rebuildBookList(myReadingList)
}

/** Adds SIMPLE book from input field 'newBookToAdd'to the list */
function addBook() {
  if (!allBookTitles.value.includes(newBook.value)) {
    allBooks.value.push({ title: newBook.value, isComplex: false, isToBeDeleted: false })
  } else {
    statusLabelAlertVariant.value = 'danger'
    statusLabelAlert.value =
      'Book already exists. Can not add identical book name (due to design of this demo)'
    Alert.value?.restart()
  }
  newBook.value = ''
}

/** finds a SIMPLE OR COMPLEX book given a title */
function findBookByTitle(bookTitle) {
  console.log(`Finding book with title "${bookTitle}"...`)

  const foundBook = allBooks.value.find((book) => book.title == bookTitle)
  console.log(foundBook)

  if (foundBook) return foundBook
  else {
    console.error(`Book "${bookTitle}" was not found. AllBooks:`, allBooks.value)
    return null
  }
}

/**
 * Removes a book from the UI stack, by setting it to be deleted.
 * It is physically deleted, when the Write is executed.
 * @param book
 */
function removeBook(bookTitle) {
  // Find book not yet marked for deletion and mark it toBe Deleted
  const book = findBookByTitle(bookTitle)

  // non-existing books or books already marked, should be ignored.
  if (!book || book.isToBeDeleted) return
  try {
    // mark it as to be deleted
    book.isToBeDeleted = true
  } catch (erreur) {
    console.error(`Failed to remove book with title ${book.title}`)
  } finally {
    console.log(allBooks.value)
  }
}

/** */
function editBook(book, newTitle) {
  if (!book.isComplex) {
    // allow for the title to be edited
    book.title = newTitle
  } else {
    // show the View Book Modal
    bookToShowUrl.value = book.resourceUri
    modalStore.canShowViewModal = true
  }
  console.log(allBooks.value)
}

/**
 * Function activates a WSN on the selected readinglist data resource, which will trigger the Subscription BAlert.
 */
async function subscribeToList() {
  // URI of the ReadingList DATA RESOURCE
  const containerUrl = booksStore.readingListURL

  // Create the websocket on that data resource
  const websocket = new WebsocketNotification(containerUrl, { fetch: fetch })

  const makeMessageReadable = (wsNMessage) => {
    // const wsNMessageExample = {
    //   '@context': [
    //     'https://www.w3.org/ns/activitystreams',
    //     { state: { '@id': 'http://www.w3.org/2011/http-headers#etag' } }
    //   ],
    //   id: 'urn:uuid:72ca7fb2-e2c2-4de9-97e9-b4d4f8bd9821',
    //   type: ['http://www.w3.org/ns/prov#Activity', 'Update'],
    //   actor: [''],
    //   object: {
    //     id: 'https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/getting-started/readingList/myList',
    //     type: ['http://www.w3.org/ns/ldp#RDFSource', 'http://www.w3.org/ns/ldp#Resource'],
    //     state: 'c7e4a411-a041-4104-b762-b6bf60b14ddc'
    //   },
    //   published: '2024-09-16T19:44:53.914134538Z'
    // }
    console.log(wsNMessage)
    return `${wsNMessage.object?.id}\n (type: ${wsNMessage.object?.type.join(', ')}) was changed:\n [${wsNMessage.type?.join(': ')}] on ${wsNMessage.published}.`
  }

  websocket.on('message', (message) => {
    Subscription.value?.restart()
    statusLabelSubscriptionHTML.value = `<pre><code>${makeMessageReadable(message)}</code></pre>`
  })

  websocket.connect()

  Subscription.value?.restart()
  statusLabelSubscription.value = `Subscribed to changes in the ${containerUrl}...'`
}

/**
 * Refetch the Reading List, refactored because of the Modal, and update the view allBookTitles list
 * @param dsToUpdate dataset to get all Things from and from which to pull out schema:name ?o for the list
 */
async function rebuildBookList(dsToUpdate) {
  try {
    // Alert.value?.restart()

    allBooks.value = []

    dsToUpdate = await getSolidDataset(booksStore.readingListURL, { fetch: fetch })

    let items = getThingAll(dsToUpdate)
    console.log(
      `Downloading instances in RDF resource ${booksStore.readingListURL}. Items: `,
      items
    )

    for (let i = 0; i < items.length; i++) {
      let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name) // Note the requirement to use this ?p
      let isComplexBook = getUrl(items[i], DCTERMS.conformsTo) == 'http://example.org/Dataset' // arbitrary selection

      if (item !== null) {
        handledBook.value = item

        // Update the view is done with computed value
        // allBookTitles.value.push(item)

        // Update the books
        allBooks.value.push({
          title: item,
          isComplex: isComplexBook,
          isToBeDeleted: false,
          resourceUri: items[i].url
        })
      }
    }
  } catch (error) {
    statusLabelAlertVariant.value = 'danger'
    statusLabelAlert.value = error
  } finally {
    console.log(`Book List rebuilt from Solid POD:`, allBooks.value)

    Alert.value?.restart()
  }
}

/**
 * WRITES the allBooks list to the POD. It must distinguish between complex and simple books.
 * 1. Gets the readingList dataset
 * 2. If the Datset exists: Gets all Things in that dataset and removes them
 * 3. If the dataset does not exist, creates the dataset
 * 4. Based on only the titles from the titles in the allBookTitles array, creates a basic Thing (a as:Article)
 * 5. Using the confusingly named setThing, adds the Thing to the reading list dataset
 * 6. Saves the whole dataset
 * 7. rebuilds the bookList from the saved ds
 */
async function createList() {
  Alert.value?.restart()

  // let titles = allBookTitles.value
  let books = allBooks.value

  // Fetch or create a new reading list.
  let myReadingList

  try {
    // Attempt to retrieve the reading list in case it already exists.
    statusLabelAlertVariant.value = 'success'
    statusLabelAlert.value = 'Retrieving existing Dataset or creating new Dataset...'
    // itemGroupClass.value = 'list-group-item-danger' // mark items being deleted in red

    myReadingList = await getSolidDataset(booksStore.readingListURL, { fetch: fetch })

    // Clear the list to override the whole list
    // The original code would cause complex books to be thrown out as well, so we avoid that for demo's sake.
    let existingBooks = getThingAll(myReadingList)
    existingBooks.forEach((item) => {
      const bookTitle = getStringNoLocale(item, SCHEMA_INRUPT.name)
      // handledBook.value = bookTitle
      if (bookTitle) {
        // SIMPLE books WILL ALL be deleted and the ones to be deleted will not restored below.
        const bookToRemove = findBookByTitle(bookTitle)
        if (bookToRemove && !bookToRemove.isComplex) {
          console.warn(`Deleting simple book with title "${bookTitle}"...`)
          myReadingList = removeThing(myReadingList, item)
        }
      }
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
  statusLabelAlertVariant.value = 'warning'
  statusLabelAlert.value = 'Creating SIMPLE book Things...'

  books.forEach((book, i) => {
    // The complex books are already stored in the SHACL FORM code
    if (book.title.trim() !== '') {
      // handledBook.value = book.title
      if (!book.isComplex && !book.isToBeDeleted) {
        // Rebuild the simple book from the title, skip those deleted above
        let item = createThing({ name: 'title' + i })
        item = addUrl(item, RDF.type, AS.Article)
        item = addStringNoLocale(item, SCHEMA_INRUPT.name, book.title)
        myReadingList = setThing(myReadingList, item)
      }
    }
  })

  try {
    // Save the SolidDataset
    let savedReadingList = await saveSolidDatasetAt(booksStore.readingListURL, myReadingList, {
      fetch: fetch
    })

    statusLabelAlertVariant.value = 'success'
    statusLabelAlert.value = 'Saved'
    // itemGroupClass.value = 'list-group-item-success' // mark items being re-added in green

    await rebuildBookList(savedReadingList) // 7.

    // handledBook.value = ''
  } catch (error) {
    statusLabelAlertVariant.value = 'danger'
    statusLabelAlert.value = error
  } finally {
    Alert.value?.pause()
  }
}

/** Must allow for the creation of a list of items, prefilled with two books. */
</script>

<style lang="scss" scoped></style>
