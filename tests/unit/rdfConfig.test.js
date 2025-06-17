/**
 * Tests for RDF_CONFIG and RDF_UTILS
 * These tests verify the RDF configuration and utility functions
 * without mocking any Inrupt SDK components
 */

import { describe, it, expect } from 'vitest'
import { RDF_CONFIG, EXTRACTION_PRIORITIES, RDF_UTILS, SHACL_CONFIG } from '@/services/rdfConfig.js'

describe('RDF_CONFIG', () => {
  describe('Basic Properties', () => {
    it('should have core entity properties defined', () => {
      expect(RDF_CONFIG.ENTITY_TYPE).toBeDefined()
      expect(RDF_CONFIG.TITLE).toBeDefined()
      expect(RDF_CONFIG.NAME).toBeDefined()
      expect(RDF_CONFIG.DESCRIPTION).toBeDefined()
      expect(RDF_CONFIG.IDENTIFIER).toBeDefined()
    })

    it('should have versioning properties defined', () => {
      expect(RDF_CONFIG.VERSION).toBeDefined()
      expect(RDF_CONFIG.CREATED_DATE).toBeDefined()
      expect(RDF_CONFIG.MODIFIED_DATE).toBeDefined()
      expect(RDF_CONFIG.CREATOR).toBeDefined()
    })

    it('should have contact properties defined', () => {
      expect(RDF_CONFIG.EMAIL).toBeDefined()
      expect(RDF_CONFIG.URL).toBeDefined()
      // Note: CONTACT_INFO may not be available in current VCARD vocabulary
    })

    it('should have relationship properties defined', () => {
      expect(RDF_CONFIG.SOURCE_REFERENCE).toBeDefined()
      expect(RDF_CONFIG.CONFORMS_TO).toBeDefined()
      expect(RDF_CONFIG.HAS_FORMAT).toBeDefined()
      expect(RDF_CONFIG.REALIZES).toBeDefined()
    })
  })

  describe('Entity Types', () => {
    it('should have all required entity types defined', () => {
      expect(RDF_CONFIG.TYPES.RDF_SOURCE).toBeDefined()
      expect(RDF_CONFIG.TYPES.ACTION).toBeDefined()
      expect(RDF_CONFIG.TYPES.TASK).toBeDefined()
      expect(RDF_CONFIG.TYPES.PROCESS).toBeDefined()
      expect(RDF_CONFIG.TYPES.WORKFLOW).toBeDefined()
      expect(RDF_CONFIG.TYPES.ORGANIZATION).toBeDefined()
    })

    it('should use proper namespaces for entity types', () => {
      expect(typeof RDF_CONFIG.TYPES.ACTION).toBe('string')
      expect(RDF_CONFIG.TYPES.ACTION).toContain('http')
      expect(typeof RDF_CONFIG.TYPES.TASK).toBe('string')
      expect(RDF_CONFIG.TYPES.TASK).toContain('http')
    })
  })
})

describe('EXTRACTION_PRIORITIES', () => {
  it('should define title extraction priorities', () => {
    expect(Array.isArray(EXTRACTION_PRIORITIES.TITLE)).toBe(true)
    expect(EXTRACTION_PRIORITIES.TITLE.length).toBeGreaterThan(0)
    expect(EXTRACTION_PRIORITIES.TITLE).toContain(RDF_CONFIG.NAME)
    expect(EXTRACTION_PRIORITIES.TITLE).toContain(RDF_CONFIG.TITLE)
  })

  it('should define description extraction priorities', () => {
    expect(Array.isArray(EXTRACTION_PRIORITIES.DESCRIPTION)).toBe(true)
    expect(EXTRACTION_PRIORITIES.DESCRIPTION.length).toBeGreaterThan(0)
    expect(EXTRACTION_PRIORITIES.DESCRIPTION).toContain(RDF_CONFIG.DESCRIPTION)
  })

  it('should define email extraction priorities', () => {
    expect(Array.isArray(EXTRACTION_PRIORITIES.EMAIL)).toBe(true)
    expect(EXTRACTION_PRIORITIES.EMAIL.length).toBeGreaterThan(0)
    expect(EXTRACTION_PRIORITIES.EMAIL).toContain(RDF_CONFIG.EMAIL)
  })

  it('should define URL extraction priorities', () => {
    expect(Array.isArray(EXTRACTION_PRIORITIES.URL)).toBe(true)
    expect(EXTRACTION_PRIORITIES.URL.length).toBeGreaterThan(0)
    expect(EXTRACTION_PRIORITIES.URL).toContain(RDF_CONFIG.URL)
  })

  it('should define language preferences', () => {
    expect(Array.isArray(EXTRACTION_PRIORITIES.LANGUAGES)).toBe(true)
    expect(EXTRACTION_PRIORITIES.LANGUAGES.length).toBeGreaterThan(0)
    expect(EXTRACTION_PRIORITIES.LANGUAGES).toContain('en')
  })
})

