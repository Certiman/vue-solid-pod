<script setup>
//  IN: URI of a Process, lists all TASKS (non-container RDFResource)
import { onBeforeMount, ref } from 'vue'
import {
  getSolidDataset,
  getThingAll,
  getStringNoLocale,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  setThing,
  saveSolidDatasetAt,
  isContainer,
  getUrl,
  addUrl
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import TaskItem from './TaskItem.vue'

import { processStore } from '@/stores/process'
import { LDP, RDF, RDFS } from '@inrupt/vocab-common-rdf'
import { modalStore } from '@/stores/ui'
import { BCardFooter } from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({ processURI: String })
const taskList = ref([])
const newTask = ref('')
const newTaskLabel = ref('')

const addTaskToProcess = async () => {
  // adds a task to the process
  // Reminder: task is a Solid Dataset like myReadingList

  const taskResourceURI = props.processURI.replace('#', '').replace(sessionStore.storagePodRoot, '')
  const newTaskURI = taskResourceURI + newTask.value.replace(' ', '')
  try {
    let newTaskDS = createSolidDataset()
    /**
     * The following ADDS A THING to the TASK container
     * with ?s uri forced same as the main resource, so
     * </b5186a91-fffe-422a-bf6a-02a61f470541/process/ECCertificates/Task2>
     *  rdfs:comment "name of the task" ; <<<< ADDED
        rdf:type  ldp:RDFSource .
     */
    let taskComment = createThing({ url: newTaskURI }) 
    taskComment = addStringNoLocale(taskComment, RDFS.comment, newTaskLabel.value)
    taskComment = addUrl(taskComment, RDF.type, LDP.RDFSource)
    // console.log(taskComment)
    newTaskDS = setThing(newTaskDS, taskComment)
    await saveSolidDatasetAt(newTaskURI, newTaskDS, { fetch: fetch })
    await loadAllTasks()
    // modalStore.showToastWithMessage = true
    // modalStore.ToastMessage = 'Task added!'
    newTask.value = ''
    newTaskLabel.value = ''
  } catch (e) {
    console.error(`addTaskToProcess failed to create task at ${newTaskURI}: error ${e}`)
  }
}

const loadAllTasks = async () => {
  // tasks exist as Solid Datasets in the Process Container as Dataset RDFresources.
  // FIXME: this should be cached!
  taskList.value = []
  try {
    const taskDataSet = await getSolidDataset(props.processURI, { fetch: fetch })

    const taskThings = getThingAll(taskDataSet)
    taskThings.forEach((tt) => {
      // FIXME: Extract the task name, fails as it is inside the resource somehow
      const taskName = getStringNoLocale(tt, RDFS.comment) || 'Unknown task name'
      const isRDFSource = getUrl(tt, RDF.type) == LDP.RDFSource
      const newTask = { taskName: taskName, taskThings: tt, taskProcessURI: props.processURI }
      if (isRDFSource) taskList.value.push(newTask)
    })
  } catch (mistake) {
    console.error(`Mounting TaskList error: ${mistake}`)
  }
}

onBeforeMount(async () => await loadAllTasks())
</script>

<template>
  <BCard
    no-body
    :header="taskList.length > 0 ? 'Available tasks' : 'Process contains no tasks'"
    class="mt-2"
  >
    <BCardBody v-if="taskList.length > 0">
      <BFormGroup
        description="Run a task by clicking the play button."
        class="mb-3"
      >
        <BListGroup flush>
          <TaskItem v-for="task of taskList" :key="task.taskName" :task="task" />
        </BListGroup>
      </BFormGroup>
    </BCardBody>
    <BCardBody v-else>
      This process provider has provided a process without tasks. If you are the owner of the
      process, you can add these yourself. If not, contact the [process provider].
    </BCardBody>
    <BCardFooter>
      <h5>Add task to process</h5>
      <p>Process: {{ props.processURI }}</p>
      <BInputGroup prepend="Task name" class="me-2">
        <BFormInput
          id="newTaskToAdd"
          v-model="newTask"
          placeholder="MyTaskShort"
          type="text"
        ></BFormInput>
        <BFormInput
          id="newTaskLabelToAdd"
          v-model="newTaskLabel"
          placeholder="A title for this Task"
          type="text"
          @keyup.enter="addTaskToProcess"
        ></BFormInput>
        <BButton @click="addTaskToProcess"><IMdiNoteAdd class="me-2 mb-1" />Add task</BButton>
      </BInputGroup>
    </BCardFooter>
  </BCard>
</template>

<style lang="scss" scoped></style>
