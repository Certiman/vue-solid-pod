<script setup>
//  IN: URI of a Process, lists all TASKS (non-container RDFResource)
import { onBeforeMount, ref, computed, reactive } from 'vue'
import {
  getSolidDataset,
  getThingAll,
  getStringNoLocale,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  setThing,
  saveSolidDatasetAt,
  getUrl,
  addUrl
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import TaskItem from './TaskItem.vue'

// import { processStore } from '@/stores/process'
import { LDP, RDF, RDFS, VCARD } from '@inrupt/vocab-common-rdf'
import { BCardFooter } from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({ processURI: String })
const taskList = ref([])
const addingTask = ref(false)
const form = reactive({
  newTask: '',
  newTaskLabel: '',
  newTaskContact: ''
})

const tasksOfYourOwnPod = computed(() => props.processURI.includes(sessionStore.selectedPodUrl))

/**
 * TODO:
 * Ideally, the list allows for a selection of Public & WebId list, in order
 * to list the CURRENT rights to that selection.
 */
// const aclRightsTarget = ref('')
// const aclRightsWebId = ref('')
// const aclRightsValues = [
//   { text: 'Public Access', value: '' },
//   { text: 'WebId', value: aclRightsWebId.value }
// ]

const addTaskToProcess = async (event) => {
  // adds a task to the process
  // Reminder: task is a Solid Dataset like myReadingList
  // Reminder 2: one can ONLY ADD TASKS in the OWN storage pod!!
  event.preventDefault()
  addingTask.value = true

  const taskResourceURI = props.processURI
    .replace('#', '')
    .replace(sessionStore.ownStoragePodRoot, '')
  const newTaskURI = taskResourceURI + form.newTask.replaceAll(' ', '')
  try {
    let newTaskDS = createSolidDataset()
    /**
     * The following ADDS A THING to the TASK container
     * with ?s uri forced same as the main resource, so
     * </b5186a91-fffe-422a-bf6a-02a61f470541/process/ECCertificates/Task2>
     *  rdfs:comment "name of the task" ; <<<< ADDED
     *  http://www.w3.org/2006/vcard/ns#hasEmail "email of the contact"  <<< ADDED
        rdf:type  ldp:RDFSource .
     */
    let taskComment = createThing({ url: newTaskURI })
    taskComment = addStringNoLocale(taskComment, RDFS.comment, form.newTaskLabel)
    taskComment = addUrl(taskComment, VCARD.hasEmail, 'mailto:' + form.newTaskContact)
    taskComment = addUrl(taskComment, RDF.type, LDP.RDFSource)
    // console.log(taskComment)
    newTaskDS = setThing(newTaskDS, taskComment)
    await saveSolidDatasetAt(newTaskURI, newTaskDS, { fetch: fetch })
    await loadAllTasks()
    // modalStore.showToastWithMessage = true
    // modalStore.ToastMessage = 'Task added!'
    form.newTask = ''
    form.newTaskLabel = ''
    form.newTaskContact = ''
  } catch (e) {
    const eMsg = `addTaskToProcess failed to create task at ${newTaskURI}: error ${e}`
    console.error(eMsg)
    return Promise.reject(eMsg)
  } finally {
    addingTask.value = false
  }
}

const loadAllTasks = async () => {
  // tasks exist as Solid Datasets in the Process Container as Dataset RDFresources.
  // FIXME: this should be cached!
  taskList.value = []
  if (!props.processURI) return null
  try {
    const taskDataSet = await getSolidDataset(props.processURI, { fetch: fetch })

    const taskThings = getThingAll(taskDataSet)
    taskThings.forEach((tt) => {
      // FIXME: Extract the task name, fails as it is inside the resource somehow
      console.log(`Analysing Task @[${props.processURI}]:`, tt)

      const taskName = getStringNoLocale(tt, RDFS.comment) || 'Unknown task name'
      const isRDFSource = getUrl(tt, RDF.type) == LDP.RDFSource
      const newTask = { taskName: taskName, taskThings: tt, taskProcessURI: props.processURI }
      if (isRDFSource) taskList.value.push(newTask)
    })
  } catch (mistake) {
    console.error(`Mounting TaskList error: ${mistake}. Caused by ${props.processURI}.`)
  }
}

onBeforeMount(async () => await loadAllTasks())
</script>

<template>
  {{ props.processURI }}
  <BCard
    no-body
    :header="taskList.length > 0 ? 'Available tasks' : 'Process contains no tasks'"
    class="mt-2"
  >
    <BCardBody v-if="taskList.length > 0">
      <!-- 
      For future extension: task acl rights are defined PER WebId, or for the PublicAgent.
      The list should visualise these rights depending on the selected Agent (WebId or Public)
      <BFormGroup
        description="To change access rights, select Public Access or a WebId"
        class="mb-3"
      >
        <BFormRadioGroup v-model="aclRightsTarget" :options="aclRightsValues" />
        <BFormGroup>
          <BFormInput v-model="aclRightsWebId" />
        </BFormGroup>
      </BFormGroup> -->
      <BFormGroup description="Run a task by clicking the play button." class="mb-3">
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
      <!-- <p>Process: {{ props.processURI }}</p> -->
      <!-- @reset="resetAddTaskForm" -->
      <BForm
        v-if="tasksOfYourOwnPod"
        @submit="addTaskToProcess"
        description="Add a task to this process"
        class="d-flex flex-row"
      >
        <BFormGroup
          description="Resource name of the task"
          label="Short taskname"
          label-for="newTaskToAdd"
          class="mx-2"
        >
          <BFormInput
            id="newTaskToAdd"
            v-model="form.newTask"
            placeholder="myTaskShort (e.g. addTaxReturn)"
            type="text"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          label="Task name title"
          label-for="newTaskLabelToAdd"
          description="A title for this Task"
          class="mx-2"
        >
          <BFormInput
            id="newTaskLabelToAdd"
            v-model="form.newTaskLabel"
            placeholder="Enter task title"
            type="text"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          label="Task contact"
          label-for="newTaskContact"
          description="Email of the person who can be contacted regarding this task"
          class="mx-2"
        >
          <BFormInput
            id="newTaskContact"
            v-model="form.newTaskContact"
            placeholder="user@domain.com"
            type="email"
          >
          </BFormInput>
        </BFormGroup>
        <BFormGroup label="-">
          <BButton type="submit" :loading="addingTask" variant="primary"
            ><IMdiNoteAdd class="me-2 mb-1" />Add task</BButton
          >
          <!-- <BButton type="reset" variant="danger" class="mx-2">Reset</BButton> -->
        </BFormGroup>
      </BForm>
      <p v-else>You cannot add tasks in other process providers' storage.</p>
    </BCardFooter>
  </BCard>
</template>

<style lang="scss" scoped></style>
