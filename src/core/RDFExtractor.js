/**
 * RDFExtractor - Centralized business logic for extracting data from RDF
 * 
 * This class consolidates the URI parsing and string manipulation logic
 * that was scattered across the dataService. It focuses on our business
 * logic, not on testing the Inrupt library functions.
 */

export class RDFExtractor {
  /**
   * Extract name from URI using our business rules
   * - Takes the last path segment
   * - Includes hash fragments as part of the name
   * - Falls back to second-to-last segment if last is empty
   * 
   * @param {string} uri - The URI to extract name from
   * @returns {string} Extracted name
   */
  static extractNameFromURI(uri) {
    if (!uri || typeof uri !== 'string') {
      return 'Unknown'
    }
    
    const parts = uri.split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown'
  }

  /**
   * Extract task URI from step URI by removing hash fragment
   * 
   * @param {string} stepURI - The step URI  
   * @returns {string} Task URI
   */
  static extractTaskURIFromStep(stepURI) {
    if (!stepURI || typeof stepURI !== 'string') {
      return ''
    }
    
    // Remove fragment identifier if present
    const baseURI = stepURI.split('#')[0]
    return baseURI
  }

  /**
   * Extract name from hash fragment specifically
   * 
   * @param {string} uri - URI that may contain hash fragment
   * @returns {string} Fragment name or fallback
   */
  static extractNameFromFragment(uri) {
    if (!uri || typeof uri !== 'string') {
      return 'Unknown'
    }
    
    if (uri.includes('#')) {
      const fragment = uri.split('#').pop()
      if (fragment) return fragment
    }
    
    // Fallback to regular name extraction
    return this.extractNameFromURI(uri)
  }

  /**
   * Validate if a URI has the expected structure for our app
   * 
   * @param {string} uri - URI to validate
   * @returns {boolean} True if URI structure is valid
   */
  static isValidResourceURI(uri) {
    if (!uri || typeof uri !== 'string') {
      return false
    }
    
    try {
      new URL(uri)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extract base URI (protocol + host + path, no fragment)
   * 
   * @param {string} uri - Full URI
   * @returns {string} Base URI
   */
  static extractBaseURI(uri) {
    if (!uri || typeof uri !== 'string') {
      return ''
    }
    
    return uri.split('#')[0].split('?')[0]
  }
}

// Export singleton for convenience
export const rdfExtractor = new RDFExtractor()
