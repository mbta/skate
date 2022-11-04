import { array, create, Infer, string } from "superstruct"
import appData from "./appData"

const TestGroups = array(string())
type TestGroups = Infer<typeof TestGroups>

const getTestGroups = (): string[] => {
  const testGroupsJson = appData()?.userTestGroups

  if (testGroupsJson === undefined) {
    return []
  }

  const testGroups = create(JSON.parse(testGroupsJson) as unknown, TestGroups)

  return testGroups
}

const inTestGroup = (key: string) => {
  return getTestGroups().includes(key)
}

export default inTestGroup
