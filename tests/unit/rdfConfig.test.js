/**
 * Tests for RDF Configuration utilities
 * These tests validate the centralized RDF property configuration
 */
import { describe, it, expect } from 'vitest'
import { RDF_CONFIG, EXTRACTION_PRIORITIES } from '@/services/rdfConfig'

describe('RDF Configuration', () => {
  describe('Property URIs', () => {
    it('should have all required entity type URIs', () => {
      expect(RDF_CONFIG.ENTITY_TYPE).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
      expect(RDF_CONFIG.TYPES).toBeDefined()
      expect(RDF_CONFIG.TYPES.TASK).toBe(
        'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Task'
      )
      expect(RDF_CONFIG.TYPES.ACTION).toBe(
        'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Action'
      )
    })

    it('should have description properties with fallback chain in EXTRACTION_PRIORITIES', () => {
      expect(EXTRACTION_PRIORITIES.DESCRIPTION).toBeDefined()
      expect(Array.isArray(EXTRACTION_PRIORITIES.DESCRIPTION)).toBe(true)
      expect(EXTRACTION_PRIORITIES.DESCRIPTION).toContain('http://purl.org/dc/terms/description')
      expect(EXTRACTION_PRIORITIES.DESCRIPTION).toContain(
        'http://purl.org/dc/elements/1.1/description'
      )
    })

    it('should have title properties with fallback chain in EXTRACTION_PRIORITIES', () => {
      expect(EXTRACTION_PRIORITIES.TITLE).toBeDefined()
      expect(Array.isArray(EXTRACTION_PRIORITIES.TITLE)).toBe(true)
      expect(EXTRACTION_PRIORITIES.TITLE).toContain('http://www.w3.org/2000/01/rdf-schema#label')
    })

    it('should have version and position properties', () => {
      expect(RDF_CONFIG.VERSION).toBe('http://schema.org/version')
      expect(RDF_CONFIG.POSITION).toBe('http://schema.org/position')
    })

    it('should have source reference property', () => {
      expect(RDF_CONFIG.SOURCE_REFERENCE).toBe('http://purl.org/dc/terms/source')
    })

    it('should have realizes property for resource targeting', () => {
      expect(RDF_CONFIG.REALIZES).toBe(
        'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#realizes'
      )
    })
  })

  describe('Extraction Priorities', () => {
    it('should have title extraction priorities defined', () => {
      expect(EXTRACTION_PRIORITIES.TITLE).toBeDefined()
      expect(Array.isArray(EXTRACTION_PRIORITIES.TITLE)).toBe(true)
      expect(EXTRACTION_PRIORITIES.TITLE.length).toBeGreaterThan(0)
    })

    it('should have description extraction priorities defined', () => {
      expect(EXTRACTION_PRIORITIES.DESCRIPTION).toBeDefined()
      expect(Array.isArray(EXTRACTION_PRIORITIES.DESCRIPTION)).toBe(true)
      expect(EXTRACTION_PRIORITIES.DESCRIPTION.length).toBeGreaterThan(0)
    })

    it('should have email extraction priorities defined', () => {
      expect(EXTRACTION_PRIORITIES.EMAIL).toBeDefined()
      expect(Array.isArray(EXTRACTION_PRIORITIES.EMAIL)).toBe(true)
    })
  })

  describe('Configuration Structure', () => {
    it('should have consistent property naming', () => {
      // All properties should be uppercase constants
      Object.keys(RDF_CONFIG).forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/)
      })
    })

    it('should have valid URI format for string properties', () => {
      const validateURI = (uri) => {
        return typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))
      }

      const checkProperty = (prop) => {
        if (typeof prop === 'string') {
          expect(validateURI(prop)).toBe(true)
        } else if (typeof prop === 'object' && prop !== null && !Array.isArray(prop)) {
          Object.values(prop).forEach(checkProperty)
        }
        // Skip arrays and other types for this test
      }

      // Test only top-level string properties
      Object.entries(RDF_CONFIG).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(validateURI(value)).toBe(true)
        } else if (key === 'TYPES') {
          Object.values(value).forEach(checkProperty)
        }
      })
    })
  })
})
