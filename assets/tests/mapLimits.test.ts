import { jest, describe, test, expect } from "@jest/globals"
import { StructError } from "superstruct"
import appData from "../src/appData"
import getMapLimits from "../src/mapLimits"

jest.mock("appData")

describe("getMapLimits", () => {
  test("returns map limits when properly formatted", () => {
    const limits = { north: 1, south: 2, east: 3, west: 4 }
    ;(appData as jest.Mock).mockImplementation(() => ({
      mapLimits: JSON.stringify(limits),
    }))

    expect(getMapLimits()).toEqual(limits)
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
      ;(appData as jest.Mock).mockImplementationOnce(() => ({
        mapLimits: mockTestGroupData,
      }))
      expect(() => getMapLimits()).toThrow(expectedError)
    }
  )
})
