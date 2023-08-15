import { jest, describe, test, expect } from "@jest/globals"
import featureIsEnabled from "../src/laboratoryFeatures"

const testFeatures = {
  falseKey: false,
  trueKey: true,
}
jest.mock("../src/appData", () => ({
  __esModule: true,
  default: jest
    .fn()
    // Implementation sequence matches
    .mockImplementationOnce(() => ({
      laboratoryFeatures: JSON.stringify(testFeatures),
    }))
    .mockImplementationOnce(() => ({
      laboratoryFeatures: JSON.stringify(testFeatures),
    }))
    .mockImplementationOnce(() => ({
      laboratoryFeatures: JSON.stringify(testFeatures),
    }))
    .mockImplementationOnce(() => ({
      laboratoryFeatures: JSON.stringify({ presets_tabs: false }),
    }))
    .mockImplementation(() => ({
      laboratoryFeatures: undefined,
    })),
}))

describe("featureIsEnabled", () => {
  test("returns the value of the requested key", () => {
    expect(featureIsEnabled("falseKey")).toEqual(false)
    expect(featureIsEnabled("trueKey")).toEqual(true)
  })

  test("returns false if the key isn't found", () => {
    expect(featureIsEnabled("undefinedKey")).toEqual(false)
  })

  test("returns false if the laboratory features data isn't found", () => {
    expect(featureIsEnabled("trueKey")).toEqual(false)
  })
})
