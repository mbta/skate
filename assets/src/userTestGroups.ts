import { array, create, Infer, string } from "superstruct"
import appData from "./appData"

const TestGroupStrings = array(string())
type TestGroupStrings = Infer<typeof TestGroupStrings>

const getTestGroups = (): string[] => {
  const testGroupsJson = appData()?.userTestGroups

  if (testGroupsJson === undefined) {
    return []
  }

  const testGroups = create(
    JSON.parse(testGroupsJson) as unknown,
    TestGroupStrings
  )

  return testGroups
}

export default getTestGroups
