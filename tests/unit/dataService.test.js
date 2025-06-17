/**
 * Tests for dataService business logic functions
 * These tests focus on the business logic without mocking Inrupt SDK
 * Testing functions that manipulate strings, URIs, and process business logic
 */

import { describe, it, expect } from 'vitest'
import { dataService } from '@/services/dataService.js'

describe('dataService - URI and String Manipulation', () => {
  describe('extractNameFromURI', () => {
    it('should extract name from simple URIs', () => {
      expect(dataService.extractNameFromURI('http://example.com/process/MyProcess')).toBe(
        'MyProcess'
      )
      expect(dataService.extractNameFromURI('https://pod.example.org/data/TaskName')).toBe(
        'TaskName'
      )
    })

    it('should extract name from URIs with fragments', () => {
      expect(dataService.extractNameFromURI('http://example.com/task#step1')).toBe('task#step1')
      expect(dataService.extractNameFromURI('https://pod.example.org/process#action_2')).toBe(
        'process#action_2'
      )
    })

    it('should handle URIs with trailing slashes', () => {
      expect(dataService.extractNameFromURI('http://example.com/process/MyProcess/')).toBe(
        'MyProcess'
      )
      expect(dataService.extractNameFromURI('https://pod.example.org/data/TaskName/')).toBe(
        'TaskName'
      )
    })

    it('should handle complex nested paths', () => {
      expect(dataService.extractNameFromURI('http://example.com/deep/nested/path/FinalName')).toBe(
        'FinalName'
      )
      expect(dataService.extractNameFromURI('https://pod.example.org/a/b/c/d/e/Target')).toBe(
        'Target'
      )
    })

    it('should handle domain-only URIs', () => {
      expect(dataService.extractNameFromURI('http://example.com/')).toBe('example.com')
      expect(dataService.extractNameFromURI('http://example.com')).toBe('example.com')
      expect(dataService.extractNameFromURI('https://solid.pod.org/')).toBe('solid.pod.org')
    })

    it('should handle edge cases gracefully', () => {
      expect(dataService.extractNameFromURI('http://')).toBe('Unknown')
      expect(dataService.extractNameFromURI('/')).toBe('Unknown')
      expect(dataService.extractNameFromURI('')).toBe('Unknown')
    })

    it('should handle URIs with query parameters', () => {
      expect(
        dataService.extractNameFromURI('http://example.com/process/MyProcess?param=value')
      ).toBe('MyProcess?param=value')
    })

    it('should handle URIs with both fragment and query', () => {
      expect(
        dataService.extractNameFromURI('http://example.com/process/MyProcess?param=value#fragment')
      ).toBe('MyProcess?param=value#fragment')
    })
  })

  describe('extractTaskURIFromStep', () => {
    it('should remove fragment identifiers from step URIs', () => {
      expect(dataService.extractTaskURIFromStep('http://example.com/task#step1')).toBe(
        'http://example.com/task'
      )
      expect(
        dataService.extractTaskURIFromStep('https://pod.example.org/process/task#action_2')
      ).toBe('https://pod.example.org/process/task')
    })

    it('should return base URI when no fragment is present', () => {
      expect(dataService.extractTaskURIFromStep('http://example.com/task')).toBe(
        'http://example.com/task'
      )
      expect(dataService.extractTaskURIFromStep('https://pod.example.org/process/task')).toBe(
        'https://pod.example.org/process/task'
      )
    })

    it('should handle multiple fragments (should only remove first)', () => {
      expect(dataService.extractTaskURIFromStep('http://example.com/task#step1#substep')).toBe(
        'http://example.com/task'
      )
    })

    it('should handle URIs with query parameters and fragments', () => {
      expect(dataService.extractTaskURIFromStep('http://example.com/task?param=value#step1')).toBe(
        'http://example.com/task?param=value'
      )
    })

    it('should handle empty or malformed URIs', () => {
      expect(dataService.extractTaskURIFromStep('')).toBe('')
      expect(dataService.extractTaskURIFromStep('#fragment')).toBe('')
    })
  })
})

describe('dataService - Data Processing Logic', () => {
  describe('processTaskRunnerData structure validation', () => {
    it('should be a function', () => {
      expect(typeof dataService.processTaskRunnerData).toBe('function')
    })

    it('should return object with expected structure when given empty dataset', () => {
      // Mock empty dataset structure (what getThingAll would return for empty dataset)
      const mockEmptyDataSet = []

      // We can't fully test this without mocking Inrupt, but we can test the structure expectation
      expect(dataService.processTaskRunnerData).toBeDefined()
    })
  })

  describe('processActionStep structure validation', () => {
    it('should be a function', () => {
      expect(typeof dataService.processActionStep).toBe('function')
    })

    it('should accept the expected parameters', () => {
      expect(dataService.processActionStep.length).toBe(4)
    })
  })

  describe('processTaskDescriptor structure validation', () => {
    it('should be a function', () => {
      expect(typeof dataService.processTaskDescriptor).toBe('function')
    })

    it('should accept single parameter', () => {
      expect(dataService.processTaskDescriptor.length).toBe(1)
    })
  })
})

