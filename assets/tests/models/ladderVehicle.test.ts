import { LadderDirection } from "../../src/components/ladder"
import {
  areOverlapping,
  byDirectionAndY,
  directionOnLadder,
  firstOpenLane,
  LadderVehicle,
  putIntoLanes,
  VehicleDirection,
} from "../../src/models/ladderVehicle"
import { Vehicle } from "../../src/skate"

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
        x: 0,
        y: 10,
        vehicleDirection: VehicleDirection.Up,
      },
      {
        vehicle,
        x: 0,
        y: 20,
        vehicleDirection: VehicleDirection.Up,
      },
      {
        vehicle,
        x: 0,
        y: 20,
        vehicleDirection: VehicleDirection.Down,
      },
      {
        vehicle,
        x: 0,
        y: 10,
        vehicleDirection: VehicleDirection.Down,
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

describe("byDirectionAndY", () => {
  test("sorts the array by direction, and then by y value", () => {
    const array = [
      {
        y: 1,
        vehicleDirection: VehicleDirection.Up,
      },
      {
        y: 2,
        vehicleDirection: VehicleDirection.Up,
      },
      {
        y: 2,
        vehicleDirection: VehicleDirection.Down,
      },
      {
        y: 1,
        vehicleDirection: VehicleDirection.Down,
      },
    ]

    const expectedYs = [2, 1, 1, 2]

    const result = array.sort(byDirectionAndY)
    const ys = result.map(v => v.y)

    expect(ys).toEqual(expectedYs)
  })

  test("sorts all vehicles traveling down ahead of all those traveling up", () => {
    const down = {
      y: 1,
      vehicleDirection: VehicleDirection.Down,
    }
    const up = {
      y: 1,
      vehicleDirection: VehicleDirection.Up,
    }

    expect(byDirectionAndY(down, up)).toEqual(-1)
    expect(byDirectionAndY(up, down)).toEqual(1)
  })

  test("while traveling down, vehicles with a higher y are in front", () => {
    const front = {
      y: 2,
      vehicleDirection: VehicleDirection.Down,
    }
    const back = {
      y: 1,
      vehicleDirection: VehicleDirection.Down,
    }

    expect(byDirectionAndY(front, back)).toEqual(-1)
    expect(byDirectionAndY(back, front)).toEqual(1)
  })

  test("while traveling up, vehicles with a lower y are in front", () => {
    const front = {
      y: 1,
      vehicleDirection: VehicleDirection.Up,
    }
    const back = {
      y: 2,
      vehicleDirection: VehicleDirection.Up,
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
      y: 10,
      vehicleDirection: VehicleDirection.Down,
    } as unknown) as LadderVehicle
    const b = ({
      y: 20,
      vehicleDirection: VehicleDirection.Down,
    } as unknown) as LadderVehicle
    const c = ({
      y: 100,
      vehicleDirection: VehicleDirection.Down,
    } as unknown) as LadderVehicle

    expect(areOverlapping(a, b)).toBeTruthy()
    expect(areOverlapping(a, c)).toBeFalsy()
  })

  test("it doesn't matter what order the vehicles are passed in", () => {
    const a = ({
      y: 10,
      vehicleDirection: VehicleDirection.Down,
    } as unknown) as LadderVehicle
    const b = ({
      y: 20,
      vehicleDirection: VehicleDirection.Down,
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