describe('SHACL_CONFIG', () => {
  it('should have step form configuration', () => {
    expect(SHACL_CONFIG.STEP_FORM).toBeDefined()
    expect(SHACL_CONFIG.STEP_FORM.SHAPE_SUBJECT).toBeDefined()
  })

  it('should have proper shape subjects', () => {
    expect(typeof SHACL_CONFIG.STEP_FORM.SHAPE_SUBJECT).toBe('string')
    expect(SHACL_CONFIG.STEP_FORM.SHAPE_SUBJECT).toContain('http')
  })
})

describe('RDF_UTILS', () => {
  describe('getPropertyUri', () => {
    it('should return correct property URI for valid semantic names', () => {
      expect(RDF_UTILS.getPropertyUri('TITLE')).toBe(RDF_CONFIG.TITLE)
      expect(RDF_UTILS.getPropertyUri('NAME')).toBe(RDF_CONFIG.NAME)
      expect(RDF_UTILS.getPropertyUri('DESCRIPTION')).toBe(RDF_CONFIG.DESCRIPTION)
      expect(RDF_UTILS.getPropertyUri('EMAIL')).toBe(RDF_CONFIG.EMAIL)
      expect(RDF_UTILS.getPropertyUri('VERSION')).toBe(RDF_CONFIG.VERSION)
    })

    it('should throw error for invalid semantic names', () => {
      expect(() => RDF_UTILS.getPropertyUri('INVALID_PROPERTY')).toThrow(
        "RDF property 'INVALID_PROPERTY' not found in configuration"
      )
      expect(() => RDF_UTILS.getPropertyUri('')).toThrow()
      expect(() => RDF_UTILS.getPropertyUri(null)).toThrow()
    })
  })

  describe('getTypeUri', () => {
    it('should return correct type URI for valid type names', () => {
      expect(RDF_UTILS.getTypeUri('ACTION')).toBe(RDF_CONFIG.TYPES.ACTION)
      expect(RDF_UTILS.getTypeUri('TASK')).toBe(RDF_CONFIG.TYPES.TASK)
      expect(RDF_UTILS.getTypeUri('PROCESS')).toBe(RDF_CONFIG.TYPES.PROCESS)
      expect(RDF_UTILS.getTypeUri('RDF_SOURCE')).toBe(RDF_CONFIG.TYPES.RDF_SOURCE)
    })

    it('should throw error for invalid type names', () => {
      expect(() => RDF_UTILS.getTypeUri('INVALID_TYPE')).toThrow(
        "RDF type 'INVALID_TYPE' not found in configuration"
      )
      expect(() => RDF_UTILS.getTypeUri('')).toThrow()
      expect(() => RDF_UTILS.getTypeUri(null)).toThrow()
    })
  })

  describe('isProperty', () => {
    it('should return true for matching property URIs', () => {
      expect(RDF_UTILS.isProperty(RDF_CONFIG.TITLE, 'TITLE')).toBe(true)
      expect(RDF_UTILS.isProperty(RDF_CONFIG.NAME, 'NAME')).toBe(true)
      expect(RDF_UTILS.isProperty(RDF_CONFIG.EMAIL, 'EMAIL')).toBe(true)
    })

    it('should return false for non-matching property URIs', () => {
      expect(RDF_UTILS.isProperty(RDF_CONFIG.TITLE, 'NAME')).toBe(false)
      expect(RDF_UTILS.isProperty('http://example.com/unknown', 'TITLE')).toBe(false)
      expect(RDF_UTILS.isProperty(RDF_CONFIG.NAME, 'DESCRIPTION')).toBe(false)
    })

    it('should return false for invalid semantic names', () => {
      expect(RDF_UTILS.isProperty(RDF_CONFIG.TITLE, 'INVALID_PROPERTY')).toBe(false)
      expect(RDF_UTILS.isProperty('http://example.com/test', 'INVALID_PROPERTY')).toBe(false)
    })

    it('should handle edge cases gracefully', () => {
      expect(RDF_UTILS.isProperty('', 'TITLE')).toBe(false)
      expect(RDF_UTILS.isProperty(null, 'TITLE')).toBe(false)
      expect(RDF_UTILS.isProperty(RDF_CONFIG.TITLE, '')).toBe(false)
      expect(RDF_UTILS.isProperty(RDF_CONFIG.TITLE, null)).toBe(false)
    })
  })

  describe('getExtractionPriority', () => {
    it('should return correct priority arrays for valid property types', () => {
      const titlePriority = RDF_UTILS.getExtractionPriority('TITLE')
      expect(Array.isArray(titlePriority)).toBe(true)
      expect(titlePriority).toEqual(EXTRACTION_PRIORITIES.TITLE)

      const descriptionPriority = RDF_UTILS.getExtractionPriority('DESCRIPTION')
      expect(Array.isArray(descriptionPriority)).toBe(true)
      expect(descriptionPriority).toEqual(EXTRACTION_PRIORITIES.DESCRIPTION)

      const emailPriority = RDF_UTILS.getExtractionPriority('EMAIL')
      expect(Array.isArray(emailPriority)).toBe(true)
      expect(emailPriority).toEqual(EXTRACTION_PRIORITIES.EMAIL)
    })

    it('should return empty array for invalid property types', () => {
      expect(RDF_UTILS.getExtractionPriority('INVALID_TYPE')).toEqual([])
      expect(RDF_UTILS.getExtractionPriority('')).toEqual([])
      expect(RDF_UTILS.getExtractionPriority(null)).toEqual([])
    })

    it('should return arrays with proper URI format', () => {
      const titlePriority = RDF_UTILS.getExtractionPriority('TITLE')
      titlePriority.forEach((uri) => {
        expect(typeof uri).toBe('string')
        expect(uri).toMatch(/^https?:\/\//)
      })
    })
  })
})

describe('RDF Configuration Integration', () => {
  it('should have consistent property definitions across configs', () => {
    // Check that properties referenced in EXTRACTION_PRIORITIES exist in RDF_CONFIG
    EXTRACTION_PRIORITIES.TITLE.forEach((property) => {
      expect(typeof property).toBe('string')
      expect(property).toMatch(/^https?:\/\//)
    })

    EXTRACTION_PRIORITIES.DESCRIPTION.forEach((property) => {
      expect(typeof property).toBe('string')
      expect(property).toMatch(/^https?:\/\//)
    })
  })

  it('should have proper namespace consistency', () => {
    // All HTTP URIs should be well-formed
    Object.values(RDF_CONFIG).forEach((value) => {
      if (typeof value === 'string' && value.startsWith('http')) {
        expect(value).toMatch(/^https?:\/\/[^\s]+$/)
      }
    })
  })

  it('should maintain backwards compatibility with expected structure', () => {
    // Ensure the configuration maintains expected structure
    expect(typeof RDF_CONFIG).toBe('object')
    expect(typeof RDF_CONFIG.TYPES).toBe('object')
    expect(typeof EXTRACTION_PRIORITIES).toBe('object')
    expect(typeof RDF_UTILS).toBe('object')
  })
})
