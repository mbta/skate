import React from "react"
import renderer from "react-test-renderer"
import Ladder from "../../src/components/ladder"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { LadderDirection } from "../../src/models/ladderDirection"
import { emptyVehiclesByPosition } from "../../src/models/vehiclesByPosition"
import {
  BlockWaiver,
  Ghost,
  Vehicle,
  VehicleOrGhost,
} from "../../src/realtime.d"
import { Timepoint } from "../../src/schedule.d"
import { initialState, selectVehicle } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: () => ({}),
}))

describe("ladder", () => {
  test("renders a ladder", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "upward",
        label: "upward",
        runId: "run-1",
        routeId: "route",
        tripId: "trip",
        blockId: "block-1",
        directionId: 0,
        scheduleAdherenceSecs: 0,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
      vehicleFactory.build({
        id: "downward",
        label: "downward",
        runId: "run-2",
        routeId: "route",
        tripId: "trip",
        blockId: "block-1",
        directionId: 1,
        scheduleAdherenceSecs: 0,
        viaVariant: null,
        operatorId: "op2",
        operatorFirstName: "NORA",
        operatorLastName: "JONES",
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.75,
          timepointId: "t2",
        },
        scheduledLocation: {
          routeId: "route",
          directionId: 0,
          tripId: "scheduled trip",
          runId: "scheduled run",
          timeSinceTripStartTime: 0,
          headsign: "scheduled headsign",
          viaVariant: "scheduled via variant",
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
      vehicleFactory.build({
        id: "notimepoint",
        label: "notimepoint",
        runId: "run-3",
        routeId: "route",
        tripId: "trip",
        blockId: "block-1",
        directionId: 1,
        scheduleAdherenceSecs: 0,
        viaVariant: null,
        operatorId: "op3",
        operatorFirstName: "SHENGMMO",
        operatorLastName: "XI",
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: null,
        scheduledLocation: null,
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: vehicles }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a ghost bus", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]

    const ghost: Ghost = ghostFactory.build({
      id: "ghost-trip",
      directionId: 0,
      routeId: "route",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: "123-0123",
      viaVariant: "X",
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
    })

    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: [ghost] }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows schedule line in the other direction", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "downward",
        label: "downward",
        runId: "run-2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorFirstName: "NORA",
        operatorLastName: "JONES",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: false,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: null,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.75,
          timepointId: "t2",
        },
        scheduledLocation: {
          routeId: "route",
          directionId: 1,
          tripId: "scheduled trip",
          runId: "scheduled run",
          timeSinceTripStartTime: 0,
          headsign: "scheduled headsign",
          viaVariant: "scheduled via variant",
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.OneToZero
    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: vehicles }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("highlights a selected vehicle", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: false,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: null,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
      vehicleFactory.build({
        id: "downward",
        label: "downward",
        runId: "run-2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorFirstName: "NORA",
        operatorLastName: "JONES",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: false,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: null,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.75,
          timepointId: "t2",
        },
        scheduledLocation: {
          routeId: "route",
          directionId: 0,
          tripId: "scheduled trip",
          runId: "scheduled run",
          timeSinceTripStartTime: 0,
          headsign: "scheduled headsign",
          viaVariant: "scheduled via variant",
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: vehicles }}
          ladderDirection={ladderDirection}
          selectedVehicleId={"upward"}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows vehicles with current block waivers", () => {
    jest
      .spyOn(dateTime, "now")
      .mockImplementation(() => new Date("2020-01-01T01:00:00.000Z"))
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const ghostWithBlockWaiver: Ghost = ghostFactory.build({
      id: "ghost-trip",
      directionId: 0,
      routeId: "route",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: "123-0123",
      viaVariant: "X",
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [
        {
          startTime: new Date("2020-01-01T00:00:00.000Z"),
          endTime: new Date("2020-01-01T02:00:00.000Z"),
          causeId: 0,
          causeDescription: "Block Waiver",
          remark: null,
        },
      ],
    })
    const vehicleWithOldBlockWaiver: Vehicle = vehicleFactory.build({
      id: "id",
      label: "label",
      runId: "run",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      directionId: 1,
      routeId: "route",
      tripId: "trip",
      headsign: null,
      viaVariant: null,
      operatorId: "op",
      operatorFirstName: "NORA",
      operatorLastName: "JONES",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block",
      previousVehicleId: "",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.75,
        timepointId: "t2",
      },
      scheduledLocation: {
        routeId: "route",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "t2",
          fractionUntilTimepoint: 0.75,
        },
      },
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [
        {
          startTime: new Date("2019-12-31T22:00:00.000Z"),
          endTime: new Date("2019-12-31T23:00:00.000Z"),
          causeId: 0,
          causeDescription: "Block Waiver",
          remark: null,
        },
      ],
      crowding: null,
    })

    const vehicleWithCurrentBlockWaiver: Vehicle = {
      ...vehicleWithOldBlockWaiver,
      id: "otherVehicle",
      blockWaivers: [
        {
          startTime: new Date("2019-12-31T00:00:00.000Z"),
          endTime: new Date("2020-01-01T02:00:00.000Z"),
          causeId: 0,
          causeDescription: "Block Waiver",
          remark: null,
        },
      ],
    }

    const vehiclesAndGhosts: VehicleOrGhost[] = [
      ghostWithBlockWaiver,
      vehicleWithOldBlockWaiver,
      vehicleWithCurrentBlockWaiver,
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            onRoute: vehiclesAndGhosts,
          }}
          ladderDirection={ladderDirection}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a vehicle selects that vehicle", async () => {
    const mockDispatch = jest.fn()

    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicle: Vehicle = vehicleFactory.build({
      id: "upward",
      label: "upward",
      runId: "run-1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      directionId: 0,
      routeId: "route",
      tripId: "trip",
      headsign: null,
      viaVariant: null,
      operatorId: "op1",
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block-1",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.5,
        timepointId: "t1",
      },
      scheduledLocation: null,
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: null,
    })

    const ladderDirection = LadderDirection.ZeroToOne

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            onRoute: [vehicle],
          }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      </StateDispatchProvider>
    )
    await userEvent.click(result.getByText("1"))

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))
  })

  test("clicking an incoming ghost selects the associated vehicle", async () => {
    const mockDispatch = jest.fn()

    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const incomingGhost: Ghost = {
      id: "ghost-incoming-y0622",
      blockWaivers: [] as BlockWaiver[],
    } as Ghost

    const ladderDirection = LadderDirection.ZeroToOne

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            onRoute: [incomingGhost],
          }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText("N/A"))

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(incomingGhost))
  })

  test("clicking a crowding icon selects the associated vehicle", async () => {
    const mockDispatch = jest.fn()

    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicle: Vehicle = vehicleFactory.build({
      id: "upward",
      label: "upward",
      runId: "run-1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      directionId: 0,
      routeId: "route",
      tripId: "trip",
      headsign: null,
      viaVariant: null,
      operatorId: "op1",
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block-1",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: null,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.5,
        timepointId: "t1",
      },
      scheduledLocation: null,
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: {
        load: 0,
        occupancyStatus: "EMPTY",
        capacity: 18,
        occupancyPercentage: 0,
      },
    })

    const ladderDirection = LadderDirection.ZeroToOne

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            onRoute: [vehicle],
          }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
          displayCrowding={true}
        />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText("0/18"))
    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))
  })

  test("renders a ladder with no timepoints", () => {
    const timepoints: Timepoint[] = []
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: false,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: null,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: vehicles }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a reversed ladder", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: false,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: null,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: {
          routeId: "route",
          directionId: 1,
          tripId: "scheduled trip",
          runId: "scheduled run",
          timeSinceTripStartTime: 0,
          headsign: "scheduled headsign",
          viaVariant: "scheduled via variant",
          timepointStatus: {
            timepointId: "t1",
            fractionUntilTimepoint: 0.4,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.OneToZero

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: vehicles }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders an off-course vehicle", () => {
    const vehicle: Vehicle = vehicleFactory.build({
      id: "y1439",
      label: "1439",
      runId: "run-1",
      timestamp: 1562777122,
      latitude: 42.38954,
      longitude: -71.07405,
      directionId: 0,
      routeId: "71",
      tripId: "40725309",
      headsign: "Harvard",
      viaVariant: "D",
      operatorId: "op1",
      operatorFirstName: "PATTI",
      operatorLastName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 0,
      blockId: "T71-17",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: true,
      isRevenue: true,
      layoverDepartureTime: null,
      dataDiscrepancies: [
        {
          attribute: "trip_id",
          sources: [
            {
              id: "busloc",
              value: "40725309",
            },
            {
              id: "swiftly",
              value: null,
            },
          ],
        },
      ],
      stopStatus: {
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: null,
      scheduledLocation: {
        routeId: "71",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "mtsty",
          fractionUntilTimepoint: 0,
        },
      },
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: null,
    })

    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            onRoute: [vehicle],
          }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders an overload vehicle", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: true,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: null,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{ ...emptyVehiclesByPosition, onRoute: vehicles }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a laying over vehicle", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "laying-over",
        label: "laying-over",
        runId: "laying-over",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: true,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: 1,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.0,
          timepointId: "t0",
        },
        scheduledLocation: null,
        routeStatus: "laying_over",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            layingOverTop: vehicles,
          }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a laying over vehicle with a scheduled line", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      vehicleFactory.build({
        id: "laying-over",
        label: "laying-over",
        runId: "laying-over",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorFirstName: "PATTI",
        operatorLastName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        isShuttle: false,
        isOverload: false,
        isOffCourse: false,
        isRevenue: true,
        layoverDepartureTime: 1,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.0,
          timepointId: "t0",
        },
        scheduledLocation: {
          routeId: "route",
          directionId: 1,
          tripId: "trip",
          runId: "laying-over",
          timeSinceTripStartTime: 22,
          headsign: null,
          viaVariant: null,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "laying_over",
        endOfTripType: "another_trip",
        blockWaivers: [],
        crowding: null,
      }),
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesByPosition={{
            ...emptyVehiclesByPosition,
            layingOverTop: vehicles,
          }}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
