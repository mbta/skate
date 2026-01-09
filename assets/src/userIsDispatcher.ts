import appData from './appData'

const isDispatcher = (): boolean => {
  const data = appData()

  if (!data) {
    return false
  }

  return data.dispatcherFlag === "true"
}

export default isDispatcher
