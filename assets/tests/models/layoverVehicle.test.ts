import { Vehicle, VehicleScheduledLocation } from "../../src/realtime.d"
import {
  byLayoverDeparture,
  ladderVehiclesForLayovers,
  LayoverBoxPosition,
} from "../../src/models/layoverVehicle"
import { VehicleDirection } from "../../src/models/ladderDirection"

describe("ladderVehiclesForLayovers", () => {
  const vehicle: Vehicle = {
    id: "vehicle",
    tripId: "next-trip",
    layoverDepartureTime: 0,
    scheduledLocation: null,
  } as Vehicle
  const soonest: Vehicle = {
    id: "soonest",
    tripId: "soonest",
    layoverDepartureTime: 1500000000,
    scheduledLocation: null,
  } as Vehicle
  const soon: Vehicle = {
    id: "soon",
    tripId: "soon",
    layoverDepartureTime: 1500000002,
    scheduledLocation: null,
  } as Vehicle
  const later: Vehicle = {
    id: "later",
    tripId: "later",
    layoverDepartureTime: 1500000004,
    scheduledLocation: null,
  } as Vehicle

  test("works for 0 vehicles", () => {
    expect(
      ladderVehiclesForLayovers([], LayoverBoxPosition.Bottom, () => 55, 99)
    ).toEqual([])
  })

  test("works for 1 vehicle", () => {
    expect(
      ladderVehiclesForLayovers(
        [vehicle],
        LayoverBoxPosition.Bottom,
        () => 55,
        99
      )
    ).toEqual([
      {
        vehicle,
        x: 0,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
    ])
  })

  test("includes info for scheduled line", () => {
    const vehicleWithScheduledLocation = {
      ...vehicle,
      scheduledLocation: {
        tripId: "next-trip",
        timeSinceTripStartTime: 10,
      } as VehicleScheduledLocation,
    }
    expect(
      ladderVehiclesForLayovers(
        [vehicleWithScheduledLocation],
        LayoverBoxPosition.Bottom,
        () => 55,
        99
      )
    ).toEqual([
      {
        vehicle: vehicleWithScheduledLocation,
        x: 0,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: 55,
        scheduledVehicleDirection: VehicleDirection.Up,
      },
    ])
  })

  test("does not include scheduled line if the layover isn't scheduled to be done", () => {
    const vehicleWithScheduledLocation = {
      ...vehicle,
      scheduledLocation: {
        tripId: "next-trip",
        timeSinceTripStartTime: -10,
      } as VehicleScheduledLocation,
    }
    expect(
      ladderVehiclesForLayovers(
        [vehicleWithScheduledLocation],
        LayoverBoxPosition.Bottom,
        () => 55,
        99
      )
    ).toEqual([
      {
        vehicle: vehicleWithScheduledLocation,
        x: 0,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
    ])
  })

  test("does not include scheduled line if the layover isn't scheduled to be started", () => {
    const vehicleWithScheduledLocation = {
      ...vehicle,
      scheduledLocation: {
        tripId: "previous-trip",
        timeSinceTripStartTime: 10,
      } as VehicleScheduledLocation,
    }
    expect(
      ladderVehiclesForLayovers(
        [vehicleWithScheduledLocation],
        LayoverBoxPosition.Bottom,
        () => 55,
        99
      )
    ).toEqual([
      {
        vehicle: vehicleWithScheduledLocation,
        x: 0,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
    ])
  })

  test("spaces out 2 vehicles", () => {
    expect(
      ladderVehiclesForLayovers(
        [soon, later],
        LayoverBoxPosition.Bottom,
        () => 55,
        99
      ).map((ladderVehicle) => ladderVehicle.x)
    ).toEqual([-15, 15])
  })

  test("on the top, puts soonest departure on the left", () => {
    const vehicles = [soon, soonest, later]
    expect(
      ladderVehiclesForLayovers(vehicles, LayoverBoxPosition.Top, () => 55, -5)
    ).toEqual([
      {
        vehicle: soonest,
        x: -30,
        y: -5,
        vehicleDirection: VehicleDirection.Down,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
      {
        vehicle: soon,
        x: 0,
        y: -5,
        vehicleDirection: VehicleDirection.Down,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
      {
        vehicle: later,
        x: 30,
        y: -5,
        vehicleDirection: VehicleDirection.Down,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
    ])
  })

  test("on the bottom, puts soonest departure on the right", () => {
    const vehicles = [soon, soonest, later]
    expect(
      ladderVehiclesForLayovers(
        vehicles,
        LayoverBoxPosition.Bottom,
        () => 55,
        99
      )
    ).toEqual([
      {
        vehicle: later,
        x: -30,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
      {
        vehicle: soon,
        x: 0,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
      {
        vehicle: soonest,
        x: 30,
        y: 99,
        vehicleDirection: VehicleDirection.Up,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      },
    ])
  })
})

describe("byLayoverDeparture", () => {
  const vehicleDepartingSooner: Vehicle = {
    layoverDepartureTime: 1,
  } as Vehicle
  const vehicleDepartingLater: Vehicle = {
    layoverDepartureTime: 2,
  } as Vehicle

  test("orders in descending order for the bottom layover box, so that vehicles leaving sooner are to the right", () => {
    const isBottomLayoverBox: boolean = true

    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingSooner,
        vehicleDepartingLater
      )
    ).toEqual(1)
    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingLater,
        vehicleDepartingSooner
      )
    ).toEqual(-1)
  })

  test("orders in ascending order for the bottom layover box, so that vehicles leaving sooner are to the left", () => {
    const isBottomLayoverBox: boolean = false

    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingSooner,
        vehicleDepartingLater
      )
    ).toEqual(-1)
    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingLater,
        vehicleDepartingSooner
      )
    ).toEqual(1)
  })

  test("returns 0 if either vehicle is missing the layoverDepartureTime", () => {
    const isBottomLayoverBox: boolean = true
    const vehicleMissingLayoverDepartureTime: Vehicle = {
      layoverDepartureTime: null,
    } as Vehicle

    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingSooner,
        vehicleMissingLayoverDepartureTime
      )
    ).toEqual(0)
    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleMissingLayoverDepartureTime,
        vehicleDepartingSooner
      )
    ).toEqual(0)
  })
})
