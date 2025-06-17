/**
 * Tests for RDFExtractor - Pure Business Logic
 *
 * Testing our URI parsing and string manipulation logic.
 * No external library mocking - just testing our own code.
 */
import { describe, it, expect } from 'vitest'
import { RDFExtractor } from '@/core/RDFExtractor'

describe('RDFExtractor - Business Logic', () => {
  describe('extractNameFromURI', () => {
    it('should extract name from simple path', () => {
      const result = RDFExtractor.extractNameFromURI('http://example.com/process/MyProcess')
      expect(result).toBe('MyProcess')
    })

    it('should extract last path segment including hash', () => {
      const result = RDFExtractor.extractNameFromURI('http://example.com/task#step1')
      expect(result).toBe('task#step1')
    })

    it('should handle complex paths', () => {
      const result = RDFExtractor.extractNameFromURI(
        'http://example.com/process/Organisation/addMember'
      )
      expect(result).toBe('addMember')
    })

    it('should handle URLs with trailing slashes', () => {
      const result = RDFExtractor.extractNameFromURI('http://example.com/process/MyProcess/')
      expect(result).toBe('MyProcess')
    })

    it('should return domain name for minimal URIs', () => {
      expect(RDFExtractor.extractNameFromURI('http://example.com/')).toBe('example.com')
      expect(RDFExtractor.extractNameFromURI('http://example.com')).toBe('example.com')
    })

    it('should handle invalid inputs gracefully', () => {
      expect(RDFExtractor.extractNameFromURI('')).toBe('Unknown')
      expect(RDFExtractor.extractNameFromURI(null)).toBe('Unknown')
      expect(RDFExtractor.extractNameFromURI(undefined)).toBe('Unknown')
    })
  })

  describe('extractTaskURIFromStep', () => {
    it('should remove hash fragment from step URI', () => {
      const stepURI = 'http://example.com/process/MyProcess/MyTask#step1'
      const result = RDFExtractor.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/process/MyProcess/MyTask')
    })

    it('should handle URIs without hash fragments', () => {
      const stepURI = 'http://example.com/process/MyProcess/MyTask'
      const result = RDFExtractor.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/process/MyProcess/MyTask')
    })

    it('should handle URIs with multiple hash fragments', () => {
      const stepURI = 'http://example.com/task#section#step1'
      const result = RDFExtractor.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/task')
    })

    it('should handle invalid inputs gracefully', () => {
      expect(RDFExtractor.extractTaskURIFromStep('')).toBe('')
      expect(RDFExtractor.extractTaskURIFromStep(null)).toBe('')
      expect(RDFExtractor.extractTaskURIFromStep(undefined)).toBe('')
    })
  })

  describe('extractNameFromFragment', () => {
    it('should extract fragment name when hash present', () => {
      const result = RDFExtractor.extractNameFromFragment('http://example.com/task#step1')
      expect(result).toBe('step1')
    })

    it('should fallback to regular name extraction when no hash', () => {
      const result = RDFExtractor.extractNameFromFragment('http://example.com/process/MyTask')
      expect(result).toBe('MyTask')
    })

    it('should handle multiple hash fragments', () => {
      const result = RDFExtractor.extractNameFromFragment('http://example.com/task#section#step1')
      expect(result).toBe('step1')
    })

    it('should handle invalid inputs', () => {
      expect(RDFExtractor.extractNameFromFragment('')).toBe('Unknown')
      expect(RDFExtractor.extractNameFromFragment(null)).toBe('Unknown')
    })
  })

  describe('isValidResourceURI', () => {
    it('should validate correct URIs', () => {
      expect(RDFExtractor.isValidResourceURI('http://example.com/resource')).toBe(true)
      expect(RDFExtractor.isValidResourceURI('https://example.com/path/to/resource#fragment')).toBe(
        true
      )
    })

    it('should reject invalid URIs', () => {
      expect(RDFExtractor.isValidResourceURI('')).toBe(false)
      expect(RDFExtractor.isValidResourceURI('not-a-uri')).toBe(false)
      expect(RDFExtractor.isValidResourceURI(null)).toBe(false)
      expect(RDFExtractor.isValidResourceURI(undefined)).toBe(false)
    })
  })

  describe('extractBaseURI', () => {
    it('should remove fragment and query parameters', () => {
      const result = RDFExtractor.extractBaseURI('http://example.com/resource#fragment?param=value')
      expect(result).toBe('http://example.com/resource')
    })

    it('should handle URIs with only fragments', () => {
      const result = RDFExtractor.extractBaseURI('http://example.com/resource#fragment')
      expect(result).toBe('http://example.com/resource')
    })

    it('should handle URIs with only query parameters', () => {
      const result = RDFExtractor.extractBaseURI('http://example.com/resource?param=value')
      expect(result).toBe('http://example.com/resource')
    })

    it('should handle clean URIs', () => {
      const result = RDFExtractor.extractBaseURI('http://example.com/resource')
      expect(result).toBe('http://example.com/resource')
    })

    it('should handle invalid inputs', () => {
      expect(RDFExtractor.extractBaseURI('')).toBe('')
      expect(RDFExtractor.extractBaseURI(null)).toBe('')
    })
  })

  describe('extractPropertyLabel', () => {
    it('should return known property labels', () => {
      expect(RDFExtractor.extractPropertyLabel('http://www.w3.org/2000/01/rdf-schema#label')).toBe('Label')
      expect(RDFExtractor.extractPropertyLabel('http://schema.org/name')).toBe('Name')
      expect(RDFExtractor.extractPropertyLabel('http://purl.org/dc/terms/title')).toBe('Title')
    })

    it('should extract name from unknown property URIs', () => {
      expect(RDFExtractor.extractPropertyLabel('http://example.org/customProperty')).toBe('customProperty')
      expect(RDFExtractor.extractPropertyLabel('http://example.org/namespace#property')).toBe('property')
    })
  })

  describe('extractRdfTypeLabel', () => {
    it('should return known type labels', () => {
      expect(RDFExtractor.extractRdfTypeLabel('http://www.w3.org/ns/org#Organization')).toBe('Organization')
      expect(RDFExtractor.extractRdfTypeLabel('http://xmlns.com/foaf/0.1/Person')).toBe('Person')
      expect(RDFExtractor.extractRdfTypeLabel('http://schema.org/Place')).toBe('Place')
    })

    it('should extract class name from unknown type URIs', () => {
      expect(RDFExtractor.extractRdfTypeLabel('http://example.org/CustomType')).toBe('CustomType')
      expect(RDFExtractor.extractRdfTypeLabel('http://example.org/namespace#MyClass')).toBe('MyClass')
    })

    it('should handle edge cases', () => {
      expect(RDFExtractor.extractRdfTypeLabel('')).toBe('Resource')
      expect(RDFExtractor.extractRdfTypeLabel('http://example.org/')).toBe('Resource')
    })
  })

  describe('extractDisplayTypeName', () => {
    it('should return pluralized known types', () => {
      expect(RDFExtractor.extractDisplayTypeName('http://www.w3.org/ns/org#Organization')).toBe('Organizations')
      expect(RDFExtractor.extractDisplayTypeName('http://xmlns.com/foaf/0.1/Person')).toBe('People')
      expect(RDFExtractor.extractDisplayTypeName('http://schema.org/Place')).toBe('Places')
    })

    it('should pluralize unknown types', () => {
      expect(RDFExtractor.extractDisplayTypeName('http://example.org/Book')).toBe('Books')
      expect(RDFExtractor.extractDisplayTypeName('http://example.org/namespace#Article')).toBe('Articles')
    })
  })

  describe('extractTypeNameFromURI', () => {
    it('should extract and pluralize class names', () => {
      expect(RDFExtractor.extractTypeNameFromURI('http://example.org/Book')).toBe('Books')
      expect(RDFExtractor.extractTypeNameFromURI('http://example.org/namespace#Article')).toBe('Articles')
      expect(RDFExtractor.extractTypeNameFromURI('http://schema.org/Event')).toBe('Events')
    })

    it('should handle edge cases', () => {
      expect(RDFExtractor.extractTypeNameFromURI('')).toBe('Resources')
      expect(RDFExtractor.extractTypeNameFromURI('http://example.org/')).toBe('Resources')
    })
  })
})
