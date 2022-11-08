import { StructError } from "superstruct"
import appData from "../src/appData"
import inTestGroup from "../src/userTestGroups"

jest.mock("appData")

describe("User Test Groups API", () => {
  test("returns true if user is in test group", () => {
    const group_1 = "user-test-group-1"
    const group_2 = "user-test-group-2"
    ;(appData as jest.Mock).mockImplementation(() => ({
      userTestGroups: JSON.stringify([group_1, group_2]),
    }))

    expect(inTestGroup(group_1)).toBe(true)
    expect(inTestGroup(group_2)).toBe(true)
    expect(inTestGroup(group_1 + group_2)).toBe(false)
  })

  test.each([{}, { userTestGroup: undefined }])(
    "returns false if the test group information is not found: case %#",
    (mock) => {
      // Missing data key
      ;(appData as jest.Mock).mockImplementation(() => mock)

      expect(inTestGroup("non-existent-group")).toBe(false)
    }
  )

  test.each([
    // JSON.parse should throw when given invalid json
    { expectedError: SyntaxError, mockTestGroupData: "" },
    { expectedError: SyntaxError, mockTestGroupData: "test 1234 !@#$ []{}" },
    { expectedError: SyntaxError, mockTestGroupData: [1, 2, 3] },

    // Superstruct catches valid json but invalid types
    { expectedError: StructError, mockTestGroupData: null },
    { expectedError: StructError, mockTestGroupData: JSON.stringify(null) },
    { expectedError: StructError, mockTestGroupData: true },
    { expectedError: StructError, mockTestGroupData: JSON.stringify(true) },
    {
      expectedError: StructError,
      mockTestGroupData: JSON.stringify([1, 2, 3]),
    },
    {
      expectedError: StructError,
      mockTestGroupData: JSON.stringify({ irrelevant: "keys" }),
    },
  ])(
    "raise error when test group data is not the correct type: case %#",
    ({ mockTestGroupData, expectedError: expectedError }) => {
      ;(appData as jest.Mock).mockImplementationOnce(() => ({
        userTestGroups: mockTestGroupData,
      }))
      expect(() => inTestGroup("non-existent-test-group")).toThrowError(
        expectedError
      )
    }
  )
})
