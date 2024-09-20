<script setup>
import { ref, onMounted } from 'vue'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { createContainerAt, getPodUrlAll, isContainer } from '@inrupt/solid-client'
import {
  addUrl,
  addStringNoLocale,
  createSolidDataset,
  createThing,
  getSolidDataset,
  getContainedResourceUrlAll,
  getStringNoLocale,
  getThingAll,
  removeThing,
  saveSolidDatasetAt,
  setThing,
  getUrl
} from '@inrupt/solid-client'

// stores
import { processStore } from '@/stores/process'
import { store } from '@/stores/store'

import AsyncButton from '../atoms/AsyncButton.vue'
import { BCardBody, BToast } from 'bootstrap-vue-next'

// import { store } from '@/stores/store'
// const allPodUrlsKnown = computed(() => store.allPodUrls.length > 0)

const newProviderWebId = ref('https://id.inrupt.com/euarpod')
const showPPHelp = ref(false)
const finishedAddingPP = ref(false)
const finishedAddingSelfPP = ref(true)
const ownProcessContainerExists = ref(false)
const showToastWithMessage = ref(3000)
const ToastMessage = ref('')

const addProvider = async (WebId) => {
  finishedAddingPP.value = false

  try {
    // Get Pod(s) associated with the WebID
    console.log(`Getting provider data at ${WebId}`)

    const ppPodUrls = await getPodUrlAll(WebId, { fetch: fetch })

    // Update the page with the retrieved values.
    // let providerPods = []
    ppPodUrls.forEach(async (ppPodUrl, i) => {
      const ppPodProcessUrl = ppPodUrl + 'process/'

      let ppPodProcessContainer, isUsefulContainer
      try {
        // Check for the container /process/, and try to find (:pro/:task#step)!
        ppPodProcessContainer = await getSolidDataset(ppPodProcessUrl, { fetch: fetch })

        // Grab all processes from it
        let existingProcesses = getThingAll(ppPodProcessContainer) // will be a group of containers?
        let existingProcessesUrls = getContainedResourceUrlAll(ppPodProcessContainer)

        // Grab all tasks from it
        console.log(existingProcesses, existingProcessesUrls)

        isUsefulContainer = true // if it canbe used and read

        // TODO:Prepare all steps in these tasks (/routes)
      } catch (error) {
        // THis container cannot be used for starting processes in
        // Note that CREATING processes is handled elsewhere
        isUsefulContainer = false
        if (
          typeof error.statusCode === 'number' &&
          error.statusCode === 404 &&
          WebId === store.loggedInWebId &&
          !ownProcessContainerExists.value
        ) {
          console.warn(`Creating the /process store in the own Pod at ${ppPodProcessUrl}...`)

          // if not found, create a new SolidDataset (i.e., the reading list)
          await createContainerAt(ppPodProcessUrl, { fetch: fetch })
          isUsefulContainer = true // if it canbe used and read
        } else if (typeof error.statusCode === 'number' && error.statusCode === 403) {
          console.error(`No accecss top the process container at ${ppPodProcessUrl}`)
        } else if (typeof error.statusCode === 'number' && error.statusCode === 404) {
          console.error(`No process container is available at ${ppPodProcessUrl}`)
        } else {
          // other errors
          console.error(`Cannot add process container at ${ppPodProcessUrl}`)
        }
      } finally {
        // Store the found pp in the state
        processStore.processProviders.push({
          ContainerURI: ppPodProcessUrl,
          Label: `ProcessProvider#${i + 1}`,
          ProviderWebId: WebId,
          Active: isUsefulContainer
        })
        finishedAddingPP.value = true
      }
    })
  } catch (error) {
    //
    console.error(error)
  }
}

const selfProcessContainerExists = async () => {
  // Checks in the WebId's root if /process exist.
  if (store.selectedPodUrl.length === 0) return null
  const ownPPUrl = store.selectedPodUrl + 'process/'
  console.log(`Checking if ${ownPPUrl} exists...`)
  try {
    // Check the container
    const processesDataSet = await getSolidDataset(ownPPUrl, {
      fetch: fetch
    })
    return processesDataSet
  } catch (erreur) {
    console.error(`Own process pod does not exist or error: ${erreur}`)
    return null
  }
}

const AddProcessProvider = async (WebId) => {
  // DONE: A request is sent to this provider on having readable /process !
  const providerExists = processStore.processProviders.find((o) => o.ProviderWebId == WebId.trim())
  if (!providerExists) await addProvider(WebId)
  else {
    showToastWithMessage.value = true
    ToastMessage.value = 'Provider already added: please enter another WebId.'
  }
}

const addNewProvider = async () => {
  // write this provider into the SolidPod of the user
  await AddProcessProvider(newProviderWebId.value)
}

