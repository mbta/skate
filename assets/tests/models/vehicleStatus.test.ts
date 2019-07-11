import { isUnassignedBySwiftly, status } from "../../src/models/vehicleStatus"
import { DataDiscrepancy, Vehicle } from "../../src/skate"

describe("status", () => {
  test("returns 'off-course' if isUnassignedBySwiftly", () => {
    const vehicle: Vehicle = {
      dataDiscrepancies: [
        {
          attribute: "trip_id",
          sources: [
            {
              id: "swiftly",
              value: null,
            },
            {
              id: "busloc",
              value: "busloc-trip-id",
            },
          ],
        },
      ],
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

describe("isUnassignedBySwiftly", () => {
  test("returns true if there is a trip_id data discrepancy where swiftly is null and busloc has a value", () => {
    const vehicle: Vehicle = {
      dataDiscrepancies: [
        {
          attribute: "trip_id",
          sources: [
            {
              id: "swiftly",
              value: null,
            },
            {
              id: "busloc",
              value: "busloc-trip-id",
            },
          ],
        },
      ],
    } as Vehicle

    expect(isUnassignedBySwiftly(vehicle)).toBeTruthy()
  })

  test("returns false if the swiftly defined a value", () => {
    const vehicle: Vehicle = {
      dataDiscrepancies: [
        {
          attribute: "trip_id",
          sources: [
            {
              id: "swiftly",
              value: "swiftly-trip-id",
            },
            {
              id: "busloc",
              value: "busloc-trip-id",
            },
          ],
        },
      ],
    } as Vehicle

    expect(isUnassignedBySwiftly(vehicle)).toBeFalsy()
  })

  test("returns false if there isn't a trip_id data discrepancy", () => {
    const vehicle: Vehicle = {
      dataDiscrepancies: [
        {
          attribute: "route_id",
          sources: [
            {
              id: "swiftly",
              value: "swiftly-route-id",
            },
            {
              id: "busloc",
              value: "busloc-route-id",
            },
          ],
        },
      ],
    } as Vehicle

    expect(isUnassignedBySwiftly(vehicle)).toBeFalsy()
  })
})
