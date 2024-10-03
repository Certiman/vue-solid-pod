<script setup>
import { sessionStore } from '@/stores/sessions'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { BAccordion, BBreadcrumb } from 'bootstrap-vue-next'

// components
import TaskList from '@/components/TaskList.vue'
import ProcessList from '@/components/ProcessList.vue'

// store
import { processStore } from '@/stores/process'

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

const fullPodProcessURI = computed(() => sessionStore.fullPodProcessURI(route.params))
const breadcrumbItems = computed(() => {
  // TODO: should be more general function
  // FIXME: component reroutes to app routes which insinuate tasks within tasks
  // converts the route.params into a BBcrum array,
  let breadCrumRoot = [{ text: 'Processes', to: '/process/' }]
  const breadCrumbBase = Object.entries(route.params).map(([path, r]) => {
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
const taskRunning = computed(() =>
  route.params.step != '' && route.params.task != '' && route.params.process != ''
    ? processStore.extractTaskResource(fullPodProcessURI.value)
    : false
)

const showProcesses = computed(() => route.params.process === '')
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
      <div>Pod Process Path: {{ fullPodProcessURI }}</div>
    </BAccordionItem>
  </BAccordion>
  <ProcessList v-if="showProcesses" />
  <TaskList v-else-if="!taskRunning" :processURI="fullPodProcessURI" />
  <TaskRunner :taskURI="fullPodProcessURI" :action="$route.params.action" v-else></TaskRunner>
</template>

<style lang="scss" scoped></style>
