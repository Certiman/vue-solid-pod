<template>
  <BFormGroup description="b. Enter items to read" class="my-3">
    <BAlert
      v-model="dismissCountDown"
      ref="Alert"
      :variant="statusLabelVariant"
      @close-countdown="countdown = $event"
    >
      <p>{{ statusLabelAlert }}</p>
      <BProgress
        :variant="statusLabelVariant"
        :max="dismissCountDown"
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
          >{{ book }}</BListGroupItem
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
          <BButton @click="addBook">+</BButton>
        </BInputGroup>
      </BCardBody>
      <BCardFooter>
        <BInputGroup prepend="Book List">
          <BFormInput v-model="newList" type="text"></BFormInput>
          <BButton @click="createList">Rewrite this list</BButton>
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
import { ref, onBeforeMount } from 'vue'

const props = defineProps(['podUrl'])

const allBooks = ref(['Leaves of Grass', 'RDF 1.1 Primer'])
const booksRewritten = ref([]) //
const newBook = ref('')
const newList = ref('myList')

// Visualize the node bing handled
const handledBook = ref('')
const itemGroupClass = ref('list-group-item-primary')

// Alert messages
const Alert = ref(null) // gives access to pause, restart etc
const statusLabelAlert = ref('Add books to a named list in your POD.')
const statusLabelVariant = ref('primary')
const dismissCountDown = ref(10000)
const countdown = ref(10)
onBeforeMount(() => Alert.value?.pause())
// Functions
/**
 * Returns @return true when the book with given title is being written into the Dataset
 * @param bookTitle the string containing the book, which is potentially being written, deleted etc
 */
const bookBeingHandled = (bookTitle) => bookTitle === handledBook.value

/** Adds book from input field 'newBookToAdd'to the list */
function addBook() {
  allBooks.value.push(newBook.value)
  newBook.value = ''
}

function removeBook(book) {
  allBooks.value.splice(allBooks.value.indexOf(book), 1)
}

async function createList() {
  Alert.value?.restart()
  const SELECTED_POD = props.podUrl

  // For simplicity and brevity, this tutorial hardcodes the  SolidDataset URL.
  // In practice, you should add in your profile a link to this resource
  // such that applications can follow to find your list.
  // https://storage.inrupt.com/DATASET_ID/getting-started/readingList/myList
  const readingListUrl = `${SELECTED_POD}getting-started/readingList/${newList.value}`

  let titles = allBooks.value

  // Fetch or create a new reading list.
  let myReadingList

  try {
    // Attempt to retrieve the reading list in case it already exists.
    statusLabelAlert.value = 'Retrieving existing Dataset or creating new Dataset...'
    itemGroupClass.value = 'list-group-item-danger' // mark items being deleted in red

    myReadingList = await getSolidDataset(readingListUrl, { fetch: fetch })
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
    let savedReadingList = await saveSolidDatasetAt(readingListUrl, myReadingList, { fetch: fetch })

    statusLabelAlert.value = 'Saved'
    itemGroupClass.value = 'list-group-item-success' // mark items being re-added in green

    // Refetch the Reading List
    savedReadingList = await getSolidDataset(readingListUrl, { fetch: fetch })

    let items = getThingAll(savedReadingList)

    for (let i = 0; i < items.length; i++) {
      let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name)
      handledBook.value = item
      if (item !== null) {
        booksRewritten.value.push(item)
      }
    }

    handledBook.value = ''
  } catch (error) {
    statusLabelAlert.value = error
    statusLabelVariant.value = 'danger'
  } finally {
    Alert.value?.pause()
  }
}

/** Must allow for the creation of a list of items, prefilled with two books. */
</script>

<style lang="scss" scoped></style>
