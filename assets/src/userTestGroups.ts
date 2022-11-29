import { array, create, Infer, string } from "superstruct"
import appData from "./appData"

const TestGroups = array(string())
type TestGroups = Infer<typeof TestGroups>

export const MAP_BETA_GROUP_NAME = "map-beta"

const getTestGroups = (): string[] => {
  const testGroupsJson = appData()?.userTestGroups

  if (testGroupsJson === undefined) {
    return []
  }

  const testGroups = create(JSON.parse(testGroupsJson) as unknown, TestGroups)

  return testGroups
}

const inTestGroup = (key: string): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
