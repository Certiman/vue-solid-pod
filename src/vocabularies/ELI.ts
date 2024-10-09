// Very partial vocab for testing purposes
const _NAMESPACE = 'http://data.europa.eu/eli/ontology#'
const _NS = (localName: string): string => {
  return _NAMESPACE + localName
}

export const ELI = {
  PREFIX: 'eli',
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: { eli: 'http://data.europa.eu/eli/ontology#' },
  NS: _NS,

  // *****************
  // All the Classes.
  // *****************
  amends: _NS('amends'),
  repeals: _NS('repeals'),
  hasMember: _NS('has_member'),
  memberOf: _NS('is_member_of'),
  hasPart: _NS('has_part'),
  partOf: _NS('is_part_of'),
}