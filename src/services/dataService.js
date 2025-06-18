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
import { RDF_CONFIG, EXTRACTION_PRIORITIES } from './rdfConfig.js'

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

      // Filter out shape files and other non-task resources
      // Filter out SHACL shape files and other non-task resources
      // TODO: this should better be based on these resources being of rdfs:type http://www.w3.org/ns/ldp#NonRDFSource
      const rdfTaskURIs = taskURIs.filter((uri) => {
        return !uri.endsWith('.ttl') && !uri.endsWith('.shacl')
      })

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
      const taskDescription = this.extractTaskDescription(taskThing) // Check for task steps/actions
      const allThings = getThingAll(taskDataSet)
      const stepThings = allThings.filter((thing) => {
        const types = getUrlAll(thing, RDF_CONFIG.ENTITY_TYPE)
        return types.includes(RDF_CONFIG.TYPES.ACTION)
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
        sequence: getInteger(stepThing, RDF_CONFIG.POSITION) || null,
        version: getInteger(stepThing, RDF_CONFIG.VERSION) || 0,
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
  } /**
   * Extract step name from step thing
   * @param {Object} stepThing - The step RDF thing
   * @param {string} stepURI - The step URI for fallback (optional)
   * @returns {string} Step name
   */,
  extractStepName(stepThing, stepURI = null) {
    // Use configurable property priorities for step name extraction
    let name = null

    for (const propertyUri of EXTRACTION_PRIORITIES.TITLE) {
      for (const lang of EXTRACTION_PRIORITIES.LANGUAGES) {
        name = getStringWithLocale(stepThing, propertyUri, lang)
        if (name) break
      }
      if (!name) {
        name = getStringNoLocale(stepThing, propertyUri)
      }
      if (name) break
    }

    return name || (stepURI ? stepURI.split('/').pop() : null) || 'Unnamed step'
  },
  /**
   * Extract step description from step thing
   * @param {Object} stepThing - The step RDF thing
   * @returns {string} Step description
   */
  extractStepDescription(stepThing) {
    // Use configurable property priorities for step description extraction
    let description = null

    for (const propertyUri of EXTRACTION_PRIORITIES.DESCRIPTION) {
      for (const lang of EXTRACTION_PRIORITIES.LANGUAGES) {
        description = getStringWithLocale(stepThing, propertyUri, lang)
        if (description) break
      }
      if (!description) {
        description = getStringNoLocale(stepThing, propertyUri)
      }
      if (description) break
    }

    return description || ''
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
   * @param {Set} versions - Versions set to update   * @param {Array} stepsList - Steps list to update
   * @param {Array} pointersList - Pointers list to update
   */
  processActionStep(step, versions, stepsList, pointersList) {
    try {
      const stepURI = asUrl(step)
      console.log('Processing action step:', stepURI)

      // Extract version
      let stepVersion = getInteger(step, RDF_CONFIG.VERSION) || 0
      if (!stepVersion) {
        console.warn('Step is missing schema:version property')
        stepVersion = 0
      }

      versions.add(stepVersion)

      // Extract next step pointer
      const nextStepURI = getUrl(step, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
      const isLastStep = nextStepURI === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'

      console.log(
        `Step ${stepURI}: version=${stepVersion}, nextStep=${nextStepURI}, isLast=${isLastStep}`
      )

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
   */ processTaskDescriptor(descriptor) {
    try {
      // Get first tasks in the sequence
      const firstTasks = getUrlAll(descriptor, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
      console.log('Task descriptor rdf:first pointers:', firstTasks)

      // Extract task metadata using the robust extraction method
      const taskName = this.extractTaskName(descriptor, asUrl(descriptor))
      const taskContact = this.extractTaskContact(descriptor)

      // Add starting points to pointers list
      const pointers = firstTasks.map((taskURI) => [null, taskURI, null])
      console.log('Created starting point pointers:', pointers)

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
            const properties = this.extractThingProperties(thing) // Get created/modified dates if available
            const created =
              getStringNoLocale(thing, RDF_CONFIG.CREATED_DATE) ||
              getStringNoLocale(thing, 'http://schema.org/dateCreated')
            const modified =
              getStringNoLocale(thing, RDF_CONFIG.MODIFIED_DATE) ||
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
  },

  /**
   * Extract resource title from thing properties with comprehensive fallbacks
   * @param {Object} resourceProperties - The resource properties object
   * @param {string} resourceURI - The resource URI for fallback
   * @returns {string} Resource title
   */
  extractResourceTitle(resourceProperties, resourceURI) {
    if (!resourceProperties) {
      return this.extractNameFromURI(resourceURI)
    }

    // Prioritize RDFS and SKOS label properties
    const titleProps = [
      'http://www.w3.org/2000/01/rdf-schema#label',
      'http://www.w3.org/2004/02/skos/core#prefLabel',
      'http://www.w3.org/2004/02/skos/core#altLabel',
      'http://schema.org/name',
      'http://purl.org/dc/terms/title',
      'http://xmlns.com/foaf/0.1/name'
    ]

    for (const prop of titleProps) {
      if (resourceProperties[prop]) {
        const value = resourceProperties[prop]
        return Array.isArray(value) ? value[0] : value
      }
    }

    // Fallback to extracting from URI
    return this.extractNameFromURI(resourceURI)
  },

  /**
   * Extract human-readable property label from property URI
   * @param {string} propertyURI - The property URI
   * @returns {string} Human-readable label
   */
  extractPropertyLabel(propertyURI) {
    const labelMap = {
      'http://www.w3.org/2000/01/rdf-schema#label': 'Label',
      'http://www.w3.org/2000/01/rdf-schema#comment': 'Description',
      'http://www.w3.org/2004/02/skos/core#prefLabel': 'Preferred Label',
      'http://www.w3.org/2004/02/skos/core#altLabel': 'Alternative Label',
      'http://schema.org/name': 'Name',
      'http://schema.org/description': 'Description',
      'http://schema.org/email': 'Email',
      'http://schema.org/url': 'URL',
      'http://purl.org/dc/terms/title': 'Title',
      'http://purl.org/dc/terms/description': 'Description',
      'http://www.w3.org/2006/vcard/ns#hasEmail': 'Email',
      'http://www.w3.org/2006/vcard/ns#hasURL': 'URL',
      'http://xmlns.com/foaf/0.1/name': 'Name',
      'http://xmlns.com/foaf/0.1/mbox': 'Email'
    }

    return labelMap[propertyURI] || propertyURI.split(/[#/]/).pop()
  },

  /**
   * Extract human-readable type name from RDF type URI
   * @param {string} rdfType - The RDF type URI
   * @returns {string} Human-readable type name
   */
  extractRdfTypeLabel(rdfType) {
    const typeMap = {
      'http://www.w3.org/ns/org#FormalOrganization': 'Formal Org',
      'http://www.w3.org/ns/org#Organization': 'Organization',
      'http://www.w3.org/ns/org#OrganizationalUnit': 'Unit',
      'http://www.w3.org/ns/org#Site': 'Site',
      'http://schema.org/Organization': 'Org',
      'http://schema.org/Place': 'Place',
      'http://xmlns.com/foaf/0.1/Organization': 'Org',
      'http://xmlns.com/foaf/0.1/Person': 'Person',
      'https://www.w3.org/ns/activitystreams#Article': 'Article'
    }

    const shortLabel = typeMap[rdfType]
    if (shortLabel) return shortLabel

    // Fallback to extracting class name from URI
    const parts = rdfType.split(/[#/]/)
    return parts[parts.length - 1] || 'Resource'
  },

  /**
   * Extract display type name for collections (pluralized)
   * @param {string} rdfType - The RDF type URI
   * @returns {string} Pluralized display name
   */
  extractDisplayTypeName(rdfType) {
    const typeMap = {
      'http://www.w3.org/ns/org#FormalOrganization': 'Organizations',
      'http://www.w3.org/ns/org#OrganizationalUnit': 'Units',
      'http://www.w3.org/ns/org#Site': 'Sites',
      'http://schema.org/Organization': 'Organizations',
      'http://schema.org/Place': 'Places',
      'http://xmlns.com/foaf/0.1/Organization': 'Organizations',
      'http://xmlns.com/foaf/0.1/Person': 'People'
    }

    return typeMap[rdfType] || this.extractTypeNameFromURI(rdfType)
  },
  /**
   * Extract class name from URI and pluralize
   * @param {string} uri - The URI to extract name from
   * @returns {string} Pluralized class name
   */
  extractTypeNameFromURI(uri) {
    const parts = uri.split(/[#/]/)
    const className = parts[parts.length - 1]
    return className ? className + 's' : 'Resources'
  },

  /**
   * Extract human-readable display text from an RDF Thing
   * Uses the same priority system as extractResourceTitle but works directly with RDF Things
   * @param {Thing} thing - The RDF Thing object from @inrupt/solid-client
   * @param {string} preferredProperty - Optional preferred property URI to try first
   * @returns {string} Human-readable display text
   */
  extractDisplayTextFromThing(thing, preferredProperty = null) {
    // Build priority list with preferred property first (if provided)
    const titleProps = [
      ...(preferredProperty ? [preferredProperty] : []),
      'http://www.w3.org/2000/01/rdf-schema#label',
      'http://www.w3.org/2004/02/skos/core#prefLabel',
      'http://www.w3.org/2004/02/skos/core#altLabel',
      'http://schema.org/name',
      'http://purl.org/dc/terms/title',
      'http://xmlns.com/foaf/0.1/name',
      'http://purl.org/dc/terms/identifier'
    ]

    // Try each property in order
    for (const prop of titleProps) {
      const value = getStringNoLocale(thing, prop) || getStringWithLocale(thing, prop)
      if (value) {
        return value
      }
    }

    // Fallback to extracting from Thing URI
    const thingURI = asUrl(thing)
    return this.extractNameFromURI(thingURI)
  },

  /**
   * Format RDF data for human-readable display
   * Converts RDF/JS dataset objects to readable Turtle-like format
   * @param {*} rdfData - The RDF data to format (can be string, RDF/JS dataset, etc.)
   * @returns {string} Formatted RDF data as string
   */
  formatRDFData(rdfData) {
    if (!rdfData) return 'No data available'

    try {
      // If it's already a string, return it as-is
      if (typeof rdfData === 'string') {
        return rdfData
      }

      // If it's an RDF/JS dataset object, extract the quads and format them
      if (typeof rdfData === 'object') {
        const quads = []

        // Check if it's an RDF/JS dataset with the match() method
        if (typeof rdfData.match === 'function') {
          // Use the standard RDF/JS dataset interface
          for (const quad of rdfData.match()) {
            quads.push(quad)
          }
        } else if (rdfData.quads) {
          // Handle case where quads are directly available
          quads.push(...rdfData.quads)
        } else if (Array.isArray(rdfData)) {
          // Handle case where it's already an array of quads
          quads.push(...rdfData)
        } else {
          // Try to extract from the internal structure
          console.log('Attempting to extract from complex RDF structure:', rdfData)
          return `Complex RDF Dataset Structure (${JSON.stringify(rdfData, null, 2).substring(0, 500)}...)`
        }

        if (quads.length > 0) {
          // Convert quads to Turtle-like format
          return quads
            .map((quad) => {
              const subject =
                quad.subject.termType === 'NamedNode'
                  ? `<${quad.subject.value}>`
                  : quad.subject.value
              const predicate =
                quad.predicate.termType === 'NamedNode'
                  ? `<${quad.predicate.value}>`
                  : quad.predicate.value
              let object
              if (quad.object.termType === 'NamedNode') {
                object = `<${quad.object.value}>`
              } else if (quad.object.termType === 'Literal') {
                const datatype = quad.object.datatype ? `^^<${quad.object.datatype.value}>` : ''
                const language = quad.object.language ? `@${quad.object.language}` : ''
                object = `"${quad.object.value}"${language}${datatype}`
              } else {
                object = quad.object.value
              }

              const graph = quad.graph && quad.graph.value ? ` # Graph: <${quad.graph.value}>` : ''
              return `${subject} ${predicate} ${object} .${graph}`
            })
            .join('\n')
        }

        // Fallback to JSON representation if no quads found
        return JSON.stringify(rdfData, null, 2)
      }

      return String(rdfData)
    } catch (error) {
      console.error('Error formatting RDF data:', error)
      return `Error formatting data: ${error.message}\n\nRaw data structure:\n${JSON.stringify(rdfData, null, 2).substring(0, 1000)}...`
    }
  }
}
