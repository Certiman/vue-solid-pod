/**
 * Mock implementations for Solid client operations
 */
import { vi } from 'vitest'

// Mock dataset structure
export const createMockDataset = (things = []) => ({
  graphs: {
    default: things.reduce((acc, thing) => {
      acc[thing.url] = thing
      return acc
    }, {})
  }
})

// Mock RDF thing structure
export const createMockThing = (url, predicates = {}) => ({
  url,
  predicates: {
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': [
      { object: { value: 'http://www.w3.org/2000/01/rdf-schema#Resource' } }
    ],
    ...predicates
  }
})

// Mock process thing
export const createMockProcessThing = (url, name = 'Test Process') => 
  createMockThing(url, {
    'http://www.w3.org/2000/01/rdf-schema#label': [
      { object: { value: name } }
    ],
    'http://purl.org/dc/terms/description': [
      { object: { value: `Description for ${name}` } }
    ]
  })

// Mock task thing
export const createMockTaskThing = (url, name = 'Test Task', stepCount = 2) => {
  const thing = createMockThing(url, {
    'http://www.w3.org/2000/01/rdf-schema#label': [
      { object: { value: name } }
    ],
    'http://purl.org/dc/terms/description': [
      { object: { value: `Description for ${name}` } }
    ],
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': [
      { object: { value: 'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Task' } }
    ]
  })
  
  return thing
}

// Mock step thing
export const createMockStepThing = (url, name = 'Test Step', version = 1, sequence = 1) =>
  createMockThing(url, {
    'http://www.w3.org/2000/01/rdf-schema#label': [
      { object: { value: name } }
    ],
    'http://purl.org/dc/terms/description': [
      { object: { value: `Description for ${name}` } }
    ],
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': [
      { object: { value: 'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Action' } }
    ],
    'http://schema.org/version': [
      { object: { value: version } }
    ],
    'http://schema.org/position': [
      { object: { value: sequence } }
    ]
  })

// Mock Solid client functions
export const mockSolidClient = {
  getSolidDataset: vi.fn(),
  getContainedResourceUrlAll: vi.fn(),
  getThing: vi.fn(),
  getThingAll: vi.fn(),
  getUrlAll: vi.fn(),
  getStringNoLocale: vi.fn(),
  getInteger: vi.fn(),
  getUrl: vi.fn(),
  asUrl: vi.fn(),
  saveSolidDatasetAt: vi.fn(),
  setThing: vi.fn(),
  createThing: vi.fn(),
  addUrl: vi.fn(),
  addStringNoLocale: vi.fn(),
  addInteger: vi.fn()
}

// Mock fetch implementation for Solid operations
export const createMockFetch = (responses = {}) => {
  return vi.fn((url, options) => {
    const response = responses[url] || responses['default']
    
    if (response) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(response.headers || {}),
        text: () => Promise.resolve(response.body || ''),
        json: () => Promise.resolve(response.json || {}),
        blob: () => Promise.resolve(new Blob([response.body || '']))
      })
    }
    
    return Promise.reject(new Error(`No mock response for ${url}`))
  })
}

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockSolidClient).forEach(mock => {
    if (typeof mock.mockReset === 'function') {
      mock.mockReset()
    }
  })
}
