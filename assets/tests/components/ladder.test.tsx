import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import Ladder from "../../src/components/ladder"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { LadderDirection } from "../../src/models/ladderDirection"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import {
  BlockWaiver,
  Ghost,
  Vehicle,
  VehicleOrGhost,
} from "../../src/realtime.d"
import { Timepoint } from "../../src/schedule.d"
import { initialState, selectVehicle } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))
jest.mock("react-tooltip", () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => <div className="mock-react-tooltip" />),
}))
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
      {
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
        operatorName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
      {
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
        operatorName: "JONES",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
      {
        id: "notimepoint",
        label: "notimepoint",
        runId: "run-3",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op3",
        operatorName: "XI",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
        dataDiscrepancies: [],
        stopStatus: {
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: null,
        scheduledLocation: null,
        routeStatus: "on_route",
        endOfTripType: "another_trip",
        blockWaivers: [],
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles}
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

    const ghost: Ghost = {
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
      routeStatus: "on_route",
      blockWaivers: [],
    }

    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={[ghost]}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("filters out vehicles whose block is not active", () => {
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicles: Vehicle[] = [
      {
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
        operatorName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: false,
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
      },
      {
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
        operatorName: "JONES",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles}
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
      {
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
        operatorName: "JONES",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
    ]
    const ladderDirection = LadderDirection.OneToZero
    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles}
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
      {
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
        operatorName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
      {
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
        operatorName: "JONES",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={"upward"}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows vehicles with block waivers", () => {
    jest
      .spyOn(dateTime, "now")
      .mockImplementation(() => new Date("2020-01-01T01:00:00.000Z"))
    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const ghostWithBlockWaiver: Ghost = {
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
      routeStatus: "on_route",
      blockWaivers: [
        {
          startTime: new Date("2020-01-01T00:00:00.000Z"),
          endTime: new Date("2020-01-01T02:00:00.000Z"),
          remark: "test block waiver",
        },
      ],
    }
    const vehicleWithOldBlockWaiver: Vehicle = {
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
      operatorName: "JONES",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block",
      headwaySecs: null,
      headwaySpacing: null,
      previousVehicleId: "",
      scheduleAdherenceSecs: 0,
      scheduledHeadwaySecs: 120,
      isOffCourse: false,
      layoverDepartureTime: null,
      blockIsActive: true,
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
          remark: "test block waiver",
        },
      ],
    }
    const vehiclesAndGhosts: VehicleOrGhost[] = [
      ghostWithBlockWaiver,
      vehicleWithOldBlockWaiver,
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehiclesAndGhosts}
          ladderDirection={ladderDirection}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a vehicle selects that vehicle", () => {
    const mockDispatch = jest.fn()

    const timepoints: Timepoint[] = [
      { id: "t0", name: "t0 name" },
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const vehicle: Vehicle = {
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
      operatorName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 33,
      blockId: "block-1",
      headwaySecs: 859.1,
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduledHeadwaySecs: 120,
      isOffCourse: false,
      layoverDepartureTime: null,
      blockIsActive: true,
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
    }

    const ladderDirection = LadderDirection.ZeroToOne

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={[vehicle]}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      </StateDispatchProvider>
    )
    wrapper.find(".m-ladder__vehicle").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle.id))
  })

  test("clicking an incoming ghost selects the associated vehicle", () => {
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

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={[incomingGhost]}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      </StateDispatchProvider>
    )
    wrapper.find(".m-ladder__vehicle").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle("y0622"))
  })

  test("renders a ladder with no timepoints", () => {
    const timepoints: Timepoint[] = []
    const vehicles: Vehicle[] = [
      {
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
        operatorName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles}
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
      {
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
        operatorName: "SMITH",
        operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
        bearing: 33,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: HeadwaySpacing.Ok,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        layoverDepartureTime: null,
        blockIsActive: true,
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
      },
    ]
    const ladderDirection = LadderDirection.OneToZero

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders an off-course vehicle", () => {
    const vehicle: Vehicle = {
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
      operatorName: "SMITH",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 0,
      blockId: "T71-17",
      headwaySecs: 859.1,
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduledHeadwaySecs: 120,
      isOffCourse: true,
      layoverDepartureTime: null,
      blockIsActive: true,
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
    }

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
          vehiclesAndGhosts={[vehicle]}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
