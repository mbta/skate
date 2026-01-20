import { describe, test, expect } from "@jest/globals"
import { calculateMilesRemaining } from "../../src/models/stateOfCharge"

describe("calculateMilesRemaining", () => {
  test("calculates miles remaining based on 2x charge percentage", () => {
    expect(calculateMilesRemaining(100)).toEqual(200)
    expect(calculateMilesRemaining(80)).toEqual(160)
    expect(calculateMilesRemaining(81)).toEqual(162)
    expect(calculateMilesRemaining(41)).toEqual(82)
    expect(calculateMilesRemaining(4)).toEqual(8)
  })
})
