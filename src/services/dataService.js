import {
  getSolidDataset,
  getThingAll,
  getThing,
  getStringNoLocale,
  getStringWithLocale,
  getContainedResourceUrlAll,
  getUrl,
  getUrlAll,
  getInteger,
  asUrl
} from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { RDFS, RDF, LDP, VCARD } from '@inrupt/vocab-common-rdf'
import { DUL } from '@/vocabularies/DUL'

/**
 * Data service for fetching and processing Solid Pod data
 * Handles the actual RDF data retrieval and parsing
 */
export const dataService = {
  /**
   * Fetch process data from a container URI
   * @param {string} processURI - The process container URI
   * @returns {Object} Process data with metadata
   */
  async fetchProcessData(processURI) {
    try {
      console.log(`Fetching process data for ${processURI}`)

      const containerDataSet = await getSolidDataset(processURI, { fetch })
      const taskURIs = getContainedResourceUrlAll(containerDataSet)

      // Filter out .ttl files and other non-RDF resources
      const rdfTaskURIs = taskURIs.filter((uri) => !uri.endsWith('.ttl'))

      const processData = {
        uri: processURI,
        name: this.extractNameFromURI(processURI),
        taskURIs: rdfTaskURIs,
        taskCount: rdfTaskURIs.length,
        containerDataSet,
        fetchedAt: new Date()
      }

      console.log(`Process data fetched: ${rdfTaskURIs.length} tasks found`)
      return processData
    } catch (error) {
      console.error(`Failed to fetch process data for ${processURI}:`, error)
      throw error
    }
  },

  /**
   * Fetch task data from a task URI
   * @param {string} taskURI - The task URI
   * @returns {Object} Task data with metadata
   */
  async fetchTaskData(taskURI) {
    try {
      console.log(`Fetching task data for ${taskURI}`)

      const taskDataSet = await getSolidDataset(taskURI, { fetch })
      const taskThing = getThing(taskDataSet, taskURI)

      if (!taskThing) {
        throw new Error(`No task thing found at ${taskURI}`)
      }

      // Extract task metadata
      const taskName = this.extractTaskName(taskThing, taskURI)
      const taskContact = this.extractTaskContact(taskThing)
      const taskDescription = this.extractTaskDescription(taskThing)

      // Check for task steps/actions
      const allThings = getThingAll(taskDataSet)
      const stepThings = allThings.filter((thing) => {
        const types = getUrlAll(thing, RDF.type)
        return types.includes(DUL.Action)
      })

      const taskData = {
        uri: taskURI,
        name: taskName,
        contact: taskContact,
        description: taskDescription,
        taskThing: taskThing,
        dataSet: taskDataSet,
        stepCount: stepThings.length,
        stepThings: stepThings,
        fetchedAt: new Date()
      }

      console.log(`Task data fetched: ${taskName} with ${stepThings.length} steps`)
      return taskData
    } catch (error) {
      console.error(`Failed to fetch task data for ${taskURI}:`, error)
      throw error
    }
  },

  /**
   * Fetch step data from a step URI
   * @param {string} stepURI - The step URI
   * @returns {Object} Step data with metadata
   */
  async fetchStepData(stepURI) {
    try {
      console.log(`Fetching step data for ${stepURI}`)

      // For steps, we might need to fetch from the parent task
      // This is a simplified version - might need more complex logic
      const taskURI = this.extractTaskURIFromStep(stepURI)
      const taskDataSet = await getSolidDataset(taskURI, { fetch })
      const stepThing = getThing(taskDataSet, stepURI)

      if (!stepThing) {
        throw new Error(`No step thing found at ${stepURI}`)
      }

      const stepData = {
        uri: stepURI,
        name: this.extractStepName(stepThing),
        sequence: getInteger(stepThing, 'http://schema.org/position') || null,
        version: getInteger(stepThing, 'http://schema.org/version') || 0,
        stepThing: stepThing,
        fetchedAt: new Date()
      }

      console.log(`Step data fetched: ${stepData.name}`)
      return stepData
    } catch (error) {
      console.error(`Failed to fetch step data for ${stepURI}:`, error)
      throw error
    }
  },

  /**
   * Extract task name from task thing with fallbacks
   * @param {Object} taskThing - The task RDF thing
   * @param {string} taskURI - The task URI for fallback
   * @returns {string} Task name
   */
  extractTaskName(taskThing, taskURI) {
    return (
      getStringNoLocale(taskThing, RDFS.comment) ||
      getStringWithLocale(taskThing, RDFS.comment, 'en-US') ||
      getStringWithLocale(taskThing, RDFS.comment, 'en') ||
      getStringNoLocale(taskThing, RDFS.label) ||
      getStringWithLocale(taskThing, RDFS.label, 'en-US') ||
      getStringWithLocale(taskThing, RDFS.label, 'en') ||
      taskURI.split('/').pop() ||
      'Unknown task name'
    )
  },

  /**
   * Extract task contact information
   * @param {Object} taskThing - The task RDF thing
   * @returns {string} Contact information
   */
  extractTaskContact(taskThing) {
    return getStringNoLocale(taskThing, VCARD.hasEmail) || getUrl(taskThing, VCARD.hasEmail) || ''
  },

  /**
   * Extract task description
   * @param {Object} taskThing - The task RDF thing
   * @returns {string} Task description
   */
  extractTaskDescription(taskThing) {
    return (
      getStringNoLocale(taskThing, 'http://purl.org/dc/terms/description') ||
      getStringNoLocale(taskThing, 'http://purl.org/dc/elements/1.1/description') ||
      ''
    )
  },

  /**
   * Extract step name from step thing
   * @param {Object} stepThing - The step RDF thing
   * @returns {string} Step name
   */
  extractStepName(stepThing) {
    return (
      getStringNoLocale(stepThing, 'http://schema.org/name') ||
      getStringNoLocale(stepThing, RDFS.label) ||
      getStringNoLocale(stepThing, RDFS.comment) ||
      'Unnamed step'
    )
  },

  /**
   * Extract name from URI (fallback method)
   * @param {string} uri - The URI to extract name from
   * @returns {string} Extracted name
   */
  extractNameFromURI(uri) {
    const parts = uri.split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown'
  },

  /**
   * Extract task URI from step URI
   * @param {string} stepURI - The step URI
   * @returns {string} Task URI
   */
  extractTaskURIFromStep(stepURI) {
    // Remove fragment identifier if present
    const baseURI = stepURI.split('#')[0]
    return baseURI
  },

  /**
   * Process task runner data (steps, pointers, versions)
   * @param {Object} taskDataSet - The task dataset
   * @returns {Object} Processed task runner data
   */
  processTaskRunnerData(taskDataSet) {
    const taskContents = getThingAll(taskDataSet)
    const stepsList = []
    const pointersList = []
    const versions = new Set()
    let taskName = ''
    let taskContact = ''

    taskContents.forEach((thing) => {
      const taskTypes = getUrlAll(thing, RDF.type)

      if (taskTypes.includes(DUL.Action)) {
        this.processActionStep(thing, versions, stepsList, pointersList)
      } else if (taskTypes.includes(LDP.RDFSource)) {
        const descriptorData = this.processTaskDescriptor(thing)
        taskName = descriptorData.taskName
        taskContact = descriptorData.taskContact
        pointersList.push(...descriptorData.pointers)
      }
    })

    return {
      stepsList,
      pointersList,
      versions: Array.from(versions),
      taskName,
      taskContact,
      totalThingsFound: taskContents.length
    }
  },

  /**
   * Process a DUL:Action step
   * @param {Object} step - The step thing
   * @param {Set} versions - Versions set to update
   * @param {Array} stepsList - Steps list to update
   * @param {Array} pointersList - Pointers list to update
   */
  processActionStep(step, versions, stepsList, pointersList) {
    try {
      const stepURI = asUrl(step)

      // Extract version
      let stepVersion = getInteger(step, 'http://schema.org/version') || 0
      if (!stepVersion) {
        console.warn('Step is missing schema:version property')
        stepVersion = 0
      }

      versions.add(stepVersion)

      // Extract next step pointer
      const nextStepURI = getUrl(step, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
      const isLastStep = nextStepURI === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'

      // Add to pointers list
      pointersList.push([stepURI, isLastStep ? null : nextStepURI, stepVersion])

      // Add to steps list (sequence will be calculated later)
      stepsList.push({ step: step, sequence: null, version: stepVersion })
    } catch (err) {
      console.error(`Error processing step: ${err.message}`)
    }
  },

  /**
   * Process task descriptor (LDP.RDFSource)
   * @param {Object} descriptor - The descriptor thing
   * @returns {Object} Processed descriptor data
   */
  processTaskDescriptor(descriptor) {
    try {
      // Get first tasks in the sequence
      const firstTasks = getUrlAll(descriptor, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first')

      // Extract task metadata
      const taskName = getStringNoLocale(descriptor, RDFS.comment) || 'Unnamed Task'
      const taskContact =
        getStringNoLocale(descriptor, VCARD.hasEmail) || getUrl(descriptor, VCARD.hasEmail) || ''

      // Add starting points to pointers list
      const pointers = firstTasks.map((taskURI) => [null, taskURI, null])

      return {
        taskName,
        taskContact,
        pointers
      }
    } catch (err) {
      console.error(`Error processing task descriptor: ${err.message}`)
      return {
        taskName: 'Error loading task',
        taskContact: '',
        pointers: []
      }
    }
  },

  /**
   * Fetch data organized by RDF type from a data container
   * @param {string} containerURI - The data container URI
   * @returns {Object} Data organized by RDF type
   */
  async fetchDataByType(containerURI) {
    try {
      console.log(`Fetching data by type from container: ${containerURI}`)

      // First, get the container to see what resources exist
      const containerDataSet = await getSolidDataset(containerURI, { fetch })
      const resourceURIs = getContainedResourceUrlAll(containerDataSet)

      console.log(`Found ${resourceURIs.length} resources in container`)

      const dataByType = {}

      // Fetch each resource and organize by RDF type
      for (const resourceURI of resourceURIs) {
        try {
          console.log(`Fetching resource: ${resourceURI}`)
          const resourceDataSet = await getSolidDataset(resourceURI, { fetch })
          const things = getThingAll(resourceDataSet)

          for (const thing of things) {
            const types = getUrlAll(thing, RDF.type)

            // Extract properties for display
            const properties = this.extractThingProperties(thing)

            // Get created/modified dates if available
            const created =
              getStringNoLocale(thing, 'http://purl.org/dc/terms/created') ||
              getStringNoLocale(thing, 'http://schema.org/dateCreated')
            const modified =
              getStringNoLocale(thing, 'http://purl.org/dc/terms/modified') ||
              getStringNoLocale(thing, 'http://schema.org/dateModified')

            const resourceData = {
              uri: asUrl(thing),
              sourceURI: resourceURI,
              properties,
              created,
              modified,
              types
            }

            // Organize by each RDF type
            for (const type of types) {
              if (!dataByType[type]) {
                dataByType[type] = []
              }
              dataByType[type].push(resourceData)
            }
          }
        } catch (resourceError) {
          console.warn(`Failed to fetch resource ${resourceURI}:`, resourceError)
          // Continue with other resources
        }
      }

      console.log(`Data organized by type:`, Object.keys(dataByType))
      return dataByType
    } catch (error) {
      console.error(`Failed to fetch data by type from ${containerURI}:`, error)
      throw error
    }
  },

  /**
   * Extract properties from a Thing for display
   * @param {Thing} thing - The RDF thing
   * @returns {Object} Properties object
   */
  extractThingProperties(thing) {
    const properties = {} // Common properties to extract
    const propertiesToExtract = [
      RDFS.label,
      RDFS.comment,
      'http://www.w3.org/2004/02/skos/core#prefLabel',
      'http://www.w3.org/2004/02/skos/core#altLabel',
      'http://schema.org/name',
      'http://schema.org/description',
      'http://schema.org/email',
      'http://schema.org/url',
      'http://purl.org/dc/terms/title',
      'http://purl.org/dc/terms/description',
      'http://www.w3.org/2006/vcard/ns#hasEmail',
      'http://www.w3.org/2006/vcard/ns#hasURL',
      'http://xmlns.com/foaf/0.1/name',
      'http://xmlns.com/foaf/0.1/mbox'
    ]

    for (const property of propertiesToExtract) {
      const value =
        getStringNoLocale(thing, property) ||
        getStringWithLocale(thing, property) ||
        getUrl(thing, property)

      if (value) {
        properties[property] = value
      }
    }

    return properties
  }
}
