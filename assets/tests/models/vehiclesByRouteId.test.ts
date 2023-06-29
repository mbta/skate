import { isVehicleInScheduledService } from "../../src/models/vehicle"
import {
  allVehiclesAndGhosts,
  allVehiclesForRoute,
  byDirection,
  nextAndPreviousVehicle,
} from "../../src/models/vehiclesByRouteId"
import { Ghost, VehicleInScheduledService } from "../../src/realtime"
import { ByRouteId } from "../../src/schedule"

const vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]> = {
  "1": [
    {
      id: "y101",
      directionId: 0,
      routeId: "1",
      previousVehicleId: "y102",
      routeStatus: "on_route",
    } as VehicleInScheduledService,
    {
      id: "y102",
      directionId: 0,
      routeId: "1",
      previousVehicleId: "y103",
      routeStatus: "on_route",
    } as VehicleInScheduledService,
    // Vehicle with direction 1 between vehicles with direction 0
    {
      id: "y111",
      directionId: 1,
      routeId: "1",
      previousVehicleId: "y112",
      routeStatus: "on_route",
    } as VehicleInScheduledService,
    {
      id: "y103",
      directionId: 0,
      routeId: "1",
      previousVehicleId: "y104",
      routeStatus: "on_route",
    } as VehicleInScheduledService,
    {
      id: "y104",
      directionId: 0,
      routeId: "1",
      previousVehicleId: "y105",
      routeStatus: "pulling_out",
    } as VehicleInScheduledService,
    {
      id: "ghost-1",
      directionId: 0,
      routeId: "1",
    } as Ghost,
  ],
  "39": [
    {
      id: "y3901",
      directionId: 0,
      routeId: "39",
      previousVehicleId: "y1250",
      routeStatus: "on_route",
    } as VehicleInScheduledService,
  ],
}

describe("allVehiclesAndGhosts", () => {
  test("returns all the vehicles and ghosts", () => {
    expect(allVehiclesAndGhosts(vehiclesByRouteId).length).toEqual(7)
  })
})

describe("allVehiclesForRoute", () => {
  test("selects the route", () => {
    expect(
      allVehiclesForRoute(
        {
          "1": [
            {
              id: "1",
              routeId: "1",
            } as VehicleInScheduledService,
          ],
          "2": [
            {
              id: "2",
              routeId: "2",
            } as VehicleInScheduledService,
          ],
        },
        "1"
      ).map((v) => v.id)
    ).toEqual(["1"])
  })

  test("filters out ghosts", () => {
    expect(
      allVehiclesForRoute(
        {
          "1": [
            {
              id: "1",
              routeId: "1",
            } as VehicleInScheduledService,
            {
              id: "ghost",
              routeId: "1",
            } as Ghost,
          ],
        },
        "1"
      ).map((v) => v.id)
    ).toEqual(["1"])
  })

  test("filters out vehicles incoming from another route", () => {
    expect(
      allVehiclesForRoute(
        {
          "1": [
            {
              id: "1",
              routeId: "1",
            } as VehicleInScheduledService,
            {
              id: "2",
              routeId: "2",
            } as VehicleInScheduledService,
          ],
        },
        "1"
      ).map((v) => v.id)
    ).toEqual(["1"])
  })
})

describe("byDirection", () => {
  test("partitions vehicles into direction 0 and direction 1", () => {
    const vehicles: VehicleInScheduledService[] = vehiclesByRouteId["1"].filter(
      isVehicleInScheduledService
    )

    const [direction0Vehicles, direction1Vehicles] = byDirection(vehicles)

    expect(Array.isArray(direction0Vehicles)).toBeTruthy()
    expect(Array.isArray(direction1Vehicles)).toBeTruthy()

    expect(direction0Vehicles.length).toEqual(4)
    expect(direction1Vehicles.length).toEqual(1)
  })
})

describe("nextAndPreviousVehicle", () => {
  test("returns the next and previous vehicles as described by the previousVehicleId property", () => {
    const vehicles: VehicleInScheduledService[] = vehiclesByRouteId["1"].filter(
      isVehicleInScheduledService
    )
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
    const vehicles: VehicleInScheduledService[] = vehiclesByRouteId[
      "39"
    ].filter(isVehicleInScheduledService)
    const currentVehicle = vehicles[0]

    expect(nextAndPreviousVehicle(vehicles, currentVehicle)).toEqual({
      nextVehicle: undefined,
      previousVehicle: undefined,
    })
  })
})
