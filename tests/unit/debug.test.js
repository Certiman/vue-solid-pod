/**
 * Quick debug test to check what's available in VCARD
 */

import { describe, it, expect } from 'vitest'
import { RDF_CONFIG } from '@/services/rdfConfig.js'

describe('Debug RDF_CONFIG', () => {
  it('should log CONTACT_INFO value', () => {
    console.log('RDF_CONFIG.EMAIL:', RDF_CONFIG.EMAIL)
    console.log('RDF_CONFIG.CONTACT_INFO:', RDF_CONFIG.CONTACT_INFO)
    console.log('RDF_CONFIG.URL:', RDF_CONFIG.URL)

    // Test what we can actually verify
    expect(RDF_CONFIG.EMAIL).toBeDefined()
    expect(RDF_CONFIG.URL).toBeDefined()
  })
})
