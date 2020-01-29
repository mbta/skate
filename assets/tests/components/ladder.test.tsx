import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import Ladder from "../../src/components/ladder"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { LadderDirection } from "../../src/models/ladderDirection"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime.d"
import { TimepointId } from "../../src/schedule.d"
import { initialState, selectVehicle } from "../../src/state"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))
jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: () => ({}),
}))

describe("ladder", () => {
  test("renders a ladder", () => {
    const timepoints = ["t0", "t1", "t2"]
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
          directionId: 0,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
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
    const timepoints = ["t0", "t1", "t2"]

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
    const timepoints = ["t0", "t1", "t2"]
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
          directionId: 0,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
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
    const timepoints = ["t0", "t1", "t2"]
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
          directionId: 1,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
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
    const timepoints = ["t0", "t1", "t2"]
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
          directionId: 0,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
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

  test("clicking a vehicle selects that vehicle", () => {
    const mockDispatch = jest.fn()

    const timepoints = ["t0", "t1", "t2"]
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

  test("renders a ladder with no timepoints", () => {
    const timepoints: TimepointId[] = []
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
    const timepoints = ["t0", "t1", "t2"]
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
          directionId: 1,
          timepointStatus: {
            timepointId: "t1",
            fractionUntilTimepoint: 0.4,
          },
        },
        routeStatus: "on_route",
        endOfTripType: "another_trip",
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
        directionId: 0,
        timepointStatus: {
          timepointId: "mtsty",
          fractionUntilTimepoint: 0,
        },
      },
      routeStatus: "on_route",
      endOfTripType: "another_trip",
    }

    const timepoints = ["t0", "t1", "t2"]
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
