import appData from "./appData"

function getTestGroups(): string[] {
  const groups = appData()?.userTestGroups
  const testGroups: string[] = groups === undefined ? [] : JSON.parse(groups)

  return testGroups
}

export default function inTestGroup(key: string) {
  return getTestGroups().includes(key)
}
