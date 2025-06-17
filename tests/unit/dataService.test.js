/**
 * Tests for Data Service - Pure Business Logic
 *
 * Testing our own utility functions without mocking external libraries.
 * Focus: URI parsing, string manipulation, data transformation logic.
 */
import { describe, it, expect } from 'vitest'
import { dataService } from '@/services/dataService'

describe('Data Service - Pure Business Logic', () => {
  describe('extractNameFromURI', () => {
    it('should extract name from simple path', () => {
      const result = dataService.extractNameFromURI('http://example.com/process/MyProcess')
      expect(result).toBe('MyProcess')
    })

    it('should extract last path segment (including hash)', () => {
      const result = dataService.extractNameFromURI('http://example.com/task#step1')
      expect(result).toBe('task#step1')
    })

    it('should handle complex paths', () => {
      const result = dataService.extractNameFromURI(
        'http://example.com/process/Organisation/addMember'
      )
      expect(result).toBe('addMember')
    })

    it('should handle URLs with trailing slashes', () => {
      const result = dataService.extractNameFromURI('http://example.com/process/MyProcess/')
      expect(result).toBe('MyProcess')
    })

    it('should return domain name for edge cases', () => {
      expect(dataService.extractNameFromURI('http://example.com/')).toBe('example.com')
      expect(dataService.extractNameFromURI('http://example.com')).toBe('example.com')
    })
  })

  describe('extractTaskURIFromStep', () => {
    it('should extract task URI from step URI with hash', () => {
      const stepURI = 'http://example.com/process/MyProcess/MyTask#step1'
      const result = dataService.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/process/MyProcess/MyTask')
    })

    it('should handle step URIs without hash', () => {
      const stepURI = 'http://example.com/process/MyProcess/MyTask'
      const result = dataService.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/process/MyProcess/MyTask')
    })

    it('should handle URIs with multiple hash fragments', () => {
      const stepURI = 'http://example.com/task#section#step1'
      const result = dataService.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/task')
    })
  })
})
