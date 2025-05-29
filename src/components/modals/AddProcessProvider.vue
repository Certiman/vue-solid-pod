<script setup>
import { ref } from 'vue'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { createContainerAt, getPodUrlAll, isContainer } from '@inrupt/solid-client'
import { getSolidDataset } from '@inrupt/solid-client'

// stores
import { processStore } from '@/stores/process'
import { sessionStore } from '@/stores/sessions'
// import { modalStore } from '@/stores/ui'

import AsyncButton from '../atoms/AsyncButton.vue'
import { BCardBody } from 'bootstrap-vue-next'

const newProviderWebId = ref('')
const showPPHelp = ref(false)
const finishedAddingPP = ref(false)
const finishedAddingSelfPP = ref(true)
const ownProcessContainerExists = ref(false)

// Adding processes
const newProcessName = ref('')
const processWasNotAdded = ref(true)
// const finishedAddingOwnProcess = ref(false)

// Flag to prevent multiple executions of modal show event
const isInitializing = ref(false)

const addProvider = async (WebId) => {
  /**
   * RUN within addProcessProvider
   *
   * For a given WebId:
   * - retrieve all its container URLs
   * - check if /process exist in that container
   * - in the OWN container URLs, create the /process container.
   */ finishedAddingPP.value = false
  const providerExists = processStore.processProviders.find((o) => o.ProviderWebId == WebId.trim())

  if (providerExists) {
    showAlert('Provider already added: please enter another WebId.', 'warning')
    finishedAddingPP.value = true
    return null
  }

  try {
    // Get Pod(s) associated with the WebID
    console.log(`(addProvider) Getting provider data for WebId ${WebId}`)

    const ppPodUrls = await getPodUrlAll(WebId, { fetch: fetch })

    // Update the page with the retrieved values.
    // let providerPods = []
    ppPodUrls.forEach(async (ppPodUrl, i) => {
      const ppPodProcessUrl = ppPodUrl + 'process/'

      let isUsefulContainer, foundDS
      try {
        // Check for the container /process/, and try to find (:pro/:task#step)!
        const { pc, ds } = await checkProcessRootContainerAt(ppPodProcessUrl) // if it can be used and read
        isUsefulContainer = pc
        foundDS = ds
        console.log(
          `(addProvider(${WebId}): addProvider() on ${ppPodProcessUrl}: useful [${pc}]`,
          ds
        )
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
          console.warn(
            `(addProvider(${WebId}): Creating the /process store in the own Pod at ${ppPodProcessUrl}...`
          )

          // if not found, create a new SolidDataset (i.e., the reading list)
          // FIXME: One can not just create this container if user disagrees!
          await createContainerAt(ppPodProcessUrl, { fetch: fetch })
          isUsefulContainer = true // if it can be used and read
        } else if (typeof error.statusCode === 'number' && error.statusCode === 403) {
          console.error(
            `(addProvider(${WebId}): No access top the process container at ${ppPodProcessUrl}`
          )
        } else if (typeof error.statusCode === 'number' && error.statusCode === 404) {
          console.error(
            `(addProvider(${WebId}): No process container is available at ${ppPodProcessUrl}`
          )
        } else {
          // other errors
          console.error(
            `(addProvider(${WebId}): Cannot add process container at ${ppPodProcessUrl}`,
            error
          )
        }
      } finally {
        // Store the found pp in the state - but check if it already exists first
        const existingProvider = processStore.processProviders.find(
          (provider) => provider.ContainerURI === ppPodProcessUrl
        )

        if (!existingProvider) {
          processStore.processProviders.push({
            ContainerURI: ppPodProcessUrl,
            Label: `P-${WebId}#${i + 1}`,
            ProviderWebId: WebId,
            Active: isUsefulContainer,
            ProcessDataSet: foundDS
          })
          console.log(`Added provider for ${WebId} at ${ppPodProcessUrl}`)
        } else {
          console.log(`Provider for ${WebId} at ${ppPodProcessUrl} already exists, skipping`)
        }
        finishedAddingPP.value = true
      }
    })
  } catch (error) {
    // Add meaningful user messages based on error types
    if (error.message.includes('network')) {
      showAlert('Network error: Could not connect to provider.', 'danger')
    } else {
      showAlert(`Error adding provider: ${error.message}`, 'danger')
    }
    console.error(`(addProvider(${WebId}):`, error)
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
  if (!isContainer(pURL)) {
    showAlert(`URL ${pURL} is not a container`, 'danger')
    return { pc: false, ds: null }
  }
  try {
    // Check the container
    const processesDataSet = await getSolidDataset(pURL, {
      fetch: fetch
    })
    console.log(
      `(checkProcessRootContainerAt) Checked if container ${pURL} exists and trying to read its dataset...`,
      processesDataSet
    )

    showAlert(`Successfully accessed process container at ${pURL}`, 'success', 3000)
    return { pc: true, ds: processesDataSet }
  } catch (erreur) {
    console.error(
      `(checkProcessRootContainerAt) On /process container at ${pURL}: does not exist or error: ${erreur}`
    )
    showAlert(`Could not access process container at ${pURL}: ${erreur.message}`, 'danger')
    return { pc: false, ds: null }
  }
}

