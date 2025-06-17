/**
 * RDF Property Configuration
 *
 * This file centralizes RDF property URIs based on their LOGICAL PURPOSE
 * rather than their ontology structure. This allows the codebase to use
 * semantic names while being configurable to use different vocabularies.
 *
 * Users can modify the underlying property URIs to use different ontologies
 * without changing the application logic.
 */

// Import vocabulary definitions
import { DUL } from '@/vocabularies/DUL'
import { ERA } from '@/vocabularies/ERA'
// Import Inrupt's standard vocabulary definitions
import { RDFS, RDF, DCTERMS, SCHEMA_INRUPT, VCARD, LDP } from '@inrupt/vocab-common-rdf'

/**
 * Core Properties - Organized by logical purpose, leveraging vocabulary files
 */
export const RDF_CONFIG = {
  // Entity identification and basic metadata
  ENTITY_TYPE: RDF.type,
  IDENTIFIER: DCTERMS.identifier,
  TITLE: RDFS.label,
  NAME: SCHEMA_INRUPT.name,
  DESCRIPTION: DCTERMS.description,
  COMMENT: RDFS.comment, // Alternative metadata properties for broader compatibility
  TITLE_DC_ELEMENTS: 'http://purl.org/dc/elements/1.1/title',
  DESCRIPTION_DC_ELEMENTS: 'http://purl.org/dc/elements/1.1/description',
  DESCRIPTION_SCHEMA_ORG: SCHEMA_INRUPT.description,
  EMAIL_SCHEMA_ORG: SCHEMA_INRUPT.email,
  URL_SCHEMA_ORG: SCHEMA_INRUPT.url,
  // Versioning and lifecycle
  VERSION: 'http://schema.org/version', // Not available in Inrupt's SCHEMA_INRUPT
  CREATED_DATE: DCTERMS.created,
  MODIFIED_DATE: DCTERMS.modified,
  CREATOR: DCTERMS.creator,

  // Relationships and references
  SOURCE_REFERENCE: DCTERMS.source,
  CONFORMS_TO: DCTERMS.conformsTo,
  HAS_FORMAT: DCTERMS.hasFormat,
  REALIZES: DUL.realizes,

  // Contact and communication
  EMAIL: VCARD.hasEmail,
  CONTACT_INFO: VCARD.hasContactInfo,
  URL: VCARD.hasURL,

  // Structural and positional
  POSITION: 'http://schema.org/position', // Not available in Inrupt's SCHEMA_INRUPT
  SEQUENCE: 'http://schema.org/position', // Alias for sequence in lists

  // Entity types - Using vocabulary definitions
  TYPES: {
    RDF_SOURCE: LDP.RDFSource,
    ACTION: DUL.Action,
    TASK: DUL.Task,
    PROCESS: DUL.Process,
    WORKFLOW: DUL.Process, // Using Process as workflow for now
    ORGANIZATION: ERA.NS('OrgOrFormalOrgShape') // ERA-specific organization shape
  }
}

/**
 * Property extraction priorities
 * Define the order in which properties are checked when extracting values
 */
export const EXTRACTION_PRIORITIES = {
  // Title/Name extraction priority (in order of preference)
  TITLE: [RDF_CONFIG.NAME, RDF_CONFIG.TITLE, RDF_CONFIG.TITLE_DC_ELEMENTS, RDF_CONFIG.COMMENT],

  // Description extraction priority
  DESCRIPTION: [
    RDF_CONFIG.DESCRIPTION,
    RDF_CONFIG.DESCRIPTION_DC_ELEMENTS,
    RDF_CONFIG.COMMENT,
    RDF_CONFIG.DESCRIPTION_SCHEMA_ORG
  ],

  // Contact email extraction priority
  EMAIL: [RDF_CONFIG.EMAIL, RDF_CONFIG.EMAIL_SCHEMA_ORG],
  // URL extraction priority
  URL: [RDF_CONFIG.URL, RDF_CONFIG.URL_SCHEMA_ORG],

  // Language preference for multi-lingual properties
  LANGUAGES: ['en-US', 'en', 'fr', 'de', 'nl']
}

/**
 * SHACL Form Configuration
 * Configuration for SHACL form behavior and shape handling
 */
