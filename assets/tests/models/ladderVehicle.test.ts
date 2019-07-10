import { LadderDirection } from "../../src/components/ladder"
import {
  areOverlapping,
  byDirectionAndY,
  directionOnLadder,
  firstOpenLane,
  isUnassignedBySwiftly,
  LadderVehicle,
  putIntoLanes,
  status,
  VehicleDirection,
} from "../../src/models/ladderVehicle"
import { DataDiscrepancy, Vehicle } from "../../src/skate"

describe("directionOnLadder", () => {
  test("determines the vehicle direction relative the ladder direction", () => {
    expect(directionOnLadder(0, LadderDirection.ZeroToOne)).toEqual(
      VehicleDirection.Up
    )
    expect(directionOnLadder(0, LadderDirection.OneToZero)).toEqual(
      VehicleDirection.Down
    )
    expect(directionOnLadder(1, LadderDirection.ZeroToOne)).toEqual(
      VehicleDirection.Down
    )
    expect(directionOnLadder(1, LadderDirection.OneToZero)).toEqual(
      VehicleDirection.Up
    )
  })
})

describe("putIntoLanes", () => {
  test("adds lane properties", () => {
    const vehicle = {} as Vehicle
    const original = [
      {
        vehicle,
        vehicleDirection: VehicleDirection.Up,
        x: 0,
        y: 10,
      },
      {
        vehicle,
        vehicleDirection: VehicleDirection.Up,
        x: 0,
        y: 20,
      },
      {
        vehicle,
        vehicleDirection: VehicleDirection.Down,
        x: 0,
        y: 20,
      },
      {
        vehicle,
        vehicleDirection: VehicleDirection.Down,
        x: 0,
        y: 10,
      },
    ]

    const expectedYs = [20, 10, 10, 20]
    const expectedLanes = [1, 0, 1, 0]

    const result = putIntoLanes(original)
    const ys = result.map(v => v.y)
    const lanes = result.map(v => v.lane)

    expect(ys).toEqual(expectedYs)
    expect(lanes).toEqual(expectedLanes)
  })
})

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
    const ladderVehicle: LadderVehicle = { vehicle } as LadderVehicle

    expect(status(ladderVehicle)).toEqual("off-course")
  })

  test("returns the vehicle's schedule adherence status otherwise", () => {
    const scheduleAdherenceStatus = "on-time"
    const vehicle: Vehicle = {
      scheduleAdherenceStatus,
      dataDiscrepancies: [] as DataDiscrepancy[],
    } as Vehicle
    const ladderVehicle: LadderVehicle = { vehicle } as LadderVehicle

    expect(status(ladderVehicle)).toEqual("on-time")
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
    const ladderVehicle: LadderVehicle = { vehicle } as LadderVehicle

    expect(isUnassignedBySwiftly(ladderVehicle)).toBeTruthy()
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
    const ladderVehicle: LadderVehicle = { vehicle } as LadderVehicle

    expect(isUnassignedBySwiftly(ladderVehicle)).toBeFalsy()
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
    const ladderVehicle: LadderVehicle = { vehicle } as LadderVehicle

    expect(isUnassignedBySwiftly(ladderVehicle)).toBeFalsy()
  })
})

describe("byDirectionAndY", () => {
  test("sorts the array by direction, and then by y value", () => {
    const array = [
      {
        vehicleDirection: VehicleDirection.Up,
        y: 1,
      },
      {
        vehicleDirection: VehicleDirection.Up,
        y: 2,
      },
      {
        vehicleDirection: VehicleDirection.Down,
        y: 2,
      },
      {
        vehicleDirection: VehicleDirection.Down,
        y: 1,
      },
    ]

    const expectedYs = [2, 1, 1, 2]

    const result = array.sort(byDirectionAndY)
    const ys = result.map(v => v.y)

    expect(ys).toEqual(expectedYs)
  })

  test("sorts all vehicles traveling down ahead of all those traveling up", () => {
    const down = {
      vehicleDirection: VehicleDirection.Down,
      y: 1,
    }
    const up = {
      vehicleDirection: VehicleDirection.Up,
      y: 1,
    }

    expect(byDirectionAndY(down, up)).toEqual(-1)
    expect(byDirectionAndY(up, down)).toEqual(1)
  })

  test("while traveling down, vehicles with a higher y are in front", () => {
    const front = {
      vehicleDirection: VehicleDirection.Down,
      y: 2,
    }
    const back = {
      vehicleDirection: VehicleDirection.Down,
      y: 1,
    }

    expect(byDirectionAndY(front, back)).toEqual(-1)
    expect(byDirectionAndY(back, front)).toEqual(1)
  })

  test("while traveling up, vehicles with a lower y are in front", () => {
    const front = {
      vehicleDirection: VehicleDirection.Up,
      y: 1,
    }
    const back = {
      vehicleDirection: VehicleDirection.Up,
      y: 2,
    }

    expect(byDirectionAndY(front, back)).toEqual(-1)
    expect(byDirectionAndY(back, front)).toEqual(1)
  })
})

describe("areOverlapping", () => {
  test("returns false if the vehicles are traveling in different directions", () => {
    const a = {
      vehicleDirection: VehicleDirection.Down,
    } as LadderVehicle
    const b = {
      vehicleDirection: VehicleDirection.Up,
    } as LadderVehicle

    expect(areOverlapping(a, b)).toBeFalsy()
  })

  test("returns true if the vehicles overlap in the y-dimension", () => {
    const a = ({
      vehicleDirection: VehicleDirection.Down,
      y: 10,
    } as unknown) as LadderVehicle
    const b = ({
      vehicleDirection: VehicleDirection.Down,
      y: 20,
    } as unknown) as LadderVehicle
    const c = ({
      vehicleDirection: VehicleDirection.Down,
      y: 100,
    } as unknown) as LadderVehicle

    expect(areOverlapping(a, b)).toBeTruthy()
    expect(areOverlapping(a, c)).toBeFalsy()
  })

  test("it doesn't matter what order the vehicles are passed in", () => {
    const a = ({
      vehicleDirection: VehicleDirection.Down,
      y: 10,
    } as unknown) as LadderVehicle
    const b = ({
      vehicleDirection: VehicleDirection.Down,
      y: 20,
    } as unknown) as LadderVehicle

    expect(areOverlapping(a, b)).toBeTruthy()
    expect(areOverlapping(b, a)).toBeTruthy()
  })
})

describe("firstOpenLane", () => {
  test("returns 0 if there are no occupiedLanes", () => {
    expect(firstOpenLane([])).toEqual(0)
  })

  test("returns the next available lane", () => {
    expect(firstOpenLane([0, 1, 2])).toEqual(3)
  })

  test("returns the earliest available lane if there is a gap", () => {
    expect(firstOpenLane([1, 2])).toEqual(0)
    expect(firstOpenLane([0, 1, 3])).toEqual(2)
  })
})