const AddProcessProvider = async (WebId, forceReload = false) => {
  // DONE: A request is sent to this provider on having readable /process !
  try {
    const providerExists = processStore.processProviders.find(
      (o) => o.ProviderWebId == WebId.trim()
    )
    if (forceReload) {
      // FIXME: should be done with SPLICE, not filter
      // Remove all the process URLs and datasets belonging to this WebId
      const p = processStore.processProviders
      const providersToRemove = p.map((o) => o.ProviderWebId === WebId)
      const updatedProcessStore = processStore.processProviders.filter(
        (o, i) => !providersToRemove[i]
      )
      processStore.processProviders = updatedProcessStore
      console.warn(processStore.processProviders)
      showAlert(`Reloading provider ${WebId}`, 'info', 3000)
    }
    if (!providerExists || forceReload) await addProvider(WebId)
    else {
      showAlert('Provider already added: please enter another WebId.', 'warning')
      console.warn(`(addProcessProvider(${WebId}): skipping addProvider()!`)
    }
  } catch (err) {
    showAlert(`Error adding process provider: ${err.message}`, 'danger')
    console.error(
      `(addProcessProvider(${WebId}): Adding Process provider failed with error: ${err}`
    )
  }
}

const addNewProvider = async () => {
  // add the provider as entered in the UI into the SolidPod of the user
  console.log(`Adding Provider from input, WebId ${newProviderWebId.value}...`)

  if (!newProviderWebId.value || newProviderWebId.value.trim() === '') {
    showAlert('Please enter a valid WebId', 'warning')
    return
  }

  showAlert(`Attempting to add provider ${newProviderWebId.value}...`, 'info', 3000)
  await AddProcessProvider(newProviderWebId.value)
}

const addNewProcess = async () => {
  // add a process container to the own Pod.
  try {
    if (!newProcessName.value || newProcessName.value.trim() === '') {
      showAlert('Please enter a valid process name', 'warning')
      return
    }

    const processName = newProcessName.value.replaceAll(' ', '').trim()
    const newProcessContainerURI = sessionStore.selectedPodUrl + 'process/' + processName

    showAlert(`Creating process container ${processName}...`, 'info', 3000)
    await createContainerAt(newProcessContainerURI, { fetch: fetch })

    processWasNotAdded.value = true
    newProcessName.value = ''
    showAlert(`Process container ${processName} created successfully`, 'success')
    // FIXME: this allows one process to be added and is very bad UI.
  } catch (err) {
    showAlert(`Failed to create process: ${err.message}`, 'danger')
    console.error(`addNewProcess() failed with error: ${err}`)
  }
}

