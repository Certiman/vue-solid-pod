/**
 * Integration tests for RDFExtractor RDF Thing functions
 *
 * These test the business logic of the RDF extraction functions
 * without extensive mocking - just minimal stubs to verify behavior.
 */
import { describe, it, expect, vi } from 'vitest'
import { RDFExtractor } from '@/core/RDFExtractor'

// Minimal mocking - just return predictable values
vi.mock('@inrupt/solid-client', () => ({
  getStringNoLocale: vi.fn(),
  getStringWithLocale: vi.fn(),
  getUrl: vi.fn()
}))

vi.mock('@inrupt/vocab-common-rdf', () => ({
  RDFS: {
    label: 'http://www.w3.org/2000/01/rdf-schema#label',
    comment: 'http://www.w3.org/2000/01/rdf-schema#comment'
  },
  VCARD: {
    hasEmail: 'http://www.w3.org/2006/vcard/ns#hasEmail'
  }
}))

vi.mock('@/services/rdfConfig.js', () => ({
  EXTRACTION_PRIORITIES: {
    TITLE: ['http://www.w3.org/2000/01/rdf-schema#label'],
    DESCRIPTION: ['http://purl.org/dc/terms/description'],
    LANGUAGES: ['en-US', 'en']
  }
}))

import { getStringNoLocale, getStringWithLocale, getUrl } from '@inrupt/solid-client'

describe('RDFExtractor - RDF Thing Functions', () => {
  describe('extractTaskName - fallback logic', () => {
    it('should follow the correct fallback chain', () => {
      const mockThing = {}

      // Test that it tries comment first, then label, then URI
      getStringNoLocale.mockReturnValueOnce(null) // comment fails
      getStringWithLocale.mockReturnValue(null) // all language variants fail
      getStringNoLocale.mockReturnValueOnce('Task Label') // label succeeds

      const result = RDFExtractor.extractTaskName(mockThing, 'http://example.com/task')
      expect(result).toBe('Task Label')

      vi.clearAllMocks()
    })

    it('should fallback to URI when no RDF properties found', () => {
      const mockThing = {}

      getStringNoLocale.mockReturnValue(null)
      getStringWithLocale.mockReturnValue(null)

      const result = RDFExtractor.extractTaskName(mockThing, 'http://example.com/MyTask')
      expect(result).toBe('MyTask')
    })

    it('should return default when nothing available', () => {
      const mockThing = {}

      getStringNoLocale.mockReturnValue(null)
      getStringWithLocale.mockReturnValue(null)

      const result = RDFExtractor.extractTaskName(mockThing, null)
      expect(result).toBe('Unknown task name')
    })
  })

  describe('extractTaskContact - email extraction logic', () => {
    it('should try string first then URL', () => {
      const mockThing = {}

      getStringNoLocale.mockReturnValue('test@example.com')

      const result = RDFExtractor.extractTaskContact(mockThing)
      expect(result).toBe('test@example.com')
    })

    it('should fallback to URL when string not available', () => {
      const mockThing = {}

      getStringNoLocale.mockReturnValue(null)
      getUrl.mockReturnValue('mailto:test@example.com')

      const result = RDFExtractor.extractTaskContact(mockThing)
      expect(result).toBe('mailto:test@example.com')
    })

    it('should return empty when no contact found', () => {
      const mockThing = {}

      getStringNoLocale.mockReturnValue(null)
      getUrl.mockReturnValue(null)

      const result = RDFExtractor.extractTaskContact(mockThing)
      expect(result).toBe('')
    })
  })

  describe('extractTaskDescription - DC terms fallback', () => {
    it('should try dcterms first then dce', () => {
      const mockThing = {}

      getStringNoLocale
        .mockReturnValueOnce(null) // dcterms fails
        .mockReturnValueOnce('DCE Description') // dce succeeds

      const result = RDFExtractor.extractTaskDescription(mockThing)
      expect(result).toBe('DCE Description')
    })

    it('should return empty when no description found', () => {
      const mockThing = {}

      getStringNoLocale.mockReturnValue(null)

      const result = RDFExtractor.extractTaskDescription(mockThing)
      expect(result).toBe('')
    })
  })

  describe('extractResourceTitle - comprehensive fallbacks', () => {
    it('should extract from properties when available', () => {
      const properties = {
        'http://www.w3.org/2000/01/rdf-schema#label': 'Resource Label'
      }

      const result = RDFExtractor.extractResourceTitle(properties, 'http://example.com/resource')
      expect(result).toBe('Resource Label')
    })

    it('should handle array values', () => {
      const properties = {
        'http://www.w3.org/2000/01/rdf-schema#label': ['First Label', 'Second Label']
      }

      const result = RDFExtractor.extractResourceTitle(properties, 'http://example.com/resource')
      expect(result).toBe('First Label')
    })

    it('should fallback to URI when no properties', () => {
      const result = RDFExtractor.extractResourceTitle(null, 'http://example.com/MyResource')
      expect(result).toBe('MyResource')
    })

    it('should try property priority order', () => {
      const properties = {
        'http://schema.org/name': 'Schema Name',
        'http://www.w3.org/2000/01/rdf-schema#label': 'RDFS Label'
      }

      // Should prefer RDFS label over schema name based on priority order
      const result = RDFExtractor.extractResourceTitle(properties, 'http://example.com/resource')
      expect(result).toBe('RDFS Label')
    })
  })
})
