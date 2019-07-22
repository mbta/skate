import featureIsEnabled from "../src/laboratoryFeatures"

const testFeatures = {
  falseKey: false,
  trueKey: true,
}
jest.mock("../src/appData", () => ({
  __esModule: true,
  default: () => ({ laboratoryFeatures: JSON.stringify(testFeatures) }),
}))

describe("featureIsEnabled", () => {
  test("returns the value of the requested keey", () => {
    expect(featureIsEnabled("falseKey")).toEqual(false)
    expect(featureIsEnabled("trueKey")).toEqual(true)
  })

  test("returns undefined if the key isn't found", () => {
    expect(featureIsEnabled("undefinedKey")).toEqual(false)
  })
})
