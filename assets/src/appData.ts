const appData = (): DOMStringMap | undefined => {
  const dataEl = document.getElementById("app")

  if (!dataEl) {
    return undefined
  }

  return dataEl.dataset
}

export default appData
