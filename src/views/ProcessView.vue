<script setup>
import { sessionStore } from '@/stores/sessions'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TaskList from '@/components/TaskList.vue'
import { BBreadcrumb } from 'bootstrap-vue-next'
import { processStore } from '@/stores/process'

const route = useRoute()

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

// If no task is running, show all Tasks whcih can be started.
// else show the steps in the Task
const taskRunning = computed(() =>
  route.params.step != '' ? processStore.extractTaskResource(fullPodProcessURI.value) : null
)
</script>
<template>
  <BBreadcrumb items="" />
  <h5>Process manager redirect (debug)</h5>
  <div>Parameters: {{ $route.params }}</div>
  <div>Query full: {{ $route.query }}</div>
  <div>This route: {{ $route.fullPath }}</div>
  <div>Pod Process Path: {{ fullPodProcessURI }}</div>
  <TaskList v-if="!taskRunning" :processURI="fullPodProcessURI" />
  <div v-else>Task {{ taskRunning }} is running!</div>
</template>

<style lang="scss" scoped></style>