const checkSelfProcessContainer = async () => {
  /**
   * Run on Modal being SHOWN.
   *
   * @function checkSelfProcessContainer ONLY checks the own /process resource and
   * adds 'itself to processStore.'
   * Also automatically adds the ERA Container provider.
   */

  // Prevent multiple simultaneous executions (Bootstrap Vue modal @show can trigger twice)
  if (isInitializing.value) {
    console.log('Already initializing, skipping checkSelfProcessContainer...')
    return null
  }

  // First, add the ERA Container provider automatically
  await addERAContainerProvider()

  if (sessionStore.selectedPodUrl.length === 0) {
    showAlert('No Pod selected. Please log in first.', 'warning')
    return null
  }

  const ownPPUrl = sessionStore.selectedPodUrl + 'process/'
  try {
    // Checks in the WebId's root if /process exist.
    const providerExists = processStore.processProviders.find(
      (o) => o.ProviderWebId == sessionStore.loggedInWebId.trim()
    )

    // FIXME: if this has been executed once and providerExists, this line should not be executed.
    const { pc, ds } = await checkProcessRootContainerAt(ownPPUrl)

    if (pc && !providerExists) {
      // Store the found pp in the state
      console.warn(`checkSelfProcessContainer: adding own dataset`)

      processStore.processProviders.push({
        ContainerURI: ownPPUrl,
        Label: `P-${sessionStore.loggedInWebId}`,
        ProviderWebId: sessionStore.loggedInWebId,
        Active: true,
        ProcessDataSet: ds
      })

      showAlert('Found your process container and added it as a provider', 'success', 3000)
    }
    ownProcessContainerExists.value = pc
  } catch (e) {
    showAlert(`Error checking your process container: ${e.message}`, 'danger')
    ownProcessContainerExists.value = false
  }
}

const addERAContainerProvider = async () => {
  /**
   * Automatically add the ERA Container provider
   * This provides access to the shared process management system
   */
  console.log('addERAContainerProvider called, isInitializing:', isInitializing.value)

  // Prevent multiple simultaneous executions
  if (isInitializing.value) {
    console.log('Already initializing ERA Container, skipping...')
    return
  }

  const eraWebId = 'https://id.inrupt.com/euarpod'

  // Check if ERA provider already exists
  const existingERA = processStore.processProviders.find(
    (provider) => provider.ProviderWebId === eraWebId
  )

  if (existingERA) {
    console.log('ERA Container provider already exists')
    return existingERA
  }

  isInitializing.value = true

  try {
    console.log('Adding ERA Container provider...')
    showAlert('Adding ERA Container (Shared Process Management)...', 'info', 2000)

    // Directly fetch the ERA Container dataset without going through addProvider
    const eraContainerURI =
      'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/'
    const { pc, ds } = await checkProcessRootContainerAt(eraContainerURI)

    if (pc) {
      const eraProvider = {
        ContainerURI: eraContainerURI,
        Label: 'ERA Container - Shared Process Management',
        ProviderWebId: eraWebId,
        Active: true,
        ProcessDataSet: ds
      }

      processStore.processProviders.push(eraProvider)
      console.log('Added ERA Container provider directly:', eraProvider)
      showAlert(
        'ERA Container provider added successfully! You now have access to shared processes.',
        'success',
        4000
      )

      return eraProvider
    } else {
      throw new Error('ERA Container is not accessible')
    }
  } catch (error) {
    console.error('Failed to add ERA Container provider:', error)
    showAlert(`Failed to add ERA Container: ${error.message}`, 'danger')

    // Add inactive provider as fallback
    const eraContainerURI =
      'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/'
    const eraProvider = {
      ContainerURI: eraContainerURI,
      Label: 'ERA Container - Shared Process Management (Unavailable)',
      ProviderWebId: eraWebId,
      Active: false,
      ProcessDataSet: null
    }

    processStore.processProviders.push(eraProvider)
    return eraProvider
  } finally {
    isInitializing.value = false
  }
}

// Add a method to clear duplicate providers (for debugging)
const clearDuplicateProviders = () => {
  const uniqueProviders = []
  const seenWebIds = new Set()
  const seenContainerURIs = new Set()

  processStore.processProviders.forEach((provider) => {
    const key = `${provider.ProviderWebId}-${provider.ContainerURI}`
    if (!seenWebIds.has(key) && !seenContainerURIs.has(provider.ContainerURI)) {
      uniqueProviders.push(provider)
      seenWebIds.add(key)
      seenContainerURIs.add(provider.ContainerURI)
    } else {
      console.log('Removing duplicate provider:', provider)
    }
  })

  const removedCount = processStore.processProviders.length - uniqueProviders.length
  processStore.processProviders = uniqueProviders
  showAlert(`Removed ${removedCount} duplicate providers`, 'info', 3000)
}

