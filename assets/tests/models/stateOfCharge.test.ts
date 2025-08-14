import { describe, test, expect } from "@jest/globals"
import { calculateMilesRemaining } from "../../src/models/stateOfCharge"

describe("calculateMilesRemaining", () => {
  test("calculates miles remaining based on 2x charge percentage", () => {
    expect(calculateMilesRemaining({ value: 100 })).toEqual(200)
    expect(calculateMilesRemaining({ value: 80 })).toEqual(160)
    expect(calculateMilesRemaining({ value: 81 })).toEqual(162)
    expect(calculateMilesRemaining({ value: 41 })).toEqual(82)
    expect(calculateMilesRemaining({ value: 4 })).toEqual(8)
  })
})
