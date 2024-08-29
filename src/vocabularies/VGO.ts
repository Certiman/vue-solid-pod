// Very partial vocab for testing purposes
const _NAMESPACE = 'http://vocab.linkeddata.es/vgo/#'
const _NS = (localName: string): string => {
  return _NAMESPACE + localName
}

export const VGO = {
  PREFIX: 'vgo',
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: { vgo: 'http://vocab.linkeddata.es/vgo/#' },
  NS: _NS,

  // *****************
  // All the Classes.
  // *****************
  Player: _NS('Player'),
  username: _NS('username'),
  hasItem: _NS('hasItem')
}