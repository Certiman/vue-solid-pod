<script setup>
import { ref } from 'vue'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { createContainerAt, getPodUrlAll, isContainer } from '@inrupt/solid-client'
import { getSolidDataset, getContainedResourceUrlAll } from '@inrupt/solid-client'

// stores
import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'
import { modalStore } from '@/stores/ui'

import AsyncButton from '../atoms/AsyncButton.vue'
import { BCardBody } from 'bootstrap-vue-next'

const newProviderWebId = ref('https://id.inrupt.com/euarpod')
const showPPHelp = ref(false)
const finishedAddingPP = ref(false)
const finishedAddingSelfPP = ref(true)
const ownProcessContainerExists = ref(false)

const addProvider = async (WebId) => {
  /**
   * For a given WebId:
   * - retrieve all its container URLs
   * - check if /process exist in that container
   * - in the OWN container URLs, create the /process container.
   */
  finishedAddingPP.value = false
  const providerExists = processStore.processProviders.find((o) => o.ProviderWebId == WebId.trim())
  if (providerExists) {
    // modalStore.showToastWithMessage = true
    // modalStore.ToastMessage = 'Provider already added: please enter another WebId.'
    return null
  }
  try {
    // Get Pod(s) associated with the WebID
    console.log(`Getting provider data for WebId ${WebId}`)

    const ppPodUrls = await getPodUrlAll(WebId, { fetch: fetch })

    // Update the page with the retrieved values.
    // let providerPods = []
    ppPodUrls.forEach(async (ppPodUrl, i) => {
      const ppPodProcessUrl = ppPodUrl + 'process/'

      let isUsefulContainer, foundDS
      try {
        // Check for the container /process/, and try to find (:pro/:task#step)!
        const { pc, ds } = checkProcessRootContainerAt(ppPodProcessUrl) // if it can be used and read
        isUsefulContainer = pc
        foundDS = ds
      } catch (error) {
        // THis container cannot be used for starting processes in
        // Note that CREATING processes is handled elsewhere
        isUsefulContainer = false
        if (
          typeof error.statusCode === 'number' &&
          error.statusCode === 404 &&
          WebId === sessionStore.loggedInWebId &&
          !ownProcessContainerExists.value
        ) {
          console.warn(`Creating the /process store in the own Pod at ${ppPodProcessUrl}...`)

          // if not found, create a new SolidDataset (i.e., the reading list)
          // FIXME: One can not just create this container if user disagrees!
          await createContainerAt(ppPodProcessUrl, { fetch: fetch })
          isUsefulContainer = true // if it can be used and read
        } else if (typeof error.statusCode === 'number' && error.statusCode === 403) {
          console.error(`No accecss top the process container at ${ppPodProcessUrl}`)
        } else if (typeof error.statusCode === 'number' && error.statusCode === 404) {
          console.error(`No process container is available at ${ppPodProcessUrl}`)
        } else {
          // other errors
          console.error(`Cannot add process container at ${ppPodProcessUrl}`, error)
        }
      } finally {
        // Store the found pp in the state
        processStore.processProviders.push({
          ContainerURI: ppPodProcessUrl,
          Label: `ProcessProvider#${i + 1}`,
          ProviderWebId: WebId,
          Active: isUsefulContainer,
          ProcessDataSet: foundDS
        })
        finishedAddingPP.value = true
      }
    })
  } catch (error) {
    //
    console.error(error)
  }
}

// const getProcessesFromPContainer = async () => {
//   // On leaving the Modal: prepare main page LIST of available processes IN these /process containers.
//   // With all providers determined, write their processes at ppPodProcessUrl in the state.
//   // Noo action so far.
// }

const checkProcessRootContainerAt = async (pURL) => {
  /**
   * Returns { pc, ds }
   * @ds For a given /process-container URL, store the dataset if it exists in ds:
   * @pc Return the existence as a boolean under pc:
   */
  console.log(`Checking if container ${pURL} exists...`)
  if (!isContainer(pURL)) return { pc: false, ds: null }
  try {
    // Check the container
    const processesDataSet = await getSolidDataset(pURL, {
      fetch: fetch
    })
    return { pc: true, ds: processesDataSet }
  } catch (erreur) {
    console.error(`On /process container at ${pURL}: does not exist or error: ${erreur}`)
    return { pc: false, ds: null }
  }
}

const AddProcessProvider = async (WebId, forceReload = false) => {
  // DONE: A request is sent to this provider on having readable /process !
  const providerExists = processStore.processProviders.find((o) => o.ProviderWebId == WebId.trim())
  if (forceReload) {
    // FIXME: should be done with SLICE, not filter
    // Remove all the process URLs and datasets belonging to this WebId
    const p = processStore.processProviders
    const providersToRemove = p.map((o) => o.ProviderWebId === WebId)
    const updatedProcessStore = processStore.processProviders.filter(
      (o, i) => !providersToRemove[i]
    )
    processStore.processProviders = updatedProcessStore
    console.warn(processStore.processProviders)
  }
  if (!providerExists || forceReload) await addProvider(WebId)
  else {
    // FIXME: better way of showing these
    // modalStore.showToastWithMessage = true
    // modalStore.ToastMessage = 'Provider already added: please enter another WebId.'
  }
}

const addNewProvider = async () => {
  // add the provider as entered in the UI into the SolidPod of the user
  await AddProcessProvider(newProviderWebId.value)
}

const checkSelfProcessContainer = async () => {
  if (sessionStore.selectedPodUrl.length === 0) return null
  const ownPPUrl = sessionStore.selectedPodUrl + 'process/'
  try {
    // Checks in the WebId's root if /process exist.
    // ds is thrown away here.
    const { pc, ds } = await checkProcessRootContainerAt(ownPPUrl)
    const providerExists = processStore.processProviders.find(
      (o) => o.ProviderWebId == sessionStore.loggedInWebId.trim()
    )

    if (pc && !providerExists) {
      // Store the found pp in the state
      processStore.processProviders.push({
        ContainerURI: ownPPUrl,
        Label: `Self#`,
        ProviderWebId: sessionStore.loggedInWebId,
        Active: true,
        ProcessDataSet: ds
      })
    }
    ownProcessContainerExists.value = pc
  } catch (e) {
    ownProcessContainerExists.value = false
  }
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
      data model.
    </p>
    <BButton class="mb-3" @click="showPPHelp = !showPPHelp">Details</BButton>
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
        <option>{{ sessionStore.loggedInWebId }}</option>
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
          <BButton
            variant="warning"
            @click="AddProcessProvider(provider.ProviderWebId, true)"
            disabled
            ><IMdiReloadAlert
          /></BButton>
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
    <BInputGroup prepend="Your WebId" class="mt-3" v-if="sessionStore.loggedInWebId">
      <!-- list="providerList" -->
      <BFormInput
        id="selfProvider"
        :placeholder="sessionStore.loggedInWebId"
        type="text"
        :disabled="true"
        @keyup.enter="addNewProvider"
      ></BFormInput>
      <!-- <datalist id="providerList">
        <option>{{ sessionStore.loggedInWebId }}</option>
      </datalist> -->
      <AsyncButton
        v-if="!ownProcessContainerExists"
        :async-done="finishedAddingSelfPP"
        variant="secondary"
        label="Activate"
        icon-class="IMdiNoteAdd"
        @aclick="addProvider(sessionStore.loggedInWebId)"
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
