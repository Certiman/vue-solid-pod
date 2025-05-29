<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BAccordion, BBreadcrumb } from 'bootstrap-vue-next'

// components
import TaskList from '@/components/TaskList.vue'
import ProcessList from '@/components/ProcessList.vue'

// store
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'
// import { sessionStore } from '@/stores/sessions'

const route = useRoute()

// TODO: if this page is loaded WITH a value run/:p/:t#0, the task must be loaded from the process provider and parsed.

/**
   General PATH manager

 * Is called as path: '/process/:action/:process/:task/:step',
 *
 * View which will show the components to CRUD:
 *
 * /process/run/iss/AddSimpleReport/0 - n
 *
 * The available components, to add explicitly per route, are:
 * - Using SolidSearchField allowing to query over the Pods where these data are stored, or the "central Pod" if not distributed.
 * - Using TreeList: giving overview of linked FOrg, Org & Units, based on the filtering in the search field.
 * - Using AddResourceModal:
 *    - a AddNewSiteModal, which allows to add a site based on geolocation
 *    - a AddNewOrgModal, which allows to add a FOrg, Org, Unit, GIVEN a subOrganizationOf or hasSubOrganization parent to which to attach it.
 *
 */

const breadcrumbItems = computed(() => {
  // TODO: should be more general function
  // FIXME: component reroutes to app routes which insinuate tasks within tasks
  // converts the route.params into a BBcrum array,
  let breadCrumRoot = [{ text: 'Processes', to: '/process/' }]
  const breadCrumbBase = Object.entries(route.params).map(([, r]) => {
    // console.log(path, r, route.fullPath)

    const rfp = route.fullPath
    const linkForRoute = rfp.substring(0, rfp.indexOf(r) + r.length + 1)
    return r.length > 0 ? { text: r, to: linkForRoute } : null
  })
  // console.log(breadCrumbBase)

  return [...breadCrumRoot, ...breadCrumbBase.filter(Boolean)]
})

// If no task is running, show all Tasks whcih can be started.
// else show the steps in the Task
const taskRunning = computed(() => {
  // Check if we have process and task parameters
  const hasTask = route.params.task && route.params.task !== ''
  const hasProcess = route.params.process && route.params.process !== ''

  // Show TaskRunner if we have both process and task (step is optional)
  // This allows TaskRunner to show even with step = 0 or no step
  const shouldShowTaskRunner = hasTask && hasProcess

  console.log(
    `ProcessView routing - Process: ${route.params.process}, Task: ${route.params.task}, Step: ${route.params.step}`
  )
  console.log(`TaskRunner should show: ${shouldShowTaskRunner}`)

  return shouldShowTaskRunner
    ? processStore.shorthandForTaskURI(processStore.currentTaskURI)
    : false
})

// Compute the correct process URI from route parameters
const currentProcessURI = computed(() => {
  if (!route.params.process) return null

  // Build process URI from route parameters
  // For example: /process/Organisation/ -> processProvider URI + /process/Organisation/
  const processName = route.params.process

  // Find the first available process provider that contains this process
  const processProvider = processStore.processProviders.find(
    (provider) => provider.ContainerURI && provider.ContainerURI.includes('/process/')
  )

  if (!processProvider) {
    console.warn('No process provider found for process:', processName)
    return null
  }

  // Build the full process container URI
  const processURI = `${processProvider.ContainerURI}${processName}/`

  console.log('ProcessView - currentProcessURI computed:', {
    routeProcess: route.params.process,
    processProvider: processProvider.ContainerURI,
    computedProcessURI: processURI
  })

  return processURI
})

// Compute the current task URI from route parameters when in TaskRunner mode
const currentTaskURI = computed(() => {
  if (!route.params.process || !route.params.task) return null

  const processName = route.params.process
  const taskName = route.params.task

  // Find the first available process provider
  const processProvider = processStore.processProviders.find(
    (provider) => provider.ContainerURI && provider.ContainerURI.includes('/process/')
  )

  if (!processProvider) {
    console.warn('No process provider found for task:', processName, taskName)
    return null
  }

  // Build the full task URI
  const taskURI = `${processProvider.ContainerURI}${processName}/${taskName}`

  console.log('ProcessView - currentTaskURI computed:', {
    routeProcess: route.params.process,
    routeTask: route.params.task,
    processProvider: processProvider.ContainerURI,
    computedTaskURI: taskURI
  })

  return taskURI
})

const showProcesses = computed(() => route.params.process === '')

// Watch for task URI changes and sync with store when TaskRunner is active
watch(
  currentTaskURI,
  (newTaskURI) => {
    if (newTaskURI && taskRunning.value) {
      console.log('ProcessView - Syncing currentTaskURI with store:', newTaskURI)
      processStore.currentTaskURI = newTaskURI
    }
  },
  { immediate: true }
)
</script>
<template>
  <BBreadcrumb :items="breadcrumbItems" class="mt-2" />
  <BAccordion class="mt-2">
    <BAccordionItem title="Debug Information">
      <h5>Process manager redirect (debug)</h5>
      <div>Parameters: {{ $route.params }}</div>
      <div>Query full: {{ $route.query }}</div>
      <div>This route: {{ $route.fullPath }}</div>
      <div>Running task: {{ taskRunning }}</div>
      <div>Computed Process URI: {{ currentProcessURI }}</div>
      <div>Computed Task URI: {{ currentTaskURI }}</div>
      <div>Store currentTaskURI: {{ processStore.currentTaskURI }}</div>
      <!-- <div>Full ProcessProvider Object: {{ processStore.processProviders }}</div> -->
    </BAccordionItem>
  </BAccordion>
  <ProcessList v-if="showProcesses" />
  <TaskList v-else-if="!taskRunning" :processURI="currentProcessURI" />
  <TaskRunner :taskURI="currentTaskURI" :action="$route.params.action" v-else></TaskRunner>
  <!-- Below Modal is triggered from both ProcessList as TaskList component -->
  <ChangeAccessToResource
    v-if="modalStore.canShowResourceACL"
    :resource-u-r-i="modalStore.selectedResourceACL"
  />
</template>

<style lang="scss" scoped></style>
