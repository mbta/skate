import {
  status,
  HeadwaySpacing,
  headwaySpacingToString,
} from "../../src/models/vehicleStatus"
import { DataDiscrepancy, Vehicle } from "../../src/realtime.d"

describe("status", () => {
  test("returns 'off-course' if isOffCourse", () => {
    const vehicle: Vehicle = {
      isOffCourse: true,
    } as Vehicle

    expect(status(vehicle)).toEqual("off-course")
  })

  test("returns the vehicle's schedule adherence status otherwise", () => {
    const scheduleAdherenceStatus = "on-time"
    const vehicle: Vehicle = {
      scheduleAdherenceStatus,
      dataDiscrepancies: [] as DataDiscrepancy[],
    } as Vehicle

    expect(status(vehicle)).toEqual("on-time")
  })
})

describe("headwaySpacingToString", () => {
  test("converts enum to string", () => {
    expect(headwaySpacingToString(HeadwaySpacing.VeryBunched)).toEqual(
      "very-bunched"
    )
    expect(headwaySpacingToString(HeadwaySpacing.Bunched)).toEqual("bunched")
    expect(headwaySpacingToString(HeadwaySpacing.Ok)).toEqual("ok")
    expect(headwaySpacingToString(HeadwaySpacing.Gapped)).toEqual("gapped")
    expect(headwaySpacingToString(HeadwaySpacing.VeryGapped)).toEqual(
      "very-gapped"
    )
  })
})
