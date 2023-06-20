import { VehicleDirection } from "../../src/models/ladderDirection"
import {
  areOverlapping,
  byDirectionAndY,
  firstOpenLane,
  LadderVehicle,
  putIntoLanes,
} from "../../src/models/ladderVehicle"
import { VehicleInScheduledService } from "../../src/realtime"

describe("putIntoLanes", () => {
  test("adds lane properties", () => {
    const original: LadderVehicle[] = [
      {
        vehicle: { id: "v1" } as VehicleInScheduledService,
        vehicleDirection: VehicleDirection.Up,
        x: 0,
        y: 10,
      },
      {
        vehicle: { id: "v2" } as VehicleInScheduledService,
        vehicleDirection: VehicleDirection.Up,
        x: 0,
        y: 20,
      },
      {
        vehicle: { id: "v3" } as VehicleInScheduledService,
        vehicleDirection: VehicleDirection.Down,
        x: 0,
        y: 20,
      },
      {
        vehicle: { id: "v4" } as VehicleInScheduledService,
        vehicleDirection: VehicleDirection.Down,
        x: 0,
        y: 10,
      },
    ]

    const expectedYs = [20, 10, 10, 20]
    const expectedLanes = [1, 0, 1, 0]

    const result = putIntoLanes(original)
    const ys = result.map((v) => v.y)
    const lanes = result.map((v) => v.lane)

    expect(ys).toEqual(expectedYs)
    expect(lanes).toEqual(expectedLanes)
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
    const ys = result.map((v) => v.y)

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
    const a = {
      vehicleDirection: VehicleDirection.Down,
      y: 10,
    } as unknown as LadderVehicle
    const b = {
      vehicleDirection: VehicleDirection.Down,
      y: 20,
    } as unknown as LadderVehicle
    const c = {
      vehicleDirection: VehicleDirection.Down,
      y: 100,
    } as unknown as LadderVehicle

    expect(areOverlapping(a, b)).toBeTruthy()
    expect(areOverlapping(a, c)).toBeFalsy()
  })

  test("it doesn't matter what order the vehicles are passed in", () => {
    const a = {
      vehicleDirection: VehicleDirection.Down,
      y: 10,
    } as unknown as LadderVehicle
    const b = {
      vehicleDirection: VehicleDirection.Down,
      y: 20,
    } as unknown as LadderVehicle

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
