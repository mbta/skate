import {
  allVehicles,
  allVehiclesAndGhosts,
  byDirection,
  nextAndPreviousVehicle,
} from "../../src/models/vehiclesByRouteId"
import {
  Ghost,
  Vehicle,
  VehicleOrGhost,
  VehiclesForRoute,
} from "../../src/realtime"
import { ByRouteId } from "../../src/schedule"

const vehiclesByRouteId: ByRouteId<VehiclesForRoute> = {
  "1": {
    onRouteVehicles: [
      {
        id: "y101",
        directionId: 0,
        previousVehicleId: "y102",
      } as Vehicle,
      {
        id: "y102",
        directionId: 0,
        previousVehicleId: "y103",
      } as Vehicle,
      // Vehicle with direction 1 between vehicles with direction 0
      {
        id: "y111",
        directionId: 1,
        previousVehicleId: "y112",
      } as Vehicle,
      {
        id: "y103",
        directionId: 0,
        previousVehicleId: "y104",
      } as Vehicle,
    ],
    incomingVehicles: [
      {
        id: "y104",
        directionId: 0,
        previousVehicleId: "y105",
      } as Vehicle,
    ],
    ghosts: [
      {
        id: "ghost-1",
        directionId: 0,
      } as Ghost,
    ],
  },
  "39": {
    onRouteVehicles: [
      {
        id: "y3901",
        directionId: 0,
        previousVehicleId: "y1250",
      } as Vehicle,
    ],
    incomingVehicles: [],
    ghosts: [],
  },
}

describe("allVehicles", () => {
  test("returns all the vehicles for this route, whether on the route or incoming", () => {
    const expected: Vehicle[] = [
      {
        id: "y101",
        directionId: 0,
        previousVehicleId: "y102",
      } as Vehicle,
      {
        id: "y102",
        directionId: 0,
        previousVehicleId: "y103",
      } as Vehicle,
      // Vehicle with direction 1 between vehicles with direction 0
      {
        id: "y111",
        directionId: 1,
        previousVehicleId: "y112",
      } as Vehicle,
      {
        id: "y103",
        directionId: 0,
        previousVehicleId: "y104",
      } as Vehicle,
      {
        id: "y104",
        directionId: 0,
        previousVehicleId: "y105",
      } as Vehicle,
    ]

    expect(allVehicles(vehiclesByRouteId["1"])).toEqual(expected)
  })

  test("returns an empty array if vehiclesForRoute is undefined", () => {
    expect(allVehicles(undefined)).toEqual([])
  })
})

describe("allVehiclesAndGhosts", () => {
  test("returns all the vehicles and ghosts for this route", () => {
    const expected: VehicleOrGhost[] = [
      {
        id: "y101",
        directionId: 0,
        previousVehicleId: "y102",
      } as Vehicle,
      {
        id: "y102",
        directionId: 0,
        previousVehicleId: "y103",
      } as Vehicle,
      // Vehicle with direction 1 between vehicles with direction 0
      {
        id: "y111",
        directionId: 1,
        previousVehicleId: "y112",
      } as Vehicle,
      {
        id: "y103",
        directionId: 0,
        previousVehicleId: "y104",
      } as Vehicle,
      {
        id: "y104",
        directionId: 0,
        previousVehicleId: "y105",
      } as Vehicle,
      {
        id: "ghost-1",
        directionId: 0,
      } as Ghost,
    ]

    expect(allVehiclesAndGhosts(vehiclesByRouteId["1"])).toEqual(expected)
  })

  test("returns an empty array if vehiclesForRoute is undefined", () => {
    expect(allVehiclesAndGhosts(undefined)).toEqual([])
  })
})

describe("byDirection", () => {
  test("partitions vehicles into direction 0 and direction 1", () => {
    const vehicles: Vehicle[] = allVehicles(vehiclesByRouteId["1"])

    const [direction0Vehicles, direction1Vehicles] = byDirection(vehicles)

    expect(Array.isArray(direction0Vehicles)).toBeTruthy()
    expect(Array.isArray(direction1Vehicles)).toBeTruthy()

    expect(direction0Vehicles.length).toEqual(4)
    expect(direction1Vehicles.length).toEqual(1)
  })
})

describe("nextAndPreviousVehicle", () => {
  test("returns the next and previous vehicles as described by the previousVehicleId property", () => {
    const vehicles: Vehicle[] = vehiclesByRouteId["1"].onRouteVehicles
    // y102
    const currentVehicle = vehicles[1]

    // y101
    const expectedNextVehicle = vehicles[0]
    // y103
    const expectedPreviousVehicle = vehicles[3]

    expect(nextAndPreviousVehicle(vehicles, currentVehicle)).toEqual({
      nextVehicle: expectedNextVehicle,
      previousVehicle: expectedPreviousVehicle,
    })
  })

  test("returns undefined if no next and/or previous vehicle", () => {
    const vehicles: Vehicle[] = vehiclesByRouteId["39"].onRouteVehicles
    const currentVehicle = vehicles[0]

    expect(nextAndPreviousVehicle(vehicles, currentVehicle)).toEqual({
      nextVehicle: undefined,
      previousVehicle: undefined,
    })
  })
})
