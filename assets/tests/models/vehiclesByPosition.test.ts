import { LadderDirection } from "../../src/models/ladderDirection"
import { groupByPosition } from "../../src/models/vehiclesByPosition"
import { BlockWaiver, Ghost, Vehicle } from "../../src/realtime.d"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"

describe("groupByPosition", () => {
  const emptyByPosition = {
    onRoute: [],
    layingOverTop: [],
    layingOverBottom: [],
    incoming: [],
  }
  test("loading", () => {
    expect(groupByPosition(undefined, "1", LadderDirection.ZeroToOne)).toEqual(
      emptyByPosition
    )
  })

  test("on route", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "1",
      directionId: 0,
      routeStatus: "on_route",
    } as Vehicle
    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [vehicle],
    })
  })

  test("laying over", () => {
    const ladderDirection: LadderDirection = LadderDirection.ZeroToOne
    const top: Vehicle = {
      id: "y0001",
      routeId: "1",
      directionId: 1,
      routeStatus: "laying_over",
    } as Vehicle
    const bottom: Vehicle = {
      id: "y0002",
      routeId: "1",
      directionId: 0,
      routeStatus: "laying_over",
    } as Vehicle
    expect(groupByPosition([top, bottom], "1", ladderDirection)).toEqual({
      ...emptyByPosition,
      layingOverTop: [top],
      layingOverBottom: [bottom],
    })
  })

  test("pulling out", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "1",
      directionId: 0,
      routeStatus: "pulling_out",
    } as Vehicle
    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      incoming: [vehicle],
    })
  })

  test("incoming from another route", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "2",
      directionId: 0,
      routeStatus: "on_route",
    } as Vehicle
    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      incoming: [vehicle],
    })
  })

  test("on route ghost", () => {
    const ghost: Ghost = {
      id: "ghost",
      routeId: "1",
      directionId: 0,
      routeStatus: "on_route",
    } as Ghost
    expect(groupByPosition([ghost], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [ghost],
    })
  })

  test("generates virtual ghosts for incoming buses that are late", () => {
    const vehicle: Vehicle = vehicleFactory.build({
      id: "vehicleId",
      directionId: 0,
      routeId: "2",
      tripId: "tripId",
      headsign: "test headsign",
      blockId: "blockId",
      routeStatus: "on_route",
      runId: "runId",
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 361,
      scheduledLocation: {
        routeId: "1",
        routePatternId: "1-_-0",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 361,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
      blockWaivers: [] as BlockWaiver[],
    })

    const expectedGhost: Ghost = ghostFactory.build({
      id: "ghost-incoming-vehicleId",
      directionId: vehicle.scheduledLocation!.directionId,
      routeId: "1",
      tripId: "scheduled trip",
      headsign: "scheduled headsign",
      blockId: vehicle.blockId,
      runId: "scheduled run",
      viaVariant: "scheduled via variant",
      layoverDepartureTime: null,
      scheduledTimepointStatus: vehicle.scheduledLocation!.timepointStatus,
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
      currentPieceFirstRoute: null,
      currentPieceStartPlace: null,
    })

    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [expectedGhost],
      incoming: [vehicle],
    })
  })

  test("generates virtual ghosts for pulling out buses that are late", () => {
    const vehicle: Vehicle = vehicleFactory.build({
      id: "vehicleId",
      directionId: 0,
      routeId: "1",
      tripId: "tripId",
      headsign: "test headsign",
      blockId: "blockId",
      routeStatus: "pulling_out",
      runId: "runId",
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 361,
      scheduledLocation: {
        routeId: "1",
        routePatternId: "1-_-0",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 361,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
      blockWaivers: [] as BlockWaiver[],
    })

    const expectedGhost: Ghost = ghostFactory.build({
      id: "ghost-incoming-vehicleId",
      directionId: vehicle.scheduledLocation!.directionId,
      routeId: "1",
      tripId: "scheduled trip",
      headsign: "scheduled headsign",
      blockId: vehicle.blockId,
      runId: "scheduled run",
      viaVariant: "scheduled via variant",
      layoverDepartureTime: null,
      scheduledTimepointStatus: vehicle.scheduledLocation!.timepointStatus,
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
      currentPieceFirstRoute: null,
      currentPieceStartPlace: null,
    })

    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [expectedGhost],
      incoming: [vehicle],
    })
  })

  test("does not generate a virtual ghost for incoming buses whose scheduled location isn't on the ladder route", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "2",
      tripId: "tripId",
      headsign: "test headsign",
      blockId: "blockId",
      directionId: 0,
      routeStatus: "on_route",
      runId: "runId",
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 361,
      scheduledLocation: {
        routeId: "2",
        directionId: 0,
        tripId: "tripId",
        runId: "runId",
        timeSinceTripStartTime: 361,
        headsign: "test headsign",
        viaVariant: "viaVariant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
    } as Vehicle

    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [],
      incoming: [vehicle],
    })
  })

  test("does not generate a virtual ghost if another vehicle is on this run", () => {
    const lateVehicle: Vehicle = {
      id: "vehicleId",
      directionId: 0,
      routeId: "1",
      tripId: "tripId",
      headsign: "test headsign",
      blockId: "blockId",
      routeStatus: "laying_over",
      runId: "runId",
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 361,
      scheduledLocation: {
        routeId: "1",
        directionId: 0,
        tripId: "tripId",
        runId: "runId",
        timeSinceTripStartTime: 361,
        headsign: "test headsign",
        viaVariant: "viaVariant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle
    const otherVehicleOnRun: Vehicle = {
      id: "otherVehicleId",
      directionId: 0,
      routeId: "1",
      tripId: "trip2",
      headsign: "test headsign",
      blockId: "blockId",
      routeStatus: "on_route",
      runId: "runId",
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 5,
      scheduledLocation: {
        routeId: "1",
        directionId: 0,
        tripId: "trip2",
        runId: "runId",
        timeSinceTripStartTime: 5,
        headsign: "test headsign",
        viaVariant: "viaVariant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle

    expect(
      groupByPosition(
        [lateVehicle, otherVehicleOnRun],
        "1",
        LadderDirection.ZeroToOne
      )
    ).toEqual({
      ...emptyByPosition,
      onRoute: [otherVehicleOnRun],
      layingOverBottom: [lateVehicle],
    })
  })

  test("does not generate a virtual ghost if the vehicle doesn't have a run ID", () => {
    const lateVehicle: Vehicle = {
      id: "vehicleId",
      directionId: 0,
      routeId: "1",
      tripId: "tripId",
      headsign: "test headsign",
      blockId: "blockId",
      routeStatus: "laying_over",
      runId: null,
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 361,
      scheduledLocation: {
        routeId: "1",
        directionId: 0,
        tripId: "tripId",
        runId: "runId",
        timeSinceTripStartTime: 361,
        headsign: "test headsign",
        viaVariant: "viaVariant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle

    expect(
      groupByPosition([lateVehicle], "1", LadderDirection.ZeroToOne)
    ).toEqual({
      ...emptyByPosition,
      layingOverBottom: [lateVehicle],
    })
  })

  test("does not generate a virtual ghost if the vehicle is more than an hour late", () => {
    const veryLateVehicle: Vehicle = {
      id: "vehicleId",
      directionId: 0,
      routeId: "2",
      tripId: "tripId",
      headsign: "test headsign",
      blockId: "blockId",
      routeStatus: "on_route",
      runId: "runId",
      viaVariant: "viaVariant",
      scheduleAdherenceSecs: 3601,
      scheduledLocation: {
        routeId: "1",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 3601,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "timepointId",
          fractionUntilTimepoint: 0.2,
        },
      },
      blockWaivers: [] as BlockWaiver[],
    } as Vehicle

    expect(
      groupByPosition([veryLateVehicle], "1", LadderDirection.ZeroToOne)
    ).toEqual({
      ...emptyByPosition,
      onRoute: [],
      incoming: [veryLateVehicle],
    })
  })
})
