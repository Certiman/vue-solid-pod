import { reactive, computed } from 'vue'
import { sessionStore } from '@/stores/sessions'
import { cacheStore } from '@/stores/cache'
import { dataService } from '@/services/dataService'

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

  // Cached data organization
  extractedProcesses: new Map(),
  extractedTasks: new Map(),
  extractedSteps: new Map(),

  canProcessData() {
    return this.processProviders.length > 0
  },
  isOwnedResource(resourceUri) {
    // Check if a URI belongs to the currently logged-in user's Pod
    if (!resourceUri) return false

    // Check against selectedPodUrl
    if (sessionStore.selectedPodUrl && resourceUri.includes(sessionStore.selectedPodUrl)) {
      return true
    }

    // Check against ownStoragePodRoot if available
    const ownStoragePodRoot = sessionStore.ownStoragePodRoot()
    if (ownStoragePodRoot && resourceUri.includes(ownStoragePodRoot)) {
      return true
    }

    return false
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