export const SHACL_CONFIG = {
  // Default shape subjects for different entity types
  STEP_FORM: {
    SHAPE_SUBJECT: RDF_CONFIG.TYPES.ACTION
  },

  TASK_FORM: {
    SHAPE_SUBJECT: RDF_CONFIG.TYPES.RDF_SOURCE
  },

  PROCESS_FORM: {
    SHAPE_SUBJECT: RDF_CONFIG.TYPES.WORKFLOW
  },

  ORGANIZATION_FORM: {
    SHAPE_SUBJECT: RDF_CONFIG.TYPES.ORGANIZATION
  },

  // Shape source property (where SHACL shape files are referenced)
  SHAPE_SOURCE_PROPERTY: RDF_CONFIG.SOURCE_REFERENCE,

  // Resource realization property (for step-to-resource mapping)
  RESOURCE_REALIZATION_PROPERTY: RDF_CONFIG.REALIZES
}

/**
 * Entity Processing Configuration
 * Specific configuration for different entity types
 */
export const ENTITY_CONFIG = {
  // Step processing configuration
  STEP: {
    REQUIRED_PROPERTIES: {
      TYPE: RDF_CONFIG.ENTITY_TYPE,
      TARGET_CLASS: RDF_CONFIG.TYPES.ACTION
    },
    OPTIONAL_PROPERTIES: {
      VERSION: RDF_CONFIG.VERSION,
      POSITION: RDF_CONFIG.POSITION,
      REALIZES: RDF_CONFIG.REALIZES,
      SOURCE: RDF_CONFIG.SOURCE_REFERENCE
    },
    DEFAULTS: {
      VERSION: 1,
      POSITION: null
    }
  },

  // Task processing configuration
  TASK: {
    REQUIRED_PROPERTIES: {
      TYPE: RDF_CONFIG.ENTITY_TYPE,
      TARGET_CLASS: RDF_CONFIG.TYPES.TASK
    },
    OPTIONAL_PROPERTIES: {
      DESCRIPTION: RDF_CONFIG.DESCRIPTION,
      EMAIL: RDF_CONFIG.EMAIL
    }
  },

  // Process processing configuration
  PROCESS: {
    REQUIRED_PROPERTIES: {
      TYPE: RDF_CONFIG.ENTITY_TYPE,
      TARGET_CLASS: RDF_CONFIG.TYPES.WORKFLOW
    },
    OPTIONAL_PROPERTIES: {
      VERSION: RDF_CONFIG.VERSION,
      DESCRIPTION: RDF_CONFIG.DESCRIPTION
    }
  }
}

/**
 * Utility functions for RDF configuration
 */
export const RDF_UTILS = {
  /**
   * Get property URI by semantic name
   * @param {string} semanticName - Semantic property name (e.g., 'IDENTIFIER', 'DESCRIPTION')
   * @returns {string} Property URI
   */
  getPropertyUri(semanticName) {
    if (RDF_CONFIG[semanticName]) {
      return RDF_CONFIG[semanticName]
    }
    throw new Error(`RDF property '${semanticName}' not found in configuration`)
  },

  /**
   * Get entity type URI by semantic name
   * @param {string} typeName - Semantic type name (e.g., 'ACTION', 'TASK')
   * @returns {string} Type URI
   */
  getTypeUri(typeName) {
    if (RDF_CONFIG.TYPES[typeName]) {
      return RDF_CONFIG.TYPES[typeName]
    }
    throw new Error(`RDF type '${typeName}' not found in configuration`)
  },

  /**
   * Check if a URI matches a configured property
   * @param {string} uri - URI to check
   * @param {string} semanticName - Semantic name to compare against
   * @returns {boolean} True if URIs match
   */
  isProperty(uri, semanticName) {
    try {
      return uri === this.getPropertyUri(semanticName)
    } catch {
      return false
    }
  },

  /**
   * Get extraction priority array for a property type
   * @param {string} propertyType - Property type (e.g., 'TITLE', 'DESCRIPTION')
   * @returns {Array} Array of property URIs in priority order
   */
  getExtractionPriority(propertyType) {
    return EXTRACTION_PRIORITIES[propertyType] || []
  }
}

export default RDF_CONFIG
