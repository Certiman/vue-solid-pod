/**
 * Vitest setup file
 * This file is run before each test file
 */
import { vi, beforeEach, afterEach } from 'vitest'

// Mock fetch for Solid client operations
globalThis.fetch = vi.fn()

// Mock URL.createObjectURL for SHACL shape handling
globalThis.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
globalThis.URL.revokeObjectURL = vi.fn()

// Mock IntersectionObserver (used by some Vue components)
globalThis.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver (used by some Bootstrap components)
globalThis.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Console cleanup for cleaner test output
const originalError = console.error
const originalWarn = console.warn

beforeEach(() => {
  // Reset fetch mock before each test
  globalThis.fetch.mockClear()
  
  // Optionally suppress expected console warnings/errors
  console.error = (...args) => {
    const message = args[0]
    // Suppress known warnings that aren't relevant to tests
    if (typeof message === 'string' && message.includes('fetch')) {
      return
    }
    originalError(...args)
  }
  
  console.warn = (...args) => {
    const message = args[0]
    // Suppress known warnings
    if (typeof message === 'string' && message.includes('deprecated')) {
      return
    }
    originalWarn(...args)
  }
})

afterEach(() => {
  // Restore console functions
  console.error = originalError
  console.warn = originalWarn
  
  // Clear any timers
  vi.clearAllTimers()
})
