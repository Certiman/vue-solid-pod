<script setup>
import { onBeforeMount, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThing,
  getThingAll,
  getUrlAll
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

import TaskItem from './TaskItem.vue'

import { processStore } from '@/stores/process'
import { cacheStore } from '@/stores/cache'
import RDFExtractor from '@/core/RDFExtractor'
import { RDF_CONFIG } from '@/services/rdfConfig'
import {
  BCard,
  BCardBody,
  BCardFooter,
  BSpinner,
  BButton,
  BFormGroup,
  BListGroup,
  BFormCheckbox,
  BRow,
  BCol
} from 'bootstrap-vue-next'
import { sessionStore } from '@/stores/sessions'

// Import icons
import IMdiNotePlus from '~icons/mdi/note-plus'
import IMdiDatabaseEyeOutline from '~icons/mdi/database-eye-outline'

const props = defineProps({ processURI: String })
const router = useRouter()
const taskList = ref([])
const isLoading = ref(false)
const loadError = ref(null)

// UI state for filtering
const showRunnableOnly = ref(true) // Default to true for better UX

// Navigate to ERA Container add task process with current process as context
const navigateToAddTask = () => {
  console.log('Navigating to add task for process:', {
    processURI: props.processURI,
    processName: processStore.extractProcessName(props.processURI)
  })

  // Store the current process URI in the process store for context
  processStore.currentProcessURI = props.processURI
  // Route to the ERA addTask process
  router.push('/process/Process/addTask/0')
}

// Navigate to data view for this process
const navigateToData = () => {
  const processName = processStore.extractProcessName(props.processURI)
  if (processName) {
    console.log('Navigating to data view for process:', processName)
    router.push(`/data/${processName}`)
  }
}

// Get process provider information
const processProvider = computed(() => {
  if (!props.processURI) return null
  return processStore.getProviderForURI(props.processURI)
})

// Get provider WebId for display
const providerWebId = computed(() => {
  const provider = processProvider.value
  return provider ? provider.ProviderWebId : '[unknown provider]'
})

// Check if the current user is the process provider
const isCurrentUserProvider = computed(() => {
  const provider = processProvider.value
  if (!provider || !sessionStore.loggedInWebId) return false
  return provider.ProviderWebId === sessionStore.loggedInWebId
})

// Get contextual message for no tasks scenario
const noTasksMessage = computed(() => {
  if (isCurrentUserProvider.value) {
    return 'As the process provider, you can add tasks yourself.'
  } else {
    return 'You can contact the Process Provider to learn more.'
  }
})

const tasksOfYourOwnPod = computed(() => {
  const isOwn = processStore.isOwnedResource(props.processURI)
  return isOwn
})

// Filtered task list based on "Runnable only" toggle
const filteredTaskList = computed(() => {
  if (!showRunnableOnly.value) {
    return taskList.value // Show all tasks
  }

  // Only show tasks that are runnable (have steps and are accessible)
  return taskList.value.filter((task) => {
    const isAccessible = task.loadStatus !== 'failed'
    const hasSteps = (task.stepCount || 0) > 0
    const isRunnable = isAccessible && hasSteps

    return isRunnable
  })
})

const headerText = computed(() => {
  const processName = processStore.extractProcessName(props.processURI) || 'Unknown Process'

  if (isLoading.value) {
    return `Tasks in ${processName} - Loading...`
  } else {
    return `Tasks in ${processName}`
  }
})

const loadAllTasks = async (forceRefresh = false) => {
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
    } // First, get the container to find all task URIs
    const containerDataSet = await getSolidDataset(props.processURI, { fetch: fetch })
    const taskURIs = getContainedResourceUrlAll(containerDataSet)

    console.log(`Found ${taskURIs.length} task URIs in container:`, taskURIs)

    // Filter out shape files and other non-task resources
    const rdfTaskURIs = taskURIs.filter((uri) => {
      // Filter out SHACL shape files and other non-task resources
      return !uri.endsWith('.ttl') && !uri.endsWith('.shacl')
    })

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
        } else {
          // Fetch fresh data
          cacheStore.markLoading('task', taskURI)
          const taskDataSet = await getSolidDataset(taskURI, { fetch: fetch })
          const taskThing = getThing(taskDataSet, taskURI)

          if (taskThing) {
            // Extract the task name using RDFExtractor
            const taskName = RDFExtractor.extractTaskName(taskThing, taskURI) // Check for steps in this task
            const allThings = getThingAll(taskDataSet)
            const stepThings = allThings.filter((thing) => {
              const types = getUrlAll(thing, RDF_CONFIG.ENTITY_TYPE)
              return types.includes(RDF_CONFIG.TYPES.ACTION)
            })

            taskData = {
              taskName: taskName,
              taskThings: taskThing,
              taskProcessURI: props.processURI,
              stepCount: stepThings.length, // Add step count for debugging
              loadStatus: 'loaded',
              loadedAt: new Date()
            }

            // Cache the task data
            cacheStore.cacheTask(taskURI, taskData, processStore.getProviderForURI(taskURI))
          } else {
            // Handle case where task URI exists but has no RDF thing
            console.warn(
              `Task URI ${taskURI} has no RDF thing - dataset loaded but getThing returned null`
            )

            const fallbackName = taskURI.split('/').pop() || 'Unknown task'

            // For owners, show empty tasks as "No Steps" instead of hiding them
            // For non-owners, this shouldn't happen (they'd get a 403 error instead)
            taskData = {
              taskName: `${fallbackName} (No Steps)`,
              taskThings: { url: taskURI }, // Minimal task thing with just URL
              taskProcessURI: props.processURI,
              stepCount: 0,
              loadStatus: 'empty',
              loadedAt: new Date()
            }

            cacheStore.cacheTask(taskURI, taskData, processStore.getProviderForURI(taskURI))
          }
        }

        if (taskData) {
          loadedTasks.push(taskData)
        }
      } catch (taskError) {
        console.warn(`Failed to load individual task ${taskURI}:`, taskError)

        // Mark as failed in cache
        cacheStore.markLoadFailed('task', taskURI, taskError) // Determine if this is a permission error vs other types of errors
        const isPermissionError =
          taskError.status === 403 ||
          taskError.message?.includes('Forbidden') ||
          taskError.message?.includes('Unauthorized')
        const isOwner = processStore.isOwnedResource(taskURI)

        // Only add placeholder entries based on error type and ownership
        if (isOwner) {
          // Owners should see their failed tasks with descriptive error messages
          const fallbackName = taskURI.split('/').pop() || 'Unknown task'
          const errorType = isPermissionError
            ? 'Access Denied'
            : taskError.status === 404
              ? 'Not Found'
              : taskError.status >= 500
                ? 'Server Error'
                : 'Load Failed'

          loadedTasks.push({
            taskName: `${fallbackName} (${errorType})`,
            taskThings: { url: taskURI },
            taskProcessURI: props.processURI,
            loadStatus: 'failed',
            error: taskError
          })
        } else if (isPermissionError) {
          // Non-owners only see permission errors as "(No Access)"
          const fallbackName = taskURI.split('/').pop() || 'Unknown task'
          loadedTasks.push({
            taskName: `${fallbackName} (No Access)`,
            taskThings: { url: taskURI },
            taskProcessURI: props.processURI,
            loadStatus: 'failed',
            error: taskError
          })
        }
        // Non-owners don't see non-permission errors (silently skip them)
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
      <!-- Filter controls -->
      <BRow class="mb-3">
        <BCol>
          <BFormCheckbox v-model="showRunnableOnly" :disabled="isLoading" switch size="sm">
            Show runnable tasks only
          </BFormCheckbox>
          <small class="text-muted d-block mt-1">
            Runnable tasks have steps and are accessible to you. Run a task by clicking the play
            button.
          </small>
        </BCol>
      </BRow>

      <!-- Task list -->
      <BFormGroup v-if="filteredTaskList.length > 0" class="mb-3">
        <BListGroup flush>
          <TaskItem v-for="task of filteredTaskList" :key="task.taskName" :task="task" />
        </BListGroup>
      </BFormGroup>

      <!-- No tasks match filter -->
      <div v-else class="text-center py-3 text-muted">
        <p class="mb-2">
          <strong>No {{ showRunnableOnly ? 'runnable ' : '' }}tasks found</strong>
        </p>
        <p class="small mb-0" v-if="showRunnableOnly && taskList.length > 0">
          Try toggling "Show runnable tasks only" to see all {{ taskList.length }} tasks
        </p>
      </div>
    </BCardBody>
    <!-- No tasks found -->
    <BCardBody v-else>
      This process contains no tasks. {{ noTasksMessage }}
      <template v-if="!isCurrentUserProvider">
        <a :href="providerWebId" target="_blank" rel="noopener noreferrer" class="ms-1">
          {{ providerWebId }}
        </a>
      </template>
    </BCardBody>
    <BCardFooter class="d-flex justify-content-between align-items-center">
      <!-- Cache status information -->
      <small class="text-muted">
        {{ taskList.length }} tasks loaded
        <span v-if="showRunnableOnly && filteredTaskList.length !== taskList.length">
          ({{ filteredTaskList.length }} runnable)
        </span>
        <span v-if="!isLoading && !loadError">
          • Cache: {{ processStore.getCacheStatus.value?.totalCached || 0 }} items
        </span>
      </small>

      <!-- Action buttons -->
      <div class="d-flex gap-2">
        <!-- View Data button -->
        <BButton
          variant="outline-info"
          size="sm"
          @click="navigateToData"
          :disabled="!sessionStore.selectedPodUrl"
        >
          <IMdiDatabaseEyeOutline class="me-1" />
          View Data
        </BButton>

        <!-- Add Task button - routes to ERA process management -->
        <BButton v-if="tasksOfYourOwnPod" variant="primary" size="sm" @click="navigateToAddTask">
          <IMdiNotePlus class="me-1" />
          Add Task
        </BButton>
        <small v-else class="text-muted">
          You cannot add tasks to other providers' processes
        </small>
      </div>
    </BCardFooter>
  </BCard>
</template>

<style lang="scss" scoped></style>
