<template>
  <BListGroupItem :variant="book.isComplex ? 'warning' : 'light'">
    <BInputGroup>
      <BFormInput :placeholder="book.title" :disabled="!editable" v-model="bookTitle" />
      <BButton @click="emit('deleteBook', book.title)" variant="primary"
        ><IMdiFileDocumentDelete class="me-2 mb-1" />Delete</BButton
      >
      <BButton @click="onEdit(book)" variant="warning"
        ><IMaterialSymbolsLightEditDocumentSharp class="me-2 mb-1" />{{
          editable ? 'Save' : 'Edit'
        }}</BButton
      >
    </BInputGroup>
  </BListGroupItem>
</template>

<script setup>
import { ref, onMounted } from 'vue'

/** Component represents an individual book in the ReadingList */
// const props =
defineProps({ book: Object })

/** Component emits edit and delete events */
const emit = defineEmits(['deleteBook', 'editBook'])

// onMounted(() => {
//   console.log(`Mounting ReadingItem`, props.book)
//   bookTitle.value = props.book.title
// })

// Allow for editing the book title
const editable = ref(false)
const bookTitle = ref('')

function onEdit(book) {
  if (!book.isComplex) {
    // Simple books can just have their titles updated
    if (editable.value) {
      // Change to the book is done in ReadingList
      emit('editBook', book, bookTitle)
    } else {
      // bookTitle.value = props.book.title
    }
    editable.value = !editable.value
  }
}
</script>

<style lang="scss" scoped></style>
