/**
 * RDFExtractor - Centralized business logic for extracting data from RDF
 *
 * This class consolidates all extraction logic from dataService, providing
 * a complete layer for property extraction, URI manipulation, and fallback chains.
 */
import { getStringNoLocale, getStringWithLocale, getUrl } from '@inrupt/solid-client'
import { RDFS, VCARD } from '@inrupt/vocab-common-rdf'
import { EXTRACTION_PRIORITIES } from '@/services/rdfConfig.js'

export class RDFExtractor {
  /**
   * Extract name from URI using our business rules
   * - Takes the last path segment
   * - Includes hash fragments as part of the name
   * - Falls back to second-to-last segment if last is empty
   *
   * @param {string} uri - The URI to extract name from
   * @returns {string} Extracted name
   */
  static extractNameFromURI(uri) {
    if (!uri || typeof uri !== 'string') {
      return 'Unknown'
    }

    const parts = uri.split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown'
  }

  /**
   * Extract task URI from step URI by removing hash fragment
   *
   * @param {string} stepURI - The step URI
   * @returns {string} Task URI
   */
  static extractTaskURIFromStep(stepURI) {
    if (!stepURI || typeof stepURI !== 'string') {
      return ''
    }

    // Remove fragment identifier if present
    const baseURI = stepURI.split('#')[0]
    return baseURI
  }

  /**
   * Extract name from hash fragment specifically
   *
   * @param {string} uri - URI that may contain hash fragment
   * @returns {string} Fragment name or fallback
   */
  static extractNameFromFragment(uri) {
    if (!uri || typeof uri !== 'string') {
      return 'Unknown'
    }

    if (uri.includes('#')) {
      const fragment = uri.split('#').pop()
      if (fragment) return fragment
    }

    // Fallback to regular name extraction
    return this.extractNameFromURI(uri)
  }

  /**
   * Validate if a URI has the expected structure for our app
   *
   * @param {string} uri - URI to validate
   * @returns {boolean} True if URI structure is valid
   */
  static isValidResourceURI(uri) {
    if (!uri || typeof uri !== 'string') {
      return false
    }

    try {
      new URL(uri)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extract base URI (protocol + host + path, no fragment)
   *
   * @param {string} uri - Full URI
   * @returns {string} Base URI
   */
  static extractBaseURI(uri) {
    if (!uri || typeof uri !== 'string') {
      return ''
    }

    return uri.split('#')[0].split('?')[0]
  }

  /**
   * Extract task name from RDF thing with comprehensive fallback chain
   * @param {Object} taskThing - The task RDF thing
   * @param {string} taskURI - The task URI for fallback
   * @returns {string} Task name
   */
  static extractTaskName(taskThing, taskURI) {
    return (
      getStringNoLocale(taskThing, RDFS.comment) ||
      getStringWithLocale(taskThing, RDFS.comment, 'en-US') ||
      getStringWithLocale(taskThing, RDFS.comment, 'en') ||
      getStringNoLocale(taskThing, RDFS.label) ||
      getStringWithLocale(taskThing, RDFS.label, 'en-US') ||
      getStringWithLocale(taskThing, RDFS.label, 'en') ||
      (taskURI ? taskURI.split('/').pop() : null) ||
      'Unknown task name'
    )
  }

  /**
   * Extract task contact information
   * @param {Object} taskThing - The task RDF thing
   * @returns {string} Contact information
   */
  static extractTaskContact(taskThing) {
    return getStringNoLocale(taskThing, VCARD.hasEmail) || getUrl(taskThing, VCARD.hasEmail) || ''
  }

  /**
   * Extract task description with DC terms fallback
   * @param {Object} taskThing - The task RDF thing
   * @returns {string} Task description
   */
  static extractTaskDescription(taskThing) {
    return (
      getStringNoLocale(taskThing, 'http://purl.org/dc/terms/description') ||
      getStringNoLocale(taskThing, 'http://purl.org/dc/elements/1.1/description') ||
      ''
    )
  }

  /**
   * Extract step name using configurable property priorities
   * @param {Object} stepThing - The step RDF thing
   * @param {string} stepURI - The step URI for fallback (optional)
   * @returns {string} Step name
   */
  static extractStepName(stepThing, stepURI = null) {
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
  }

  /**
   * Extract step description using configurable property priorities
   * @param {Object} stepThing - The step RDF thing
   * @returns {string} Step description
   */
  static extractStepDescription(stepThing) {
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
  }

  /**
   * Extract properties from a Thing for display
   * @param {Object} thing - The RDF thing
   * @returns {Object} Properties object
   */
  static extractThingProperties(thing) {
    const properties = {}
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

  /**
   * Extract resource title with comprehensive fallbacks
   * @param {Object} resourceProperties - The resource properties object
   * @param {string} resourceURI - The resource URI for fallback
   * @returns {string} Resource title
   */
  static extractResourceTitle(resourceProperties, resourceURI) {
    if (!resourceProperties) {
      return this.extractNameFromURI(resourceURI)
    }

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

    return this.extractNameFromURI(resourceURI)
  }

  /**
   * Extract human-readable property label from property URI
   * @param {string} propertyURI - The property URI
   * @returns {string} Human-readable label
   */
  static extractPropertyLabel(propertyURI) {
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
  }

  /**
   * Extract human-readable type name from RDF type URI
   * @param {string} rdfType - The RDF type URI
   * @returns {string} Human-readable type name
   */
  static extractRdfTypeLabel(rdfType) {
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
  }

  /**
   * Extract display type name for collections (pluralized)
   * @param {string} rdfType - The RDF type URI
   * @returns {string} Pluralized display name
   */
  static extractDisplayTypeName(rdfType) {
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
  }

  /**
   * Extract class name from URI and pluralize
   * @param {string} uri - The URI to extract name from
   * @returns {string} Pluralized class name
   */
  static extractTypeNameFromURI(uri) {
    const parts = uri.split(/[#/]/)
    const className = parts[parts.length - 1]
    return className ? className + 's' : 'Resources'
  }
}

// Export singleton for convenience
export const rdfExtractor = new RDFExtractor()
