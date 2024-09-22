<script setup>
//  IN: URI of a Process, lists all TASKS (non-container RDFResource)
import { onBeforeMount, ref } from 'vue'
import { getSolidDataset, getThingAll, getStringNoLocale } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import TaskItem from './TaskItem.vue'

import { processStore } from '@/stores/process'
import { RDFS } from '@inrupt/vocab-common-rdf'

const props = defineProps({ processURI: String })
const taskList = ref([])

onBeforeMount(async () => {
  // tasks exist as Solid Datasets in the Process Container as Dataset RDFresources.
  // FIXME: this should be cached!
  try {
    const taskDataSet = await getSolidDataset(props.processURI, { fetch: fetch })

    const taskThings = getThingAll(taskDataSet)
    console.log(taskThings)
    taskThings.forEach((tt) => {
      // Extract the task name
      const taskName = getStringNoLocale(tt, RDFS.comment)
      const newTask = { taskName: taskName, taskThings: tt, taskProcessURI: props.processURI }

      if (taskName) taskList.value.push(newTask)
    })
  } catch (mistake) {
    console.error(`Mounting TaskList error: ${mistake}`)
  }
})
</script>

<template>
  <section v-if="taskList.length > 0">
    <h3>Available Tasks</h3>
    <BFormGroup description="Run a task by clicking the play button.">
      <BCardBody>
        <BListGroup flush>
          <TaskItem v-for="task of taskList" :key="task.taskName" :task="task" />
        </BListGroup>
      </BCardBody>
    </BFormGroup>
  </section>
  <section v-else>
    <h3>No task exist in process {{ props.processURI }}</h3>
    <p>
      This process provider has provided a process without tasks. If you are the owner of the
      process, you can add these yourself. If not, contact the [process provider].
    </p>
  </section>
  <!-- <ul>
    <li>v-for over /:process/:tasks, with option to make it public or not (if owned)</li>
    <li>should list all the TASKS, and provide a play button to launch the first #step.</li>
    <li>
      should allow to add a task (myReadingList), and task steps (books). The app route for this
      action is hard-coded on /:process/addTask
    </li>
  </ul> -->
</template>

<style lang="scss" scoped></style>
