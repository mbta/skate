export const saveState = (stateKey: string, state: object) => {
  const serializedState = JSON.stringify(state)
  localStorage.setItem(stateKey, serializedState)
}

export const loadState = (stateKey: string): object | undefined => {
  const serializedState = localStorage.getItem(stateKey)

  if (serializedState === null) {
    return undefined
  }

  return JSON.parse(serializedState)
}
