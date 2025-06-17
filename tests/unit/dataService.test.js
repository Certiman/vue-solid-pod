/**
 * Tests for Data Service utilities
 * These tests validate the existing data extraction and processing logic
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataService } from '@/services/dataService'
import { 
  createMockThing, 
  createMockTaskThing, 
  createMockStepThing 
} from '../mocks/solidClient'

describe('Data Service', () => {
  describe('extractTaskName', () => {
    it('should extract rdfs:label as primary source', () => {
      const taskThing = createMockTaskThing('http://example.com/task1', 'My Task')
      const result = dataService.extractTaskName(taskThing)
      expect(result).toBe('My Task')
    })

    it('should fallback to URI fragment when no properties available', () => {
      const taskThing = createMockThing('http://example.com/process/MyProcess/MyTask')
      const result = dataService.extractTaskName(taskThing, 'http://example.com/process/MyProcess/MyTask')
      expect(result).toBe('MyTask')
    })

    it('should handle URLs with hash fragments', () => {
      const taskThing = createMockThing('http://example.com/task#step1')
      const result = dataService.extractTaskName(taskThing, 'http://example.com/task#step1')
      expect(result).toBe('step1')
    })

    it('should handle missing URI gracefully', () => {
      const taskThing = createMockThing('http://example.com/task')
      const result = dataService.extractTaskName(taskThing)
      expect(result).toBe('Unknown Task')
    })
  })

  describe('extractStepName', () => {
    it('should extract rdfs:label as primary source', () => {
      const stepThing = createMockStepThing('http://example.com/step1', 'My Step')
      const result = dataService.extractStepName(stepThing)
      expect(result).toBe('My Step')
    })

    it('should fallback to URI extraction', () => {
      const stepThing = createMockThing('http://example.com/task#myStep')
      const result = dataService.extractStepName(stepThing, 'http://example.com/task#myStep')
      expect(result).toBe('myStep')
    })
  })

  describe('extractTaskDescription', () => {
    it('should extract description from dcterms:description first', () => {
      const taskThing = createMockThing('http://example.com/task', {
        'http://purl.org/dc/terms/description': [
          { object: { value: 'DCTerms description' } }
        ],
        'http://purl.org/dc/elements/1.1/description': [
          { object: { value: 'DCElements description' } }
        ]
      })
      
      const result = dataService.extractTaskDescription(taskThing)
      expect(result).toBe('DCTerms description')
    })

    it('should fallback to dce:description', () => {
      const taskThing = createMockThing('http://example.com/task', {
        'http://purl.org/dc/elements/1.1/description': [
          { object: { value: 'DCElements description' } }
        ]
      })
      
      const result = dataService.extractTaskDescription(taskThing)
      expect(result).toBe('DCElements description')
    })

    it('should return default when no description found', () => {
      const taskThing = createMockThing('http://example.com/task')
      const result = dataService.extractTaskDescription(taskThing)
      expect(result).toBe('No description available')
    })
  })

  describe('extractNameFromURI', () => {
    it('should extract name from simple path', () => {
      const result = dataService.extractNameFromURI('http://example.com/process/MyProcess')
      expect(result).toBe('MyProcess')
    })

    it('should extract name from hash fragment', () => {
      const result = dataService.extractNameFromURI('http://example.com/task#step1')
      expect(result).toBe('step1')
    })

    it('should handle complex paths', () => {
      const result = dataService.extractNameFromURI('http://example.com/process/Organisation/addMember')
      expect(result).toBe('addMember')
    })

    it('should handle URLs with trailing slashes', () => {
      const result = dataService.extractNameFromURI('http://example.com/process/MyProcess/')
      expect(result).toBe('MyProcess')
    })

    it('should return fallback for invalid URIs', () => {
      const result = dataService.extractNameFromURI('')
      expect(result).toBe('Unknown')
    })
  })

  describe('extractTaskURIFromStep', () => {
    it('should extract task URI from step URI with hash', () => {
      const stepURI = 'http://example.com/process/MyProcess/MyTask#step1'
      const result = dataService.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/process/MyProcess/MyTask')
    })

    it('should handle step URIs without hash', () => {
      const stepURI = 'http://example.com/process/MyProcess/MyTask/step1'
      const result = dataService.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/process/MyProcess/MyTask')
    })

    it('should return original URI if no clear task pattern', () => {
      const stepURI = 'http://example.com/somethingelse'
      const result = dataService.extractTaskURIFromStep(stepURI)
      expect(result).toBe('http://example.com/somethingelse')
    })
  })
})
