<script setup>
import {
  createSolidDataset,
  getSolidDataset,
  getStringNoLocale,
  getThingAll,
  getUrl
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { LDP, RDF, RDFS } from '@inrupt/vocab-common-rdf'
import { BCardFooter } from 'bootstrap-vue-next'
import { onBeforeMount, ref, computed } from 'vue'

// Stores
import { processStore } from '@/stores/process'
import { modalStore } from '@/stores/ui'

// Props, refs
const props = defineProps({ taskURI: String, action: String })
const taskList = ref([])
const taskName = ref('')

// Alllw to add steps.
const canAddStep = computed(() => Boolean(props.taskURI))

const setProcessTaskToAddStep = () => {
  processStore.processTaskInEdit = props.taskURI
  modalStore.canShowAddTaskStep = true
}

onBeforeMount(async () => {
  let taskDataSet
  try {
    taskDataSet = await getSolidDataset(props.taskURI, { fetch: fetch })
    const taskContents = getThingAll(taskDataSet)
    taskContents.forEach((step) => {
      const isTaskDescriptor = getUrl(step, RDF.type) == LDP.RDFSource
      if (!isTaskDescriptor) {
        // A pure step
        taskList.value.push(step)
      } else {
        taskName.value = getStringNoLocale(step, RDFS.comment)
      }
    })
  } catch (err) {
    console.error(err)
    console.warn(` No task data was found at this URI. Will push the /add route`)
    taskDataSet = createSolidDataset()
  } finally {
    //
  }
})
</script>
<template>
  <BCard no-body :header="action || taskName" class="mt-2">
    <BCardBody>
      {{ taskList }}
    </BCardBody>
    <BCardFooter>
      <!-- v-b-tooltip="{ title: 'Add a step to this Task' }" -->
      <BInputGroup :prepend="`Found ${taskList.length} steps in this task.`">
        <BButton @click="setProcessTaskToAddStep" :disabled="!canAddStep"
          ><IMdiNotePlus class="mb-1 me-2"
        />Add a task step</BButton>
      </BInputGroup>
    </BCardFooter>
  </BCard>
  <!-- @show="checkTaskStepsInProcess" -->
  <BModal
    id="add-process-task-step"
    v-model="modalStore.canShowAddTaskStep"
    title="Add a step to process task"
    size="lg"
    ok-only
    scrollable
    ><p>Add a step - SHACL-FORM - task {{ processStore.processTaskInEdit }}</p>
  </BModal>
</template>

<style lang="scss" scoped></style>
