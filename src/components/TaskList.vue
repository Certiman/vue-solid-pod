<script setup>
//  IN: URI of a Process, lists all TASKS (non-container RDFResource)
import { onBeforeMount, ref, computed } from 'vue'
import {
  getSolidDataset,
  getStringNoLocale,
  getStringWithLocale,
  getContainedResourceUrlAll,
  getThing
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import TaskItem from './TaskItem.vue'
import AddTaskCard from './atoms/AddTaskCard.vue'

// import { processStore } from '@/stores/process'
import { RDFS } from '@inrupt/vocab-common-rdf'
import { BCardFooter } from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({ processURI: String })
const taskList = ref([])

// Handle task added event from AddTaskCard
const handleTaskAdded = async (taskData) => {
  console.log('Task added:', taskData)
  // Reload the task list to include the new task
  await loadAllTasks()
}

const tasksOfYourOwnPod = computed(() => {
  const ownStoragePodRoot = sessionStore.ownStoragePodRoot()
  const isOwn =
    props.processURI.includes(sessionStore.selectedPodUrl) ||
    (ownStoragePodRoot && props.processURI.includes(ownStoragePodRoot))

  console.log('TaskList - tasksOfYourOwnPod debug:', {
    processURI: props.processURI,
    selectedPodUrl: sessionStore.selectedPodUrl,
    ownStoragePodRoot: ownStoragePodRoot,
    includesSelected: props.processURI.includes(sessionStore.selectedPodUrl),
    includesStorage: ownStoragePodRoot && props.processURI.includes(ownStoragePodRoot),
    isOwn
  })

  return isOwn
})

const loadAllTasks = async () => {
  // tasks exist as Solid Datasets in the Process Container as Dataset RDFresources.
  // FIXME: this should be cached!
  taskList.value = []
  if (!props.processURI) return null
  try {
    // First, get the container to find all task URIs
    const containerDataSet = await getSolidDataset(props.processURI, { fetch: fetch })
    const taskURIs = getContainedResourceUrlAll(containerDataSet)

    console.log(`Found ${taskURIs.length} task URIs in container:`, taskURIs)

    // Filter out .ttl files and other non-RDF resources
    const rdfTaskURIs = taskURIs.filter((uri) => !uri.endsWith('.ttl'))

    console.log(`Filtered to ${rdfTaskURIs.length} potential task URIs:`, rdfTaskURIs)

    // Now fetch each individual task to get its metadata
    for (const taskURI of rdfTaskURIs) {
      try {
        const taskDataSet = await getSolidDataset(taskURI, { fetch: fetch })
        const taskThing = getThing(taskDataSet, taskURI)

        if (taskThing) {
          console.log(`Analysing individual Task @[${taskURI}]:`, taskThing)

          // Extract the task name from the individual task resource
          const taskName =
            getStringNoLocale(taskThing, RDFS.comment) ||
            getStringWithLocale(taskThing, RDFS.comment, 'en-US') ||
            getStringWithLocale(taskThing, RDFS.comment, 'en') ||
            getStringNoLocale(taskThing, RDFS.label) ||
            getStringWithLocale(taskThing, RDFS.label, 'en-US') ||
            getStringWithLocale(taskThing, RDFS.label, 'en') ||
            taskURI.split('/').pop() || // Use the last part of URI as fallback
            'Unknown task name'

          const newTask = {
            taskName: taskName,
            taskThings: taskThing,
            taskProcessURI: props.processURI
          }
          taskList.value.push(newTask)

          console.log(`Added task: ${taskName}`)
        }
      } catch (taskError) {
        console.warn(`Failed to load individual task ${taskURI}:`, taskError)
        // Add a placeholder entry for failed tasks
        const fallbackName = taskURI.split('/').pop() || 'Unknown task'
        taskList.value.push({
          taskName: `${fallbackName} (load failed)`,
          taskThings: { url: taskURI },
          taskProcessURI: props.processURI
        })
      }
    }

    console.log(`Loaded ${taskList.value.length} tasks total`)
  } catch (mistake) {
    console.error(`Mounting TaskList error: ${mistake}. Caused by ${props.processURI}.`)
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
    </BCardFooter>
  </BCard>
  <AddTaskCard
    v-if="tasksOfYourOwnPod"
    :process-uri="props.processURI"
    @task-added="handleTaskAdded"
  />
  <p v-else>You cannot add tasks in other process providers' storage.</p>
</template>

<style lang="scss" scoped></style>
