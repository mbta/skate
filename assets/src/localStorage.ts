export const saveState = (
  stateKey: string,
  state: object,
  persistedKeys: string[]
) => {
  const perstableState = filter(state, persistedKeys)
  const serializedState = JSON.stringify(perstableState)
  localStorage.setItem(stateKey, serializedState)
}

export const loadState = (stateKey: string): object | undefined => {
  const serializedState = localStorage.getItem(stateKey)

  if (serializedState === null) {
    return undefined
  }

  return JSON.parse(serializedState)
}

export const filter = (obj: object, allowedKeys: string[]): object =>
  keys(obj)
    .filter(key => allowedKeys.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})

function keys<O extends object>(obj: O): Array<keyof O> {
  return Object.keys(obj) as Array<keyof O>
}
