/**
 * Vitest setup file
 * Provides basic browser environment without mocking Inrupt SDK
 */

// Mock console methods for cleaner test output
const originalConsole = global.console
global.console = {
  ...originalConsole,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Basic global setup for jsdom environment
global.window = window
global.document = document

// Mock URL constructor for Node.js environment
if (typeof URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      if (base) {
        this.href = new URL(url, base).href
      } else {
        this.href = url
      }
    }
  }
}
