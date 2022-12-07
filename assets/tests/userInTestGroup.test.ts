import inTestGroup from "../src/userInTestGroup"
import getTestGroups from "../src/userTestGroups"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("inTestGroup", () => {
  test("returns true if user is in test group", () => {
    const group_1 = "user-test-group-1"
    const group_2 = "user-test-group-2"
    ;(getTestGroups as jest.Mock).mockReturnValue([group_1, group_2])

    expect(inTestGroup(group_1)).toBe(true)
    expect(inTestGroup(group_2)).toBe(true)
    expect(inTestGroup(group_1 + group_2)).toBe(false)
  })

  test("returns false if the test group information is not found", () => {
    // Missing data key
    ;(getTestGroups as jest.Mock).mockReturnValue(["a-test-group"])

    expect(inTestGroup("non-existent-group")).toBe(false)
  })
})