const checkSelfProcessContainer = async () => {
  ownProcessContainerExists.value = await selfProcessContainerExists()
}
</script>

<template>
  <BModal
    id="add-process-provider"
    v-model="processStore.canShowAddProcessProviderModal"
    @show="checkSelfProcessContainer"
    title="Add your process provider"
    size="lg"
    ok-only
    scrollable
  >
    <p>
      Process providers allow you to add data to your data pod following a fixed process and shared
      data model. Detected own container /process: {{ ownProcessContainerExists }} in pod
      {{ store.selectedPodUrl }}. {{ processStore.processProviders }}
    </p>
    <BButton class="mb-3" @click="showPPHelp = !showPPHelp">Details</BButton>
    <Teleport to="body">
      <div class="'bottom-0 end-0">
        <BToast v-model="showToastWithMessage" variant="warning">{{ ToastMessage }}</BToast>
      </div>
    </Teleport>
    <BInputGroup prepend="Provider WebId">
      <!-- list="providerList" -->
      <BFormInput
        id="newProvider"
        v-model="newProviderWebId"
        placeholder="WebID of your Process Provider"
        type="text"
        @keyup.enter="addNewProvider"
      ></BFormInput>
      <!-- <datalist id="providerList">
        <option>{{ store.loggedInWebId }}</option>
      </datalist> -->
      <AsyncButton
        :async-done="true"
        variant="secondary"
        label="Add Provider"
        icon-class="IMdiNoteAdd"
        @aclick="addNewProvider"
      />
    </BInputGroup>
    <BCard class="mt-3" v-if="processStore.processProviders.length > 0" header="Process providers">
      <BCardBody v-for="provider in processStore.processProviders" :key="provider.Label">
        <BInputGroup>
          <BFormInput
            variant="success"
            :placeholder="provider.ProviderWebId"
            type="text"
          ></BFormInput>
          <BInputGroupText
            ><IMdiCloudCancel v-if="!provider.Active" variant="danger"></IMdiCloudCancel
            ><IMdiCloudCheck v-else></IMdiCloudCheck
          ></BInputGroupText>
        </BInputGroup>
      </BCardBody>
    </BCard>
    <p class="mt-3">
      You can add processes in your own pod as well, they MUST be stored in the
      <code>/process</code> container.
    </p>
    <BInputGroup prepend="Your WebId" class="mt-3" v-if="store.loggedInWebId">
      <!-- list="providerList" -->
      <BFormInput
        id="selfProvider"
        :placeholder="store.loggedInWebId"
        type="text"
        :disabled="true"
        @keyup.enter="addNewProvider"
      ></BFormInput>
      <!-- <datalist id="providerList">
        <option>{{ store.loggedInWebId }}</option>
      </datalist> -->
      <AsyncButton
        v-if="!ownProcessContainerExists"
        :async-done="finishedAddingSelfPP"
        variant="secondary"
        label="Activate"
        icon-class="IMdiNoteAdd"
        @aclick="addProvider(store.loggedInWebId)"
      /><BInputGroupText v-else><IMdiCloudCheck></IMdiCloudCheck></BInputGroupText>
    </BInputGroup>
    <BAlert variant="warning" :model-value="true" class="mt-3" v-else
      >Log in to your Solid Pod, in order to use your own processes!</BAlert
    >
  </BModal>
  <BModal id="ProcessHelpModal" v-model="showPPHelp" size="lg" :no-close-on-esc="true" ok-only>
    <p>Process providers are:</p>
    <ul>
      <li>
        SolidPods containing process-describing datasets at
        <code>https://PodProvider/{RootContainer}/process/{ProcessName}/{TaskName}#{Step}</code>.
      </li>
      <li>
        (NOT SUPPORTED) Triple Stores containing a process-describing instance at
        <code>https://TripleStore:port/process/{ProcessName}/{TaskName}#{Step}</code>.
      </li>
    </ul>
    <p>Each Process step must contain:</p>
    <ol>
      <li>A name (<code>rdfs:label</code>)</li>
      <li>A description (<code>rdfs:description</code>)</li>
      <li>An action: Retrieve, Update, ...</li>
      <li>An active URI, upon which the action will be performed</li>
      <li>
        For a Form: a <code>shacl-shape</code> compliant SHACL-file. The RDF data will be stored
        in/retrieved from the URI.
      </li>
      <li>
        For a List: a <code>SPARQL-query</code> which will be executed on the URI (must then be an
        endpoint), the search query variables will serve as columns.
      </li>
      <li>
        Without Form, nor List, the process will just display the description and link to the next
        step.
      </li>
    </ol>
    <p>
      If the Process resource is not found, this application will revert to some provided routes or
      display a 404.
    </p>
  </BModal>
</template>

<style lang="scss" scoped></style>
