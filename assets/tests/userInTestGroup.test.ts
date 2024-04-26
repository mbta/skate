import { jest, describe, test, expect } from "@jest/globals"
import inTestGroup, { TestGroups } from "../src/userInTestGroup"
import getTestGroups from "../src/userTestGroups"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("inTestGroup", () => {
  test("returns true if user is in test group", () => {
    const group_1 = "user-test-group-1"
    const group_2 = "user-test-group-2"
    jest.mocked(getTestGroups).mockReturnValue([group_1, group_2])

    expect(inTestGroup(group_1 as TestGroups)).toBe(true)
    expect(inTestGroup(group_2 as TestGroups)).toBe(true)
    expect(inTestGroup((group_1 + group_2) as TestGroups)).toBe(false)
  })

  test("returns false if the test group information is not found", () => {
    // Missing data key
    jest.mocked(getTestGroups).mockReturnValue(["a-test-group"])

    expect(inTestGroup("non-existent-group" as TestGroups)).toBe(false)
  })
})
