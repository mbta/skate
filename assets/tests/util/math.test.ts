import { describe, test, expect } from "@jest/globals"
import { clamp } from "../../src/util/math"

describe("clamp", () => {
  test("when value is below minimum, returns minimum value", () => {
    expect(clamp(-11, -10, 0)).toBe(-10)
  })

  test("when value is above maximum, returns maximum value", () => {
    expect(clamp(11, 0, 10)).toBe(10)
  })

  test("when value is between minimum and maximum, returns value", () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
})
