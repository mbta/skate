import { jest, describe, test, expect } from "@jest/globals"
import { StructError } from "superstruct"
import appData from "../src/appData"
import getTestGroups from "../src/userTestGroups"

jest.mock("appData")

describe("getTestGroups", () => {
  test("returns all tests groups when properly formatted", () => {
    const group_1 = "user-test-group-1"
    const group_2 = "user-test-group-2"
    ;jest.mocked(appData).mockImplementation(() => ({
      userTestGroups: JSON.stringify([group_1, group_2]),
    }))

    expect(getTestGroups()).toEqual([group_1, group_2])
  })

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
      ;jest.mocked(appData).mockImplementationOnce(() => ({
        userTestGroups: mockTestGroupData,
      }))
      expect(() => getTestGroups()).toThrow(expectedError)
    }
  )
})
