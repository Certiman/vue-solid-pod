/**
 * Vitest setup file - Minimal browser mocks
 */
import { vi } from 'vitest'

// Only mock browser APIs that are needed
global.fetch = vi.fn()
global.URL = URL
global.URLSearchParams = URLSearchParams

// Mock observers for component testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))
