<script setup>
import { sessionStore } from '@/stores/sessions'

import ReadingList from '@/components/ReadingList.vue'
</script>

<template>
  <ReadingList v-if="sessionStore.canDisplayData()" />
</template>