const clearAllProviders = () => {
  processStore.processProviders = []
  showAlert('Cleared all providers', 'info', 2000)
}

// Alert system
const alertMessage = ref('')
const alertVariant = ref('info')
const alertDuration = ref(0) // 0 = hidden, positive value = shown with countdown
const alertCountdown = ref(0)

// Helper function to show alerts
const showAlert = (message, variant = 'warning', duration = 5000) => {
  alertMessage.value = message
  alertVariant.value = variant
  alertDuration.value = duration
  alertCountdown.value = duration
}
</script>

<template>
  <!-- @show="checkSelfProcessContainer" runs two times ? -->
  <BModal
    id="add-process-provider"
    v-model="processStore.canShowAddProcessProviderModal"
    title="Add your process provider"
    size="lg"
    ok-only
    scrollable
    @show="checkSelfProcessContainer"
  >
    <p>
      Process providers allow you to add data to your data pod following a fixed process and shared
      data model. The ERA Container (shared process management system) will be automatically added
      when you open this modal.
    </p>
    <BButton class="mb-3" @click="showPPHelp = !showPPHelp">Details</BButton>

    <BAlert
      v-model="alertDuration"
      ref="statusAlert"
      :variant="alertVariant"
      @close-countdown="alertCountdown = $event"
      class="mb-3"
    >
      <p>{{ alertMessage }}</p>
      <BProgress
        :variant="alertVariant"
        :max="alertDuration"
        :value="alertCountdown"
        height="4px"
      />
    </BAlert>

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
          <BButton variant="warning" @click="AddProcessProvider(provider.ProviderWebId, true)"
            ><IMdiReloadAlert
          /></BButton>
          <BInputGroupText
            ><IMdiCloudCancel v-if="!provider.Active" variant="danger"></IMdiCloudCancel
            ><IMdiCloudCheck v-else></IMdiCloudCheck
          ></BInputGroupText>
        </BInputGroup>
      </BCardBody>
    </BCard>

    <!-- Debug controls -->
    <BCard header="Debug Controls" class="mt-3" v-if="processStore.processProviders.length > 1">
      <BCardBody>
        <div class="d-flex gap-2">
          <BButton variant="warning" size="sm" @click="clearDuplicateProviders">
            Remove Duplicates
          </BButton>
          <BButton variant="danger" size="sm" @click="clearAllProviders">
            Clear All Providers
          </BButton>
        </div>
        <small class="text-muted mt-2 d-block">
          Use these controls if you see duplicate providers.
        </small>
      </BCardBody>
    </BCard>

    <BCard header="Your own processes" class="mt-3">
      <p class="mt-3">
        You can add processes in your own pod as well, they WILL be stored in the
        <code>/process/</code> <b>container</b>.
      </p>
      <BCardBody>
        <p v-if="sessionStore.loggedInWebId">
          <BInputGroup prepend="Your WebId" class="mt-3">
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
          <BInputGroup prepend="Process Name" class="mt-2">
            <BFormInput
              id="selfProcessAdd"
              placeholder="Process Name"
              v-model="newProcessName"
              type="text"
              @keyup.enter="addNewProcess"
            ></BFormInput>
            <AsyncButton
              v-if="processWasNotAdded"
              :async-done="newProcessName.replaceAll(' ', '').length > 6"
              variant="secondary"
              label="+"
              icon-class="IMdiNoteAdd"
              @aclick="addNewProcess"
            /><BInputGroupText v-else><IMdiCloudCheck></IMdiCloudCheck></BInputGroupText>
          </BInputGroup>
        </p>
        <BAlert variant="warning" :model-value="true" class="mt-3" v-else
          >Log in to your Solid Pod, in order to use your own processes!</BAlert
        >
      </BCardBody>
    </BCard>
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
