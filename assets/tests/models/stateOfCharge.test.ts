import { describe, test, expect } from "@jest/globals"
import {
  calculateMilesRemaining,
  calculatePercent,
} from "../../src/models/stateOfCharge"

describe("calculatePercent", () => {
  test("converts millipercent value to a whole number", () => {
    expect(calculatePercent({ value: 100000 })).toEqual(100)
    expect(calculatePercent({ value: 80350 })).toEqual(80)
    expect(calculatePercent({ value: 80500 })).toEqual(81)
    expect(calculatePercent({ value: 41200 })).toEqual(41)
    expect(calculatePercent({ value: 3500 })).toEqual(4)
  })
})

describe("calculateMilesRemaining", () => {
  test("calculates miles remaining based on 2x charge percentage", () => {
    expect(calculateMilesRemaining({ value: 100000 })).toEqual(200)
    expect(calculateMilesRemaining({ value: 80350 })).toEqual(160)
    expect(calculateMilesRemaining({ value: 80500 })).toEqual(162)
    expect(calculateMilesRemaining({ value: 41200 })).toEqual(82)
    expect(calculateMilesRemaining({ value: 3500 })).toEqual(8)
  })
})
