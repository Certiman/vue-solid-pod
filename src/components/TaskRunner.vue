<script setup>
import { createSolidDataset, getSolidDataset } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { onBeforeMount, ref } from 'vue'

const props = defineProps({ taskURI: String, action: String })
const task = ref(null)

onBeforeMount(async () => {
  let taskThing
  try {
    taskThing = await getSolidDataset(props.taskURI, { fetch: fetch })
  } catch (err) {
    console.warn(` No task data was found at this URI. Will push the /add route`)

    taskThing = createSolidDataset()
  } finally {
    task.value = taskThing
  }
})
</script>
<template>
  <div>Task {{ action }} @ {{ taskURI }} is running!</div>
  <p>{{ task }}</p>
</template>

<style lang="scss" scoped></style>
