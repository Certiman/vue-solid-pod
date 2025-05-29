import { reactive, computed } from 'vue'
import { sessionStore } from '@/stores/sessions'
import { cacheStore } from '@/stores/cache'
import { dataService } from '@/services/dataService'
import { getSolidDataset } from '@inrupt/solid-client'

/**
 * A processProvider must be stored as:
 * {
 *  ContainerURI: String, // Where /process can be found
 *  Label: String,
 *  ProviderWebId: String // If possible, instead of the ContainerURI.
 *  Active: boolean // If contact is possible with this provider.
 * }
 */

export const processStore = reactive({
  processProviders: [], // Comunica can query several process sources
  canShowAddProcessProviderModal: false,
  processTaskInEdit: '',
  currentTaskURI: '', // pod URI of the process/task which is being selected for execution
  // ERA Container system configuration
  eraContainerURI: 'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/',

  // ERA Container management processes
  get eraManagementProcessURI() {
    return `${this.eraContainerURI}Process/`
  },

  get eraAddTaskProcessURI() {
    return `${this.eraContainerURI}Process/addTask`
  },

  get eraAddStepProcessURI() {
    return `${this.eraContainerURI}Process/addStep`
  },

  get eraAddProcessURI() {
    return `${this.eraContainerURI}Process/add`
  },

  // Cached data organization
  extractedProcesses: new Map(),
  extractedTasks: new Map(),
  extractedSteps: new Map(),

  canProcessData() {
    return this.processProviders.length > 0
  },
  isOwnedResource(resourceUri) {
    // Check if a URI belongs to the currently logged-in user's Pod storage
    if (!resourceUri) return false

    // Primary check: Does the resource URI start with the user's selected Pod URL?
    // Example: selectedPodUrl = "https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/"
    //          resourceUri = "https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/Organisation/"
    if (sessionStore.selectedPodUrl && resourceUri.startsWith(sessionStore.selectedPodUrl)) {
      return true
    }

    // Secondary check: Use ownStoragePodRoot for more flexible matching
    // This handles cases where the full Pod URL might vary but the root storage is the same
    const ownStoragePodRoot = sessionStore.ownStoragePodRoot()
    if (ownStoragePodRoot) {
      try {
        const resourceURL = new URL(resourceUri)
        const podRootURL = new URL(ownStoragePodRoot)

        // Check if it's the same storage provider and if the resource path starts with the user's Pod ID
        if (
          resourceURL.hostname === podRootURL.hostname &&
          resourceUri.includes(sessionStore.selectedPodUrl.split('/').slice(-2, -1)[0])
        ) {
          return true
        }
      } catch (error) {
        console.warn('Error parsing URLs for ownership check:', error)
      }
    }

    return false
  }, // Enhanced provider management for ERA Container system
  async addERAContainerProvider() {
    // Add the ERA Container as a process provider if not already present
    // ERA Container is owned by the euarpod WebId
    const existingERA = this.processProviders.find((p) => p.ContainerURI === this.eraContainerURI)
    if (existingERA) {
      return existingERA
    }

    try {
      // Fetch the actual dataset from the ERA Container
      const dataset = await getSolidDataset(this.eraContainerURI, { fetch: fetch })

      const eraProvider = {
        ContainerURI: this.eraContainerURI,
        Label: 'ERA Container - Generic Process Management',
        ProviderWebId: 'https://id.inrupt.com/euarpod', // Actual owner of the ERA Container
        Active: true,
        ProcessDataSet: dataset
      }

      this.processProviders.push(eraProvider)
      console.log('Added ERA Container provider:', eraProvider)
      return eraProvider
    } catch (error) {
      console.error('Failed to fetch ERA Container dataset:', error)

      // Add provider without dataset for now, but mark as inactive
      const eraProvider = {
        ContainerURI: this.eraContainerURI,
        Label: 'ERA Container - Generic Process Management (Unavailable)',
        ProviderWebId: 'https://id.inrupt.com/euarpod',
        Active: false,
        ProcessDataSet: null
      }

      this.processProviders.push(eraProvider)
      return eraProvider
    }
  },
  // Get user's own process provider
  getOwnProcessProvider() {
    return this.processProviders.find((provider) => this.isOwnedResource(provider.ContainerURI))
  },

  // Cache management methods for processes
  async getOrFetchProcess(processURI, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = cacheStore.getCachedProcess(processURI)
      if (cached && cached.loadStatus === 'loaded') {
        return cached.data
      }
      if (cached && cached.loadStatus === 'loading') {
        // TODO: Implement waiting mechanism or return loading state
        return null
      }
    }

    cacheStore.markLoading('process', processURI)

    try {
      // Here you would implement the actual fetching logic
      // For now, return a placeholder
      const processData = await this.fetchProcessData(processURI)
      cacheStore.cacheProcess(processURI, processData, this.getProviderForURI(processURI))
      return processData
    } catch (error) {
      cacheStore.markLoadFailed('process', processURI, error)
      throw error
    }
  },

  async getOrFetchTask(taskURI, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = cacheStore.getCachedTask(taskURI)
      if (cached && cached.loadStatus === 'loaded') {
        return cached.data
      }
      if (cached && cached.loadStatus === 'loading') {
        return null
      }
    }

    cacheStore.markLoading('task', taskURI)

    try {
      const taskData = await this.fetchTaskData(taskURI)
      cacheStore.cacheTask(taskURI, taskData, this.getProviderForURI(taskURI))
      return taskData
    } catch (error) {
      cacheStore.markLoadFailed('task', taskURI, error)
      throw error
    }
  },

  async getOrFetchStep(stepURI, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = cacheStore.getCachedStep(stepURI)
      if (cached && cached.loadStatus === 'loaded') {
        return cached.data
      }
      if (cached && cached.loadStatus === 'loading') {
        return null
      }
    }

    cacheStore.markLoading('step', stepURI)

    try {
      const stepData = await this.fetchStepData(stepURI)
      cacheStore.cacheStep(stepURI, stepData, this.getProviderForURI(stepURI))
      return stepData
    } catch (error) {
      cacheStore.markLoadFailed('step', stepURI, error)
      throw error
    }
  },

  // Helper method to identify which provider a URI belongs to
  getProviderForURI(uri) {
    return this.processProviders.find(
      (provider) => uri.startsWith(provider.ContainerURI) || uri.startsWith(provider.ProviderWebId)
    )
  },
  // Placeholder methods for actual data fetching (to be implemented)
  async fetchProcessData(processURI) {
    return await dataService.fetchProcessData(processURI)
  },

  async fetchTaskData(taskURI) {
    return await dataService.fetchTaskData(taskURI)
  },

  async fetchStepData(stepURI) {
    return await dataService.fetchStepData(stepURI)
  },

  // Computed properties for cache status
  getCacheStatus: computed(() => {
    const stats = cacheStore.getCacheStats()
    return {
      totalCached: stats.processes + stats.tasks + stats.steps,
      ...stats
    }
  }),

  // Check if resource is loading
  isResourceLoading(uri, type) {
    const cache =
      type === 'process'
        ? cacheStore.processCache
        : type === 'task'
          ? cacheStore.taskCache
          : cacheStore.stepCache
    const cached = cache.get(uri)
    return cached && cached.loadStatus === 'loading'
  },

  // Check if resource failed to load
  isResourceLoadFailed(uri, type) {
    const cache =
      type === 'process'
        ? cacheStore.processCache
        : type === 'task'
          ? cacheStore.taskCache
          : cacheStore.stepCache
    const cached = cache.get(uri)
    return cached && cached.loadStatus === 'failed'
  },

  extractProcessName(processURI) {
    // https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/add
    // returns '/Organisation'
    if (!processURI) return null
    let p = processURI
    const identifier = '/process/'
    const pName = p.substring(p.indexOf(identifier) + identifier.length).split('/')
    console.log(`extractProcessName(${processURI}): ${pName[0]}`)
    return `/${pName[0]}`
  },

  shorthandForProcessURI(processURI) {
    // https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/
    // Returns TheThirdProcess/
    if (!processURI) return null
    let p = processURI

    const shortHURI = p.substring(p.substring(0, p.length - 1).lastIndexOf('/') + 1)
    // console.log(`shortHURI() generated: ${shortHURI}.`)
    console.log(`shorthandForProcessURI(${processURI}): ${shortHURI}`)
    return shortHURI
  },

  shorthandForTaskURI(taskURI) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns SecondTask and NEVER SecondTask#0 if a step is present.
    if (!taskURI) return null
    let p = taskURI
    const shorthandForTaskURI = p.substring(p.lastIndexOf('/') + 1)
    console.log(`shorthandForTaskURI(${taskURI}): ${shorthandForTaskURI}`)
    return shorthandForTaskURI
  },

  extractProcTaskAppPath(taskURI, step) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask/{step}
    // and NOT TheThirdProcess/SecondTask#{step}
    if (!taskURI) return null
    let p = taskURI
    const identifier = '/process/'
    const shURI = p.substring(p.indexOf(identifier) + identifier.length) + `/${step}`
    console.log(`extractProcTaskAppPath(${taskURI}): ${shURI}`)
    return shURI
  },

  extractProcTaskResource(taskURI, step) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask#{step}
    let p = taskURI
    const identifier = '/process/'
    const shPTURI =
      p.substring(p.indexOf(identifier) + identifier.length) + (step ? `#${step}` : '')
    console.log(`extractProcTaskResource(${taskURI}): ${shPTURI}`)
    return shPTURI
  }
})
