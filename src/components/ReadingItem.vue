<template>
  <BListGroupItem :variant="book.isComplex ? 'warning' : 'light'">
    <BInputGroup>
      <BFormInput
        :placeholder="book.title"
        :disabled="!editable"
        v-model="bookTitle"
        @keyup.enter="onEdit(book)"
      />
      <BButton @click="emit('deleteBook', book.title)" variant="primary"
        ><IMdiFileDocumentDelete class="me-2 mb-1" />Delete</BButton
      >
      <BButton @click="onEdit(book)" variant="warning"
        ><IMaterialSymbolsLightEditDocumentSharp class="me-2 mb-1" />{{
          editable ? 'Save' : book.isComplex ? 'View' : 'Edit'
        }}</BButton
      >
    </BInputGroup>
  </BListGroupItem>
</template>

<script setup>
import { ref } from 'vue'

/** Component represents an individual book in the ReadingList */
// const props =
defineProps({ book: Object })

/** Component emits edit and delete events */
const emit = defineEmits(['deleteBook', 'editBook'])

// Allow for editing the book title
const editable = ref(false)
const bookTitle = ref('')

function onEdit(book) {
  if (!book.isComplex) {
    // Simple books can just have their titles updated
    if (editable.value) {
      // Change to the book is done in ReadingList
      emit('editBook', book, bookTitle.value)
    } else {
      bookTitle.value = book.title
    }
    editable.value = !editable.value
  } else {
    // Triggers a modal view
    emit('editBook', book, null)
  }
}
</script>

<style lang="scss" scoped></style>
