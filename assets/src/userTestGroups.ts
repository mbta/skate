import appData from "./appData"

const getTestGroups = (): string[] => {
  const groups = appData()?.userTestGroups
  const testGroups: string[] = groups === undefined ? [] : JSON.parse(groups)

  return testGroups
}

const inTestGroup = (key: string) => {
  return getTestGroups().includes(key)
}

export default inTestGroup
