<script setup>
import { store } from '../stores/store'

import ReadingList from '@/components/ReadingList.vue'

</script>

<template>
  <ReadingList v-if="store.canDisplayData()" />
</template>
