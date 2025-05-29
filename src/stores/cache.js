import { reactive } from 'vue'

export const cacheStore = reactive({
  // SHACL shape blob URLs cache
  allShapeBlobUrls: [],

  // SHACL shape source URL to BLOB URL mapping
  shapeUrlMapping: new Map(),

  // Process data cache with metadata
  processCache: new Map(),

  // Task data cache with metadata
  taskCache: new Map(),

  // Step data cache with metadata
  stepCache: new Map(),

  // SHACL shape file sources cache
  shapeSourceCache: new Map(),

  // Provider availability cache
  providerStatusCache: new Map(),

  // Cache management methods
  cacheProcess(processURI, data, sourceProvider = null) {
    this.processCache.set(processURI, {
      data,
      sourceProvider,
      loadStatus: 'loaded',
      loadedAt: new Date(),
      lastAccessed: new Date()
    })
  },

  cacheTask(taskURI, data, sourceProvider = null) {
    this.taskCache.set(taskURI, {
      data,
      sourceProvider,
      loadStatus: 'loaded',
      loadedAt: new Date(),
      lastAccessed: new Date()
    })
  },

  cacheStep(stepURI, data, sourceProvider = null) {
    this.stepCache.set(stepURI, {
      data,
      sourceProvider,
      loadStatus: 'loaded',
      loadedAt: new Date(),
      lastAccessed: new Date()
    })
  },

  getCachedProcess(processURI) {
    const cached = this.processCache.get(processURI)
    if (cached) {
      cached.lastAccessed = new Date()
      return cached
    }
    return null
  },

  getCachedTask(taskURI) {
    const cached = this.taskCache.get(taskURI)
    if (cached) {
      cached.lastAccessed = new Date()
      return cached
    }
    return null
  },

  getCachedStep(stepURI) {
    const cached = this.stepCache.get(stepURI)
    if (cached) {
      cached.lastAccessed = new Date()
      return cached
    }
    return null
  },

  markLoadFailed(type, uri, error = null) {
    const cache =
      type === 'process' ? this.processCache : type === 'task' ? this.taskCache : this.stepCache

    cache.set(uri, {
      data: null,
      sourceProvider: null,
      loadStatus: 'failed',
      error,
      loadedAt: new Date(),
      lastAccessed: new Date()
    })
  },

  markLoading(type, uri) {
    const cache =
      type === 'process' ? this.processCache : type === 'task' ? this.taskCache : this.stepCache

    cache.set(uri, {
      data: null,
      sourceProvider: null,
      loadStatus: 'loading',
      loadedAt: new Date(),
      lastAccessed: new Date()
    })
  },
  clearCache() {
    this.processCache.clear()
    this.taskCache.clear()
    this.stepCache.clear()
    this.shapeSourceCache.clear()
    this.providerStatusCache.clear()
    // Clear SHACL shape cache
    this.shapeUrlMapping.clear()
    // Revoke existing BLOB URLs to free memory
    this.allShapeBlobUrls.forEach(blobUrl => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    })
    this.allShapeBlobUrls.length = 0
  },

  // SHACL shape caching methods
  getShapeBlobUrl(sourceUrl) {
    return this.shapeUrlMapping.get(sourceUrl)
  },

  isShapeCached(sourceUrl) {
    return this.shapeUrlMapping.has(sourceUrl)
  },

  cacheShapeBlob(sourceUrl, blobUrl) {
    if (!this.isShapeCached(sourceUrl)) {
      this.shapeUrlMapping.set(sourceUrl, blobUrl)
      this.allShapeBlobUrls.push(blobUrl)
      console.log(`Cached new SHACL shape: ${sourceUrl} -> ${blobUrl}`)
      return true
    } else {
      console.log(`SHACL shape already cached: ${sourceUrl}`)
      return false
    }
  },

  // Get cache statistics
  getCacheStats() {
    return {
      processes: this.processCache.size,
      tasks: this.taskCache.size,
      steps: this.stepCache.size,
      shapes: this.shapeSourceCache.size,
      providers: this.providerStatusCache.size,
      shapeBlobUrls: this.allShapeBlobUrls.length,
      shapeMappings: this.shapeUrlMapping.size
    }
  }
})
