<template>
  <BFormGroup description="b. Enter items to read" class="my-3">
    <BCard no-body>
      <BListGroup flush>
        <BListGroupItem
          v-for="book of allBooks"
          :key="allBooks.indexOf(book)"
          button
          :active="bookBeingWritten(book)"
          :active-class="itemGroupClass"
          >{{ book }}</BListGroupItem
        >
      </BListGroup>
      <BCardBody>
        <BInputGroup prepend="Book title">
          <BFormInput v-model="newBook" type="text" @keyup.enter="addBook"></BFormInput>
          <BButton @click="addBook">+</BButton>
        </BInputGroup>
      </BCardBody>
      <BCardFooter v-if="labelCreateStatus.length > 0">{{ labelCreateStatus }}</BCardFooter>
      <BCardFooter v-else>
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
  BButton,
  BCard,
  BCardBody,
  BCardFooter,
  BFormGroup,
  BFormInput,
  BInputGroup,
  BListGroupItem
} from 'bootstrap-vue-next'
import { ref } from 'vue'

const props = defineProps(['podUrl'])

const allBooks = ref(['Leaves of Grass', 'RDF 1.1 Primer'])
const booksRewritten = ref([]) //
const newBook = ref('')
const handledBook = ref('')
const newList = ref('myList')
const labelCreateStatus = ref('')
const itemGroupClass = ref('primary')

// Functions
/**
 * Returns @return true when the book with given title is being written into the Dataset
 * @param bookTitle the string containing the book, which is potentially being written
 */
const bookBeingWritten = (bookTitle) => bookTitle === handledBook.value

function addBook() {
  allBooks.value.push(newBook.value)
  newBook.value = ''
}

async function createList() {
  labelCreateStatus.value = 'Retrieving existing Dataset or creating new Dataset...'
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
    myReadingList = await getSolidDataset(readingListUrl, { fetch: fetch })
    // Clear the list to override the whole list
    let items = getThingAll(myReadingList)
    items.forEach((item) => {
      myReadingList = removeThing(myReadingList, item)
    })
  } catch (error) {
    console.error('Getting data from dataset failed:', error.message)
    if (typeof error.statusCode === 'number' && error.statusCode === 401) {
      // if not found, create a new SolidDataset (i.e., the reading list)
      myReadingList = createSolidDataset()
    } else {
      console.error('Error - createSolidDataset() was not executed!')
    }
  }

  // Add titles to the Dataset
  labelCreateStatus.value = 'Creating book Things...'

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

    labelCreateStatus.value = 'Saved'
    itemGroupClass.value = 'success'

    // Refetch the Reading List
    savedReadingList = await getSolidDataset(readingListUrl, { fetch: fetch })

    let items = getThingAll(savedReadingList)

    // FIXME: rework below !

    let listcontent = []
    for (let i = 0; i < items.length; i++) {
      let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name)
      handledBook.value = item
      if (item !== null) {
        listcontent.push(item)
      }
    }

    booksRewritten.value = listcontent
    handledBook.value = ''
  } catch (error) {
    console.log(error)
    labelCreateStatus.value = 'Error' + error
    // labelCreateStatus.value.setAttribute('role', 'alert')
  }
}

/** Must allow for the creation of a list of items, prefilled with two books. */
</script>

<style lang="scss" scoped></style>
