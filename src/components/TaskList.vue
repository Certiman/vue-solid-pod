<script setup>
import { onBeforeMount, ref, computed, watch } from 'vue'
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

import { processStore } from '@/stores/process'
import { cacheStore } from '@/stores/cache'
import { RDFS } from '@inrupt/vocab-common-rdf'
import {
  BCard,
  BCardBody,
  BCardFooter,
  BSpinner,
  BButton,
  BFormGroup,
  BListGroup
} from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

const props = defineProps({ processURI: String })
const taskList = ref([])
const isLoading = ref(false)
const loadError = ref(null)

// Handle task added event from AddTaskCard
const handleTaskAdded = async (taskData) => {
  console.log('Task added:', taskData)
  // Reload the task list to include the new task
  await loadAllTasks(true) // Force refresh
}

const tasksOfYourOwnPod = computed(() => {
  const isOwn = processStore.isOwnedResource(props.processURI)

  console.log('TaskList - tasksOfYourOwnPod debug:', {
    processURI: props.processURI,
    selectedPodUrl: sessionStore.selectedPodUrl,
    ownStoragePodRoot: sessionStore.ownStoragePodRoot(),
    isOwn
  })

  return isOwn
})

const headerText = computed(() => {
  if (isLoading.value) {
    return '[TaskList] Loading tasks...'
  } else if (taskList.value.length > 0) {
    return '[TaskList] Available tasks'
  } else {
    return '[TaskList] Process contains no tasks'
  }
})

const loadAllTasks = async (forceRefresh = false) => {
  console.log('TaskList - loadAllTasks called:', {
    processURI: props.processURI,
    forceRefresh,
    currentTaskCount: taskList.value.length
  })

  // Check cache first if not forcing refresh
  if (!forceRefresh && props.processURI) {
    const cached = cacheStore.getCachedProcess(props.processURI)
    if (cached && cached.loadStatus === 'loaded' && cached.data.tasks) {
      taskList.value = cached.data.tasks
      console.log(`Loaded ${taskList.value.length} tasks from cache`)
      return
    }
  }

  // tasks exist as Solid Datasets in the Process Container as Dataset RDFresources.
  isLoading.value = true
  loadError.value = null
  taskList.value = []

  if (!props.processURI) return null

  try {
    // Mark as loading in cache
    if (!cacheStore.getCachedProcess(props.processURI)) {
      cacheStore.markLoading('process', props.processURI)
    }

    // First, get the container to find all task URIs
    const containerDataSet = await getSolidDataset(props.processURI, { fetch: fetch })
    const taskURIs = getContainedResourceUrlAll(containerDataSet)

    console.log(`Found ${taskURIs.length} task URIs in container:`, taskURIs)

    // Filter out .ttl files and other non-RDF resources
    const rdfTaskURIs = taskURIs.filter((uri) => !uri.endsWith('.ttl'))

    console.log(`Filtered to ${rdfTaskURIs.length} potential task URIs:`, rdfTaskURIs)

    const loadedTasks = []

    // Now fetch each individual task to get its metadata
    for (const taskURI of rdfTaskURIs) {
      try {
        // Check if task is already cached
        const cachedTask = cacheStore.getCachedTask(taskURI)
        let taskData

        if (cachedTask && cachedTask.loadStatus === 'loaded' && !forceRefresh) {
          taskData = cachedTask.data
          console.log(`Using cached task data for ${taskURI}`)
        } else {
          // Fetch fresh data
          cacheStore.markLoading('task', taskURI)
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

            taskData = {
              taskName: taskName,
              taskThings: taskThing,
              taskProcessURI: props.processURI,
              loadStatus: 'loaded',
              loadedAt: new Date()
            }

            // Cache the task data
            cacheStore.cacheTask(taskURI, taskData, processStore.getProviderForURI(taskURI))
            console.log(`Added task: ${taskName}`)
          }
        }

        if (taskData) {
          loadedTasks.push(taskData)
        }
      } catch (taskError) {
        console.warn(`Failed to load individual task ${taskURI}:`, taskError)

        // Mark as failed in cache
        cacheStore.markLoadFailed('task', taskURI, taskError)

        // Add a placeholder entry for failed tasks
        const fallbackName = taskURI.split('/').pop() || 'Unknown task'
        loadedTasks.push({
          taskName: `${fallbackName} (load failed)`,
          taskThings: { url: taskURI },
          taskProcessURI: props.processURI,
          loadStatus: 'failed',
          error: taskError
        })
      }
    }

    taskList.value = loadedTasks

    // Cache the complete process data with tasks
    const processData = {
      uri: props.processURI,
      tasks: loadedTasks,
      taskCount: loadedTasks.length,
      loadedAt: new Date()
    }

    cacheStore.cacheProcess(
      props.processURI,
      processData,
      processStore.getProviderForURI(props.processURI)
    )

    console.log(`Loaded ${taskList.value.length} tasks total`)
  } catch (mistake) {
    console.error(`Mounting TaskList error: ${mistake}. Caused by ${props.processURI}.`)
    loadError.value = mistake.message || 'Failed to load tasks'
    cacheStore.markLoadFailed('process', props.processURI, mistake)
  } finally {
    isLoading.value = false
  }
}

onBeforeMount(async () => await loadAllTasks())

// Watch for processURI changes (when navigating between processes)
watch(
  () => props.processURI,
  async (newProcessURI, oldProcessURI) => {
    console.log('TaskList - processURI changed:', { oldProcessURI, newProcessURI })
    if (newProcessURI && newProcessURI !== oldProcessURI) {
      await loadAllTasks()
    }
  }
)
</script>

<template>
  <BCard no-body :header="headerText" class="mt-2">
    <!-- Loading state -->
    <BCardBody v-if="isLoading" class="text-center py-4">
      <BSpinner class="me-2" />
      Loading tasks from process container...
    </BCardBody>

    <!-- Error state -->
    <BCardBody v-else-if="loadError" class="text-center py-4">
      <div class="text-danger"><strong>Failed to load tasks:</strong> {{ loadError }}</div>
      <BButton variant="outline-primary" @click="loadAllTasks(true)" class="mt-2">
        Try Again
      </BButton>
    </BCardBody>

    <!-- Tasks loaded successfully -->
    <BCardBody v-else-if="taskList.length > 0">
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

    <!-- No tasks found -->
    <BCardBody v-else>
      This process provider has provided a process without tasks. If you are the owner of the
      process, you can add these yourself. If not, contact the [process provider].
    </BCardBody>

    <BCardFooter>
      <!-- Cache status information -->
      <small class="text-muted">
        {{ taskList.length }} tasks loaded
        <span v-if="!isLoading && !loadError">
          • Cache: {{ processStore.getCacheStatus.value?.totalCached || 0 }} items
        </span>
      </small>
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
