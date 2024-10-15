// Very partial vocab for PoC purposes
const _NAMESPACE = 'http://data.europa.eu/949/'
const _NS = (localName: string): string => {
  return _NAMESPACE + localName
}

export const ERA = {
  PREFIX: 'era',
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: { era: 'http://data.europa.eu/949/' },
  NS: _NS,
}