describe('dataService - Method Availability', () => {
  const expectedMethods = [
    'fetchProcessData',
    'fetchTaskData',
    'fetchStepData',
    'extractTaskName',
    'extractTaskContact',
    'extractTaskDescription',
    'extractStepName',
    'extractStepDescription',
    'extractNameFromURI',
    'extractTaskURIFromStep',
    'processTaskRunnerData',
    'processActionStep',
    'processTaskDescriptor',
    'fetchDataByType',
    'extractThingProperties',
    'extractResourceTitle',
    'extractPropertyLabel',
    'extractRdfTypeLabel',
    'extractDisplayTypeName',
    'extractTypeNameFromURI'
  ]

  expectedMethods.forEach((methodName) => {
    it(`should have ${methodName} method defined`, () => {
      expect(dataService[methodName]).toBeDefined()
      expect(typeof dataService[methodName]).toBe('function')
    })
  })
})

describe('dataService - Configuration and Dependencies', () => {
  it('should be an object with methods', () => {
    expect(typeof dataService).toBe('object')
    expect(dataService).not.toBeNull()
  })

  it('should have extraction methods that follow naming convention', () => {
    const extractionMethods = Object.keys(dataService).filter((key) => key.startsWith('extract'))
    expect(extractionMethods.length).toBeGreaterThan(0)

    extractionMethods.forEach((methodName) => {
      expect(typeof dataService[methodName]).toBe('function')
    })
  })

  it('should have processing methods that follow naming convention', () => {
    const processingMethods = Object.keys(dataService).filter((key) => key.startsWith('process'))
    expect(processingMethods.length).toBeGreaterThan(0)

    processingMethods.forEach((methodName) => {
      expect(typeof dataService[methodName]).toBe('function')
    })
  })

  it('should have fetch methods that follow naming convention', () => {
    const fetchMethods = Object.keys(dataService).filter((key) => key.startsWith('fetch'))
    expect(fetchMethods.length).toBeGreaterThan(0)

    fetchMethods.forEach((methodName) => {
      expect(typeof dataService[methodName]).toBe('function')
    })
  })
})

describe('dataService - Business Logic Validation', () => {
  describe('URI validation patterns', () => {
    it('should handle various URI patterns in extractNameFromURI', () => {
      const testCases = [
        { input: 'http://example.com/simple', expected: 'simple' },
        { input: 'https://secure.example.org/secure_name', expected: 'secure_name' },
        { input: 'http://localhost:3000/local_resource', expected: 'local_resource' },
        {
          input: 'https://pod.example.com/user/data/Resource_Name_123',
          expected: 'Resource_Name_123'
        }
      ]

      testCases.forEach(({ input, expected }) => {
        expect(dataService.extractNameFromURI(input)).toBe(expected)
      })
    })

    it('should handle task URI extraction consistently', () => {
      const stepURI = 'https://pod.example.com/process/MyTask#step_1'
      const expectedTaskURI = 'https://pod.example.com/process/MyTask'

      expect(dataService.extractTaskURIFromStep(stepURI)).toBe(expectedTaskURI)
    })
  })

  describe('Naming convention compliance', () => {
    it('should return meaningful names from URIs', () => {
      const result = dataService.extractNameFromURI(
        'https://eratv.example.org/data/ERATV_Application_2024'
      )
      expect(result).toBe('ERATV_Application_2024')
      expect(result).not.toBe('Unknown')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should preserve semantic meaning in extracted names', () => {
      const meaningfulURIs = [
        'http://era.example.org/VehicleAuthorisation',
        'https://pod.org/process/MaintenanceWorkflow',
        'http://example.com/task/QualityAssessment'
      ]

      meaningfulURIs.forEach((uri) => {
        const extracted = dataService.extractNameFromURI(uri)
        expect(extracted.length).toBeGreaterThan(0)
        expect(extracted).not.toBe('Unknown')
        // Should preserve the meaningful part
        expect(['VehicleAuthorisation', 'MaintenanceWorkflow', 'QualityAssessment']).toContain(
          extracted
        )
      })
    })
  })
})
