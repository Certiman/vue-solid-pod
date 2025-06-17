/**
 * Common vocabularies for standard RDF properties
 * Covers RDFS, Dublin Core (Terms & Elements), Schema.org, vCard, RDF, and LDP
 */

// RDF Schema vocabulary
const _RDFS_NAMESPACE = 'http://www.w3.org/2000/01/rdf-schema#'
const _RDFS_NS = (localName) => _RDFS_NAMESPACE + localName

export const RDFS = {
  PREFIX: 'rdfs',
  NAMESPACE: _RDFS_NAMESPACE,
  PREFIX_AND_NAMESPACE: { rdfs: _RDFS_NAMESPACE },
  NS: _RDFS_NS,
  label: _RDFS_NS('label'),
  comment: _RDFS_NS('comment'),
  seeAlso: _RDFS_NS('seeAlso'),
  isDefinedBy: _RDFS_NS('isDefinedBy')
}

// RDF vocabulary
const _RDF_NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const _RDF_NS = (localName) => _RDF_NAMESPACE + localName

export const RDF = {
  PREFIX: 'rdf',
  NAMESPACE: _RDF_NAMESPACE,
  PREFIX_AND_NAMESPACE: { rdf: _RDF_NAMESPACE },
  NS: _RDF_NS,
  type: _RDF_NS('type')
}

// Dublin Core Terms vocabulary
const _DCTERMS_NAMESPACE = 'http://purl.org/dc/terms/'
const _DCTERMS_NS = (localName) => _DCTERMS_NAMESPACE + localName

export const DCTERMS = {
  PREFIX: 'dcterms',
  NAMESPACE: _DCTERMS_NAMESPACE,
  PREFIX_AND_NAMESPACE: { dcterms: _DCTERMS_NAMESPACE },
  NS: _DCTERMS_NS,
  identifier: _DCTERMS_NS('identifier'),
  title: _DCTERMS_NS('title'),
  description: _DCTERMS_NS('description'),
  creator: _DCTERMS_NS('creator'),
  created: _DCTERMS_NS('created'),
  modified: _DCTERMS_NS('modified'),
  source: _DCTERMS_NS('source'),
  conformsTo: _DCTERMS_NS('conformsTo'),
  hasFormat: _DCTERMS_NS('hasFormat')
}

// Dublin Core Elements vocabulary
const _DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/'
const _DC_NS = (localName) => _DC_NAMESPACE + localName

export const DC = {
  PREFIX: 'dc',
  NAMESPACE: _DC_NAMESPACE,
  PREFIX_AND_NAMESPACE: { dc: _DC_NAMESPACE },
  NS: _DC_NS,
  title: _DC_NS('title'),
  description: _DC_NS('description'),
  creator: _DC_NS('creator'),
  identifier: _DC_NS('identifier')
}

// Schema.org vocabulary
const _SCHEMA_NAMESPACE = 'http://schema.org/'
const _SCHEMA_NS = (localName) => _SCHEMA_NAMESPACE + localName

export const SCHEMA = {
  PREFIX: 'schema',
  NAMESPACE: _SCHEMA_NAMESPACE,
  PREFIX_AND_NAMESPACE: { schema: _SCHEMA_NAMESPACE },
  NS: _SCHEMA_NS,
  name: _SCHEMA_NS('name'),
  description: _SCHEMA_NS('description'),
  email: _SCHEMA_NS('email'),
  url: _SCHEMA_NS('url'),
  version: _SCHEMA_NS('version'),
  position: _SCHEMA_NS('position')
}

// vCard vocabulary
const _VCARD_NAMESPACE = 'http://www.w3.org/2006/vcard/ns#'
const _VCARD_NS = (localName) => _VCARD_NAMESPACE + localName

export const VCARD = {
  PREFIX: 'vcard',
  NAMESPACE: _VCARD_NAMESPACE,
  PREFIX_AND_NAMESPACE: { vcard: _VCARD_NAMESPACE },
  NS: _VCARD_NS,
  hasEmail: _VCARD_NS('hasEmail'),
  hasURL: _VCARD_NS('hasURL'),
  hasContactInfo: _VCARD_NS('hasContactInfo')
}

// Linked Data Platform vocabulary
const _LDP_NAMESPACE = 'http://www.w3.org/ns/ldp#'
const _LDP_NS = (localName) => _LDP_NAMESPACE + localName

export const LDP = {
  PREFIX: 'ldp',
  NAMESPACE: _LDP_NAMESPACE,
  PREFIX_AND_NAMESPACE: { ldp: _LDP_NAMESPACE },
  NS: _LDP_NS,
  RDFSource: _LDP_NS('RDFSource')
}
